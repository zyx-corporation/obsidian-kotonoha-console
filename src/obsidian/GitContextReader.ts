import type { App, TFile } from "obsidian";
import type { GitContextSnapshot, GitMode } from "../domain/types";
import { vaultBasePath } from "../util/vaultPath";

/**
 * Read-only Git context. Never mutates the repository (git-mode-spec).
 * MVP: passive display when Obsidian Git metadata or simple heuristics exist.
 */
export async function readGitContext(
  app: App,
  file: TFile,
  mode: GitMode,
): Promise<GitContextSnapshot | undefined> {
  if (mode === "off") return undefined;

  const repoRelativePath = file.path;
  const dirty = app.vault.getAbstractFileByPath(file.path) !== null;

  // Obsidian does not expose Git natively; enrich later via CLI or community API.
  return {
    repoRelativePath,
    dirty,
    branch: mode === "passive-observing" ? undefined : undefined,
    commit: undefined,
    root: vaultBasePath(app) || undefined,
  };
}
