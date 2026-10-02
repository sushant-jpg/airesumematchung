from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_liveness() -> None:
    assert client.get("/health/live").json() == {"status": "ok", "service": "ai-service"}

def test_rejects_wrong_upload_type() -> None:
    response = client.post("/v1/resumes/parse", files={"file": ("resume.txt", b"hello", "text/plain")})
    assert response.status_code == 415

def test_match_endpoint() -> None:
    response = client.post("/v1/matches", json={"candidate": {"skills": ["React"], "experienceYears": 2}, "job": {"requiredSkills": ["React", "Docker"], "minimumExperienceYears": 2}})
    assert response.status_code == 200
    assert response.json()["missingRequiredSkills"] == ["Docker"]
