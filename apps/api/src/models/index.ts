import mongoose, { Schema } from "mongoose";

const options = { timestamps: true } as const;
const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["CANDIDATE", "RECRUITER", "ADMIN"], required: true },
  emailVerified: { type: Boolean, default: false }, suspendedAt: Date,
  failedLoginCount: { type: Number, default: 0, select: false }, lockedUntil: { type: Date, select: false }
}, options);
userSchema.set("toJSON", { transform: (_document, value: Record<string, unknown>) => { delete value.passwordHash; delete value.failedLoginCount; delete value.lockedUntil; delete value.__v; return value; } });
export const User = mongoose.model("User", userSchema);

const profileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  headline: String, location: String, preferredWorkModes: [{ type: String, enum: ["REMOTE", "HYBRID", "ONSITE"] }],
  skills: [{ type: String }], experienceYears: { type: Number, default: 0 }, education: String,
  summary: String, profileCompletion: { type: Number, min: 0, max: 100, default: 10 }
}, options);
export const CandidateProfile = mongoose.model("CandidateProfile", profileSchema);

const recruiterProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  title: String, phone: String, bio: String, companyIds: [{ type: Schema.Types.ObjectId, ref: "Company" }]
}, options);
export const RecruiterProfile = mongoose.model("RecruiterProfile", recruiterProfileSchema);

const companySchema = new Schema({
  name: { type: String, required: true, trim: true, index: true }, slug: { type: String, required: true, unique: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, website: String, location: String,
  description: String, size: String, industry: String, verified: { type: Boolean, default: false }
}, options);
export const Company = mongoose.model("Company", companySchema);

const jobSchema = new Schema({
  title: { type: String, required: true, text: true }, description: { type: String, required: true, text: true },
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  location: { type: String, required: true, index: true }, workMode: { type: String, enum: ["REMOTE", "HYBRID", "ONSITE"], index: true },
  jobType: { type: String, enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"], index: true },
  requiredSkills: [{ type: String, index: true }], preferredSkills: [String], minimumExperienceYears: Number,
  educationRequirement: String, salaryMin: Number, salaryMax: Number,
  status: { type: String, enum: ["DRAFT", "ACTIVE", "CLOSED", "MODERATED"], default: "ACTIVE", index: true }, publishedAt: { type: Date, default: Date.now }
}, options);
jobSchema.index({ status: 1, createdAt: -1 });
export const Job = mongoose.model("Job", jobSchema);

const resumeSchema = new Schema({
  candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  originalName: { type: String, required: true }, mimeType: String, size: Number, sha256: String,
  storagePath: { type: String, required: true, select: false },
  parsedOriginal: { type: Schema.Types.Mixed, required: true }, confirmedData: { type: Schema.Types.Mixed, required: true },
  parserVersion: String, parsedAt: Date
}, options);
resumeSchema.set("toJSON", { transform: (_document, value: Record<string, unknown>) => { delete value.storagePath; delete value.__v; return value; } });
export const Resume = mongoose.model("Resume", resumeSchema);

const historySchema = new Schema({ status: String, changedBy: Schema.Types.ObjectId, changedAt: { type: Date, default: Date.now }, note: String }, { _id: false });
const applicationSchema = new Schema({
  candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  status: { type: String, enum: ["APPLIED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED", "WITHDRAWN"], default: "APPLIED", index: true },
  coverLetter: String, matchScore: { type: Number, min: 0, max: 100, index: true }, matchSnapshot: Schema.Types.Mixed,
  history: [historySchema]
}, options);
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
export const Application = mongoose.model("Application", applicationSchema);

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, type: String, title: String, message: String,
  data: Schema.Types.Mixed, readAt: Date
}, options);
notificationSchema.index({ userId: 1, createdAt: -1 });
export const Notification = mongoose.model("Notification", notificationSchema);

const refreshSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, revokedAt: Date, replacedById: Schema.Types.ObjectId,
  userAgent: String, ip: String
}, options);
export const RefreshSession = mongoose.model("RefreshSession", refreshSchema);

const actionTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  purpose: { type: String, enum: ["VERIFY_EMAIL", "RESET_PASSWORD"], required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, usedAt: Date
}, options);
actionTokenSchema.index({ userId: 1, purpose: 1 });
export const ActionToken = mongoose.model("ActionToken", actionTokenSchema);

const auditSchema = new Schema({
  actorId: Schema.Types.ObjectId, actorRole: String, action: { type: String, required: true, index: true }, resource: String,
  resourceId: String, ip: String, userAgent: String, requestId: { type: String, required: true, index: true }
}, options);
auditSchema.index({ createdAt: -1 });
export const AuditLog = mongoose.model("AuditLog", auditSchema);

const savedJobSchema = new Schema({ candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true }, jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true } }, options);
savedJobSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
export const SavedJob = mongoose.model("SavedJob", savedJobSchema);

const skillSchema = new Schema({ canonicalName: { type: String, required: true, unique: true, index: true }, aliases: [{ type: String }], category: { type: String, index: true }, active: { type: Boolean, default: true } }, options);
export const Skill = mongoose.model("Skill", skillSchema);
