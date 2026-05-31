import { describe, expect, it } from "vitest";
import { composeAppliedNote } from "../src/obsidian/applyNoteContent";

describe("composeAppliedNote", () => {
  it("replaces full note body", () => {
    const result = composeAppliedNote("# Old\nbody", "# New\nbody", {
      preserveFrontmatter: false,
    });
    expect(result.kind).toBe("whole");
    if (result.kind === "whole") expect(result.content).toBe("# New\nbody");
  });

  it("preserves original frontmatter when proposal has none", () => {
    const original = "---\ntitle: Sample\ntags:\n  - kotonoha\ncustom: value\n---\n\n# Old";
    const result = composeAppliedNote(original, "# New summary", {
      preserveFrontmatter: true,
    });
    expect(result.kind).toBe("whole");
    if (result.kind === "whole") {
      expect(result.content).toContain("title: Sample");
      expect(result.content).toContain("custom: value");
      expect(result.content).toContain("# New summary");
    }
  });

  it("replaces selection span when selectionText provided", () => {
    const original = "aaa\nbbb\nccc";
    const result = composeAppliedNote(original, "BBB", {
      preserveFrontmatter: false,
      selectionText: "bbb",
    });
    expect(result).toEqual({ kind: "selection", content: "aaa\nBBB\nccc" });
  });

  it("returns selection_not_found instead of whole-note fallback", () => {
    const result = composeAppliedNote("aaa\nccc", "BBB", {
      preserveFrontmatter: false,
      selectionText: "bbb",
    });
    expect(result).toEqual({ kind: "selection_not_found" });
  });
});
