import { describe, expect, it } from "vitest";
import { calculateMatch } from "./matching.js";
import { normalizeSkills } from "./skills.js";

describe("skill normalization", () => {
  it("canonicalizes aliases and removes duplicates", () => {
    expect(normalizeSkills(["JS", "javascript", "Node", "ReactJS", "Mongo"])).toEqual(["JavaScript", "Node.js", "React", "MongoDB"]);
  });
});
describe("explainable matching", () => {
  it("scores deterministically and identifies missing skills", () => {
    const result = calculateMatch(
      { skills: ["React", "TS", "Node", "Mongo"], experienceYears: 1.5, location: "Remote", preferredWorkModes: ["REMOTE"], text: "Full stack web developer" },
      { requiredSkills: ["React", "TypeScript", "Node.js", "MongoDB", "Docker"], minimumExperienceYears: 2, workMode: "REMOTE", location: "Remote", text: "Full stack developer" }
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.missingRequiredSkills).toEqual(["Docker"]);
    expect(result.experienceGapYears).toBe(0.5);
  });
  it("rejects invalid weights", () => {
    expect(() => calculateMatch({ skills: [], experienceYears: 0 }, { requiredSkills: [], minimumExperienceYears: 0 }, { requiredSkills: 1, preferredSkills: 1, experience: 1, education: 1, semantic: 1, location: 1 })).toThrow();
  });
});
