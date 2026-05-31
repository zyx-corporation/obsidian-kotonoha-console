import type { AuditEngine, GenerationRequest, Proposal, RdeAudit } from "../domain/types";

export interface GenerateResult {
  proposal: Proposal;
  audit?: RdeAudit;
}

export interface AuditProposalResult {
  audit: RdeAudit;
  engine: AuditEngine;
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
