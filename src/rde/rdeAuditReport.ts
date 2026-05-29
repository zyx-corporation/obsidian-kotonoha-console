import type { GenerationRequest, RdeAudit } from "../domain/types";
import {
  formatCategory,
  formatDecision,
  normalizeRdeLang,
  rdeMsg,
} from "./rdeI18n";

/** Human-readable RDE audit report for the console (non-Git vault supported). */
export function rdeAuditReportMarkdown(
  request: GenerationRequest,
  audit: RdeAudit,
): string {
  const lang = normalizeRdeLang(request.language);
  const lines = [
    `<!-- kotonoha rde-audit -->`,
    "",
    `# ${rdeMsg(lang, "reportTitle")}`,
    "",
    `> ${rdeMsg(lang, "mvpBanner")}`,
    "",
    `**${rdeMsg(lang, "reportFile")}:** \`${request.context.filePath}\``,
    `**${rdeMsg(lang, "reportSourceHash")}:** \`${request.context.sourceHash.slice(0, 16)}…\``,
    `**${rdeMsg(lang, "reportRecommended")}:** ${formatDecision(lang, audit.recommendedDecision)}`,
    "",
    `## ${rdeMsg(lang, "reportCategories")}`,
    audit.categories.map((c) => formatCategory(lang, c)).join(", ") ||
      rdeMsg(lang, "categoryNone"),
    "",
  ];

  appendSection(lines, lang, "sectionPreserved", audit.preservedElements);
  appendSection(lines, lang, "sectionTransformed", audit.transformedElements);
  appendSection(lines, lang, "sectionInferred", audit.inferredExtensions);
  appendSection(lines, lang, "sectionUnresolved", audit.unresolvedElements);
  appendSection(lines, lang, "sectionDriftRisks", audit.driftRisks);

  lines.push(`## ${rdeMsg(lang, "reportSourceExcerpt")}`, "", request.context.sourceText.slice(0, 2000));
  if (request.context.sourceText.length > 2000) {
    lines.push("", "…");
  }

  return lines.join("\n");
}

function appendSection(
  lines: string[],
  lang: ReturnType<typeof normalizeRdeLang>,
  sectionKey: Parameters<typeof rdeMsg>[1],
  items: string[],
): void {
  if (items.length === 0) return;
  lines.push(`## ${rdeMsg(lang, sectionKey)}`, "");
  for (const item of items) {
    lines.push(`- ${item}`);
  }
  lines.push("");
}
