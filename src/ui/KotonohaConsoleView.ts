import { ItemView, MarkdownView, Notice, WorkspaceLeaf } from "obsidian";
import type KotonohaConsolePlugin from "../main";
import type { GenerationRequest, OperationType, ApprovalDecision } from "../domain/types";
import type { ProposalBundle } from "../services/ProposalService";
import { ProposalView } from "./ProposalView";
import { RdeAuditView } from "./RdeAuditView";
import { performRdeAudit } from "../services/RdeAuditService";

export const KOTONOHA_CONSOLE_VIEW = "kotonoha-console-view";

export class KotonohaConsoleView extends ItemView {
  private bundle: ProposalBundle | null = null;
  private lastRequest: GenerationRequest | null = null;
  private lastOperation: OperationType = "rde_audit";
  private sourceHashAtGeneration: string | null = null;
  private reviseMode = false;
  private editedText = "";
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

    const header = containerEl.createDiv({ cls: "kotonoha-console-header" });
    header.createEl("h2", { text: "Kotonoha Console" });
    header.createEl("p", {
      cls: "kotonoha-console-muted kotonoha-console-tagline",
      text: "提案は自動適用されません。",
    });

    const ctx = await this.plugin.noteContext.capture();
    if (ctx) {
      const meta = header.createEl("div", { cls: "kotonoha-console-meta" });
      meta.createEl("div", {
        cls: "kotonoha-console-meta-line",
        text: `${ctx.filePath} · ${ctx.sourceHash.slice(0, 8)}…`,
      });
      if (ctx.selectionText) {
        meta.createEl("div", { cls: "kotonoha-console-meta-line", text: "Scope: selection" });
      }
      if (ctx.git) {
        meta.createEl("div", {
          cls: "kotonoha-console-meta-line",
          text: `Git: ${this.plugin.settings.gitMode}`,
        });
      }
    } else {
      header.createEl("p", {
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
      attr: { rows: "2", placeholder: "任意の指示…" },
    });

    const actions = form.createDiv({ cls: "kotonoha-console-actions" });
    actions
      .createEl("button", { text: "RDE 監査を実施", cls: "mod-cta" })
      .addEventListener("click", () => void this.runRdeAudit());
    actions.createEl("button", { text: "Generate proposal" }).addEventListener(
      "click",
      () => void this.runGenerate(),
    );

    const results = containerEl.createDiv({ cls: "kotonoha-console-results" });
    this.proposalHost = results.createDiv({ cls: "kotonoha-console-proposal" });
    this.auditHost = results.createDiv({ cls: "kotonoha-console-audit" });
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
      this.lastRequest = request;
      this.reviseMode = false;
      this.editedText = "";
      this.bundle = await this.plugin.proposals.generate(request);
      await this.plugin.auditLog.logProposal(
        this.bundle.proposal,
        ctx.sourceText,
      );
      if (this.plugin.settings.sidecarMode) {
        await this.plugin.sidecar.saveProposalRecord(request, this.bundle.proposal);
        if (this.bundle.audit) {
          await this.plugin.sidecar.saveRdeAuditRecord(
            request,
            this.bundle.proposal,
            this.bundle.audit,
          );
        }
      }
      this.renderBundle();
      const saved =
        this.plugin.settings.sidecarMode
          ? "（.kotonoha/ に保存）"
          : "（sidecarMode off — UI のみ）";
      const msg =
        operation === "rde_audit"
          ? `RDE 監査完了${saved}`
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

    const wantsAudit = this.plugin.settings.enableRdeAudit || isAuditReport;
    const auditMissing = wantsAudit && !isAuditReport && !this.bundle.audit;

    new ProposalView(this.proposalHost, this.bundle.proposal, {
      onApply: () => void this.applyProposal(),
      onReject: () => void this.rejectProposal(),
      onCopy: () => void this.copyProposal(),
      onRevise: isAuditReport ? undefined : () => void this.startRevise(),
      onCancelRevise: () => this.cancelRevise(),
      onReAudit: () => void this.reAuditEditedProposal(),
      auditReportOnly: isAuditReport,
      auditMissing,
      reviseMode: this.reviseMode,
      editedText: this.editedText,
      onEditedTextChange: (text) => {
        this.editedText = text;
      },
    });

    if (this.bundle.audit && wantsAudit) {
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

    const text = this.reviseMode
      ? this.editedText
      : this.bundle.proposal.proposedText;
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

    const decision = this.reviseMode
      ? this.plugin.approval.approveRevised(
          this.bundle.proposal,
          text,
          this.bundle.proposal.proposedText,
        )
      : this.plugin.approval.approve(this.bundle.proposal, text);
    await this.plugin.auditLog.logDecision(decision, this.bundle.audit);
    await this.saveReviewSidecar(decision);
    new Notice(
      decision.decision === "partially_applied"
        ? "Applied revised text (partially_applied)"
        : "Applied (audit logged)",
    );
    this.bundle = null;
    this.lastRequest = null;
    this.reviseMode = false;
    this.editedText = "";
    this.proposalHost.empty();
    this.auditHost.empty();
  }

  private async rejectProposal(): Promise<void> {
    if (!this.bundle) return;
    const decision = this.plugin.approval.reject(this.bundle.proposal);
    await this.plugin.auditLog.logDecision(decision, this.bundle.audit);
    await this.saveReviewSidecar(decision);
    new Notice(this.lastOperation === "rde_audit" ? "監査を記録（却下）" : "Rejected");
    this.bundle = null;
    this.lastRequest = null;
    this.proposalHost.empty();
    this.auditHost.empty();
  }

  private async copyProposal(): Promise<void> {
    if (!this.bundle) return;
    const text = this.reviseMode ? this.editedText : this.bundle.proposal.proposedText;
    await navigator.clipboard.writeText(text);
    new Notice("クリップボードにコピーしました");
  }

  private async startRevise(): Promise<void> {
    if (!this.bundle || this.lastOperation === "rde_audit") return;
    this.reviseMode = true;
    this.editedText = this.bundle.proposal.proposedText;
    const decision = this.plugin.approval.hold(
      this.bundle.proposal,
      "user opened revise editor",
    );
    await this.plugin.auditLog.logDecision(decision, this.bundle.audit);
    await this.saveReviewSidecar(decision);
    new Notice("Revise mode — edit proposal, then Apply revision or Re-audit");
    this.renderBundle();
  }

  private cancelRevise(): void {
    this.reviseMode = false;
    this.editedText = "";
    this.renderBundle();
  }

  private async reAuditEditedProposal(): Promise<void> {
    if (!this.bundle || !this.lastRequest) return;
    const audit = performRdeAudit(this.lastRequest, this.bundle.proposal.id, {
      proposalText: this.editedText,
    });
    this.bundle = { ...this.bundle, audit };
    if (this.plugin.settings.sidecarMode) {
      await this.plugin.sidecar.saveRdeAuditRecord(
        this.lastRequest,
        this.bundle.proposal,
        audit,
      );
    }
    new Notice("Re-audit complete (local rule-based)");
    this.renderBundle();
  }

  private async saveReviewSidecar(decision: ApprovalDecision): Promise<void> {
    if (!this.plugin.settings.sidecarMode || !this.lastRequest || !this.bundle) {
      return;
    }
    await this.plugin.sidecar.saveReviewRecord(
      this.lastRequest,
      this.bundle.proposal,
      decision,
      this.bundle.audit,
    );
  }
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
