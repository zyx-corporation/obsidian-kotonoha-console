import type { GenerationRequest, RdeAudit } from "../domain/types";

/** Human-readable RDE audit report for the console (non-Git vault supported). */
export function rdeAuditReportMarkdown(
  request: GenerationRequest,
  audit: RdeAudit,
): string {
  const lines = [
    `<!-- kotonoha rde-audit -->`,
    "",
    `# RDE audit`,
    "",
    `**File:** \`${request.context.filePath}\``,
    `**Source hash:** \`${request.context.sourceHash.slice(0, 16)}…\``,
    `**Recommended:** ${audit.recommendedDecision}`,
    "",
    "## Categories",
    audit.categories.join(", ") || "(none)",
    "",
  ];

  appendSection(lines, "Preserved", audit.preservedElements);
  appendSection(lines, "Transformed", audit.transformedElements);
  appendSection(lines, "Inferred", audit.inferredExtensions);
  appendSection(lines, "Unresolved", audit.unresolvedElements);
  appendSection(lines, "Drift risks", audit.driftRisks);

  lines.push("## Source excerpt", "", request.context.sourceText.slice(0, 2000));
  if (request.context.sourceText.length > 2000) {
    lines.push("", "…");
  }

  return lines.join("\n");
}

function appendSection(lines: string[], title: string, items: string[]): void {
  if (items.length === 0) return;
  lines.push(`## ${title}`, "");
  for (const item of items) {
    lines.push(`- ${item}`);
  }
  lines.push("");
}
