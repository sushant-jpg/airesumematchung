const aliases: Record<string, string> = {
  js: "JavaScript", javascript: "JavaScript", ecmascript: "JavaScript",
  ts: "TypeScript", typescript: "TypeScript",
  node: "Node.js", "node.js": "Node.js", nodejs: "Node.js",
  react: "React", reactjs: "React", "react.js": "React",
  mongo: "MongoDB", mongodb: "MongoDB",
  postgres: "PostgreSQL", postgresql: "PostgreSQL",
  k8s: "Kubernetes", kubernetes: "Kubernetes",
  py: "Python", python: "Python",
  "c#": "C#", csharp: "C#", dotnet: ".NET", ".net": ".NET"
};

export function normalizeSkill(skill: string): string {
  const clean = skill.trim().replace(/\s+/g, " ");
  return aliases[clean.toLowerCase()] ?? clean.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function normalizeSkills(skills: string[]): string[] {
  return [...new Map(skills.filter(Boolean).map(normalizeSkill).map((skill) => [skill.toLowerCase(), skill])).values()];
}
