import { describe, expect, it } from "vitest";
import { ApprovalService } from "../src/services/ApprovalService";
import type { Proposal } from "../src/domain/types";

const proposal: Proposal = {
  id: "p1",
  requestId: "r1",
  createdAt: new Date().toISOString(),
  proposedText: "original text",
};

describe("ApprovalService", () => {
  const svc = new ApprovalService();

  it("records hold for revise workflow", () => {
    const d = svc.hold(proposal, "user opened revise editor");
    expect(d.decision).toBe("hold");
    expect(d.comment).toContain("revise");
  });

  it("marks partially_applied when revised text differs", () => {
    const d = svc.approveRevised(proposal, "edited text", proposal.proposedText);
    expect(d.decision).toBe("partially_applied");
    expect(d.appliedText).toBe("edited text");
  });

  it("marks approved when revised text matches original", () => {
    const d = svc.approveRevised(proposal, proposal.proposedText, proposal.proposedText);
    expect(d.decision).toBe("approved");
  });
});
