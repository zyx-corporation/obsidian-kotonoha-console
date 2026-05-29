import { execFile } from "child_process";
import { promisify } from "util";
import { join, relative } from "path";
import type { GitContextSnapshot, GitMode } from "../domain/types";

const execFileAsync = promisify(execFile);

export type GitExec = (args: string[], cwd: string) => Promise<string | undefined>;

const GIT_TIMEOUT_MS = 5000;

export async function defaultGitExec(
  args: string[],
  cwd: string,
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: 256 * 1024,
    });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Read-only Git snapshot (never mutates repo — git-mode-spec §6). */
export async function buildGitContext(
  vaultPath: string,
  filePath: string,
  mode: GitMode,
  exec: GitExec = defaultGitExec,
): Promise<GitContextSnapshot | undefined> {
  if (mode === "off" || !vaultPath.trim()) return undefined;

  const root = await exec(["rev-parse", "--show-toplevel"], vaultPath);
  if (!root) {
    return {
      root: vaultPath,
      repoRelativePath: filePath,
      dirty: false,
    };
  }

  const absFile = join(vaultPath, filePath);
  const repoRelativePath = relative(root, absFile).split("\\").join("/") || filePath;

  if (mode === "external") {
    return { root, repoRelativePath, dirty: false };
  }

  const branch = await exec(["rev-parse", "--abbrev-ref", "HEAD"], root);
  const commit = await exec(["rev-parse", "--short", "HEAD"], root);
  const fileStatus = await exec(["status", "--porcelain", "--", repoRelativePath], root);
  const repoStatus = await exec(["status", "--porcelain"], root);

  return {
    root,
    branch,
    commit,
    repoRelativePath,
    dirty: Boolean(fileStatus?.length || repoStatus?.length),
  };
}
