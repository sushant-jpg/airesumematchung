export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type WorkMode = "REMOTE" | "HYBRID" | "ONSITE";
export type JobStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "MODERATED";
export type ApplicationStatus =
  | "APPLIED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW"
  | "OFFERED" | "HIRED" | "REJECTED" | "WITHDRAWN";

export interface ApiSuccess<T> { success: true; data: T; }
export interface ApiFailure {
  success: false;
  error: { code: string; message: string; requestId: string; details?: unknown };
}
export interface Pagination { page: number; limit: number; total: number; pages: number; }

export interface MatchBreakdown {
  overallScore: number;
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  educationScore: number;
  semanticScore: number;
  locationScore: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  experienceGapYears: number;
  explanation: string[];
}
