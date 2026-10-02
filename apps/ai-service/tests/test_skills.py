from app.skills import extract_skills, normalize_skills

def test_normalizes_aliases_without_duplicates() -> None:
    assert normalize_skills(["JS", "javascript", "Node", "ReactJS", "Mongo"]) == ["JavaScript", "Node.js", "React", "MongoDB"]

def test_extracts_only_skills_present() -> None:
    found = extract_skills("Built ReactJS services with Node, TypeScript, MongoDB and Docker.")
    assert found == ["TypeScript", "Node.js", "React", "MongoDB", "Docker"]
    assert "Python" not in found
