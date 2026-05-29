import { describe, expect, it } from "vitest";
import {
  buildSourceReview,
  buildStructuralDiff,
} from "../src/rde/StructuralDiffBuilder";

describe("StructuralDiffBuilder", () => {
  it("detects claim strength drift", () => {
    const result = buildStructuralDiff(
      "This may be possible.",
      "This is clearly true.",
    );
    expect(result.categories).toContain("suspicious_drift");
    expect(result.driftRisks.length).toBeGreaterThan(0);
  });

  it("marks identical text as preserved", () => {
    const text = "Same content.\nSecond line.";
    const result = buildStructuralDiff(text, text);
    expect(result.categories).toContain("preserved");
  });

  it("source review detects hedging in note", () => {
    const result = buildSourceReview("This may be possible.");
    expect(result.unresolvedElements.some((e) => e.includes("hedging"))).toBe(true);
    expect(result.driftRisks).toHaveLength(0);
  });

  it("detects frontmatter key removal (§14)", () => {
    const result = buildStructuralDiff(
      "---\ntitle: A\n---\nBody",
      "Body only",
      { frontmatter: { title: "A" } },
    );
    expect(result.driftRisks.some((r) => r.includes("frontmatter"))).toBe(true);
  });
});
