import type { App, TFile } from "obsidian";
import type { GitContextSnapshot, GitMode } from "../domain/types";
import { vaultBasePath } from "../util/vaultPath";
import { buildGitContext } from "../util/gitReadonly";
import { isObsidianGitPluginEnabled } from "./obsidianGitDetect";

/**
 * Read-only Git context. Never mutates the repository (git-mode-spec).
 */
export async function readGitContext(
  app: App,
  file: TFile,
  mode: GitMode,
): Promise<GitContextSnapshot | undefined> {
  const vaultPath = vaultBasePath(app);
  if (!vaultPath) return undefined;
  const snapshot = await buildGitContext(vaultPath, file.path, mode);
  if (!snapshot) return undefined;
  if (mode === "obsidian-git-aware") {
    return {
      ...snapshot,
      obsidianGitDetected: isObsidianGitPluginEnabled(app),
    };
  }
  return snapshot;
}
