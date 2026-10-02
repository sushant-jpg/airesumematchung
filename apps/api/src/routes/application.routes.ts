import { Router } from "express";
import { applicationSchema } from "@hirematch/validation";
import type { ApplicationStatus } from "@hirematch/types";
import { authenticate, authorize } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { AppError } from "../lib/errors.js";
import { Application, Job } from "../models/index.js";
import { matchCandidateToJob } from "../services/match.service.js";
import { notify } from "../services/notification.service.js";

export const applicationRouter = Router();
export const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["REVIEWING", "WITHDRAWN", "REJECTED"], REVIEWING: ["SHORTLISTED", "INTERVIEW", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["INTERVIEW", "REJECTED", "WITHDRAWN"], INTERVIEW: ["OFFERED", "REJECTED", "WITHDRAWN"],
  OFFERED: ["HIRED", "REJECTED", "WITHDRAWN"], HIRED: [], REJECTED: [], WITHDRAWN: []
};
applicationRouter.post("/", authenticate, authorize("CANDIDATE"), async (request, response) => {
  const input = applicationSchema.parse(request.body); const job = await Job.findOne({ _id: input.jobId, status: "ACTIVE" });
  if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The job is not accepting applications.");
  const match = await matchCandidateToJob(request.auth!.userId, input.jobId);
  try {
    const application = await Application.create({ candidateId: request.auth!.userId, jobId: job.id, coverLetter: input.coverLetter, matchScore: match.overallScore, matchSnapshot: match, history: [{ status: "APPLIED", changedBy: request.auth!.userId }] });
    await Promise.all([audit(request, "APPLICATION_CREATED", "Application", application.id), notify(job.recruiterId.toString(), "NEW_APPLICATION", "New application", `A candidate applied to ${job.title}.`, { applicationId: application.id, matchScore: match.overallScore }), notify(request.auth!.userId, "APPLICATION_SUBMITTED", "Application submitted", `Your application for ${job.title} was submitted.`, { applicationId: application.id })]);
    response.status(201).json({ success: true, data: application });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) throw new AppError(409, "APPLICATION_DUPLICATE", "You have already applied to this job.");
    throw error;
  }
});
applicationRouter.get("/mine", authenticate, authorize("CANDIDATE"), async (request, response) => {
  const applications = await Application.find({ candidateId: request.auth!.userId }).populate({ path: "jobId", populate: { path: "companyId", select: "name slug" } }).sort({ createdAt: -1 }).lean();
  response.json({ success: true, data: applications });
});
applicationRouter.get("/job/:jobId", authenticate, authorize("RECRUITER", "ADMIN"), async (request, response) => {
  if (request.auth!.role === "RECRUITER" && !await Job.exists({ _id: request.params.jobId, recruiterId: request.auth!.userId })) throw new AppError(403, "AUTH_FORBIDDEN", "You do not own this job.");
  const minimumScore = Math.max(Number(request.query.minimumScore) || 0, 0);
  const filter: Record<string, unknown> = { jobId: request.params.jobId, matchScore: { $gte: minimumScore } };
  if (typeof request.query.status === "string") filter.status = request.query.status;
  const applications = await Application.find(filter).populate("candidateId", "name email").sort(request.query.sort === "date" ? { createdAt: -1 } : { matchScore: -1 }).lean();
  response.json({ success: true, data: applications });
});
applicationRouter.patch("/:id/status", authenticate, async (request, response) => {
  const application = await Application.findById(request.params.id);
  if (!application) throw new AppError(404, "APPLICATION_NOT_FOUND", "The application was not found.");
  const nextStatus = request.body.status as ApplicationStatus;
  const currentStatus = application.status as ApplicationStatus;
  const isCandidateWithdrawal = request.auth!.role === "CANDIDATE" && application.candidateId.toString() === request.auth!.userId && nextStatus === "WITHDRAWN";
  const job = await Job.findById(application.jobId);
  const isOwner = request.auth!.role === "ADMIN" || (request.auth!.role === "RECRUITER" && job?.recruiterId.toString() === request.auth!.userId);
  if (!isCandidateWithdrawal && !isOwner) throw new AppError(403, "AUTH_FORBIDDEN", "You cannot change this application.");
  const allowedTransitions = transitions[currentStatus];
  if (!allowedTransitions?.includes(nextStatus)) throw new AppError(409, "APPLICATION_TRANSITION_INVALID", `Cannot move an application from ${currentStatus} to ${nextStatus}.`);
  application.status = nextStatus; application.history.push({ status: nextStatus, changedBy: request.auth!.userId, changedAt: new Date() }); await application.save();
  await Promise.all([audit(request, "APPLICATION_STATUS_CHANGED", "Application", application.id), notify(application.candidateId.toString(), `APPLICATION_${nextStatus}`, "Application updated", `Your application status changed to ${nextStatus}.`, { applicationId: application.id })]);
  response.json({ success: true, data: application });
});
