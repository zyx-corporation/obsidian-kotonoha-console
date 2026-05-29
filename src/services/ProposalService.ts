import type { KotonohaClient } from "../client/KotonohaClient";
import type { GenerationRequest, Proposal, RdeAudit } from "../domain/types";

export interface ProposalBundle {
  proposal: Proposal;
  audit?: RdeAudit;
}

export class ProposalService {
  constructor(private readonly client: KotonohaClient) {}

  async generate(request: GenerationRequest): Promise<ProposalBundle> {
    const result = await this.client.generate(request);
    return { proposal: result.proposal, audit: result.audit };
  }
}
