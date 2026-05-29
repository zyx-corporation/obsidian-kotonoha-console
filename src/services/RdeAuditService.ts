import type { GenerationRequest, RdeAudit } from "../domain/types";
import { buildStructuralDiff } from "../rde/StructuralDiffBuilder";
import { mergeStructuralIntoAudit } from "../rde/mergeRdeAudit";
import { enrichAuditFromSource } from "../rde/enrichAuditFromSource";
import { rdeAuditFromEmit } from "../rde/parseRdeEmit";

export interface RdeAuditCliInput {
  emitStdout: string;
}

/**
 * Full RDE audit: structural diff + optional CLI RDE skeleton (rde-audit-policy §7–8).
 */
export function performRdeAudit(
  request: GenerationRequest,
  proposalId: string,
  options?: {
    /** When set, compare source vs this proposal text. */
    proposalText?: string;
    cli?: RdeAuditCliInput;
  },
): RdeAudit {
  const compareTarget = options?.proposalText ?? request.context.sourceText;
  const structural = buildStructuralDiff(
    request.context.sourceText,
    compareTarget,
  );

  let base: RdeAudit;
  if (options?.cli?.emitStdout) {
    base = rdeAuditFromEmit(options.cli.emitStdout, proposalId);
  } else {
    base = {
      proposalId,
      createdAt: new Date().toISOString(),
      categories: [],
      preservedElements: [],
      transformedElements: [],
      inferredExtensions: [],
      unresolvedElements: [],
      driftRisks: [],
      recommendedDecision: "human_review",
      confidence: 0.5,
    };
  }

  const merged = mergeStructuralIntoAudit(base, structural);
  return enrichAuditFromSource(merged, request);
}
