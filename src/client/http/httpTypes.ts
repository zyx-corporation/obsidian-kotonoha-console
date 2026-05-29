import type { GenerationRequest, Proposal, RdeAudit } from "../../domain/types";

/** Console / orchestrator LLM proxy — POST /v1/proposals/generate */
export interface HttpProposalGenerateBody {
  operation: GenerationRequest["operation"];
  instruction: string;
  language: GenerationRequest["language"];
  context: {
    filePath: string;
    title: string;
    sourceText: string;
    sourceHash: string;
    selectionText?: string;
    tags: string[];
    links: string[];
    frontmatter: Record<string, unknown>;
  };
}

export interface HttpProposalGenerateResponse {
  proposal: {
    proposedText: string;
    summary?: string;
    uncertaintyNote?: string;
  };
  audit?: RdeAudit;
}

export interface HttpGatewayToolResponse {
  tool: string;
  ok: boolean;
  result: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    exit_code?: number;
    stdout?: string;
    stderr?: string;
  };
}

export interface OrchestratorRdeEvaluateResponse {
  rde_review_output: {
    spec_version?: string;
    subject_ref: string;
    categories: Record<string, Array<string | { summary: string }>>;
  };
}

export function toHttpGenerateBody(request: GenerationRequest): HttpProposalGenerateBody {
  return {
    operation: request.operation,
    instruction: request.instruction,
    language: request.language,
    context: {
      filePath: request.context.filePath,
      title: request.context.title,
      sourceText: request.context.sourceText,
      sourceHash: request.context.sourceHash,
      selectionText: request.context.selectionText,
      tags: request.context.tags,
      links: request.context.links,
      frontmatter: request.context.frontmatter,
    },
  };
}

export function toGenerateResult(
  request: GenerationRequest,
  proposalId: string,
  body: HttpProposalGenerateResponse,
): { proposal: Proposal; audit?: RdeAudit } {
  return {
    proposal: {
      id: proposalId,
      requestId: request.id,
      createdAt: new Date().toISOString(),
      proposedText: body.proposal.proposedText,
      summary: body.proposal.summary,
      uncertaintyNote: body.proposal.uncertaintyNote,
    },
    audit: body.audit,
  };
}
