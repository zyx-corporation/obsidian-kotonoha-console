import { ItemView, Notice, WorkspaceLeaf, TFile } from "obsidian";
import type KotonohaConsolePlugin from "../main";
import type { GenerationRequest, OperationType, ApprovalDecision } from "../domain/types";
import type { ProposalBundle } from "../services/ProposalService";
import { ProposalView } from "./ProposalView";
import { RdeAuditView } from "./RdeAuditView";
import { consoleMsg, operationLabel, gitContextLines } from "../i18n/consoleI18n";
import type { RdeLang } from "../rde/rdeI18n";
import { localizeBundleForDisplay } from "../services/localizeBundle";
import { formatAuditEngineNoticeLine } from "../rde/auditEngine";
import { composeAppliedNote } from "../obsidian/applyNoteContent";
import { readGitContext } from "../obsidian/GitContextReader";
import {
  resolveTargetFilePath,
  sourceHashMismatch,
} from "../obsidian/noteIoGuards";
import {
  effectiveMetadataWriteMode,
  mergeKotonohaFrontmatter,
  shouldWriteMetadata,
} from "../obsidian/metadataLineage";
import { isRevisionAuditStale } from "../obsidian/revisionAuditGuards";
import {
  describeApplyScope,
  isApplyScopeSupported,
  type ApplyScope,
} from "../obsidian/applyScope";

export const KOTONOHA_CONSOLE_VIEW = "kotonoha-console-view";

