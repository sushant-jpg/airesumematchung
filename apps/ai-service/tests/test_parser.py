import pytest
from app.parser import ResumeParseError, extract_pdf_text, parse_resume_text

def test_extracts_structured_resume_data() -> None:
    parsed = parse_resume_text("Alex Rivera\nalex@example.com\n+977 980 123 4567\nSoftware Engineer\n4 years experience\nReact, TS, Node, Docker\nBachelor of Computer Science\nAWS Certified Developer")
    assert parsed["fullName"] == "Alex Rivera"
    assert parsed["email"] == "alex@example.com"
    assert parsed["experienceYears"] == 4
    assert set(parsed["skills"]) >= {"React", "TypeScript", "Node.js", "Docker", "AWS"}

def test_rejects_non_pdf_and_empty_files() -> None:
    with pytest.raises(ResumeParseError):
        extract_pdf_text(b"")
    with pytest.raises(ResumeParseError):
        extract_pdf_text(b"not a pdf")
