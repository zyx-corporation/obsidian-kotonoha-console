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
      { language: "en" },
    );
    expect(result.categories).toContain("suspicious_drift");
    expect(result.driftRisks.length).toBeGreaterThan(0);
  });

  it("marks identical text as preserved", () => {
    const text = "Same content.\nSecond line.";
    const result = buildStructuralDiff(text, text, { language: "en" });
    expect(result.categories).toContain("preserved");
  });

  it("source review detects hedging in note (en)", () => {
    const result = buildSourceReview("This may be possible.", "en");
    expect(result.unresolvedElements.some((e) => e.includes("hedging"))).toBe(true);
    expect(result.driftRisks).toHaveLength(0);
  });

  it("source review detects hedging in note (ja)", () => {
    const result = buildSourceReview("This may be possible.", "ja");
    expect(result.unresolvedElements.some((e) => e.includes("未確定"))).toBe(true);
  });

  it("detects frontmatter key removal (§14)", () => {
    const result = buildStructuralDiff(
      "---\ntitle: A\n---\nBody",
      "Body only",
      { frontmatter: { title: "A" }, language: "en" },
    );
    expect(result.driftRisks.some((r) => r.includes("frontmatter"))).toBe(true);
  });

  it("detects introduced URL not in source (§14)", () => {
    const result = buildStructuralDiff(
      "See docs.",
      "See https://example.com/new for details.",
      { language: "en" },
    );
    expect(result.driftRisks.some((r) => r.includes("URL introduced"))).toBe(true);
    expect(result.categories).toContain("inferred_extension");
  });

  it("detects human approval language removal (§14)", () => {
    const result = buildStructuralDiff(
      "This change requires human approval before deploy.",
      "This change can deploy immediately.",
      { language: "en" },
    );
    expect(result.driftRisks.some((r) => r.includes("human approval"))).toBe(true);
  });

  it("detects final decision language from proposal tone (§14)", () => {
    const result = buildStructuralDiff(
      "This is a draft proposal for the architecture.",
      "This is the approved final decision for the architecture.",
      { language: "en" },
    );
    expect(result.driftRisks.some((r) => r.includes("final decision"))).toBe(true);
  });
});
