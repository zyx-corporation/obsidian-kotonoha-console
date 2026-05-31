import type { AuditProposalResult, KotonohaClient } from "../client/KotonohaClient";
import type { GenerationRequest, Proposal, RdeAudit } from "../domain/types";
import { normalizeProposalText } from "./normalizeProposalText";

export interface ProposalBundle {
  proposal: Proposal;
  audit?: RdeAudit;
}

function withNormalizedProposal(proposal: Proposal): Proposal {
  const proposedText = normalizeProposalText(proposal.proposedText);
  if (proposedText === proposal.proposedText) return proposal;
  return { ...proposal, proposedText };
}

export class ProposalService {
  constructor(private readonly client: KotonohaClient) {}

  async generate(request: GenerationRequest): Promise<ProposalBundle> {
    const result = await this.client.generate(request);
    const proposal = withNormalizedProposal(result.proposal);
    let audit = result.audit;
    if (
      proposal.proposedText !== result.proposal.proposedText &&
      result.audit
    ) {
      const reaudit = await this.client.auditProposal(
        request,
        proposal.id,
        proposal.proposedText,
      );
      audit = reaudit.audit;
    }
    return { proposal, audit };
  }

  async auditProposal(
    request: GenerationRequest,
    proposalId: string,
    proposalText: string,
  ): Promise<AuditProposalResult> {
    return this.client.auditProposal(
      request,
      proposalId,
      normalizeProposalText(proposalText),
    );
  }
}
