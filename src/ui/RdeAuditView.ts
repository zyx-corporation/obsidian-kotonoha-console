import type { RdeAudit } from "../domain/types";
import {
  RDE_AUDIT_LOW_CONFIDENCE,
  shouldShowLowConfidenceWarning,
} from "./rdeAuditPolicyMessages";

export class RdeAuditView {
  constructor(host: HTMLElement, audit: RdeAudit) {
    host.createEl("h3", { text: "RDE audit" });
    if (shouldShowLowConfidenceWarning(audit)) {
      host.createEl("p", { cls: "kotonoha-console-warn", text: RDE_AUDIT_LOW_CONFIDENCE });
    }
    host.createEl("p", {
      text: `Recommended: ${audit.recommendedDecision} · confidence ${(audit.confidence * 100).toFixed(0)}% (informative — not safety score)`,
    });

    const cats = host.createEl("p", {
      text: `Categories: ${audit.categories.join(", ")}`,
    });
    cats.addClass("kotonoha-console-muted");

    appendList(host, "Preserved", audit.preservedElements);
    appendList(host, "Transformed", audit.transformedElements);
    appendList(host, "Inferred", audit.inferredExtensions);
    appendList(host, "Unresolved", audit.unresolvedElements);
    appendList(host, "Drift risks", audit.driftRisks);
  }
}

function appendList(host: HTMLElement, title: string, items: string[]): void {
  if (items.length === 0) return;
  const section = host.createEl("div");
  section.createEl("strong", { text: title });
  const ul = section.createEl("ul");
  for (const item of items) {
    ul.createEl("li", { text: item });
  }
}
