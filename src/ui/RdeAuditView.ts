import type { RdeAudit } from "../domain/types";
import {
  RDE_AUDIT_LOW_CONFIDENCE,
  shouldShowLowConfidenceWarning,
} from "./rdeAuditPolicyMessages";

const OPEN_BY_DEFAULT = new Set(["Unresolved", "Drift risks"]);

export class RdeAuditView {
  constructor(host: HTMLElement, audit: RdeAudit) {
    host.addClass("kotonoha-console-audit-panel");
    host.createEl("h3", { cls: "kotonoha-console-section-title", text: "RDE audit" });
    if (shouldShowLowConfidenceWarning(audit)) {
      host.createEl("p", { cls: "kotonoha-console-warn", text: RDE_AUDIT_LOW_CONFIDENCE });
    }
    host.createEl("p", {
      cls: "kotonoha-console-audit-summary",
      text: `${audit.recommendedDecision} · ${(audit.confidence * 100).toFixed(0)}% · ${audit.categories.join(", ") || "(none)"}`,
    });

    appendList(host, "Preserved", audit.preservedElements);
    appendList(host, "Transformed", audit.transformedElements);
    appendList(host, "Inferred", audit.inferredExtensions);
    appendList(host, "Unresolved", audit.unresolvedElements);
    appendList(host, "Drift risks", audit.driftRisks);
  }
}

function appendList(host: HTMLElement, title: string, items: string[]): void {
  if (items.length === 0) return;
  const details = host.createEl("details", { cls: "kotonoha-console-audit-details" });
  if (OPEN_BY_DEFAULT.has(title)) details.open = true;
  details.createEl("summary", { text: `${title} (${items.length})` });
  const ul = details.createEl("ul");
  for (const item of items) {
    ul.createEl("li", { text: item });
  }
}
