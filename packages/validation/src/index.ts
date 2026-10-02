import { z } from "zod";

export const passwordSchema = z.string().min(10).max(128)
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  role: z.enum(["CANDIDATE", "RECRUITER"]).default("CANDIDATE")
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

const jobObjectSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(50).max(20_000),
  companyId: z.string().regex(/^[a-f\d]{24}$/i),
  location: z.string().trim().min(2).max(120),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]),
  requiredSkills: z.array(z.string().trim().min(1)).min(1).max(30),
  preferredSkills: z.array(z.string().trim().min(1)).max(30).default([]),
  minimumExperienceYears: z.number().min(0).max(50),
  educationRequirement: z.string().trim().max(200).default(""),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional()
}).refine((value) => !value.salaryMin || !value.salaryMax || value.salaryMax >= value.salaryMin, {
  message: "Maximum salary must be at least the minimum salary", path: ["salaryMax"]
});
export const jobSchema = jobObjectSchema;
export const jobUpdateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(), description: z.string().trim().min(50).max(20_000).optional(),
  companyId: z.string().regex(/^[a-f\d]{24}$/i).optional(), location: z.string().trim().min(2).max(120).optional(),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(), jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional(),
  requiredSkills: z.array(z.string().trim().min(1)).min(1).max(30).optional(), preferredSkills: z.array(z.string().trim().min(1)).max(30).optional(),
  minimumExperienceYears: z.number().min(0).max(50).optional(), educationRequirement: z.string().trim().max(200).optional(),
  salaryMin: z.number().nonnegative().optional(), salaryMax: z.number().nonnegative().optional()
}).refine((value) => !value.salaryMin || !value.salaryMax || value.salaryMax >= value.salaryMin, {
  message: "Maximum salary must be at least the minimum salary", path: ["salaryMax"]
});

export const applicationSchema = z.object({ jobId: z.string().regex(/^[a-f\d]{24}$/i), coverLetter: z.string().max(4000).optional() });
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource id");
