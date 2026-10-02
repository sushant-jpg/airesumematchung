from dataclasses import dataclass
import re
from .skills import normalize_skills

@dataclass(frozen=True)
class Weights:
    required_skills: float = 40
    preferred_skills: float = 10
    experience: float = 20
    education: float = 10
    semantic: float = 15
    location: float = 5

    def validate(self) -> None:
        if round(sum(vars(self).values()), 6) != 100:
            raise ValueError("Match weights must total 100")

def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9+#.]{2,}", text.lower()))

def _jaccard(left: str, right: str) -> float:
    a, b = _tokens(left), _tokens(right)
    return len(a & b) / len(a | b) if a and b else 0

def _score(value: float) -> int:
    return round(max(0, min(100, value)))

def calculate_match(candidate: dict[str, object], job: dict[str, object], weights: Weights = Weights()) -> dict[str, object]:
    weights.validate()
    candidate_skills = normalize_skills([str(skill) for skill in candidate.get("skills", [])])
    required = normalize_skills([str(skill) for skill in job.get("requiredSkills", [])])
    preferred = normalize_skills([str(skill) for skill in job.get("preferredSkills", [])])
    candidate_set = {skill.lower() for skill in candidate_skills}
    matched_required = [skill for skill in required if skill.lower() in candidate_set]
    missing_required = [skill for skill in required if skill.lower() not in candidate_set]
    matched_preferred = [skill for skill in preferred if skill.lower() in candidate_set]
    required_score = _score(100 * len(matched_required) / len(required)) if required else 100
    preferred_score = _score(100 * len(matched_preferred) / len(preferred)) if preferred else 100
    candidate_years, required_years = float(candidate.get("experienceYears", 0) or 0), float(job.get("minimumExperienceYears", 0) or 0)
    experience_score = _score(100 * min(candidate_years / required_years, 1)) if required_years else 100
    education_requirement = str(job.get("educationRequirement", "") or "")
    education_score = 100 if not education_requirement or _jaccard(str(candidate.get("education", "")), education_requirement) > 0 else 0
    semantic_score = _score(100 * _jaccard(f'{candidate.get("text", "")} {" ".join(candidate_skills)}', f'{job.get("text", "")} {" ".join(required)}'))
    same_location = str(candidate.get("location", "")).lower() == str(job.get("location", "")).lower()
    remote = job.get("workMode") == "REMOTE" and "REMOTE" in candidate.get("preferredWorkModes", [])
    location_score = 100 if not job.get("location") or same_location or remote else 0
    overall = _score(required_score * weights.required_skills / 100 + preferred_score * weights.preferred_skills / 100 + experience_score * weights.experience / 100 + education_score * weights.education / 100 + semantic_score * weights.semantic / 100 + location_score * weights.location / 100)
    gap = max(0, required_years - candidate_years)
    return {
        "overallScore": overall, "requiredSkillsScore": required_score, "preferredSkillsScore": preferred_score,
        "experienceScore": experience_score, "educationScore": education_score, "semanticScore": semantic_score,
        "locationScore": location_score, "matchedRequiredSkills": matched_required, "missingRequiredSkills": missing_required,
        "matchedPreferredSkills": matched_preferred, "experienceGapYears": gap,
        "explanation": [f"{len(matched_required)} of {len(required)} required skills matched.", f"Experience is {gap:.1f} years below the requirement." if gap else "Experience meets the minimum requirement.", "Resume language aligns well with the role." if semantic_score >= 50 else "Resume and job language have limited overlap.", "Location or work preference is compatible." if location_score == 100 else "Location or work preference may need confirmation."],
    }
