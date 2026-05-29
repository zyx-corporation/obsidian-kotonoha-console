import type { App, TFile } from "obsidian";
import type { NoteContext } from "../domain/types";
import { sha256Hex } from "../util/hash";
import { readGitContext } from "./GitContextReader";
import type { GitMode } from "../domain/types";
import { vaultBasePath } from "../util/vaultPath";

export class ActiveNoteReader {
  constructor(
    private readonly app: App,
    private readonly gitMode: GitMode,
  ) {}

  getActiveFile(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    return file ?? null;
  }

  async readNoteContext(selectionText?: string): Promise<NoteContext | null> {
    const file = this.getActiveFile();
    if (!file) return null;

    const sourceText = await this.app.vault.read(file);
    const targetText =
      selectionText !== undefined && selectionText.length > 0
        ? selectionText
        : sourceText;

    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = (cache?.frontmatter as Record<string, unknown>) ?? {};
    const tags = (cache?.tags ?? []).map((t) => t.tag);
    const links = (cache?.links ?? []).map((l) => l.link);

    const git =
      this.gitMode === "off"
        ? undefined
        : await readGitContext(this.app, file, this.gitMode);

    return {
      vaultPath: vaultBasePath(this.app),
      filePath: file.path,
      title: file.basename,
      sourceText: targetText,
      selectionText:
        selectionText && selectionText.length > 0 ? selectionText : undefined,
      sourceHash: await sha256Hex(targetText),
      tags,
      links,
      frontmatter,
      git,
    };
  }
}
