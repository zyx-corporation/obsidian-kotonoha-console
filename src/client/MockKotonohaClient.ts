import type { GenerateResult, KotonohaClient, AuditProposalResult } from "./KotonohaClient";
import type { GenerationRequest } from "../domain/types";
import { consoleMsg } from "../i18n/consoleI18n";
import { performRdeAudit } from "../services/RdeAuditService";
import { rdeAuditReportMarkdown } from "../rde/rdeAuditReport";
import { attachAuditEngine } from "../rde/auditEngine";

function id(): string {
  return crypto.randomUUID();
}

export class MockKotonohaClient implements KotonohaClient {
  async generate(request: GenerationRequest): Promise<GenerateResult> {
    const { context, operation, instruction } = request;
    const lang = request.language;

    const proposedText = [
      `<!-- kotonoha mock ${operation} -->`,
      "",
      `> ${instruction || consoleMsg(lang, "noInstruction")}`,
      "",
      context.sourceText,
    ].join("\n");

    const proposalId = id();

    if (operation === "rde_audit") {
      const audit = attachAuditEngine(
        performRdeAudit(request, proposalId, { sourceReview: true }),
        "mock",
      );
      return {
        proposal: {
          id: proposalId,
          requestId: request.id,
          createdAt: new Date().toISOString(),
          proposedText: rdeAuditReportMarkdown(request, audit),
          summary: consoleMsg(lang, "mockRdeSummary", { title: context.title }),
        },
        audit,
      };
    }

    const mockProposal = proposedText;
    const audit = attachAuditEngine(
      performRdeAudit(request, proposalId, {
        proposalText: mockProposal,
      }),
      "mock",
    );

    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText: mockProposal,
        summary: consoleMsg(lang, "mockOpSummary", {
          operation,
          title: context.title,
        }),
        uncertaintyNote: consoleMsg(lang, "mockUncertainty"),
      },
      audit,
    };
  }

  async auditProposal(
    request: GenerationRequest,
    proposalId: string,
    proposalText: string,
  ): Promise<AuditProposalResult> {
    return {
      audit: attachAuditEngine(
        performRdeAudit(request, proposalId, { proposalText }),
        "mock",
      ),
      engine: "mock",
    };
  }
}
