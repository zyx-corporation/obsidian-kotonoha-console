import { describe, expect, it } from "vitest";
import { consoleMsg, operationLabel } from "../src/i18n/consoleI18n";

describe("consoleI18n", () => {
  it("Japanese console labels", () => {
    expect(consoleMsg("ja", "labelOperation")).toBe("操作");
    expect(consoleMsg("ja", "btnGenerate")).toBe("提案を生成");
    expect(operationLabel("ja", "rde_audit")).toBe("RDE 監査");
  });
});
