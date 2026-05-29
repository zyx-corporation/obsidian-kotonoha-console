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
}
