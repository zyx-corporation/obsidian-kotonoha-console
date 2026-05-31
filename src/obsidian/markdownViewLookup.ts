import type { App } from "obsidian";

interface MarkdownEditorLeaf {
  file?: { path: string };
  editor?: { getSelection(): string };
}

/** Find an open Markdown editor for `filePath`, even when Console has focus. */
export function findMarkdownViewForFile(
  app: App,
  filePath: string,
): MarkdownEditorLeaf | null {
  const leaves = app.workspace.getLeavesOfType("markdown");
  for (const leaf of leaves) {
    const view = leaf.view as MarkdownEditorLeaf;
    if (view.file?.path === filePath && view.editor) {
      return view;
    }
  }
  return null;
}
