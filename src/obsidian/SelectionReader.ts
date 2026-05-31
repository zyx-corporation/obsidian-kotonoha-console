import type { Editor } from "obsidian";

export function readSelection(editor: Editor): string | undefined {
  const sel = editor.getSelection();
  const trimmed = sel.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
