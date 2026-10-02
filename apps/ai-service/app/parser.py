from io import BytesIO
import re
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from .skills import extract_skills

EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
PHONE = re.compile(r"(?<!\w)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}(?!\w)")
EXPERIENCE = re.compile(r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)", re.I)
EDUCATION_TERMS = ("bachelor", "master", "phd", "doctorate", "b.sc", "m.sc", "university", "college")
CERT_TERMS = ("certified", "certification", "certificate", "aws certified", "pmp")

class ResumeParseError(ValueError):
    """Raised when a document cannot be safely parsed."""

def extract_pdf_text(content: bytes) -> str:
    if not content or not content.startswith(b"%PDF-"):
        raise ResumeParseError("The uploaded file is not a PDF")
    try:
        reader = PdfReader(BytesIO(content), strict=True)
        if reader.is_encrypted:
            raise ResumeParseError("Encrypted PDFs are not supported")
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except (PdfReadError, EOFError, ValueError) as error:
        raise ResumeParseError("The PDF is corrupted or unreadable") from error
    if not text:
        raise ResumeParseError("The PDF contains no extractable text")
    return text

def _lines_for_terms(lines: list[str], terms: tuple[str, ...]) -> list[str]:
    return [line for line in lines if any(term in line.lower() for term in terms)][:10]

def parse_resume_text(text: str) -> dict[str, object]:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines() if line.strip()]
    emails = EMAIL.findall(text)
    phones = [value.strip() for value in PHONE.findall(text)]
    years = [float(value) for value in EXPERIENCE.findall(text)]
    likely_name = next((line for line in lines[:5] if 1 < len(line.split()) <= 5 and not EMAIL.search(line) and not any(char.isdigit() for char in line)), "")
    education = _lines_for_terms(lines, EDUCATION_TERMS)
    certifications = _lines_for_terms(lines, CERT_TERMS)
    project_lines = [line for line in lines if "project" in line.lower()][:10]
    language_line = next((line for line in lines if line.lower().startswith("languages")), "")
    languages = [part.strip() for part in re.split(r"[:,|]", language_line)[1:] if part.strip()]
    skills = extract_skills(text)
    keywords = sorted({word.lower() for word in re.findall(r"\b[A-Za-z][A-Za-z+#.]{2,}\b", text) if word.lower() not in {"and", "the", "with", "for", "from", "that"}})[:100]
    return {
        "fullName": likely_name, "email": emails[0] if emails else "", "phone": phones[0] if phones else "",
        "skills": skills, "technicalSkills": skills, "experienceYears": max(years, default=0.0),
        "workExperience": _lines_for_terms(lines, ("experience", "engineer", "developer", "manager", "analyst")),
        "jobTitles": _lines_for_terms(lines, ("engineer", "developer", "manager", "analyst", "designer")),
        "companies": [], "education": " | ".join(education), "certifications": certifications,
        "projects": project_lines, "languages": languages, "keywords": keywords, "rawText": text,
    }
