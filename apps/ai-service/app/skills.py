import re

ALIASES = {
    "js": "JavaScript", "javascript": "JavaScript", "ecmascript": "JavaScript",
    "ts": "TypeScript", "typescript": "TypeScript",
    "node": "Node.js", "node.js": "Node.js", "nodejs": "Node.js",
    "react": "React", "reactjs": "React", "react.js": "React",
    "mongo": "MongoDB", "mongodb": "MongoDB", "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL", "k8s": "Kubernetes", "kubernetes": "Kubernetes",
    "py": "Python", "python": "Python", "c#": "C#", "csharp": "C#",
    "dotnet": ".NET", ".net": ".NET", "nextjs": "Next.js", "next.js": "Next.js",
    "aws": "AWS", "docker": "Docker", "fastapi": "FastAPI", "express": "Express",
    "graphql": "GraphQL", "redis": "Redis", "java": "Java", "go": "Go",
    "git": "Git", "azure": "Azure", "gcp": "GCP", "tailwind": "Tailwind CSS",
}

def normalize_skill(skill: str) -> str:
    clean = re.sub(r"\s+", " ", skill.strip())
    return ALIASES.get(clean.lower(), clean.title())

def normalize_skills(skills: list[str]) -> list[str]:
    result: dict[str, str] = {}
    for skill in skills:
        if skill.strip():
            normalized = normalize_skill(skill)
            result.setdefault(normalized.lower(), normalized)
    return list(result.values())

def extract_skills(text: str) -> list[str]:
    lowered = text.lower()
    found: list[str] = []
    for alias, canonical in ALIASES.items():
        pattern = rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])"
        if re.search(pattern, lowered):
            found.append(canonical)
    return normalize_skills(found)
