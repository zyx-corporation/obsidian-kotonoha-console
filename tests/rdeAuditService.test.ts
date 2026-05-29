import { describe, expect, it } from "vitest";
import { performRdeAudit } from "../src/services/RdeAuditService";
import type { GenerationRequest, NoteContext } from "../domain/types";

const ctx: NoteContext = {
  vaultPath: "/v",
  filePath: "note.md",
  title: "n",
  sourceText: "This may be possible.",
  sourceHash: "abc",
  tags: [],
  links: [],
  frontmatter: {},
};

const request: GenerationRequest = {
  id: "r1",
  createdAt: new Date().toISOString(),
  operation: "rde_audit",
  instruction: "",
  context: ctx,
  language: "ja",
};

describe("performRdeAudit", () => {
  it("source review flags hedging without fake drift risks", () => {
    const audit = performRdeAudit(request, "p1", { sourceReview: true });
    expect(audit.proposalId).toBe("p1");
    expect(audit.preservedElements.some((e) => e.includes("path:"))).toBe(true);
    expect(audit.unresolvedElements.some((e) => e.includes("hedging"))).toBe(true);
    expect(audit.driftRisks.some((r) => r.includes("Git commit boundary"))).toBe(
      false,
    );
  });

  it("detects drift when proposal strengthens claims", () => {
    const audit = performRdeAudit(request, "p2", {
      proposalText: "This is clearly true.",
    });
    expect(audit.driftRisks.length).toBeGreaterThan(0);
    expect(["revise", "reject"]).toContain(audit.recommendedDecision);
  });
});
