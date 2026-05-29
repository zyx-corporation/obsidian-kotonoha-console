import type { App } from "obsidian";

/** Local vault base path when available (FileSystemAdapter). */
export function vaultBasePath(app: App): string {
  const adapter = app.vault.adapter as { getBasePath?: () => string };
  return typeof adapter.getBasePath === "function" ? adapter.getBasePath() : "";
}
