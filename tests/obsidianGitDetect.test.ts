import { describe, expect, it } from "vitest";
import { isObsidianGitPluginEnabled } from "../src/obsidian/obsidianGitDetect";

function mockApp(enabled: string[], pluginPresent: boolean) {
  const enabledSet = new Set(enabled);
  return {
    plugins: {
      enabledPlugins: enabledSet,
      getPlugin: (id: string) =>
        pluginPresent && enabledSet.has(id) ? { id } : null,
    },
  } as never;
}

describe("isObsidianGitPluginEnabled", () => {
  it("true when obsidian-git is enabled and loaded", () => {
    expect(
      isObsidianGitPluginEnabled(mockApp(["obsidian-git"], true)),
    ).toBe(true);
  });

  it("false when plugin disabled", () => {
    expect(isObsidianGitPluginEnabled(mockApp([], true))).toBe(false);
  });

  it("false when plugin not loaded", () => {
    expect(
      isObsidianGitPluginEnabled(mockApp(["obsidian-git"], false)),
    ).toBe(false);
  });
});
