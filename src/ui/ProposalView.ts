import type { Proposal } from "../domain/types";
import { RDE_AUDIT_UNAVAILABLE } from "./rdeAuditPolicyMessages";

export interface ProposalViewActions {
  onApply: () => void;
  onReject: () => void;
  onCopy: () => void;
  onRevise?: () => void;
  onCancelRevise?: () => void;
  onReAudit?: () => void;
  /** RDE audit report — do not offer Apply to note */
  auditReportOnly?: boolean;
  /** rde-audit-policy §16 — audit expected but missing */
  auditMissing?: boolean;
  /** User is editing proposal before apply */
  reviseMode?: boolean;
  editedText?: string;
  onEditedTextChange?: (text: string) => void;
}

export class ProposalView {
  constructor(
    host: HTMLElement,
    proposal: Proposal,
    actions: ProposalViewActions,
  ) {
    host.createEl("h3", {
      text: actions.auditReportOnly
        ? "RDE 監査レポート"
        : actions.reviseMode
          ? "Proposal（改訂中）"
          : "Proposal",
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

    if (actions.reviseMode) {
      const textarea = host.createEl("textarea", {
        cls: "kotonoha-console-revise",
        attr: { rows: "12" },
      });
      textarea.value = actions.editedText ?? proposal.proposedText;
      textarea.addEventListener("input", () => {
        actions.onEditedTextChange?.(textarea.value);
      });
    } else {
      const pre = host.createEl("pre", { cls: "kotonoha-console-pre" });
      pre.setText(proposal.proposedText);
    }

    const bar = host.createDiv({ cls: "kotonoha-console-actions" });
    if (actions.reviseMode) {
      bar
        .createEl("button", { text: "Apply revision", cls: "mod-cta" })
        .addEventListener("click", actions.onApply);
      if (actions.onReAudit) {
        bar.createEl("button", { text: "Re-audit" }).addEventListener("click", actions.onReAudit);
      }
      bar
        .createEl("button", { text: "Cancel revise" })
        .addEventListener("click", () => actions.onCancelRevise?.());
      bar.createEl("button", { text: "Copy" }).addEventListener("click", actions.onCopy);
    } else if (!actions.auditReportOnly) {
      bar.createEl("button", { text: "Apply" }).addEventListener("click", actions.onApply);
      if (actions.onRevise) {
        bar.createEl("button", { text: "Revise" }).addEventListener("click", actions.onRevise);
      }
      bar.createEl("button", { text: "Reject" }).addEventListener("click", actions.onReject);
      bar.createEl("button", { text: "Copy" }).addEventListener("click", actions.onCopy);
    } else {
      bar
        .createEl("button", { text: "記録を閉じる" })
        .addEventListener("click", actions.onReject);
      bar.createEl("button", { text: "Copy" }).addEventListener("click", actions.onCopy);
    }
  }
}
