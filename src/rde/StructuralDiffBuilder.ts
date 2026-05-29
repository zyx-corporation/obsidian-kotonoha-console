import type { RdeCategory } from "../domain/types";

export interface StructuralDiffResult {
  categories: RdeCategory[];
  preservedElements: string[];
  transformedElements: string[];
  inferredExtensions: string[];
  unresolvedElements: string[];
  driftRisks: string[];
  lineAdditions: number;
  lineDeletions: number;
}

const HEDGING =
  /\b(may|might|could|possibly|perhaps|likely|probably|かもしれない|可能性|推測)\b/giu;
const STRONG =
  /\b(must|will|always|never|certainly|clearly|proves?|確実|必ず|明らか|証明)\b/giu;

/** Surface + heuristic semantic diff (rde-audit-policy §8). */
export function buildStructuralDiff(
  source: string,
  proposal?: string,
): StructuralDiffResult {
  const preservedElements: string[] = [];
  const transformedElements: string[] = [];
  const inferredExtensions: string[] = [];
  const unresolvedElements: string[] = [];
  const driftRisks: string[] = [];
  const categories = new Set<RdeCategory>();

  const srcLines = source.split(/\n/);
  const propLines = (proposal ?? source).split(/\n/);
  const sameText = source.trim() === (proposal ?? source).trim();

  let lineAdditions = 0;
  let lineDeletions = 0;
  if (!sameText && proposal) {
    const srcSet = new Set(srcLines.map((l) => l.trim()).filter(Boolean));
    const propSet = new Set(propLines.map((l) => l.trim()).filter(Boolean));
    for (const l of propSet) {
      if (!srcSet.has(l)) lineAdditions++;
    }
    for (const l of srcSet) {
      if (!propSet.has(l)) lineDeletions++;
    }
    if (lineAdditions > 0 || lineDeletions > 0) {
      categories.add("authorized_transformation");
      transformedElements.push(
        `lines +${lineAdditions} / -${lineDeletions} (structural)`,
      );
    }
  } else {
    categories.add("preserved");
    preservedElements.push("source and proposal text match (structural)");
  }

  scanClaimStrength(source, proposal ?? source, driftRisks, categories);
  scanHedgingLoss(source, proposal ?? source, driftRisks, categories);

  if (srcLines.length > 3) {
    preservedElements.push(`source paragraphs: ${srcLines.filter((l) => l.trim()).length}`);
  }

  if (driftRisks.length === 0 && !sameText && proposal) {
    const ratio = proposal.length / Math.max(source.length, 1);
    if (ratio > 1.4) {
      inferredExtensions.push(`proposal length ×${ratio.toFixed(2)} vs source`);
      categories.add("inferred_extension");
    }
  }

  if (categories.size === 0) {
    categories.add("unresolved");
    unresolvedElements.push("insufficient structural signal for classification");
  }

  return {
    categories: [...categories],
    preservedElements,
    transformedElements,
    inferredExtensions,
    unresolvedElements,
    driftRisks,
    lineAdditions,
    lineDeletions,
  };
}

function scanClaimStrength(
  source: string,
  proposal: string,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  const srcHedge = (source.match(HEDGING) ?? []).length;
  const propHedge = (proposal.match(HEDGING) ?? []).length;
  const srcStrong = (source.match(STRONG) ?? []).length;
  const propStrong = (proposal.match(STRONG) ?? []).length;

  if (srcHedge > 0 && propStrong > srcStrong && propHedge < srcHedge) {
    driftRisks.push("claim strength may have increased (hedging reduced, certainty markers added)");
    categories.add("suspicious_drift");
  }
  if (propStrong > 0 && srcHedge > 0 && propHedge === 0) {
    driftRisks.push("hedging removed while strong claims present in proposal");
    categories.add("suspicious_drift");
  }
}

function scanHedgingLoss(
  source: string,
  proposal: string,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  if (source === proposal) return;
  const lost = ["may", "might", "could", "possibly"].filter(
    (w) => source.toLowerCase().includes(w) && !proposal.toLowerCase().includes(w),
  );
  if (lost.length > 0) {
    driftRisks.push(`hedging terms dropped: ${lost.join(", ")}`);
    categories.add("suspicious_drift");
  }
}
