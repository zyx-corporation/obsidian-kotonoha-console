import type { Editor } from "obsidian";

export function readSelection(editor: Editor): string | undefined {
  const sel = editor.getSelection();
  return sel.trim().length > 0 ? sel : undefined;
}
