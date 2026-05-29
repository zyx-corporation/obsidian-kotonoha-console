import { describe, expect, it } from "vitest";
import { buildStructuralDiff } from "../src/rde/StructuralDiffBuilder";

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
});
