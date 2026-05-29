import { ItemView, MarkdownView, Notice, WorkspaceLeaf } from "obsidian";
import type KotonohaConsolePlugin from "../main";
import type { OperationType } from "../domain/types";
import type { ProposalBundle } from "../services/ProposalService";
import { ProposalView } from "./ProposalView";
import { RdeAuditView } from "./RdeAuditView";

export const KOTONOHA_CONSOLE_VIEW = "kotonoha-console-view";

export class KotonohaConsoleView extends ItemView {
  private bundle: ProposalBundle | null = null;
  private proposalHost!: HTMLElement;
  private auditHost!: HTMLElement;
  private instructionInput!: HTMLTextAreaElement;
  private operationSelect!: HTMLSelectElement;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: KotonohaConsolePlugin) {
    super(leaf);
  }

  getViewType(): string {
    return KOTONOHA_CONSOLE_VIEW;
  }

  getDisplayText(): string {
    return "Kotonoha Console";
  }

  getIcon(): string {
    return "layers";
  }

  async onOpen(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("kotonoha-console-root");

    containerEl.createEl("h2", { text: "Kotonoha Console" });
    containerEl.createEl("p", {
      cls: "kotonoha-console-muted",
      text: "提案は自動適用されません。Apply の前に内容を確認してください。",
    });

    const ctx = await this.plugin.noteContext.capture();
    if (ctx) {
      const meta = containerEl.createEl("div", { cls: "kotonoha-console-meta" });
      meta.createEl("div", { text: `Note: ${ctx.filePath}` });
      meta.createEl("div", { text: `Source hash: ${ctx.sourceHash.slice(0, 16)}…` });
      if (ctx.selectionText) {
        meta.createEl("div", { text: "Scope: selection" });
      }
      if (ctx.git) {
        meta.createEl("div", {
          text: `Git mode: ${this.plugin.settings.gitMode} · ${ctx.git.repoRelativePath}`,
        });
      }
    } else {
      containerEl.createEl("p", {
        cls: "kotonoha-console-warn",
        text: "アクティブな Markdown ノートを開いてください。",
      });
    }

    const form = containerEl.createDiv({ cls: "kotonoha-console-form" });
    form.createEl("label", { text: "Operation" });
    this.operationSelect = form.createEl("select");
    for (const op of ["summarize", "rewrite", "expand", "rde_audit", "custom"] as OperationType[]) {
      const opt = this.operationSelect.createEl("option", { value: op, text: op });
      opt.value = op;
    }

    form.createEl("label", { text: "Instruction" });
    this.instructionInput = form.createEl("textarea", {
      attr: { rows: "3", placeholder: "任意の指示…" },
    });

    const actions = form.createDiv({ cls: "kotonoha-console-actions" });
    actions.createEl("button", { text: "Generate proposal" }).addEventListener(
      "click",
      () => void this.runGenerate(),
    );

    this.proposalHost = containerEl.createDiv({ cls: "kotonoha-console-proposal" });
    this.auditHost = containerEl.createDiv({ cls: "kotonoha-console-audit" });
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }

  private async runGenerate(): Promise<void> {
    const ctx = await this.plugin.noteContext.capture();
    if (!ctx) {
      new Notice("No active note");
      return;
    }

    const operation = this.operationSelect.value as OperationType;
    const instruction = this.instructionInput.value.trim();
    const request = this.plugin.generationRequests.create(
      ctx,
      operation,
      instruction,
      this.plugin.settings.defaultLanguage,
    );

    try {
      this.bundle = await this.plugin.proposals.generate(request);
      await this.plugin.auditLog.logProposal(
        this.bundle.proposal,
        ctx.sourceText,
      );
      this.renderBundle();
      new Notice("Proposal ready (not applied)");
    } catch (e) {
      new Notice(`Generate failed: ${message(e)}`);
    }
  }

  private renderBundle(): void {
    this.proposalHost.empty();
    this.auditHost.empty();
    if (!this.bundle) return;

    new ProposalView(this.proposalHost, this.bundle.proposal, {
      onApply: () => void this.applyProposal(),
      onReject: () => void this.rejectProposal(),
      onCopy: () => void this.copyProposal(),
    });

    if (this.plugin.settings.enableRdeAudit && this.bundle.audit) {
      new RdeAuditView(this.auditHost, this.bundle.audit);
    }
  }

  private async applyProposal(): Promise<void> {
    if (!this.bundle) return;
    if (this.plugin.settings.requireHumanApproval) {
      const ok = confirm(
        "この提案をノートに適用しますか？元のテキストは上書きされます。",
      );
      if (!ok) return;
    }

    const ctx = await this.plugin.noteContext.capture();
    if (!ctx) {
      new Notice("No active note");
      return;
    }

    const file = this.plugin.activeNoteReader.getActiveFile();
    if (!file) return;

    const text = this.bundle.proposal.proposedText;
    if (ctx.selectionText) {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      const editor = view?.editor;
      if (editor) {
        editor.replaceSelection(text);
      } else {
        new Notice("Open note in editor to apply selection");
        return;
      }
    } else {
      await this.plugin.markdownWriter.replaceNoteContent(file, text);
    }

    const decision = this.plugin.approval.approve(this.bundle.proposal, text);
    await this.plugin.auditLog.logDecision(decision, this.bundle.audit);
    new Notice("Applied (audit logged)");
    this.bundle = null;
    this.proposalHost.empty();
    this.auditHost.empty();
  }

  private async rejectProposal(): Promise<void> {
    if (!this.bundle) return;
    const decision = this.plugin.approval.reject(this.bundle.proposal);
    await this.plugin.auditLog.logDecision(decision, this.bundle.audit);
    new Notice("Rejected");
    this.bundle = null;
    this.proposalHost.empty();
    this.auditHost.empty();
  }

  private async copyProposal(): Promise<void> {
    if (!this.bundle) return;
    await navigator.clipboard.writeText(this.bundle.proposal.proposedText);
    new Notice("Copied to clipboard");
  }
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
