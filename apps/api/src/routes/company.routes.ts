import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { AppError } from "../lib/errors.js";
import { Company } from "../models/index.js";

export const companyRouter = Router();
const companyInput = z.object({ name: z.string().trim().min(2).max(120), website: z.string().url().optional(), location: z.string().max(120).optional(), description: z.string().max(3000).optional(), size: z.string().max(50).optional(), industry: z.string().max(100).optional() });
companyRouter.get("/", async (_request, response) => response.json({ success: true, data: await Company.find({}).select("-ownerId").limit(100).lean() }));
companyRouter.post("/", authenticate, authorize("RECRUITER"), async (request, response) => {
  const input = companyInput.parse(request.body);
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
  const company = await Company.create({ ...input, slug, ownerId: request.auth!.userId });
  await audit(request, "COMPANY_CREATED", "Company", company.id);
  response.status(201).json({ success: true, data: company });
});
companyRouter.patch("/:id", authenticate, authorize("RECRUITER", "ADMIN"), async (request, response) => {
  const input = companyInput.partial().parse(request.body);
  const filter = request.auth!.role === "ADMIN" ? { _id: request.params.id } : { _id: request.params.id, ownerId: request.auth!.userId };
  const company = await Company.findOneAndUpdate(filter, input, { new: true, runValidators: true });
  if (!company) throw new AppError(404, "COMPANY_NOT_FOUND", "The company was not found or is not owned by you.");
  await audit(request, "COMPANY_UPDATED", "Company", company.id);
  response.json({ success: true, data: company });
});
