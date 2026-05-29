/** RDE audit UI / guardrail messages (defaultLanguage + request.language). */
export type RdeLang = "ja" | "en" | "zh_CN";

export function normalizeRdeLang(lang?: string): RdeLang {
  if (lang === "en") return "en";
  if (lang === "zh_CN" || lang === "zh" || lang === "cn_zn") return "zh_CN";
  return "ja";
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
  zh_CN: {
    reportTitle: "RDE 审计",
    reportFile: "文件",
    reportSourceHash: "源哈希",
    reportRecommended: "建议决策",
    reportCategories: "类别",
    reportSourceExcerpt: "源摘录",
    sectionPreserved: "保留元素",
    sectionTransformed: "已转换元素",
    sectionInferred: "推断补充",
    sectionUnresolved: "未解决",
    sectionDriftRisks: "偏离风险",
    categoryNone: "（无）",
    mvpBanner:
      "基于规则的 MVP 审计（非完整 RDE）。参见 rde-audit-policy §14。",
    decisionApprove: "批准",
    decisionRevise: "修订",
    decisionReject: "拒绝",
    decisionHumanReview: "人工审核",
    auditPanelTitle: "RDE 审计",
    confidenceNote: "（仅供参考 — 非安全评分）",
    sourceReviewLines: "源笔记审查（非空行 {count} 行）",
    hedgingUnresolved: "源含 {count} 处 hedging 表述 — 含义可能仍未确定",
    strongPreserved: "源含 {count} 处强主张表述",
    limitedSignals: "未检测到 hedging / 强主张标记 — 基于规则的信号有限",
    linesStructural: "行 +{add} / -{del}（结构差异）",
    textMatchStructural: "源与提案文本一致（结构上）",
    sourceParagraphs: "源段落数: {count}",
    lengthInferred: "提案长度为源的 ×{ratio}",
    insufficientSignal: "分类所需的结构信号不足",
    claimStrengthDrift:
      "主张强度可能上升（hedging 减少、确定性表述增加）",
    hedgingRemovedStrong: "提案含强主张且 hedging 已被移除",
    hedgingDropped: "hedging 词缺失: {terms}",
    frontmatterRemoved: "frontmatter 键可能被删除或修改: {key}",
    linkRemoved: "链接或 wiki 链接可能被删除: {target}",
    rewriteShortened:
      "rewrite 将文本缩短至源的 {pct}%（阈值 {threshold}%）",
    urlIntroduced: "提案中新增源中不存在的 URL: {url}",
    dateIntroduced: "提案中新增源中不存在的日期: {date}",
    approvalRemoved: "人工批准相关表述可能被删除: {lost}",
    finalDecisionDrift:
      "提案可能将试探性表述转为最终决策语气: {introduced}",
    nonGitVault:
      "非 Git vault：无提交边界；语义锚点仅使用 path + source_hash",
    auditUnavailable:
      "此提案无 RDE 审计。应用前请仔细审查。",
    auditLowConfidence:
      "RDE 审计置信度较低。需要人工审核。",
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

const CATEGORY_LABELS: Record<Exclude<RdeLang, "en">, Record<string, string>> = {
  ja: {
    preserved: "保存",
    authorized_transformation: "許可された変換",
    inferred_extension: "推論による補完",
    unresolved: "未解決",
    suspicious_drift: "疑わしい逸脱",
    critical_distortion: "重大な歪曲",
  },
  zh_CN: {
    preserved: "保留",
    authorized_transformation: "授权转换",
    inferred_extension: "推断补充",
    unresolved: "未解决",
    suspicious_drift: "可疑偏离",
    critical_distortion: "严重歪曲",
  },
};

export function formatCategory(lang: RdeLang | undefined, cat: string): string {
  const L = normalizeRdeLang(lang);
  if (L === "en") return cat;
  return CATEGORY_LABELS[L][cat] ?? cat;
}
