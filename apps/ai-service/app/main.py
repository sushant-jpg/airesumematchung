from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from .matching import calculate_match
from .parser import ResumeParseError, extract_pdf_text, parse_resume_text
from .schemas import MatchRequest

app = FastAPI(title="HireMatch AI Service", version="1.0.0", description="Local, deterministic resume parsing and explainable matching.")
app.add_middleware(CORSMiddleware, allow_origins=[], allow_methods=["GET", "POST"], allow_headers=["content-type"])
MAX_FILE_SIZE = 5 * 1024 * 1024

@app.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service"}

@app.get("/health/ready")
def ready() -> dict[str, str]:
    return {"status": "ready", "parser": "available", "matcher": "available"}

@app.post("/v1/resumes/parse")
async def parse_resume(file: UploadFile = File(...)) -> dict[str, object]:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Only PDF resumes are supported")
    content = await file.read(MAX_FILE_SIZE + 1)
    if not content:
        raise HTTPException(status_code=422, detail="The uploaded resume is empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Resume exceeds the 5 MB limit")
    try:
        return parse_resume_text(extract_pdf_text(content))
    except ResumeParseError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

@app.post("/v1/matches")
def match_resume(payload: MatchRequest) -> dict[str, object]:
    return calculate_match(payload.candidate.model_dump(), payload.job.model_dump())
