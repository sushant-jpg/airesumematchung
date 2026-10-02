import { calculateMatch } from "@hirematch/shared";
import { AppError } from "../lib/errors.js";
import { CandidateProfile, Job, Resume } from "../models/index.js";

export async function matchCandidateToJob(candidateId: string, jobId: string) {
  const [profile, resume, job] = await Promise.all([
    CandidateProfile.findOne({ userId: candidateId }).lean(), Resume.findOne({ candidateId }).lean(), Job.findById(jobId).lean()
  ]);
  if (!job) throw new AppError(404, "JOB_NOT_FOUND", "The requested job was not found.");
  if (!profile && !resume) throw new AppError(422, "PROFILE_INCOMPLETE", "Add a profile or resume before requesting a match.");
  const parsed = resume?.confirmedData as { skills?: string[]; experienceYears?: number; education?: string; rawText?: string } | undefined;
  return calculateMatch({
    skills: profile?.skills?.length ? profile.skills : parsed?.skills ?? [],
    experienceYears: profile?.experienceYears ?? parsed?.experienceYears ?? 0,
    education: profile?.education ?? parsed?.education,
    location: profile?.location ?? undefined, preferredWorkModes: profile?.preferredWorkModes,
    text: `${profile?.summary ?? ""} ${parsed?.rawText ?? ""}`
  }, {
    requiredSkills: job.requiredSkills, preferredSkills: job.preferredSkills ?? [],
    minimumExperienceYears: job.minimumExperienceYears ?? 0, educationRequirement: job.educationRequirement ?? undefined,
    location: job.location, workMode: job.workMode ?? undefined, text: `${job.title} ${job.description}`
  });
}
