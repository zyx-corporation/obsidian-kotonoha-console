import type { RdeAudit, RdeCategory } from "../domain/types";

const CATEGORY_MAP: Record<string, RdeCategory> = {
  preserved: "preserved",
  complemented: "inferred_extension",
  transformed: "authorized_transformation",
  deviation_risk: "suspicious_drift",
  intentionally_unresolved: "unresolved",
  lost: "critical_distortion",
  next_update_policy: "unresolved",
};

interface RdeEmitRoot {
  rde_review_output?: {
    categories?: Record<string, string[]>;
    subject_ref?: string;
  };
}

export function rdeAuditFromEmit(stdout: string, proposalId: string): RdeAudit {
  const root = JSON.parse(stdout) as RdeEmitRoot;
  const cats = root.rde_review_output?.categories ?? {};
  const categories = new Set<RdeCategory>();
  const preservedElements: string[] = [];
  const transformedElements: string[] = [];
  const inferredExtensions: string[] = [];
  const unresolvedElements: string[] = [];
  const driftRisks: string[] = [];

  for (const [key, items] of Object.entries(cats)) {
    const mapped = CATEGORY_MAP[key];
    if (mapped) categories.add(mapped);
    const target =
      key === "preserved"
        ? preservedElements
        : key === "transformed"
          ? transformedElements
          : key === "complemented"
            ? inferredExtensions
            : key === "deviation_risk"
              ? driftRisks
              : unresolvedElements;
    for (const item of items ?? []) {
      target.push(String(item));
    }
  }

  if (categories.size === 0) {
    categories.add("unresolved");
  }

  return {
    proposalId,
    createdAt: new Date().toISOString(),
    categories: [...categories],
    preservedElements,
    transformedElements,
    inferredExtensions,
    unresolvedElements,
    driftRisks,
    recommendedDecision: "human_review",
    confidence: 0.5,
  };
}
