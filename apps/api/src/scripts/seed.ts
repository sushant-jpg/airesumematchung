import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { calculateMatch, normalizeSkills } from "@hirematch/shared";
import { config } from "../config.js";
import { Application, CandidateProfile, Company, Job, Skill, User } from "../models/index.js";

await mongoose.connect(config.MONGODB_URI);
const passwordHash = await bcrypt.hash("Portfolio123!", 12);
const admin = await User.findOneAndUpdate({ email: "admin@hirematch.dev" }, { name: "System Admin", passwordHash, role: "ADMIN", emailVerified: true }, { upsert: true, new: true });
const recruiter = await User.findOneAndUpdate({ email: "maya@northstar.dev" }, { name: "Maya Chen", passwordHash, role: "RECRUITER", emailVerified: true }, { upsert: true, new: true });
const candidate = await User.findOneAndUpdate({ email: "alex@candidate.dev" }, { name: "Alex Rivera", passwordHash, role: "CANDIDATE", emailVerified: true }, { upsert: true, new: true });
const candidateSkills = normalizeSkills(["ReactJS", "TS", "Node", "Mongo", "Docker"]);
await CandidateProfile.findOneAndUpdate({ userId: candidate.id }, { headline: "Full-stack TypeScript Engineer", location: "Kathmandu", preferredWorkModes: ["REMOTE", "HYBRID"], skills: candidateSkills, experienceYears: 3.5, education: "Bachelor of Computer Science", summary: "Product-minded engineer building reliable web platforms.", profileCompletion: 90 }, { upsert: true });
const company = await Company.findOneAndUpdate({ slug: "northstar-labs" }, { name: "Northstar Labs", slug: "northstar-labs", ownerId: recruiter.id, website: "https://example.com", location: "Kathmandu", description: "A product studio building trusted workflow software.", size: "51-200", industry: "Software", verified: true }, { upsert: true, new: true });
const jobs = [
  { title: "Senior Full-stack Engineer", description: "Build accessible product experiences and resilient APIs with our collaborative platform team. You will own features from discovery through production and improve engineering quality.", requiredSkills: ["React", "TypeScript", "Node.js", "MongoDB", "Docker"], preferredSkills: ["Kubernetes", "AWS"], minimumExperienceYears: 3, workMode: "HYBRID", jobType: "FULL_TIME", location: "Kathmandu", salaryMin: 70000, salaryMax: 100000 },
  { title: "Frontend Product Engineer", description: "Create polished, accessible interfaces, evolve our design system, and partner closely with designers and backend engineers on high-impact product workflows.", requiredSkills: ["React", "TypeScript", "CSS"], preferredSkills: ["Next.js", "Playwright"], minimumExperienceYears: 2, workMode: "REMOTE", jobType: "FULL_TIME", location: "Remote", salaryMin: 60000, salaryMax: 90000 }
];
const seededJobs = [];
for (const job of jobs) seededJobs.push(await Job.findOneAndUpdate({ title: job.title, companyId: company.id }, { ...job, companyId: company.id, recruiterId: recruiter.id, status: "ACTIVE", educationRequirement: "Bachelor degree or equivalent experience" }, { upsert: true, new: true }));
for (const canonicalName of normalizeSkills(["React", "TypeScript", "Node.js", "MongoDB", "Docker", "Kubernetes", "AWS", "Next.js", "Playwright"])) {
  await Skill.findOneAndUpdate({ canonicalName }, { canonicalName, category: "Technical", active: true }, { upsert: true });
}
const firstJob = seededJobs[0];
if (firstJob) {
  const match = calculateMatch({ skills: candidateSkills, experienceYears: 3.5, education: "Bachelor of Computer Science", location: "Kathmandu", preferredWorkModes: ["HYBRID"], text: "Product-minded full stack engineer" }, { requiredSkills: firstJob.requiredSkills, preferredSkills: firstJob.preferredSkills, minimumExperienceYears: firstJob.minimumExperienceYears ?? 0, educationRequirement: firstJob.educationRequirement ?? undefined, location: firstJob.location, workMode: firstJob.workMode ?? undefined, text: `${firstJob.title} ${firstJob.description}` });
  await Application.findOneAndUpdate({ candidateId: candidate.id, jobId: firstJob.id }, { candidateId: candidate.id, jobId: firstJob.id, status: "SHORTLISTED", matchScore: match.overallScore, matchSnapshot: match, history: [{ status: "APPLIED", changedBy: candidate.id }, { status: "REVIEWING", changedBy: recruiter.id }, { status: "SHORTLISTED", changedBy: recruiter.id }] }, { upsert: true });
}
console.log(`Seeded users: ${[admin.email, recruiter.email, candidate.email].join(", ")} (password: Portfolio123!)`);
await mongoose.disconnect();
