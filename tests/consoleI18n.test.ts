import { describe, expect, it } from "vitest";
import { consoleMsg, operationLabel } from "../src/i18n/consoleI18n";

describe("consoleI18n", () => {
  it("Japanese console labels", () => {
    expect(consoleMsg("ja", "labelOperation")).toBe("操作");
    expect(consoleMsg("ja", "btnGenerate")).toBe("提案を生成");
    expect(operationLabel("ja", "rde_audit")).toBe("RDE 監査");
  });

  it("Simplified Chinese console labels", () => {
    expect(consoleMsg("zh_CN", "labelOperation")).toBe("操作");
    expect(consoleMsg("zh_CN", "btnGenerate")).toBe("生成提案");
    expect(consoleMsg("zh_CN", "tagline")).toBe("提案不会自动应用。");
    expect(operationLabel("zh_CN", "rde_audit")).toBe("RDE 审计");
  });

  it("settings labels follow default language", () => {
    expect(consoleMsg("ja", "settingsBackendModeName")).toBe("バックエンドモード");
    expect(consoleMsg("en", "settingsDefaultLanguageName")).toBe("Default language");
    expect(consoleMsg("zh_CN", "settingsRequireApprovalName")).toBe("应用前必须人工批准");
    expect(consoleMsg("ja", "settingsLangZhCn")).toBe("简体中文 (zh_CN)");
  });

  it("command palette labels", () => {
    expect(consoleMsg("ja", "cmdRunRdeAudit")).toBe("RDE 監査を実施（アクティブノート）");
    expect(consoleMsg("en", "cmdOpenConsole")).toBe("Open Kotonoha Console");
    expect(consoleMsg("zh_CN", "cmdRunRdeAudit")).toBe("运行 RDE 审计（活动笔记）");
  });
});
