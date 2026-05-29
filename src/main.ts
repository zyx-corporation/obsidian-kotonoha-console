import { Notice, Plugin } from "obsidian";
import { cliErrorMessage, runKotonoha } from "./cli/runKotonoha";
import { buildCliEnv } from "./cli/buildCliEnv";
import { vaultBasePath } from "./util/vaultPath";
import {
  DEFAULT_SETTINGS,
  type KotonohaConsoleSettings,
} from "./settings/PluginSettings";
import { KotonohaSettingsTab } from "./settings/SettingsTab";
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

  async onload(): Promise<void> {
    await this.loadSettings();
    this.refreshNoteReader();
    this.markdownWriter = new MarkdownWriter(this.app);
    this.noteContext = new NoteContextService(this.activeNoteReader);
    this.refreshClient();
    this.refreshAuditLog();
    this.sidecar = new SidecarStore(this.app);

    this.registerView(KOTONOHA_CONSOLE_VIEW, (leaf) => new KotonohaConsoleView(leaf, this));

    this.addRibbonIcon("layers", "Kotonoha Console", () => {
      void this.activateConsole();
    });

    this.addCommand({
      id: "open-console",
      name: "Open Kotonoha Console",
      callback: () => void this.activateConsole(),
    });

    this.addCommand({
      id: "run-rde-audit",
      name: "RDE 監査を実施（アクティブノート）",
      callback: () => void this.runRdeAuditCommand(),
    });

    this.addSettingTab(new KotonohaSettingsTab(this.app, this));
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
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...((await this.loadData()) as Partial<KotonohaConsoleSettings> | undefined),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async testCliVersion(): Promise<void> {
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
        new Notice(result.stdout.trim().split("\n")[0] ?? "kotonoha ok");
      } else {
        new Notice(`CLI error: ${cliErrorMessage(result)}`);
      }
    } catch (e) {
      new Notice(`CLI spawn failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
