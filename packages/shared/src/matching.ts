import type { MatchBreakdown } from "@hirematch/types";
import { normalizeSkills } from "./skills.js";

export interface MatchWeights {
  requiredSkills: number; preferredSkills: number; experience: number;
  education: number; semantic: number; location: number;
}
export const DEFAULT_WEIGHTS: MatchWeights = {
  requiredSkills: 40, preferredSkills: 10, experience: 20,
  education: 10, semantic: 15, location: 5
};
export interface CandidateMatchInput {
  skills: string[]; experienceYears: number; education?: string;
  location?: string; preferredWorkModes?: string[]; text?: string;
}
export interface JobMatchInput {
  requiredSkills: string[]; preferredSkills?: string[]; minimumExperienceYears: number;
  educationRequirement?: string; location?: string; workMode?: string; text?: string;
}

function tokens(value = ""): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? []);
}
function similarity(left = "", right = ""): number {
  const a = tokens(left); const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}
function round(value: number): number { return Math.round(Math.max(0, Math.min(100, value))); }

export function calculateMatch(candidate: CandidateMatchInput, job: JobMatchInput, weights = DEFAULT_WEIGHTS): MatchBreakdown {
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (totalWeight !== 100) throw new Error("Match weights must total 100");
  const candidateSkills = normalizeSkills(candidate.skills);
  const required = normalizeSkills(job.requiredSkills);
  const preferred = normalizeSkills(job.preferredSkills ?? []);
  const candidateSet = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
  const matchedRequiredSkills = required.filter((skill) => candidateSet.has(skill.toLowerCase()));
  const missingRequiredSkills = required.filter((skill) => !candidateSet.has(skill.toLowerCase()));
  const matchedPreferredSkills = preferred.filter((skill) => candidateSet.has(skill.toLowerCase()));
  const requiredRatio = required.length ? matchedRequiredSkills.length / required.length : 1;
  const preferredRatio = preferred.length ? matchedPreferredSkills.length / preferred.length : 1;
  const experienceRatio = job.minimumExperienceYears <= 0 ? 1 : Math.min(candidate.experienceYears / job.minimumExperienceYears, 1);
  const educationScore = !job.educationRequirement ? 100 : similarity(candidate.education, job.educationRequirement) > 0 ? 100 : 0;
  const semanticScore = round(similarity(`${candidate.text ?? ""} ${candidateSkills.join(" ")}`, `${job.text ?? ""} ${job.requiredSkills.join(" ")}`) * 100);
  const remoteCompatible = job.workMode === "REMOTE" && candidate.preferredWorkModes?.includes("REMOTE");
  const sameLocation = Boolean(candidate.location && job.location && candidate.location.toLowerCase() === job.location.toLowerCase());
  const locationScore = !job.location || remoteCompatible || sameLocation ? 100 : 0;
  const requiredSkillsScore = round(requiredRatio * 100);
  const preferredSkillsScore = round(preferredRatio * 100);
  const experienceScore = round(experienceRatio * 100);
  const overallScore = round(
    requiredSkillsScore * weights.requiredSkills / 100 + preferredSkillsScore * weights.preferredSkills / 100 +
    experienceScore * weights.experience / 100 + educationScore * weights.education / 100 +
    semanticScore * weights.semantic / 100 + locationScore * weights.location / 100
  );
  const experienceGapYears = Math.max(0, job.minimumExperienceYears - candidate.experienceYears);
  const explanation = [
    `${matchedRequiredSkills.length} of ${required.length} required skills matched.`,
    experienceGapYears > 0 ? `Experience is ${experienceGapYears.toFixed(1)} years below the requirement.` : "Experience meets the minimum requirement.",
    semanticScore >= 50 ? "Resume language aligns well with the role." : "Resume and job language have limited overlap.",
    locationScore === 100 ? "Location or work preference is compatible." : "Location or work preference may need confirmation."
  ];
  return { overallScore, requiredSkillsScore, preferredSkillsScore, experienceScore, educationScore,
    semanticScore, locationScore, matchedRequiredSkills, missingRequiredSkills, matchedPreferredSkills,
    experienceGapYears, explanation };
}
