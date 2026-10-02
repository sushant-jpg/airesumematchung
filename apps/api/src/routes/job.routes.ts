import { Router } from "express";
import { normalizeSkills } from "@hirematch/shared";
import { jobSchema, jobUpdateSchema } from "@hirematch/validation";
import { authenticate, authorize } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { AppError } from "../lib/errors.js";
import { Company, Job } from "../models/index.js";

export const jobRouter = Router();
function escaped(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
jobRouter.get("/", async (request, response) => {
  const page = Math.max(Number(request.query.page) || 1, 1); const limit = Math.min(Math.max(Number(request.query.limit) || 12, 1), 50);
  const filter: Record<string, unknown> = { status: "ACTIVE" };
  if (typeof request.query.keyword === "string" && request.query.keyword.trim()) filter.$text = { $search: request.query.keyword.trim().slice(0, 100) };
  if (typeof request.query.location === "string") filter.location = new RegExp(escaped(request.query.location.slice(0, 100)), "i");
  if (typeof request.query.workMode === "string") filter.workMode = request.query.workMode;
  if (typeof request.query.jobType === "string") filter.jobType = request.query.jobType;
  if (typeof request.query.skills === "string") filter.requiredSkills = { $in: normalizeSkills(request.query.skills.split(",")) };
  const sort: Record<string, 1 | -1> = request.query.sort === "salary" ? { salaryMax: -1 } : { createdAt: -1 };
  const [jobs, total] = await Promise.all([Job.find(filter).populate("companyId", "name slug location").sort(sort).skip((page - 1) * limit).limit(limit).lean(), Job.countDocuments(filter)]);
  response.json({ success: true, data: jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
jobRouter.get("/:id", async (request, response) => {
  const job = await Job.findById(request.params.id).populate("companyId", "name slug description website location").lean();
  if (!job || job.status === "MODERATED") throw new AppError(404, "JOB_NOT_FOUND", "The requested job was not found.");
  response.json({ success: true, data: job });
});
jobRouter.post("/", authenticate, authorize("RECRUITER"), async (request, response) => {
  const input = jobSchema.parse(request.body);
  if (!await Company.exists({ _id: input.companyId, ownerId: request.auth!.userId })) throw new AppError(403, "COMPANY_NOT_OWNED", "Create or select a company you own.");
  const job = await Job.create({ ...input, requiredSkills: normalizeSkills(input.requiredSkills), preferredSkills: normalizeSkills(input.preferredSkills), recruiterId: request.auth!.userId });
  await audit(request, "JOB_CREATED", "Job", job.id);
  response.status(201).json({ success: true, data: job });
});
jobRouter.patch("/:id", authenticate, authorize("RECRUITER", "ADMIN"), async (request, response) => {
  const input = jobUpdateSchema.parse(request.body);
  const filter = request.auth!.role === "ADMIN" ? { _id: request.params.id } : { _id: request.params.id, recruiterId: request.auth!.userId };
  const update = { ...input, ...(input.requiredSkills ? { requiredSkills: normalizeSkills(input.requiredSkills) } : {}), ...(input.preferredSkills ? { preferredSkills: normalizeSkills(input.preferredSkills) } : {}) };
  const job = await Job.findOneAndUpdate(filter, update, { new: true, runValidators: true });
  if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The job was not found or is not owned by you.");
  await audit(request, "JOB_UPDATED", "Job", job.id);
  response.json({ success: true, data: job });
});
jobRouter.patch("/:id/status", authenticate, authorize("RECRUITER", "ADMIN"), async (request, response) => {
  const status = request.auth!.role === "ADMIN" ? ["ACTIVE", "CLOSED", "MODERATED"] : ["ACTIVE", "CLOSED"];
  if (!status.includes(request.body.status)) throw new AppError(422, "JOB_STATUS_INVALID", "The requested job status is not allowed.");
  const filter = request.auth!.role === "ADMIN" ? { _id: request.params.id } : { _id: request.params.id, recruiterId: request.auth!.userId };
  const job = await Job.findOneAndUpdate(filter, { status: request.body.status }, { new: true });
  if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The job was not found or is not owned by you.");
  await audit(request, "JOB_STATUS_CHANGED", "Job", job.id);
  response.json({ success: true, data: job });
});