export class KotonohaConsoleView extends ItemView {
  private bundle: ProposalBundle | null = null;
  private lastRequest: GenerationRequest | null = null;
  private lastOperation: OperationType = "rde_audit";
  private targetFilePath: string | null = null;
  private sourceHashAtGeneration: string | null = null;
  private gitCommitAtGeneration: string | null = null;
  private auditedProposalText: string | null = null;
  private reviseMode = false;
  private editedText = "";
  private proposalHost!: HTMLElement;
  private auditHost!: HTMLElement;
  private instructionInput!: HTMLTextAreaElement;
  private instructionBlock!: HTMLElement;
  private operationSelect!: HTMLSelectElement;
  private primaryActionButton!: HTMLButtonElement;
  private busyCount = 0;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: KotonohaConsolePlugin) {
    super(leaf);
  }

  getViewType(): string {
    return KOTONOHA_CONSOLE_VIEW;
  }

  getDisplayText(): string {
    return consoleMsg(this.plugin.settings.defaultLanguage, "viewTitle");
  }

  getIcon(): string {
    return "layers";
  }

  async onOpen(): Promise<void> {
    await this.buildUi();
  }

  /** Rebuild chrome when defaultLanguage changes (keeps proposal/audit state). */
  async refreshLocalizedUi(): Promise<void> {
    const op = (this.operationSelect?.value as OperationType | undefined) ?? this.lastOperation;
    const instruction = this.instructionInput?.value ?? "";
    await this.buildUi(op, instruction);
    if (this.bundle) this.renderBundle();
  }

  private async buildUi(
    restoreOp?: OperationType,
    restoreInstruction?: string,
  ): Promise<void> {
    const lang = this.plugin.settings.defaultLanguage;
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("kotonoha-console-root");

    const header = containerEl.createDiv({ cls: "kotonoha-console-header" });
    header.createEl("h2", { text: consoleMsg(lang, "viewTitle") });
    header.createEl("p", {
      cls: "kotonoha-console-muted kotonoha-console-tagline",
      text: consoleMsg(lang, "tagline"),
    });

    const ctx = await this.plugin.noteContext.capture();
    if (ctx) {
      const meta = header.createEl("div", { cls: "kotonoha-console-meta" });
      meta.createEl("div", {
        cls: "kotonoha-console-meta-line",
        text: `${ctx.filePath} · ${ctx.sourceHash.slice(0, 8)}…`,
      });
      if (ctx.selectionText) {
        meta.createEl("div", {
          cls: "kotonoha-console-meta-line",
          text: consoleMsg(lang, "scopeSelection"),
        });
      }
      if (ctx.git) {
        for (const line of gitContextLines(lang, ctx.git, this.plugin.settings.gitMode)) {
          meta.createEl("div", { cls: "kotonoha-console-meta-line", text: line });
        }
      }
    } else {
      header.createEl("p", {
        cls: "kotonoha-console-warn",
        text: consoleMsg(lang, "noActiveNote"),
      });
    }

    const form = containerEl.createDiv({ cls: "kotonoha-console-form" });
    form.createEl("label", { text: consoleMsg(lang, "labelOperation") });
    this.operationSelect = form.createEl("select");
    for (const op of ["rde_audit", "summarize", "rewrite", "expand", "custom"] as OperationType[]) {
      const opt = this.operationSelect.createEl("option", {
        value: op,
        text: operationLabel(lang, op),
      });
      opt.value = op;
    }
    this.operationSelect.value = restoreOp ?? "rde_audit";
    this.operationSelect.addEventListener("change", () => this.syncOperationUi());

    this.instructionBlock = form.createDiv({ cls: "kotonoha-console-instruction" });
    this.instructionBlock.createEl("label", { text: consoleMsg(lang, "labelInstruction") });
    this.instructionInput = this.instructionBlock.createEl("textarea", {
      attr: { rows: "2", placeholder: consoleMsg(lang, "instructionPlaceholder") },
    });
    if (restoreInstruction !== undefined) {
      this.instructionInput.value = restoreInstruction;
    }

    const actions = form.createDiv({ cls: "kotonoha-console-actions" });
    this.primaryActionButton = actions.createEl("button", { cls: "mod-cta" });
    this.syncOperationUi();
    this.primaryActionButton.addEventListener("click", () => void this.runGenerate());

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
    this.syncOperationUi();
    await this.runGenerate();
  }

  /** Keep form chrome aligned with selected operation; drop stale results on operation change. */
  private syncOperationUi(): void {
    const lang = this.plugin.settings.defaultLanguage;
    const op = (this.operationSelect?.value ?? "rde_audit") as OperationType;
    this.primaryActionButton.textContent =
      op === "rde_audit"
        ? consoleMsg(lang, "btnRdeAudit")
        : consoleMsg(lang, "btnGenerate");
    if (this.instructionBlock) {
      this.instructionBlock.style.display = op === "rde_audit" ? "none" : "";
    }
    if (this.bundle && op !== this.lastOperation) {
      this.clearResults();
    }
  }

  private clearResults(): void {
    this.bundle = null;
    this.lastRequest = null;
    this.targetFilePath = null;
    this.sourceHashAtGeneration = null;
    this.gitCommitAtGeneration = null;
    this.auditedProposalText = null;
    this.reviseMode = false;
    this.editedText = "";
    this.proposalHost?.empty();
    this.auditHost?.empty();
  }

  /** Target note at generation time — Console focus must not break apply. */
  private resolveTargetFile(): TFile | null {
    const active = this.plugin.activeNoteReader.getActiveFile();
    const path = resolveTargetFilePath(
      active?.path ?? null,
      this.targetFilePath,
      (p) => {
        const f = this.app.vault.getAbstractFileByPath(p);
        return f instanceof TFile;
      },
    );
    if (!path) return null;
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  private uiLang(): RdeLang {
    return this.plugin.settings.defaultLanguage;
  }

  /** Local busy state — wait cursor within Console panel only. */
  private setBusy(on: boolean): void {
    this.busyCount = Math.max(0, this.busyCount + (on ? 1 : -1));
    const busy = this.busyCount > 0;
    this.containerEl.classList.toggle("kotonoha-console-busy", busy);
    if (this.primaryActionButton) {
      this.primaryActionButton.disabled = busy;
    }
  }

  private async withBusy<T>(work: () => Promise<T>): Promise<T> {
    this.setBusy(true);
    try {
      return await work();
    } finally {
      this.setBusy(false);
    }
  }

  private async runGenerate(): Promise<void> {
    const lang = this.plugin.settings.defaultLanguage;
    const ctx = await this.plugin.noteContext.capture();
    if (!ctx) {
      this.bundle = null;
      this.proposalHost?.empty();
      this.auditHost?.empty();
      new Notice(consoleMsg(lang, "noticeNoNote"));
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
      await this.withBusy(async () => {
        this.sourceHashAtGeneration = ctx.sourceHash;
        this.gitCommitAtGeneration = ctx.git?.commit ?? null;
        this.targetFilePath = ctx.filePath;
        this.lastRequest = request;
        this.reviseMode = false;
        this.editedText = "";
        this.bundle = await this.plugin.proposals.generate(request);
        this.auditedProposalText = this.bundle.audit
          ? this.bundle.proposal.proposedText
          : null;
        await this.plugin.auditLog.logProposal(
          this.bundle.proposal,
          ctx.sourceText,
        );
        if (this.plugin.settings.sidecarMode) {
          await this.plugin.sidecar.saveProposalRecord(
            request,
            this.bundle.proposal,
            { projectId: this.plugin.settings.projectId },
          );
          if (this.bundle.audit) {
            await this.plugin.sidecar.saveRdeAuditRecord(
              request,
              this.bundle.proposal,
              this.bundle.audit,
              { projectId: this.plugin.settings.projectId },
            );
          }
        }
      });
      this.renderBundle();
      const saved = this.plugin.settings.sidecarMode
        ? consoleMsg(lang, "noticeSavedSidecar")
        : consoleMsg(lang, "noticeSavedUiOnly");
      const msg =
        operation === "rde_audit" || this.bundle?.audit
          ? consoleMsg(lang, "noticeRdeAuditWithEngine", {
              engineLine: this.bundle?.audit
                ? formatAuditEngineNoticeLine(lang, this.bundle.audit)
                : consoleMsg(lang, "auditEngineLocal"),
              saved: operation === "rde_audit" ? saved : "",
            })
          : consoleMsg(lang, "noticeProposalReady");
      new Notice(msg);
    } catch (e) {
      new Notice(consoleMsg(lang, "noticeFailed", { msg: message(e) }));
    }
  }

  private renderBundle(): void {
    this.proposalHost.empty();
    this.auditHost.empty();
    if (!this.bundle || !this.lastRequest) return;

    const isAuditReport = this.lastOperation === "rde_audit";

    const wantsAudit = this.plugin.settings.enableRdeAudit || isAuditReport;
    const auditMissing = wantsAudit && !isAuditReport && !this.bundle.audit;

    const lang = this.plugin.settings.defaultLanguage;
    const displayBundle = localizeBundleForDisplay(
      this.bundle,
      this.lastRequest,
      this.lastOperation,
      lang,
    );

    new ProposalView(this.proposalHost, displayBundle.proposal, {
      onApply: () => void this.applyProposal(),
      onReject: () => void this.rejectProposal(),
      onCopy: () => void this.copyProposal(),
      onRevise: isAuditReport ? undefined : () => void this.startRevise(),
      onCancelRevise: () => this.cancelRevise(),
      onReAudit: isAuditReport ? undefined : () => void this.reAuditProposal(),
      auditReportOnly: isAuditReport,
      auditMissing,
      applyScopeText: isAuditReport ? undefined : this.formatApplyScopeText(lang),
      applyScopeWarningText: isAuditReport
        ? undefined
        : this.formatApplyScopeWarningText(lang),
      exportCorrelationText: this.formatExportCorrelationText(lang),
      language: lang,
      reviseMode: this.reviseMode,
      editedText: this.editedText,
      onEditedTextChange: (text) => {
        this.editedText = text;
      },
    });

    if (displayBundle.audit && wantsAudit) {
      new RdeAuditView(this.auditHost, displayBundle.audit, lang);
    }
  }

  private async applyProposal(): Promise<void> {
    if (!this.bundle) return;
    const lang = this.uiLang();
    if (this.lastOperation === "rde_audit") {
      new Notice(consoleMsg(lang, "noticeAuditNoApply"));
      return;
    }

    const applyScope = this.currentApplyScope();
    if (!isApplyScopeSupported(applyScope)) {
      new Notice(
        consoleMsg(lang, "noticeApplyScopeUnsupported", {
          reason: applyScope.reason,
        }),
      );
      return;
    }

    const file = this.resolveTargetFile();
    if (!file) {
      new Notice(consoleMsg(lang, "noticeNoNote"));
      return;
    }

    const current = await this.plugin.activeNoteReader.readNoteContextForFile(
      file,
      this.lastRequest?.context.selectionText,
    );
    if (
      sourceHashMismatch(this.sourceHashAtGeneration, current?.sourceHash)
    ) {
      const ok = confirm(consoleMsg(lang, "confirmSourceChanged"));
      if (!ok) return;
    }

    if (this.plugin.settings.gitMode === "obsidian-git-aware" && this.gitCommitAtGeneration) {
      const gitNow = await readGitContext(
        this.app,
        file,
        this.plugin.settings.gitMode,
      );
      if (gitNow?.commit && gitNow.commit !== this.gitCommitAtGeneration) {
        const ok = confirm(consoleMsg(lang, "confirmGitHeadChanged"));
        if (!ok) return;
      }
    }

    const proposedTextForApply = this.reviseMode
      ? this.editedText
      : this.bundle.proposal.proposedText;
    if (
      isRevisionAuditStale(
        this.reviseMode,
        proposedTextForApply,
        this.auditedProposalText,
        Boolean(this.bundle.audit),
      )
    ) {
      const ok = confirm(consoleMsg(lang, "confirmRevisionAuditStale"));
      if (!ok) return;
    }

    const okApply = confirm(
      consoleMsg(
        lang,
        applyScope.kind === "selection"
          ? "confirmApplySelection"
          : "confirmApplyWholeNote",
      ),
    );
    if (!okApply) return;

    await this.withBusy(async () => {
      const file = this.resolveTargetFile();
      if (!file) {
        new Notice(
          consoleMsg(lang, "noticeTargetFileMissing", {
            path: this.targetFilePath ?? "?",
          }),
        );
        return;
      }

      const proposedText = this.reviseMode
        ? this.editedText
        : this.bundle!.proposal.proposedText;
      const original = await this.app.vault.read(file);
      const composed = composeAppliedNote(original, proposedText, {
        preserveFrontmatter: this.plugin.settings.preserveFrontmatter,
        selectionText: this.lastRequest?.context.selectionText,
      });

      if (composed.kind === "selection_not_found") {
        new Notice(consoleMsg(lang, "noticeSelectionNotFound"));
        return;
      }

      await this.plugin.markdownWriter.replaceNoteContent(file, composed.content);

      const text = proposedText;

      const decision = this.reviseMode
        ? this.plugin.approval.approveRevised(
            this.bundle!.proposal,
            text,
            this.bundle!.proposal.proposedText,
          )
        : this.plugin.approval.approve(this.bundle!.proposal, text);
      await this.plugin.auditLog.logDecision(decision, this.bundle!.audit);
      await this.saveReviewSidecar(decision);

      const afterApply = await this.app.vault.read(file);
      const withLineage = await this.maybeMergeLineageMetadata(
        afterApply,
        lang,
        decision.decision === "partially_applied" ? "partially_applied" : "applied",
      );
      if (withLineage !== afterApply) {
        await this.plugin.markdownWriter.replaceNoteContent(file, withLineage);
      }

      new Notice(
        decision.decision === "partially_applied"
          ? consoleMsg(lang, "noticeAppliedRevised")
          : consoleMsg(lang, "noticeApplied"),
      );
      this.clearResults();
    });
  }

  private async maybeMergeLineageMetadata(
    content: string,
    lang: RdeLang,
    reviewStatus: string,
  ): Promise<string> {
    const effective = effectiveMetadataWriteMode(
      this.plugin.settings.metadataWriteMode,
      this.plugin.settings.gitMode,
    );
    if (!shouldWriteMetadata(effective)) return content;
    if (effective === "prompt" && !confirm(consoleMsg(lang, "confirmWriteMetadata"))) {
      return content;
    }
    if (!this.bundle) return content;
    return mergeKotonohaFrontmatter(content, {
      review_status: reviewStatus,
      latest_proposal_id: this.bundle.proposal.id,
      project_id: this.plugin.settings.projectId,
    });
  }

  private currentApplyScope(): ApplyScope {
    return describeApplyScope({
      selectionText: this.lastRequest?.context.selectionText,
    });
  }

  private formatApplyScopeText(lang: RdeLang): string {
    const scope = this.currentApplyScope();
    if (scope.kind === "selection") {
      return consoleMsg(lang, "applyScopeSelection", {
        chars: scope.selectedChars,
      });
    }
    if (scope.kind === "unsupported_partial") {
      return consoleMsg(lang, "applyScopeUnsupported", {
        reason: scope.reason,
      });
    }
    return consoleMsg(lang, "applyScopeWholeNote");
  }

  private formatApplyScopeWarningText(lang: RdeLang): string | undefined {
    const scope = this.currentApplyScope();
    if (scope.kind !== "unsupported_partial") return undefined;
    return consoleMsg(lang, "noticeApplyScopeUnsupported", {
      reason: scope.reason,
    });
  }

  private formatExportCorrelationText(lang: RdeLang): string | undefined {
    if (!this.lastRequest) return undefined;
    const commit = this.lastRequest.context.git?.commit;
    const projectId = this.plugin.settings.projectId?.trim();
    if (commit && projectId) {
      return consoleMsg(lang, "exportCorrelationAvailable", {
        projectId,
        commit,
        path: this.lastRequest.context.filePath,
      });
    }
    return consoleMsg(lang, "exportCorrelationMissing", {
      reason:
        !commit && !projectId
          ? "projectId / gitCommit"
          : !projectId
            ? "projectId"
            : "gitCommit",
    });
  }

  private async rejectProposal(): Promise<void> {
    if (!this.bundle) return;
    const lang = this.uiLang();
    await this.withBusy(async () => {
      const decision = this.plugin.approval.reject(this.bundle!.proposal);
      await this.plugin.auditLog.logDecision(decision, this.bundle!.audit);
      await this.saveReviewSidecar(decision);
      new Notice(
        this.lastOperation === "rde_audit"
          ? consoleMsg(lang, "noticeAuditDismissed")
          : consoleMsg(lang, "noticeRejected"),
      );
      this.clearResults();
    });
  }

  private async copyProposal(): Promise<void> {
    if (!this.bundle) return;
    const text = this.reviseMode ? this.editedText : this.bundle.proposal.proposedText;
    await navigator.clipboard.writeText(text);
    new Notice(consoleMsg(this.uiLang(), "noticeCopied"));
  }

  private async startRevise(): Promise<void> {
    if (!this.bundle || this.lastOperation === "rde_audit") return;
    const lang = this.uiLang();
    this.reviseMode = true;
    this.editedText = this.bundle.proposal.proposedText;
    await this.withBusy(async () => {
      const decision = this.plugin.approval.hold(
        this.bundle!.proposal,
        "user opened revise editor",
      );
      await this.plugin.auditLog.logDecision(decision, this.bundle!.audit);
      await this.saveReviewSidecar(decision);
    });
    new Notice(consoleMsg(lang, "noticeReviseMode"));
    this.renderBundle();
  }

  private cancelRevise(): void {
    this.reviseMode = false;
    this.editedText = "";
    this.renderBundle();
  }

  private async reAuditProposal(): Promise<void> {
    if (!this.bundle || !this.lastRequest) return;
    await this.withBusy(async () => {
      const proposalText = this.reviseMode
        ? this.editedText
        : this.bundle!.proposal.proposedText;
      const { audit } = await this.plugin.proposals.auditProposal(
        this.lastRequest!,
        this.bundle!.proposal.id,
        proposalText,
      );
      this.bundle = { ...this.bundle!, audit };
      this.auditedProposalText = proposalText;
      if (this.plugin.settings.sidecarMode) {
        await this.plugin.sidecar.saveRdeAuditRecord(
          this.lastRequest!,
          this.bundle.proposal,
          audit,
          { projectId: this.plugin.settings.projectId },
        );
      }
      new Notice(
        consoleMsg(this.uiLang(), "noticeRdeAuditWithEngine", {
          engineLine: formatAuditEngineNoticeLine(this.uiLang(), audit),
          saved: "",
        }),
      );
      this.renderBundle();
    });
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
      { projectId: this.plugin.settings.projectId },
    );
  }
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
