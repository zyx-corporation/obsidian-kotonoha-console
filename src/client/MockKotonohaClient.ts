import type { GenerateResult, KotonohaClient } from "./KotonohaClient";
import type { GenerationRequest, RdeAudit } from "../domain/types";

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
    const audit: RdeAudit = {
      proposalId,
      createdAt: new Date().toISOString(),
      categories: ["preserved", "authorized_transformation"],
      preservedElements: [excerpt],
      transformedElements: [`mock ${operation} wrapper`],
      inferredExtensions: [],
      unresolvedElements: [],
      driftRisks: [],
      recommendedDecision: "human_review",
      confidence: 0.55,
    };

    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary: `[mock] ${operation} on ${context.title}`,
        uncertaintyNote:
          "Mock backend — connect HTTP or CLI in settings for real Kotonoha output.",
      },
      audit,
    };
  }
}
