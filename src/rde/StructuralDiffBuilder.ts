import type { OperationType, RdeCategory } from "../domain/types";
import { type RdeLang, rdeMsg } from "./rdeI18n";

export interface StructuralDiffOptions {
  language?: RdeLang;
  operation?: OperationType;
  frontmatter?: Record<string, unknown>;
  sourceLinks?: string[];
}

/** Rewrite length ratio below this triggers §14 length-shrink guardrail. */
export const REWRITE_LENGTH_SHRINK_RATIO = 0.5;

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

/** Source-only review for `rde_audit` (no proposal transform yet). */
export function buildSourceReview(
  source: string,
  language?: RdeLang,
): StructuralDiffResult {
  const preservedElements: string[] = [];
  const unresolvedElements: string[] = [];
  const categories = new Set<RdeCategory>();

  const hedgeCount = (source.match(HEDGING) ?? []).length;
  const strongCount = (source.match(STRONG) ?? []).length;
  const lineCount = source.split(/\n/).filter((l) => l.trim()).length;

  categories.add("preserved");
  preservedElements.push(
    rdeMsg(language, "sourceReviewLines", { count: lineCount }),
  );

  if (hedgeCount > 0) {
    categories.add("unresolved");
    unresolvedElements.push(
      rdeMsg(language, "hedgingUnresolved", { count: hedgeCount }),
    );
  }
  if (strongCount > 0) {
    preservedElements.push(
      rdeMsg(language, "strongPreserved", { count: strongCount }),
    );
  }
  if (hedgeCount === 0 && strongCount === 0 && source.trim().length > 0) {
    unresolvedElements.push(rdeMsg(language, "limitedSignals"));
    categories.add("unresolved");
  }

  return {
    categories: [...categories],
    preservedElements,
    transformedElements: [],
    inferredExtensions: [],
    unresolvedElements,
    driftRisks: [],
    lineAdditions: 0,
    lineDeletions: 0,
  };
}

/** Surface + heuristic semantic diff (rde-audit-policy §8, §14). */
export function buildStructuralDiff(
  source: string,
  proposal?: string,
  options?: StructuralDiffOptions,
): StructuralDiffResult {
  const lang = options?.language;
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
        rdeMsg(lang, "linesStructural", { add: lineAdditions, del: lineDeletions }),
      );
    }
  } else {
    categories.add("preserved");
    preservedElements.push(rdeMsg(lang, "textMatchStructural"));
  }

  scanClaimStrength(source, proposal ?? source, lang, driftRisks, categories);
  scanHedgingLoss(source, proposal ?? source, lang, driftRisks, categories);

  if (srcLines.length > 3) {
    preservedElements.push(
      rdeMsg(lang, "sourceParagraphs", {
        count: srcLines.filter((l) => l.trim()).length,
      }),
    );
  }

  if (driftRisks.length === 0 && !sameText && proposal) {
    const ratio = proposal.length / Math.max(source.length, 1);
    if (ratio > 1.4) {
      inferredExtensions.push(
        rdeMsg(lang, "lengthInferred", { ratio: ratio.toFixed(2) }),
      );
      categories.add("inferred_extension");
    }
  }

  if (!sameText && proposal) {
    scanMvpGuardrails(source, proposal, options, driftRisks, categories);
  }

  if (categories.size === 0) {
    categories.add("unresolved");
    unresolvedElements.push(rdeMsg(lang, "insufficientSignal"));
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
  lang: RdeLang | undefined,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  const srcHedge = (source.match(HEDGING) ?? []).length;
  const propHedge = (proposal.match(HEDGING) ?? []).length;
  const srcStrong = (source.match(STRONG) ?? []).length;
  const propStrong = (proposal.match(STRONG) ?? []).length;

  if (srcHedge > 0 && propStrong > srcStrong && propHedge < srcHedge) {
    driftRisks.push(rdeMsg(lang, "claimStrengthDrift"));
    categories.add("suspicious_drift");
  }
  if (propStrong > 0 && srcHedge > 0 && propHedge === 0) {
    driftRisks.push(rdeMsg(lang, "hedgingRemovedStrong"));
    categories.add("suspicious_drift");
  }
}

function scanHedgingLoss(
  source: string,
  proposal: string,
  lang: RdeLang | undefined,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  if (source === proposal) return;
  const lost = ["may", "might", "could", "possibly"].filter(
    (w) => source.toLowerCase().includes(w) && !proposal.toLowerCase().includes(w),
  );
  if (lost.length > 0) {
    driftRisks.push(rdeMsg(lang, "hedgingDropped", { terms: lost.join(", ") }));
    categories.add("suspicious_drift");
  }
}

