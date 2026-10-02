import { Router } from "express";
import { authenticate, authorize } from "../lib/auth.js";
import { AppError } from "../lib/errors.js";
import { Job, SavedJob } from "../models/index.js";

export const savedJobRouter = Router();
savedJobRouter.use(authenticate, authorize("CANDIDATE"));
savedJobRouter.get("/", async (request, response) => response.json({ success: true, data: await SavedJob.find({ candidateId: request.auth!.userId }).populate("jobId").sort({ createdAt: -1 }).lean() }));
savedJobRouter.post("/:jobId", async (request, response) => {
  if (!await Job.exists({ _id: request.params.jobId, status: "ACTIVE" })) throw new AppError(404, "JOB_NOT_FOUND", "The requested job was not found.");
  const saved = await SavedJob.findOneAndUpdate({ candidateId: request.auth!.userId, jobId: request.params.jobId }, { $setOnInsert: { candidateId: request.auth!.userId, jobId: request.params.jobId } }, { new: true, upsert: true });
  response.status(201).json({ success: true, data: saved });
});
savedJobRouter.delete("/:jobId", async (request, response) => { await SavedJob.deleteOne({ candidateId: request.auth!.userId, jobId: request.params.jobId }); response.status(204).send(); });
