import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { MatchRing } from "./match-ring";
describe("MatchRing", () => { it("presents the score accessibly", () => { render(<MatchRing score={78}/>); expect(screen.getByLabelText("78% match")).toBeInTheDocument(); expect(screen.getByText("78%")).toBeInTheDocument(); }); });
