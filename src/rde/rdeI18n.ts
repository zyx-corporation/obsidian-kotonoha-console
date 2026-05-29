/** RDE audit UI / guardrail messages (defaultLanguage + request.language). */
export type RdeLang = "ja" | "en";

export function normalizeRdeLang(lang?: string): RdeLang {
  return lang === "en" ? "en" : "ja";
}

type Params = Record<string, string | number>;

function fmt(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

const MSGS = {
  en: {
    reportTitle: "RDE audit",
    reportFile: "File",
    reportSourceHash: "Source hash",
    reportRecommended: "Recommended",
    reportCategories: "Categories",
    reportSourceExcerpt: "Source excerpt",
    sectionPreserved: "Preserved",
    sectionTransformed: "Transformed",
    sectionInferred: "Inferred",
    sectionUnresolved: "Unresolved",
    sectionDriftRisks: "Drift risks",
    categoryNone: "(none)",
    mvpBanner:
      "Rule-based MVP audit (not full RDE). See rde-audit-policy §14.",
    decisionApprove: "approve",
    decisionRevise: "revise",
    decisionReject: "reject",
    decisionHumanReview: "human_review",
    auditPanelTitle: "RDE audit",
    confidenceNote: "(informative — not safety score)",
    sourceReviewLines: "source note review ({count} non-empty lines)",
    hedgingUnresolved: "source contains {count} hedging marker(s) — meaning may remain open",
    strongPreserved: "source contains {count} strong claim marker(s)",
    limitedSignals: "no hedging or strong-claim markers detected — rule-based signals limited",
    linesStructural: "lines +{add} / -{del} (structural)",
    textMatchStructural: "source and proposal text match (structural)",
    sourceParagraphs: "source paragraphs: {count}",
    lengthInferred: "proposal length ×{ratio} vs source",
    insufficientSignal: "insufficient structural signal for classification",
    claimStrengthDrift:
      "claim strength may have increased (hedging reduced, certainty markers added)",
    hedgingRemovedStrong:
      "hedging removed while strong claims present in proposal",
    hedgingDropped: "hedging terms dropped: {terms}",
    frontmatterRemoved: "frontmatter key may be removed or altered: {key}",
    linkRemoved: "link or wikilink may be removed: {target}",
    rewriteShortened:
      "rewrite shortened text to {pct}% of source (threshold {threshold}%)",
    urlIntroduced: "URL introduced in proposal (not in source): {url}",
    dateIntroduced: "date introduced in proposal (not in source): {date}",
    approvalRemoved: "human approval language may be removed: {lost}",
    finalDecisionDrift:
      "proposal may convert tentative language to final decision: {introduced}",
    nonGitVault:
      "Non-Git vault: no commit boundary; semantic anchors use path + source_hash only",
    auditUnavailable:
      "RDE audit is not available for this proposal. Review carefully before applying.",
    auditLowConfidence:
      "RDE audit confidence is low. Human review is required.",
  },
  ja: {
    reportTitle: "RDE 監査",
    reportFile: "ファイル",
    reportSourceHash: "ソースハッシュ",
    reportRecommended: "推奨判断",
    reportCategories: "カテゴリ",
    reportSourceExcerpt: "ソース抜粋",
    sectionPreserved: "保存された要素",
    sectionTransformed: "変換された要素",
    sectionInferred: "推論による補完",
    sectionUnresolved: "未解決",
    sectionDriftRisks: "逸脱リスク",
    categoryNone: "（なし）",
    mvpBanner:
      "ルールベース MVP 監査（full RDE ではありません）。rde-audit-policy §14 参照。",
    decisionApprove: "承認",
    decisionRevise: "改訂",
    decisionReject: "却下",
    decisionHumanReview: "人手レビュー",
    auditPanelTitle: "RDE 監査",
    confidenceNote: "（参考値 — 安全性スコアではありません）",
    sourceReviewLines: "ソースノートレビュー（非空行 {count} 行）",
    hedgingUnresolved:
      "ソースに hedging 表現が {count} 件 — 意味は未確定の可能性",
    strongPreserved: "ソースに強い主張表現が {count} 件",
    limitedSignals:
      "hedging / 強主張のマーカー未検出 — ルールベースのシグナルは限定的",
    linesStructural: "行 +{add} / -{del}（構造差分）",
    textMatchStructural: "ソースと提案テキストは一致（構造上）",
    sourceParagraphs: "ソース段落数: {count}",
    lengthInferred: "提案の長さはソースの ×{ratio}",
    insufficientSignal: "分類に十分な構造シグナルがありません",
    claimStrengthDrift:
      "主張の強度が上がった可能性（hedging 減少・確定性表現の追加）",
    hedgingRemovedStrong: "提案に強い主張があり hedging が除去されています",
    hedgingDropped: "hedging 語の脱落: {terms}",
    frontmatterRemoved: "frontmatter キーが削除または変更された可能性: {key}",
    linkRemoved: "リンクまたはウィキリンクが削除された可能性: {target}",
    rewriteShortened:
      "rewrite でソースの {pct}% に短縮（閾値 {threshold}%）",
    urlIntroduced: "ソースに無い URL が提案に追加: {url}",
    dateIntroduced: "ソースに無い日付が提案に追加: {date}",
    approvalRemoved: "人手承認に関する表現が削除された可能性: {lost}",
    finalDecisionDrift:
      "試行・草案的な表現が最終判断調に変わった可能性: {introduced}",
    nonGitVault:
      "非 Git vault: コミット境界なし。path + source_hash のみで意味アンカー",
    auditUnavailable:
      "この提案に RDE 監査はありません。適用前に慎重に確認してください。",
    auditLowConfidence:
      "RDE 監査の信頼度が低いです。人手によるレビューが必要です。",
  },
} as const;

export type RdeMsgKey = keyof (typeof MSGS)["en"];

export function rdeMsg(lang: RdeLang | undefined, key: RdeMsgKey, params?: Params): string {
  const L = normalizeRdeLang(lang);
  return fmt(MSGS[L][key], params);
}

export function formatDecision(
  lang: RdeLang | undefined,
  decision: string,
): string {
  const map: Record<string, RdeMsgKey> = {
    approve: "decisionApprove",
    revise: "decisionRevise",
    reject: "decisionReject",
    human_review: "decisionHumanReview",
  };
  const key = map[decision];
  return key ? rdeMsg(lang, key) : decision;
}

export function formatCategory(lang: RdeLang | undefined, cat: string): string {
  if (normalizeRdeLang(lang) === "en") return cat;
  const ja: Record<string, string> = {
    preserved: "保存",
    authorized_transformation: "許可された変換",
    inferred_extension: "推論による補完",
    unresolved: "未解決",
    suspicious_drift: "疑わしい逸脱",
    critical_distortion: "重大な歪曲",
  };
  return ja[cat] ?? cat;
}
