import type { GenerationRequest, Proposal, RdeAudit } from "../domain/types";

export interface GenerateResult {
  proposal: Proposal;
  audit?: RdeAudit;
}

export interface KotonohaClient {
  generate(request: GenerationRequest): Promise<GenerateResult>;
}
