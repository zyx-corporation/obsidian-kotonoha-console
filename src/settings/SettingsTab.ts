import { App, PluginSettingTab, Setting } from "obsidian";
import type KotonohaConsolePlugin from "../main";
import type { BackendMode, GitMode } from "../domain/types";

export class KotonohaSettingsTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: KotonohaConsolePlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Kotonoha Console" });

    new Setting(containerEl)
      .setName("Backend mode")
      .setDesc("cli = kotonoha CLI; RDE audit works without Git; context export only when gitMode ≠ off")
      .addDropdown((d) =>
        d
          .addOptions({ mock: "mock", http: "http", cli: "cli" })
          .setValue(this.plugin.settings.backendMode)
          .onChange(async (v) => {
            this.plugin.settings.backendMode = v as BackendMode;
            await this.plugin.saveSettings();
            this.plugin.refreshClient();
            this.display();
          }),
      );

    containerEl.createEl("h3", { text: "CLI (kotonoha ≥ 0.3.1)" });

    new Setting(containerEl)
      .setName("CLI command")
      .setDesc("Path to kotonoha binary")
      .addText((t) =>
        t
          .setPlaceholder("kotonoha")
          .setValue(this.plugin.settings.cliCommand ?? "kotonoha")
          .onChange(async (v) => {
            this.plugin.settings.cliCommand = v;
            await this.plugin.saveSettings();
            this.plugin.refreshClient();
          }),
      )
      .addButton((b) =>
        b.setButtonText("Test version").onClick(() => {
          void this.plugin.testCliVersion();
        }),
      );

    new Setting(containerEl)
      .setName("CLI workdir")
      .setDesc("Git repo root for --path (empty = vault folder)")
      .addText((t) =>
        t
          .setPlaceholder("(vault path)")
          .setValue(this.plugin.settings.cliWorkdir ?? "")
          .onChange(async (v) => {
            this.plugin.settings.cliWorkdir = v;
            await this.plugin.saveSettings();
            this.plugin.refreshClient();
          }),
      );

    new Setting(containerEl)
      .setName("DATABASE_URL")
      .setDesc("Optional; required for DB-backed CLI commands later")
      .addText((t) =>
        t
          .setPlaceholder("postgres://…")
          .setValue(this.plugin.settings.databaseUrl ?? "")
          .onChange(async (v) => {
            this.plugin.settings.databaseUrl = v;
            await this.plugin.saveSettings();
            this.plugin.refreshClient();
          }),
      );

    new Setting(containerEl)
      .setName("KOTONOHA_PRINCIPAL_ID")
      .addText((t) =>
        t
          .setPlaceholder("UUID")
          .setValue(this.plugin.settings.principalId ?? "")
          .onChange(async (v) => {
            this.plugin.settings.principalId = v;
            await this.plugin.saveSettings();
            this.plugin.refreshClient();
          }),
      );

    new Setting(containerEl)
      .setName("KOTONOHA_PROJECT_ID")
      .addText((t) =>
        t
          .setPlaceholder("UUID")
          .setValue(this.plugin.settings.projectId ?? "")
          .onChange(async (v) => {
            this.plugin.settings.projectId = v;
            await this.plugin.saveSettings();
            this.plugin.refreshClient();
          }),
      );

    new Setting(containerEl)
      .setName("Git mode")
      .setDesc("Git-aware but never mutates the repo (git-mode-spec)")
      .addDropdown((d) =>
        d
          .addOptions({
            off: "off",
            external: "external",
            "passive-observing": "passive-observing",
            "obsidian-git-aware": "obsidian-git-aware",
          })
          .setValue(this.plugin.settings.gitMode)
          .onChange(async (v) => {
            this.plugin.settings.gitMode = v as GitMode;
            await this.plugin.saveSettings();
            this.plugin.refreshNoteReader();
          }),
      );

    new Setting(containerEl)
      .setName("Default language")
      .addDropdown((d) =>
        d
          .addOptions({ ja: "ja", en: "en" })
          .setValue(this.plugin.settings.defaultLanguage)
          .onChange(async (v) => {
            this.plugin.settings.defaultLanguage = v as "ja" | "en";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Require human approval before apply")
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.requireHumanApproval)
          .onChange(async (v) => {
            this.plugin.settings.requireHumanApproval = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Enable RDE audit panel")
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.enableRdeAudit)
          .onChange(async (v) => {
            this.plugin.settings.enableRdeAudit = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Audit log mode")
      .addDropdown((d) =>
        d
          .addOptions({
            hash_only: "hash_only",
            summary: "summary",
            full_text: "full_text",
          })
          .setValue(this.plugin.settings.auditLogMode)
          .onChange(async (v) => {
            this.plugin.settings.auditLogMode = v as typeof this.plugin.settings.auditLogMode;
            await this.plugin.saveSettings();
            this.plugin.refreshAuditLog();
          }),
      );
  }
}
