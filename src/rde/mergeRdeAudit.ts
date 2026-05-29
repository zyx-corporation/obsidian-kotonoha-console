import type { RdeAudit, RdeCategory } from "../domain/types";
import type { StructuralDiffResult } from "./StructuralDiffBuilder";

function mergeUnique(target: string[], more: string[]): void {
  for (const item of more) {
    if (!target.includes(item)) target.push(item);
  }
}

function mergeCategories(a: RdeCategory[], b: RdeCategory[]): RdeCategory[] {
  return [...new Set([...a, ...b])];
}

export function mergeStructuralIntoAudit(
  base: RdeAudit,
  structural: StructuralDiffResult,
): RdeAudit {
  const preservedElements = [...base.preservedElements];
  const transformedElements = [...base.transformedElements];
  const inferredExtensions = [...base.inferredExtensions];
  const unresolvedElements = [...base.unresolvedElements];
  const driftRisks = [...base.driftRisks];

  mergeUnique(preservedElements, structural.preservedElements);
  mergeUnique(transformedElements, structural.transformedElements);
  mergeUnique(inferredExtensions, structural.inferredExtensions);
  mergeUnique(unresolvedElements, structural.unresolvedElements);
  mergeUnique(driftRisks, structural.driftRisks);

  const categories = mergeCategories(base.categories, structural.categories);
  const recommendedDecision = recommendDecision(categories, driftRisks);

  return {
    ...base,
    categories,
    preservedElements,
    transformedElements,
    inferredExtensions,
    unresolvedElements,
    driftRisks,
    recommendedDecision,
    confidence: driftRisks.length > 0 ? 0.45 : structural.lineAdditions > 0 ? 0.65 : 0.75,
  };
}

function recommendDecision(
  categories: RdeCategory[],
  driftRisks: string[],
): RdeAudit["recommendedDecision"] {
  if (categories.includes("critical_distortion")) return "reject";
  if (driftRisks.length >= 2 || categories.includes("suspicious_drift")) {
    return "revise";
  }
  if (categories.includes("unresolved") && categories.length <= 1) {
    return "human_review";
  }
  if (categories.includes("preserved") && driftRisks.length === 0) {
    return "approve";
  }
  return "human_review";
}
