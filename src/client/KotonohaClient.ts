import type { GenerationRequest, Proposal, RdeAudit } from "../domain/types";

export interface GenerateResult {
  proposal: Proposal;
  audit?: RdeAudit;
}

export type RdeAuditEngine = "orchestrator" | "local";

export interface AuditProposalResult {
  audit: RdeAudit;
  engine: RdeAuditEngine;
}

export interface KotonohaClient {
  generate(request: GenerationRequest): Promise<GenerateResult>;
  /** Source vs proposal diff audit (re-audit button). */
  auditProposal(
    request: GenerationRequest,
    proposalId: string,
    proposalText: string,
  ): Promise<AuditProposalResult>;
}
