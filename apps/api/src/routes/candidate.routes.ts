import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { normalizeSkills } from "@hirematch/shared";
import { config } from "../config.js";
import { authenticate, authorize } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { AppError } from "../lib/errors.js";
import { CandidateProfile, Resume } from "../models/index.js";

export const candidateRouter = Router();
candidateRouter.use(authenticate, authorize("CANDIDATE"));
const profileInput = z.object({ headline: z.string().max(160).optional(), location: z.string().max(120).optional(), preferredWorkModes: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])).max(3).optional(), skills: z.array(z.string().min(1)).max(100).optional(), experienceYears: z.number().min(0).max(60).optional(), education: z.string().max(500).optional(), summary: z.string().max(3000).optional() });
candidateRouter.get("/me", async (request, response) => response.json({ success: true, data: await CandidateProfile.findOne({ userId: request.auth!.userId }).lean() }));
candidateRouter.patch("/me", async (request, response) => {
  const input = profileInput.parse(request.body);
  const present = Object.values(input).filter((value) => Array.isArray(value) ? value.length : Boolean(value)).length;
  const profile = await CandidateProfile.findOneAndUpdate({ userId: request.auth!.userId }, { ...input, ...(input.skills ? { skills: normalizeSkills(input.skills) } : {}), profileCompletion: Math.min(100, 10 + present * 15) }, { new: true, upsert: true, runValidators: true });
  response.json({ success: true, data: profile });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.MAX_RESUME_SIZE_MB * 1024 * 1024, files: 1 }, fileFilter: (_request, file, callback) => callback(null, file.mimetype === "application/pdf") });
candidateRouter.get("/resume", async (request, response) => {
  const resume = await Resume.findOne({ candidateId: request.auth!.userId }).lean();
  if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "No resume has been uploaded.");
  response.json({ success: true, data: resume });
});
candidateRouter.post("/resume", upload.single("resume"), async (request, response) => {
  if (!request.file?.buffer.length) throw new AppError(422, "RESUME_EMPTY", "Select a non-empty PDF resume.");
  if (request.file.mimetype !== "application/pdf" || request.file.buffer.subarray(0, 5).toString() !== "%PDF-") throw new AppError(415, "RESUME_TYPE_INVALID", "The uploaded file is not a valid PDF.");
  const body = new FormData(); body.append("file", new Blob([new Uint8Array(request.file.buffer)], { type: "application/pdf" }), "resume.pdf");
  let parsed: Record<string, unknown>;
  try {
    const aiResponse = await fetch(`${config.AI_SERVICE_URL}/v1/resumes/parse`, { method: "POST", body, signal: AbortSignal.timeout(30_000) });
    if (!aiResponse.ok) throw new Error("Parser rejected the PDF");
    parsed = await aiResponse.json() as Record<string, unknown>;
  } catch { throw new AppError(422, "RESUME_PARSE_FAILED", "The PDF is corrupted or could not be parsed."); }
  const storageDirectory = resolve(config.RESUME_STORAGE_DIR); await mkdir(storageDirectory, { recursive: true });
  const storagePath = resolve(storageDirectory, `${randomUUID()}.pdf`);
  if (!storagePath.startsWith(storageDirectory)) throw new AppError(500, "RESUME_STORAGE_ERROR", "Resume storage could not be initialized.");
  await writeFile(storagePath, request.file.buffer, { flag: "wx", mode: 0o600 });
  const old = await Resume.findOne({ candidateId: request.auth!.userId }).select("+storagePath");
  const resume = await Resume.findOneAndUpdate({ candidateId: request.auth!.userId }, {
    originalName: request.file.originalname.slice(0, 200), mimeType: request.file.mimetype, size: request.file.size,
    sha256: createHash("sha256").update(request.file.buffer).digest("hex"), storagePath,
    parsedOriginal: parsed, confirmedData: parsed, parserVersion: "1.0.0", parsedAt: new Date()
  }, { new: true, upsert: true, runValidators: true });
  if (old?.storagePath) await unlink(old.storagePath).catch(() => undefined);
  await audit(request, "RESUME_UPLOADED", "Resume", resume.id);
  response.status(201).json({ success: true, data: resume });
});
candidateRouter.patch("/resume", async (request, response) => {
  const confirmedData = z.object({ fullName: z.string().max(120).optional(), email: z.string().email().optional(), phone: z.string().max(30).optional(), skills: z.array(z.string()).max(100).optional(), experienceYears: z.number().min(0).max(60).optional(), education: z.string().max(1000).optional(), certifications: z.array(z.string()).max(50).optional(), projects: z.array(z.string()).max(50).optional(), languages: z.array(z.string()).max(30).optional() }).parse(request.body);
  const resume = await Resume.findOneAndUpdate({ candidateId: request.auth!.userId }, { confirmedData: { ...confirmedData, ...(confirmedData.skills ? { skills: normalizeSkills(confirmedData.skills) } : {}) } }, { new: true });
  if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "No resume has been uploaded.");
  response.json({ success: true, data: resume });
});
candidateRouter.delete("/resume", async (request, response) => {
  const resume = await Resume.findOneAndDelete({ candidateId: request.auth!.userId }).select("+storagePath");
  if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "No resume has been uploaded.");
  await unlink(resume.storagePath).catch(() => undefined); await audit(request, "RESUME_DELETED", "Resume", resume.id);
  response.status(204).send();
});
