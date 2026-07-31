import { describe, expect, it } from "vitest";
import { isRevisionAuditStale } from "../src/obsidian/revisionAuditGuards";

describe("isRevisionAuditStale", () => {
  it("does not warn outside revise mode", () => {
    expect(isRevisionAuditStale(false, "edited", "original", true)).toBe(false);
  });

  it("does not warn when no audit exists yet", () => {
    expect(isRevisionAuditStale(true, "edited", "original", false)).toBe(false);
  });

  it("does not warn before an audited proposal text is recorded", () => {
    expect(isRevisionAuditStale(true, "edited", null, true)).toBe(false);
  });

  it("detects edits made after the last re-audit", () => {
    expect(isRevisionAuditStale(true, "edited again", "edited", true)).toBe(true);
  });

  it("ignores surrounding whitespace-only differences", () => {
    expect(isRevisionAuditStale(true, " edited \n", "edited", true)).toBe(false);
  });
});
