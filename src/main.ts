import { Notice, Plugin } from "obsidian";
import { cliErrorMessage, runKotonoha } from "./cli/runKotonoha";
import { buildCliEnv } from "./cli/buildCliEnv";
import { vaultBasePath } from "./util/vaultPath";
import { consoleMsg } from "./i18n/consoleI18n";
import {
  DEFAULT_SETTINGS,
  type KotonohaConsoleSettings,
} from "./settings/PluginSettings";
import { KotonohaSettingsTab } from "./settings/SettingsTab";
import { normalizeRdeLang } from "./rde/rdeI18n";
import {
  KOTONOHA_CONSOLE_VIEW,
  KotonohaConsoleView,
} from "./ui/KotonohaConsoleView";
import { ActiveNoteReader } from "./obsidian/ActiveNoteReader";
import { MarkdownWriter } from "./obsidian/MarkdownWriter";
import { NoteContextService } from "./services/NoteContextService";
import { GenerationRequestService } from "./services/GenerationRequestService";
import { ProposalService } from "./services/ProposalService";
import { ApprovalService } from "./services/ApprovalService";
import { AuditLogService } from "./services/AuditLogService";
import { SidecarStore } from "./services/SidecarStore";
import { HttpProbeError, probeHttpBackend } from "./client/http/probeHttpBackend";
import { createKotonohaClient } from "./client/createClient";
import type { KotonohaClient } from "./client/KotonohaClient";

export default class KotonohaConsolePlugin extends Plugin {
  settings: KotonohaConsoleSettings = { ...DEFAULT_SETTINGS };

  activeNoteReader!: ActiveNoteReader;
  markdownWriter!: MarkdownWriter;
  noteContext!: NoteContextService;
  generationRequests = new GenerationRequestService();
  proposals!: ProposalService;
  approval = new ApprovalService();
  auditLog!: AuditLogService;
  sidecar!: SidecarStore;

  private client!: KotonohaClient;
  private settingsTab!: KotonohaSettingsTab;
  private ribbonEl?: HTMLElement;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.refreshNoteReader();
    this.markdownWriter = new MarkdownWriter(this.app);
    this.noteContext = new NoteContextService(this.activeNoteReader);
    this.refreshClient();
    this.refreshAuditLog();
    this.sidecar = new SidecarStore(this.app);

    this.registerView(KOTONOHA_CONSOLE_VIEW, (leaf) => new KotonohaConsoleView(leaf, this));

    this.ribbonEl = this.addRibbonIcon("layers", consoleMsg(this.settings.defaultLanguage, "viewTitle"), () => {
      void this.activateConsole();
    });

    this.registerLocalizedCommands();

