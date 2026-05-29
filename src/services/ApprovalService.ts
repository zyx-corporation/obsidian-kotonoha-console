import type { ApprovalDecision, Proposal } from "../domain/types";

export class ApprovalService {
  approve(proposal: Proposal, appliedText: string, comment?: string): ApprovalDecision {
    return {
      proposalId: proposal.id,
      decidedAt: new Date().toISOString(),
      decision: "approved",
      appliedText,
      comment,
    };
  }

  reject(proposal: Proposal, comment?: string): ApprovalDecision {
    return {
      proposalId: proposal.id,
      decidedAt: new Date().toISOString(),
      decision: "rejected",
      comment,
    };
  }

  hold(proposal: Proposal, comment?: string): ApprovalDecision {
    return {
      proposalId: proposal.id,
      decidedAt: new Date().toISOString(),
      decision: "hold",
      comment,
    };
  }

  approveRevised(
    proposal: Proposal,
    appliedText: string,
    originalText: string,
    comment?: string,
  ): ApprovalDecision {
    const revised = appliedText.trim() !== originalText.trim();
    return {
      proposalId: proposal.id,
      decidedAt: new Date().toISOString(),
      decision: revised ? "partially_applied" : "approved",
      appliedText,
      comment: revised
        ? [comment, "user revised before apply"].filter(Boolean).join("; ")
        : comment,
    };
  }
}
