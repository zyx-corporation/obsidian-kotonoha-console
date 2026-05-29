import type { RdeAudit } from "../domain/types";
import {
  formatCategory,
  formatDecision,
  type RdeLang,
  rdeMsg,
} from "../rde/rdeI18n";
import {
  rdeAuditLowConfidenceMessage,
  shouldShowLowConfidenceWarning,
} from "./rdeAuditPolicyMessages";

const OPEN_BY_DEFAULT = new Set(["sectionUnresolved", "sectionDriftRisks"]);

export class RdeAuditView {
  constructor(host: HTMLElement, audit: RdeAudit, language?: RdeLang) {
    const lang = language ?? "ja";
    host.addClass("kotonoha-console-audit-panel");
    host.createEl("h3", {
      cls: "kotonoha-console-section-title",
      text: rdeMsg(lang, "auditPanelTitle"),
    });
    if (shouldShowLowConfidenceWarning(audit)) {
      host.createEl("p", {
        cls: "kotonoha-console-warn",
        text: rdeAuditLowConfidenceMessage(lang),
      });
    }
    host.createEl("p", {
      cls: "kotonoha-console-audit-summary",
      text: `${formatDecision(lang, audit.recommendedDecision)} · ${(audit.confidence * 100).toFixed(0)}% · ${audit.categories.map((c) => formatCategory(lang, c)).join(", ") || rdeMsg(lang, "categoryNone")} ${rdeMsg(lang, "confidenceNote")}`,
    });

    appendList(host, lang, "sectionPreserved", audit.preservedElements);
    appendList(host, lang, "sectionTransformed", audit.transformedElements);
    appendList(host, lang, "sectionInferred", audit.inferredExtensions);
    appendList(host, lang, "sectionUnresolved", audit.unresolvedElements);
    appendList(host, lang, "sectionDriftRisks", audit.driftRisks);
  }
}

function appendList(
  host: HTMLElement,
  lang: RdeLang,
  sectionKey: Parameters<typeof rdeMsg>[1],
  items: string[],
): void {
  if (items.length === 0) return;
  const title = rdeMsg(lang, sectionKey);
  const details = host.createEl("details", { cls: "kotonoha-console-audit-details" });
  if (OPEN_BY_DEFAULT.has(sectionKey)) details.open = true;
  details.createEl("summary", { text: `${title} (${items.length})` });
  const ul = details.createEl("ul");
  for (const item of items) {
    ul.createEl("li", { text: item });
  }
}
