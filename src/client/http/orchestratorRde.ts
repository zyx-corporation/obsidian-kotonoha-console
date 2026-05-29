import type { GenerationRequest } from "../../domain/types";
import type { StructuralDiffResult } from "../../rde/StructuralDiffBuilder";
import type { OrchestratorRdeEvaluateResponse } from "./httpTypes";

export function subjectRefForRequest(request: GenerationRequest): string {
  const hash = request.context.sourceHash.slice(0, 16);
  return `obsidian://${request.context.filePath}#${hash}`;
}

export function structuralToMeaningChanges(
  structural: StructuralDiffResult,
): Record<string, string[]> {
  return {
    preserved: structural.preservedElements,
    transformed: structural.transformedElements,
    complemented: structural.inferredExtensions,
    unresolved: structural.unresolvedElements,
    deviation_risk: structural.driftRisks,
  };
}

/** Normalize orchestrator evaluate JSON to CLI `rde emit` shape for parseRdeEmit. */
export function orchestratorEvaluateToEmitStdout(
  body: OrchestratorRdeEvaluateResponse,
): string {
  const out = body.rde_review_output;
  const normalized: Record<string, string[]> = {};
  for (const [key, items] of Object.entries(out.categories ?? {})) {
    normalized[key] = (items ?? []).map((item) =>
      typeof item === "string" ? item : item.summary,
    );
  }
  return JSON.stringify({
    rde_review_output: {
      spec_version: out.spec_version ?? "0.1",
      subject_ref: out.subject_ref,
      categories: normalized,
    },
  });
}
