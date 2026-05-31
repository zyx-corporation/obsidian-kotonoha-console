import type { ApplyNoteOptions } from "./applyNoteContent";

export type ApplyComposeResult =
  | { kind: "selection"; content: string }
  | { kind: "whole"; content: string }
  | { kind: "selection_not_found" };

/** Whether selection-scoped apply can proceed without whole-note fallback. */
export function canApplyToSelection(originalContent: string, selectionText?: string): boolean {
  const selection = selectionText?.trim();
  if (!selection) return true;
  return originalContent.includes(selection);
}

export function applyComposeKind(
  options: ApplyNoteOptions,
  originalContent: string,
): "selection" | "whole" | "selection_not_found" {
  const selection = options.selectionText?.trim();
  if (!selection) return "whole";
  return originalContent.includes(selection) ? "selection" : "selection_not_found";
}
