import type { GenerationRequest, RdeAudit } from "../domain/types";
import {
  buildSourceReview,
  buildStructuralDiff,
} from "../rde/StructuralDiffBuilder";
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
    /** `rde_audit` on active note — characterize source without a transform. */
    sourceReview?: boolean;
    cli?: RdeAuditCliInput;
  },
): RdeAudit {
  const structural =
    options?.sourceReview && !options?.proposalText
      ? buildSourceReview(request.context.sourceText, request.language)
      : buildStructuralDiff(
          request.context.sourceText,
          options?.proposalText ?? request.context.sourceText,
          {
            language: request.language,
            operation: request.operation,
            frontmatter: request.context.frontmatter,
            sourceLinks: request.context.links,
          },
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
