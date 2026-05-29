import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type KotonohaConsolePlugin from "../main";
import type { BackendMode, GitMode } from "../domain/types";
import { consoleMsg } from "../i18n/consoleI18n";
import type { RdeLang } from "../rde/rdeI18n";

const LANG_LABEL: Record<RdeLang, string> = {
  ja: "ja",
  en: "en",
  zh_CN: "zh_CN",
};

export class KotonohaSettingsTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: KotonohaConsolePlugin) {
    super(app, plugin);
  }

  /** Called when defaultLanguage changes so labels refresh while tab is open. */
  refreshDisplay(): void {
    this.display();
  }

  private lang(): RdeLang {
    return this.plugin.settings.defaultLanguage;
  }

  private t(key: Parameters<typeof consoleMsg>[1]): string {
    return consoleMsg(this.lang(), key);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: this.t("settingsTitle") });
    containerEl.createEl("p", {
      cls: "kotonoha-console-muted",
      text: consoleMsg(this.lang(), "settingsDiagnostic", {
        version: this.plugin.manifest.version,
        sample: this.t("settingsBackendModeName"),
      }),
    });

    new Setting(containerEl)
      .setName(this.t("settingsBackendModeName"))
      .setDesc(this.t("settingsBackendModeDesc"))
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

    new Setting(containerEl)
      .setName(this.t("settingsTestBackendName"))
      .setDesc(this.t("settingsTestBackendDesc"))
      .addButton((b) =>
        b.setButtonText(this.t("settingsBtnTestBackend")).onClick(() => {
          void this.plugin.testBackendConnection();
        }),
      );

    if (this.plugin.settings.backendMode === "http") {
      containerEl.createEl("h3", { text: this.t("settingsHttpSection") });

      new Setting(containerEl)
        .setName(this.t("settingsHttpEndpointName"))
        .setDesc(this.t("settingsHttpEndpointDesc"))
        .addText((t) =>
          t
            .setPlaceholder(this.t("settingsHttpEndpointPlaceholder"))
            .setValue(this.plugin.settings.httpEndpoint ?? "")
            .onChange(async (v) => {
              this.plugin.settings.httpEndpoint = v;
              await this.plugin.saveSettings();
              this.plugin.refreshClient();
            }),
        );

      new Setting(containerEl)
        .setName(this.t("settingsHttpApiKeyName"))
        .setDesc(this.t("settingsHttpApiKeyDesc"))
        .addText((t) =>
          t
            .setPlaceholder("Bearer …")
            .setValue(this.plugin.settings.httpApiKey ?? "")
            .onChange(async (v) => {
              this.plugin.settings.httpApiKey = v;
              await this.plugin.saveSettings();
              this.plugin.refreshClient();
            }),
        );
    }

    if (this.plugin.settings.backendMode === "cli") {
      containerEl.createEl("h3", { text: this.t("settingsCliSection") });

      new Setting(containerEl)
        .setName(this.t("settingsCliCommandName"))
        .setDesc(this.t("settingsCliCommandDesc"))
        .addText((t) =>
          t
            .setPlaceholder("kotonoha")
            .setValue(this.plugin.settings.cliCommand ?? "kotonoha")
            .onChange(async (v) => {
              this.plugin.settings.cliCommand = v;
              await this.plugin.saveSettings();
              this.plugin.refreshClient();
            }),
        );

      new Setting(containerEl)
        .setName(this.t("settingsCliWorkdirName"))
        .setDesc(this.t("settingsCliWorkdirDesc"))
        .addText((t) =>
          t
            .setPlaceholder(this.t("settingsCliWorkdirPlaceholder"))
            .setValue(this.plugin.settings.cliWorkdir ?? "")
            .onChange(async (v) => {
              this.plugin.settings.cliWorkdir = v;
              await this.plugin.saveSettings();
              this.plugin.refreshClient();
            }),
        );

      new Setting(containerEl)
        .setName("DATABASE_URL")
        .setDesc(this.t("settingsDatabaseUrlDesc"))
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
    }

    new Setting(containerEl)
      .setName(this.t("settingsGitModeName"))
      .setDesc(this.t("settingsGitModeDesc"))
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
      .setName(this.t("settingsDefaultLanguageName"))
      .addDropdown((d) =>
        d
          .addOptions({
            ja: this.t("settingsLangJa"),
            en: this.t("settingsLangEn"),
            zh_CN: this.t("settingsLangZhCn"),
          })
          .setValue(this.plugin.settings.defaultLanguage)
          .onChange(async (v) => {
            this.plugin.settings.defaultLanguage = v as "ja" | "en" | "zh_CN";
            await this.plugin.saveSettings();
            new Notice(
              consoleMsg(v as RdeLang, "noticeLanguageChanged", {
                lang: LANG_LABEL[v as RdeLang],
              }),
            );
            await this.plugin.refreshForLanguageChange();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName(this.t("settingsRequireApprovalName"))
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.requireHumanApproval)
          .onChange(async (v) => {
            this.plugin.settings.requireHumanApproval = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(this.t("settingsEnableRdeAuditName"))
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.enableRdeAudit)
          .onChange(async (v) => {
            this.plugin.settings.enableRdeAudit = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(this.t("settingsAuditLogModeName"))
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

    new Setting(containerEl)
      .setName(this.t("settingsBtnReloadPlugin"))
      .addButton((b) =>
        b.setButtonText(this.t("settingsBtnReloadPlugin")).onClick(() => {
          void this.plugin.reloadPlugin();
        }),
      );
  }
}