function scanMvpGuardrails(
  source: string,
  proposal: string,
  options: StructuralDiffOptions | undefined,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  const lang = options?.language;
  const fm = options?.frontmatter ?? {};
  for (const key of Object.keys(fm)) {
    if (!proposal.includes(`${key}:`) && !proposal.includes(`${key} `)) {
      driftRisks.push(rdeMsg(lang, "frontmatterRemoved", { key }));
      categories.add("suspicious_drift");
    }
  }

  const linkTargets = new Set<string>(options?.sourceLinks ?? []);
  for (const m of source.matchAll(/\[\[([^\]|#]+)/g)) {
    linkTargets.add(m[1]!);
  }
  for (const m of source.matchAll(/\]\(([^)]+)\)/g)) {
    linkTargets.add(m[1]!);
  }
  for (const target of linkTargets) {
    const needle = target.replace(/^\[\[/, "").replace(/\]\]$/, "");
    if (needle && !proposal.includes(needle)) {
      driftRisks.push(rdeMsg(lang, "linkRemoved", { target: needle }));
      categories.add("suspicious_drift");
    }
  }

  if (options?.operation === "rewrite") {
    const ratio = proposal.length / Math.max(source.length, 1);
    if (ratio < REWRITE_LENGTH_SHRINK_RATIO) {
      driftRisks.push(
        rdeMsg(lang, "rewriteShortened", {
          pct: (ratio * 100).toFixed(0),
          threshold: REWRITE_LENGTH_SHRINK_RATIO * 100,
        }),
      );
      categories.add("suspicious_drift");
    }
  }

  scanIntroducedUrlsAndDates(source, proposal, lang, driftRisks, categories);
  scanApprovalLanguageRemoval(source, proposal, lang, driftRisks, categories);
  scanFinalDecisionLanguage(source, proposal, lang, driftRisks, categories);
}

const URL_PATTERN = /https?:\/\/[^\s)\]>]+/gi;
const ISO_DATE_PATTERN = /\b\d{4}-\d{2}-\d{2}\b/g;
const HUMAN_APPROVAL_PATTERN =
  /\b(must be approved|requires? (?:human )?approval|human review required|人工レビュー|承認が必要)\b/giu;
const PROPOSAL_LANGUAGE_PATTERN =
  /\b(proposal|suggest(?:ed|ion)?|may recommend|draft|提案|推奨)\b/giu;
const FINAL_DECISION_PATTERN =
  /\b(approved|rejected|final decision|must proceed|is (?:the )?correct|確定|承認済|却下済)\b/giu;

function uniqueMatches(text: string, pattern: RegExp): string[] {
  return [...new Set((text.match(pattern) ?? []).map((m) => m.trim()))];
}

function scanIntroducedUrlsAndDates(
  source: string,
  proposal: string,
  lang: RdeLang | undefined,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  const srcUrls = new Set(uniqueMatches(source, URL_PATTERN));
  for (const url of uniqueMatches(proposal, URL_PATTERN)) {
    if (!srcUrls.has(url)) {
      driftRisks.push(rdeMsg(lang, "urlIntroduced", { url }));
      categories.add("inferred_extension");
    }
  }

  const srcDates = new Set(source.match(ISO_DATE_PATTERN) ?? []);
  for (const date of proposal.match(ISO_DATE_PATTERN) ?? []) {
    if (!srcDates.has(date)) {
      driftRisks.push(rdeMsg(lang, "dateIntroduced", { date }));
      categories.add("inferred_extension");
    }
  }
}

function scanApprovalLanguageRemoval(
  source: string,
  proposal: string,
  lang: RdeLang | undefined,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  const srcMarkers = uniqueMatches(source, HUMAN_APPROVAL_PATTERN);
  if (srcMarkers.length === 0) return;
  const propMarkers = uniqueMatches(proposal, HUMAN_APPROVAL_PATTERN);
  const lost = srcMarkers.filter((m) => !propMarkers.includes(m));
  if (lost.length > 0) {
    driftRisks.push(rdeMsg(lang, "approvalRemoved", { lost: lost.join("; ") }));
    categories.add("suspicious_drift");
  }
}

function scanFinalDecisionLanguage(
  source: string,
  proposal: string,
  lang: RdeLang | undefined,
  driftRisks: string[],
  categories: Set<RdeCategory>,
): void {
  const srcFinal = uniqueMatches(source, FINAL_DECISION_PATTERN);
  const propFinal = uniqueMatches(proposal, FINAL_DECISION_PATTERN);
  const introduced = propFinal.filter((m) => !srcFinal.includes(m));
  if (introduced.length === 0) return;
  const srcProposalLang = uniqueMatches(source, PROPOSAL_LANGUAGE_PATTERN);
  if (srcProposalLang.length > 0 || propFinal.length > srcFinal.length) {
    driftRisks.push(
      rdeMsg(lang, "finalDecisionDrift", { introduced: introduced.join("; ") }),
    );
    categories.add("suspicious_drift");
  }
}
