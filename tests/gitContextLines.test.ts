import { describe, expect, it } from "vitest";
import { gitContextLines } from "../src/i18n/consoleI18n";

describe("gitContextLines", () => {
  const git = {
    branch: "main",
    commit: "abc1234",
    dirty: false,
    repoRelativePath: "notes/a.md",
  };

  it("passive-observing: branch snapshot without Obsidian Git line", () => {
    const lines = gitContextLines("ja", git, "passive-observing");
    expect(lines[0]).toContain("main");
    expect(lines[0]).toContain("abc1234");
    expect(lines.some((l) => l.includes("Obsidian Git"))).toBe(false);
  });

  it("obsidian-git-aware: includes Obsidian Git status", () => {
    const lines = gitContextLines(
      "ja",
      { ...git, obsidianGitDetected: true },
      "obsidian-git-aware",
    );
    expect(lines.some((l) => l.includes("Obsidian Git: 有効"))).toBe(true);
  });

  it("obsidian-git-aware: absent plugin message", () => {
    const lines = gitContextLines(
      "en",
      { ...git, obsidianGitDetected: false },
      "obsidian-git-aware",
    );
    expect(lines.some((l) => l.includes("Obsidian Git: not detected"))).toBe(
      true,
    );
  });
});
