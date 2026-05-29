import type { GenerateResult, KotonohaClient } from "./KotonohaClient";
import type { GenerationRequest } from "../domain/types";
import { performRdeAudit } from "../services/RdeAuditService";
import { rdeAuditReportMarkdown } from "../rde/rdeAuditReport";

function id(): string {
  return crypto.randomUUID();
}

export class MockKotonohaClient implements KotonohaClient {
  async generate(request: GenerationRequest): Promise<GenerateResult> {
    const { context, operation, instruction } = request;
    const excerpt =
      context.sourceText.slice(0, 120).replace(/\n/g, " ") +
      (context.sourceText.length > 120 ? "…" : "");

    const proposedText = [
      `<!-- kotonoha mock ${operation} -->`,
      "",
      `> ${instruction || "(no instruction)"}`,
      "",
      context.sourceText,
    ].join("\n");

    const proposalId = id();

    if (operation === "rde_audit") {
      const audit = performRdeAudit(request, proposalId, { sourceReview: true });
      return {
        proposal: {
          id: proposalId,
          requestId: request.id,
          createdAt: new Date().toISOString(),
          proposedText: rdeAuditReportMarkdown(request, audit),
          summary: `[mock] RDE audit · ${context.title}`,
        },
        audit,
      };
    }

    const mockProposal = proposedText;
    const audit = performRdeAudit(request, proposalId, {
      proposalText: mockProposal,
    });

    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText: mockProposal,
        summary: `[mock] ${operation} on ${context.title}`,
        uncertaintyNote:
          "Mock backend — connect HTTP or CLI in settings for real Kotonoha output.",
      },
      audit,
    };
  }
}
