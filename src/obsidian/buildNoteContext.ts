import type { GitContextSnapshot, NoteContext } from "../domain/types";
import { sha256Hex } from "../util/hash";

/** Pure note context builder — testable without Obsidian (#40). */
export async function buildNoteContext(input: {
  vaultPath: string;
  filePath: string;
  title: string;
  fullSourceText: string;
  selectionText?: string;
  frontmatter: Record<string, unknown>;
  tags: string[];
  links: string[];
  git?: GitContextSnapshot;
}): Promise<NoteContext> {
  const selection =
    input.selectionText !== undefined && input.selectionText.length > 0
      ? input.selectionText
      : undefined;
  const targetText = selection ?? input.fullSourceText;

  return {
    vaultPath: input.vaultPath,
    filePath: input.filePath,
    title: input.title,
    sourceText: targetText,
    selectionText: selection,
    sourceHash: await sha256Hex(targetText),
    tags: input.tags,
    links: input.links,
    frontmatter: input.frontmatter,
    git: input.git,
  };
}
