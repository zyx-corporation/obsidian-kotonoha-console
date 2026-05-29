import type { Proposal } from "../domain/types";
import { RDE_AUDIT_UNAVAILABLE } from "./rdeAuditPolicyMessages";

export interface ProposalViewActions {
  onApply: () => void;
  onReject: () => void;
  onCopy: () => void;
  /** RDE audit report — do not offer Apply to note */
  auditReportOnly?: boolean;
  /** rde-audit-policy §16 — audit expected but missing */
  auditMissing?: boolean;
}

export class ProposalView {
  constructor(
    host: HTMLElement,
    proposal: Proposal,
    actions: ProposalViewActions,
  ) {
    host.createEl("h3", {
      text: actions.auditReportOnly ? "RDE 監査レポート" : "Proposal",
    });
    if (proposal.summary) {
      host.createEl("p", { cls: "kotonoha-console-muted", text: proposal.summary });
    }
    if (actions.auditMissing) {
      host.createEl("p", { cls: "kotonoha-console-warn", text: RDE_AUDIT_UNAVAILABLE });
    }
    if (proposal.uncertaintyNote) {
      host.createEl("p", {
        cls: "kotonoha-console-warn",
        text: proposal.uncertaintyNote,
      });
    }
    const pre = host.createEl("pre", { cls: "kotonoha-console-pre" });
    pre.setText(proposal.proposedText);

    const bar = host.createDiv({ cls: "kotonoha-console-actions" });
    if (!actions.auditReportOnly) {
      bar.createEl("button", { text: "Apply" }).addEventListener("click", actions.onApply);
    }
    bar
      .createEl("button", { text: actions.auditReportOnly ? "記録を閉じる" : "Reject" })
      .addEventListener("click", actions.onReject);
    bar.createEl("button", { text: "Copy" }).addEventListener("click", actions.onCopy);
  }
}
