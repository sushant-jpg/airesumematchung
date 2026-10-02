from pydantic import BaseModel, Field

class CandidateInput(BaseModel):
    skills: list[str] = Field(default_factory=list, max_length=100)
    experienceYears: float = Field(default=0, ge=0, le=60)
    education: str = ""
    location: str = ""
    preferredWorkModes: list[str] = Field(default_factory=list)
    text: str = Field(default="", max_length=100_000)

class JobInput(BaseModel):
    requiredSkills: list[str] = Field(default_factory=list, max_length=100)
    preferredSkills: list[str] = Field(default_factory=list, max_length=100)
    minimumExperienceYears: float = Field(default=0, ge=0, le=60)
    educationRequirement: str = ""
    location: str = ""
    workMode: str = ""
    text: str = Field(default="", max_length=100_000)

class MatchRequest(BaseModel):
    candidate: CandidateInput
    job: JobInput
