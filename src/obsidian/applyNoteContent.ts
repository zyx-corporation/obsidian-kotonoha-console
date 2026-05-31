import type { ApplyComposeResult } from "./noteIoApply";

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

export interface ApplyNoteOptions {
  preserveFrontmatter: boolean;
  /** When set, replace first occurrence in file instead of full note replace. */
  selectionText?: string;
}

/** Build vault content for apply (selection replace or full note + optional FM preserve). */
export function composeAppliedNote(
  originalContent: string,
  proposedText: string,
  options: ApplyNoteOptions,
): ApplyComposeResult {
  const selection = options.selectionText?.trim();
  if (selection) {
    const idx = originalContent.indexOf(selection);
    if (idx < 0) {
      return { kind: "selection_not_found" };
    }
    return {
      kind: "selection",
      content:
        originalContent.slice(0, idx) +
        proposedText +
        originalContent.slice(idx + selection.length),
    };
  }

  if (!options.preserveFrontmatter) {
    return { kind: "whole", content: proposedText };
  }

  const fm = originalContent.match(FRONTMATTER_RE);
  if (!fm || proposedText.trimStart().startsWith("---")) {
    return { kind: "whole", content: proposedText };
  }
  return { kind: "whole", content: fm[0] + proposedText };
}
