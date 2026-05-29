import type { App, TFile } from "obsidian";
import type { GitContextSnapshot, GitMode } from "../domain/types";
import { vaultBasePath } from "../util/vaultPath";
import { buildGitContext } from "../util/gitReadonly";

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
  return buildGitContext(vaultPath, file.path, mode);
}
