import type { RdeAudit } from "../domain/types";

export class RdeAuditView {
  constructor(host: HTMLElement, audit: RdeAudit) {
    host.createEl("h3", { text: "RDE audit" });
    host.createEl("p", {
      text: `Recommended: ${audit.recommendedDecision} · confidence ${(audit.confidence * 100).toFixed(0)}% (informative)`,
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