    this.settingsTab = new KotonohaSettingsTab(this.app, this);
    this.addSettingTab(this.settingsTab);
  }

  /** Command palette + ribbon labels follow defaultLanguage. */
  registerLocalizedCommands(): void {
    const lang = this.settings.defaultLanguage;
    if (this.ribbonEl) {
      this.ribbonEl.setAttribute("aria-label", consoleMsg(lang, "viewTitle"));
    }
    this.addCommand({
      id: "open-console",
      name: consoleMsg(lang, "cmdOpenConsole"),
      callback: () => void this.activateConsole(),
    });
    this.addCommand({
      id: "run-rde-audit",
      name: consoleMsg(lang, "cmdRunRdeAudit"),
      callback: () => void this.runRdeAuditCommand(),
    });
    this.addCommand({
      id: "test-backend-connection",
      name: consoleMsg(lang, "cmdTestBackend"),
      callback: () => void this.testBackendConnection(),
    });
  }

  refreshNoteReader(): void {
    this.activeNoteReader = new ActiveNoteReader(this.app, this.settings.gitMode);
  }

  refreshClient(): void {
    this.client = createKotonohaClient(this.settings, this.app);
    this.proposals = new ProposalService(this.client);
  }

  refreshAuditLog(): void {
    this.auditLog = new AuditLogService(this.app, this.settings.auditLogMode);
  }

  async runRdeAuditCommand(): Promise<void> {
    await this.activateConsole();
    const leaves = this.app.workspace.getLeavesOfType(KOTONOHA_CONSOLE_VIEW);
    const view = leaves[0]?.view;
    if (view && "runRdeAudit" in view && typeof view.runRdeAudit === "function") {
      await (view as { runRdeAudit: () => Promise<void> }).runRdeAudit();
    }
  }

  async activateConsole(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(KOTONOHA_CONSOLE_VIEW)[0];
    if (!leaf) {
      const right = workspace.getRightLeaf(false);
      if (!right) return;
      await right.setViewState({ type: KOTONOHA_CONSOLE_VIEW, active: true });
      leaf = right;
    }
    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    const raw = (await this.loadData()) as Partial<KotonohaConsoleSettings> | undefined;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...raw,
      defaultLanguage: normalizeRdeLang(raw?.defaultLanguage ?? DEFAULT_SETTINGS.defaultLanguage),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /** Refresh open console panels and settings tab after defaultLanguage changes. */
  async refreshForLanguageChange(): Promise<void> {
    this.registerLocalizedCommands();
    await this.refreshConsoleForLanguageChange();
    this.settingsTab?.refreshDisplay();
  }

  private async refreshConsoleForLanguageChange(): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(KOTONOHA_CONSOLE_VIEW)) {
      const view = leaf.view;
      if (view instanceof KotonohaConsoleView) {
        await view.refreshLocalizedUi();
      }
    }
  }

  /** Disable + enable to load updated main.js from disk (dev workflow). */
  async reloadPlugin(): Promise<void> {
    const id = this.manifest.id;
    const version = this.manifest.version;
    await this.app.plugins.disablePlugin(id);
    await this.app.plugins.enablePlugin(id);
    new Notice(consoleMsg(this.settings.defaultLanguage, "noticePluginReloaded", { version }));
  }

  async testBackendConnection(): Promise<void> {
    const lang = this.settings.defaultLanguage;
    switch (this.settings.backendMode) {
      case "mock":
        new Notice(consoleMsg(lang, "noticeMockBackendOk"));
        return;
      case "cli":
        await this.testCliVersion();
        return;
      case "http":
        await this.testHttpConnection();
        return;
    }
  }

  async testHttpConnection(): Promise<void> {
    const lang = this.settings.defaultLanguage;
    const endpoint = this.settings.httpEndpoint?.trim() || "http://127.0.0.1:8000";
    try {
      const result = await probeHttpBackend(endpoint, this.settings.httpApiKey);
      if (result.endpoint !== endpoint.replace(/\/+$/, "")) {
        this.settings.httpEndpoint = result.endpoint;
        await this.saveSettings();
        this.refreshClient();
      }
      new Notice(
        consoleMsg(lang, "noticeHttpOk", {
          status: result.health,
          backend: result.backend,
          endpoint: result.endpoint,
        }),
      );
    } catch (e) {
      const detail =
        e instanceof HttpProbeError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      new Notice(
        consoleMsg(lang, "noticeHttpFailed", {
          msg: detail,
          endpoint,
        }),
      );
    }
  }

  async testCliVersion(): Promise<void> {
    const lang = this.settings.defaultLanguage;
    const bin = this.settings.cliCommand?.trim() || "kotonoha";
    const cwd =
      this.settings.cliWorkdir?.trim() || vaultBasePath(this.app) || ".";
    try {
      const result = await runKotonoha({
        bin,
        cwd,
        args: ["version"],
        env: buildCliEnv(this.settings),
      });
      if (result.exitCode === 0) {
        new Notice(result.stdout.trim().split("\n")[0] ?? consoleMsg(lang, "noticeCliOk"));
      } else {
        new Notice(consoleMsg(lang, "noticeCliError", { msg: cliErrorMessage(result) }));
      }
    } catch (e) {
      new Notice(
        consoleMsg(lang, "noticeCliSpawnFailed", {
          msg: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  }
}
