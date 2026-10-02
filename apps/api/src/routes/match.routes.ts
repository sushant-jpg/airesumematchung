import { Router } from "express";
import { authenticate, authorize } from "../lib/auth.js";
import { matchCandidateToJob } from "../services/match.service.js";
import { Job } from "../models/index.js";

export const matchRouter = Router();
matchRouter.use(authenticate, authorize("CANDIDATE"));
matchRouter.get("/jobs/:jobId", async (request, response) => response.json({ success: true, data: await matchCandidateToJob(request.auth!.userId, request.params.jobId) }));
matchRouter.get("/recommendations", async (request, response) => {
  const jobs = await Job.find({ status: "ACTIVE" }).sort({ createdAt: -1 }).limit(50).lean();
  const matches = await Promise.all(jobs.map(async (job) => ({ job, match: await matchCandidateToJob(request.auth!.userId, job._id.toString()) })));
  matches.sort((left, right) => right.match.overallScore - left.match.overallScore);
  response.json({ success: true, data: matches.slice(0, 12) });
});
