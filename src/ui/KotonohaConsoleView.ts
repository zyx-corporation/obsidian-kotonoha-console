import { ItemView, MarkdownView, Notice, WorkspaceLeaf } from "obsidian";
import type KotonohaConsolePlugin from "../main";
import type { OperationType } from "../domain/types";
import type { ProposalBundle } from "../services/ProposalService";
import { ProposalView } from "./ProposalView";
import { RdeAuditView } from "./RdeAuditView";

export const KOTONOHA_CONSOLE_VIEW = "kotonoha-console-view";

export class KotonohaConsoleView extends ItemView {
  private bundle: ProposalBundle | null = null;
  private lastOperation: OperationType = "rde_audit";
  private sourceHashAtGeneration: string | null = null;
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
      text: "提案は自動適用されません。RDE 監査レポートはノートに書き込みません。",
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
    for (const op of ["rde_audit", "summarize", "rewrite", "expand", "custom"] as OperationType[]) {
      const opt = this.operationSelect.createEl("option", { value: op, text: op });
      opt.value = op;
    }
    this.operationSelect.value = "rde_audit";

    form.createEl("label", { text: "Instruction" });
    this.instructionInput = form.createEl("textarea", {
      attr: { rows: "3", placeholder: "任意の指示（監査の観点など）…" },
    });

    const actions = form.createDiv({ cls: "kotonoha-console-actions" });
    actions
      .createEl("button", { text: "RDE 監査を実施", cls: "mod-cta" })
      .addEventListener("click", () => void this.runRdeAudit());
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

  /** Command palette: RDE 監査を実施 */
  async runRdeAudit(): Promise<void> {
    this.operationSelect.value = "rde_audit";
    await this.runGenerate();
  }

  private async runGenerate(): Promise<void> {
    const ctx = await this.plugin.noteContext.capture();
    if (!ctx) {
      new Notice("アクティブなノートがありません");
      return;
    }

    const operation = this.operationSelect.value as OperationType;
    this.lastOperation = operation;
    const instruction = this.instructionInput.value.trim();
    const request = this.plugin.generationRequests.create(
      ctx,
      operation,
      instruction,
      this.plugin.settings.defaultLanguage,
    );

    try {
      this.sourceHashAtGeneration = ctx.sourceHash;
      this.bundle = await this.plugin.proposals.generate(request);
      await this.plugin.auditLog.logProposal(
        this.bundle.proposal,
        ctx.sourceText,
      );
      if (this.plugin.settings.sidecarMode && this.bundle.audit) {
        await this.plugin.sidecar.saveProposalRecord(request, this.bundle.proposal);
        await this.plugin.sidecar.saveRdeAuditRecord(
          request,
          this.bundle.proposal,
          this.bundle.audit,
        );
      }
      this.renderBundle();
      const msg =
        operation === "rde_audit"
          ? "RDE 監査完了（.kotonoha/audit/ に保存）"
          : "Proposal ready (not applied)";
      new Notice(msg);
    } catch (e) {
      new Notice(`失敗: ${message(e)}`);
    }
  }

  private renderBundle(): void {
    this.proposalHost.empty();
    this.auditHost.empty();
    if (!this.bundle) return;

    const isAuditReport = this.lastOperation === "rde_audit";

    new ProposalView(this.proposalHost, this.bundle.proposal, {
      onApply: () => void this.applyProposal(),
      onReject: () => void this.rejectProposal(),
      onCopy: () => void this.copyProposal(),
      auditReportOnly: isAuditReport,
    });

    if (this.bundle.audit && (this.plugin.settings.enableRdeAudit || isAuditReport)) {
      new RdeAuditView(this.auditHost, this.bundle.audit);
    }
  }

  private async applyProposal(): Promise<void> {
    if (!this.bundle) return;
    if (this.lastOperation === "rde_audit") {
      new Notice("RDE 監査レポートはノートに適用できません（Copy を使用）");
      return;
    }

    const ctx = await this.plugin.noteContext.capture();
    if (!ctx) {
      new Notice("No active note");
      return;
    }

    const current = await this.plugin.noteContext.capture();
    if (
      this.sourceHashAtGeneration &&
      current &&
      current.sourceHash !== this.sourceHashAtGeneration
    ) {
      const ok = confirm(
        "ソースが変更されています。再監査または明示的な上書きが必要です。続行しますか？",
      );
      if (!ok) return;
    }

    if (this.plugin.settings.requireHumanApproval) {
      const ok = confirm(
        "この提案をノートに適用しますか？元のテキストは上書きされます。",
      );
      if (!ok) return;
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
    new Notice(this.lastOperation === "rde_audit" ? "監査を記録（却下）" : "Rejected");
    this.bundle = null;
    this.proposalHost.empty();
    this.auditHost.empty();
  }

  private async copyProposal(): Promise<void> {
    if (!this.bundle) return;
    await navigator.clipboard.writeText(this.bundle.proposal.proposedText);
    new Notice("クリップボードにコピーしました");
  }
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
