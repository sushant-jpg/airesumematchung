import { Router } from "express";
import { authenticate, authorize } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { AppError } from "../lib/errors.js";
import { Application, AuditLog, Company, Job, Skill, User } from "../models/index.js";

export const adminRouter = Router();
adminRouter.use(authenticate, authorize("ADMIN"));
adminRouter.get("/stats", async (_request, response) => {
  const [users, candidates, recruiters, companies, activeJobs, applications, suspendedUsers] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: "CANDIDATE" }), User.countDocuments({ role: "RECRUITER" }), Company.countDocuments(), Job.countDocuments({ status: "ACTIVE" }), Application.countDocuments(), User.countDocuments({ suspendedAt: { $ne: null } })
  ]);
  response.json({ success: true, data: { users, candidates, recruiters, companies, activeJobs, applications, suspendedUsers } });
});
adminRouter.get("/users", async (request, response) => {
  const page = Math.max(Number(request.query.page) || 1, 1); const limit = Math.min(Number(request.query.limit) || 25, 100);
  const filter = typeof request.query.role === "string" ? { role: request.query.role } : {};
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(filter)]);
  response.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
adminRouter.patch("/users/:id/suspend", async (request, response) => {
  if (request.params.id === request.auth!.userId) throw new AppError(409, "ADMIN_SELF_SUSPEND", "You cannot suspend your own account.");
  const user = await User.findByIdAndUpdate(request.params.id, { suspendedAt: request.body.suspended === false ? null : new Date() }, { new: true });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "The user was not found.");
  await audit(request, request.body.suspended === false ? "USER_REINSTATED" : "USER_SUSPENDED", "User", user.id);
  response.json({ success: true, data: user });
});
adminRouter.get("/audit-logs", async (request, response) => {
  const page = Math.max(Number(request.query.page) || 1, 1); const limit = Math.min(Number(request.query.limit) || 50, 100);
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  response.json({ success: true, data: logs });
});
adminRouter.get("/skills", async (_request, response) => response.json({ success: true, data: await Skill.find({}).sort({ canonicalName: 1 }).lean() }));
adminRouter.post("/skills", async (request, response) => {
  const canonicalName = typeof request.body.canonicalName === "string" ? request.body.canonicalName.trim() : "";
  if (!canonicalName) throw new AppError(422, "VALIDATION_FAILED", "A canonical skill name is required.");
  const skill = await Skill.create({ canonicalName, aliases: Array.isArray(request.body.aliases) ? request.body.aliases : [], category: request.body.category });
  await audit(request, "SKILL_CREATED", "Skill", skill.id); response.status(201).json({ success: true, data: skill });
});
