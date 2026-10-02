import pytest
from app.matching import Weights, calculate_match

def test_match_is_explainable_and_bounded() -> None:
    result = calculate_match(
        {"skills": ["React", "TS", "Node", "Mongo"], "experienceYears": 1.5, "location": "Remote", "preferredWorkModes": ["REMOTE"], "text": "full stack developer"},
        {"requiredSkills": ["React", "TypeScript", "Node.js", "MongoDB", "Docker"], "preferredSkills": [], "minimumExperienceYears": 2, "location": "Remote", "workMode": "REMOTE", "text": "full stack developer"},
    )
    assert 0 <= result["overallScore"] <= 100
    assert result["missingRequiredSkills"] == ["Docker"]
    assert result["experienceGapYears"] == 0.5
    assert len(result["explanation"]) == 4

def test_missing_data_stays_bounded() -> None:
    result = calculate_match({}, {})
    assert 0 <= result["overallScore"] <= 100

def test_invalid_weights_fail() -> None:
    with pytest.raises(ValueError):
        calculate_match({}, {}, Weights(required_skills=1))
