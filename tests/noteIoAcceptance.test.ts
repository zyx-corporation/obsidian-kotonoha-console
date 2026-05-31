import { describe, expect, it } from "vitest";
import { readSelection } from "../src/obsidian/SelectionReader";
import {
  effectiveMetadataWriteMode,
  mergeKotonohaFrontmatter,
  shouldWriteMetadata,
} from "../src/obsidian/metadataLineage";
import { composeAppliedNote } from "../src/obsidian/applyNoteContent";
import { sourceHashMismatch } from "../src/obsidian/noteIoGuards";

describe("noteIoAcceptance", () => {
  it("readSelection returns trimmed selection only when non-empty", () => {
    expect(readSelection({ getSelection: () => "  hello  " } as never)).toBe("hello");
    expect(readSelection({ getSelection: () => "   " } as never)).toBeUndefined();
  });

  it("metadataWriteMode off does not write metadata", () => {
    expect(shouldWriteMetadata("off")).toBe(false);
    expect(effectiveMetadataWriteMode("off", "obsidian-git-aware")).toBe("off");
  });

  it("obsidian-git-aware + always behaves as prompt", () => {
    expect(effectiveMetadataWriteMode("always", "obsidian-git-aware")).toBe("prompt");
  });

  it("mergeKotonohaFrontmatter preserves unrelated frontmatter keys", () => {
    const original = `---
title: Test
tags:
  - kotonoha
custom: value
---

body`;
    const out = mergeKotonohaFrontmatter(original, {
      review_status: "applied",
      latest_proposal_id: "p1",
    });
    expect(out).toContain("title: Test");
    expect(out).toContain("custom: value");
    expect(out).toContain("review_status: applied");
    expect(out).toContain("body");
  });

  it("selection apply replaces only the selected span", () => {
    const before = "aaa\nbbb\nccc";
    const result = composeAppliedNote(before, "BBB", {
      preserveFrontmatter: true,
      selectionText: "bbb",
    });
    expect(result).toEqual({ kind: "selection", content: "aaa\nBBB\nccc" });
  });

  it("source hash guard flags mismatch after generation", () => {
    const atGen = "hash-at-generation";
    const current = "hash-after-edit";
    expect(sourceHashMismatch(atGen, current)).toBe(true);
  });
});
