import type { App, Editor, TFile } from "obsidian";
import { MarkdownView } from "obsidian";
import type { NoteContext } from "../domain/types";
import { buildNoteContext } from "./buildNoteContext";
import { readGitContext } from "./GitContextReader";
import type { GitMode } from "../domain/types";
import { vaultBasePath } from "../util/vaultPath";
import { findMarkdownViewForFile } from "./markdownViewLookup";
import { readSelection } from "./SelectionReader";

export class ActiveNoteReader {
  constructor(
    private readonly app: App,
    private readonly gitMode: GitMode,
  ) {}

  getActiveFile(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    return file ?? null;
  }

  /** Editor selection for `file`, including when another view (e.g. Console) is focused. */
  readSelectionForFile(file: TFile): string | undefined {
    const active = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (active?.file?.path === file.path && active.editor) {
      return readSelection(active.editor);
    }
    const view = findMarkdownViewForFile(this.app, file.path);
    if (view?.editor) return readSelection(view.editor as Editor);
    return undefined;
  }

  /** Editor selection from active Markdown view, if any. */
  readActiveSelection(): string | undefined {
    const file = this.getActiveFile();
    if (!file) return undefined;
    return this.readSelectionForFile(file);
  }

  async readNoteContext(selectionText?: string): Promise<NoteContext | null> {
    const file = this.getActiveFile();
    if (!file) return null;
    const selection = selectionText ?? this.readActiveSelection();
    return this.readNoteContextForFile(file, selection);
  }

  async readNoteContextForFile(
    file: TFile,
    selectionText?: string,
  ): Promise<NoteContext | null> {
    const fullSourceText = await this.app.vault.read(file);
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = (cache?.frontmatter as Record<string, unknown>) ?? {};
    const tags = (cache?.tags ?? []).map((t) => t.tag);
    const links = (cache?.links ?? []).map((l) => l.link);

    const git =
      this.gitMode === "off"
        ? undefined
        : await readGitContext(this.app, file, this.gitMode);

    return buildNoteContext({
      vaultPath: vaultBasePath(this.app),
      filePath: file.path,
      title: file.basename,
      fullSourceText,
      selectionText,
      frontmatter,
      tags,
      links,
      git,
    });
  }
}
