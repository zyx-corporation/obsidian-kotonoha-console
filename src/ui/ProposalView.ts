import type { Proposal } from "../domain/types";
import { consoleMsg } from "../i18n/consoleI18n";
import type { RdeLang } from "../rde/rdeI18n";
import { rdeAuditUnavailableMessage } from "./rdeAuditPolicyMessages";

export interface ProposalViewActions {
  onApply: () => void;
  onReject: () => void;
  onCopy: () => void;
  onRevise?: () => void;
  onCancelRevise?: () => void;
  onReAudit?: () => void;
  language?: RdeLang;
  auditReportOnly?: boolean;
  auditMissing?: boolean;
  applyScopeText?: string;
  applyScopeWarningText?: string;
  exportCorrelationText?: string;
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
    const lang = actions.language;
    host.createEl("h3", {
      cls: "kotonoha-console-section-title",
      text: actions.auditReportOnly
        ? consoleMsg(lang, "auditReportTitle")
        : actions.reviseMode
          ? consoleMsg(lang, "proposalReviseTitle")
          : consoleMsg(lang, "proposalTitle"),
    });
    if (proposal.summary) {
      host.createEl("p", { cls: "kotonoha-console-muted", text: proposal.summary });
    }
    if (actions.auditMissing) {
      host.createEl("p", {
        cls: "kotonoha-console-warn",
        text: rdeAuditUnavailableMessage(lang),
      });
    }
    if (proposal.uncertaintyNote) {
      host.createEl("p", {
        cls: "kotonoha-console-warn",
        text: proposal.uncertaintyNote,
      });
    }
    if (!actions.auditReportOnly && actions.applyScopeText) {
      host.createEl("p", {
        cls: "kotonoha-console-apply-scope",
        text: actions.applyScopeText,
      });
    }
    if (!actions.auditReportOnly && actions.applyScopeWarningText) {
      host.createEl("p", {
        cls: "kotonoha-console-warn",
        text: actions.applyScopeWarningText,
      });
    }
    if (actions.exportCorrelationText) {
      host.createEl("p", {
        cls: "kotonoha-console-export-correlation",
        text: actions.exportCorrelationText,
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
      const pre = host.createEl("pre", {
        cls: actions.auditReportOnly
          ? "kotonoha-console-pre kotonoha-console-pre-audit"
          : "kotonoha-console-pre",
      });
      pre.setText(proposal.proposedText);
    }

    const bar = host.createDiv({ cls: "kotonoha-console-actions" });
    if (actions.reviseMode) {
      bar
        .createEl("button", { text: consoleMsg(lang, "btnApplyRevision"), cls: "mod-cta" })
        .addEventListener("click", actions.onApply);
      if (actions.onReAudit) {
        bar
          .createEl("button", { text: consoleMsg(lang, "btnReAudit") })
          .addEventListener("click", actions.onReAudit);
      }
      bar
        .createEl("button", { text: consoleMsg(lang, "btnCancelRevise") })
        .addEventListener("click", () => actions.onCancelRevise?.());
      bar
        .createEl("button", { text: consoleMsg(lang, "btnCopy") })
        .addEventListener("click", actions.onCopy);
    } else if (!actions.auditReportOnly) {
      bar
        .createEl("button", { text: consoleMsg(lang, "btnApply") })
        .addEventListener("click", actions.onApply);
      if (actions.onRevise) {
        bar
          .createEl("button", { text: consoleMsg(lang, "btnRevise") })
          .addEventListener("click", actions.onRevise);
      }
      if (actions.onReAudit) {
        bar
          .createEl("button", { text: consoleMsg(lang, "btnReAudit") })
          .addEventListener("click", actions.onReAudit);
      }
      bar
        .createEl("button", { text: consoleMsg(lang, "btnReject") })
        .addEventListener("click", actions.onReject);
      bar
        .createEl("button", { text: consoleMsg(lang, "btnCopy") })
        .addEventListener("click", actions.onCopy);
    } else {
      bar
        .createEl("button", { text: consoleMsg(lang, "btnCloseRecord") })
        .addEventListener("click", actions.onReject);
      bar
        .createEl("button", { text: consoleMsg(lang, "btnCopy") })
        .addEventListener("click", actions.onCopy);
    }
  }
}
