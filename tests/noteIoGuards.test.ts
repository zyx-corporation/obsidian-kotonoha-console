import { describe, expect, it } from "vitest";
import {
  resolveTargetFilePath,
  sourceHashMismatch,
} from "../src/obsidian/noteIoGuards";
import { canApplyToSelection } from "../src/obsidian/noteIoApply";

describe("noteIoGuards", () => {
  it("resolveTargetFilePath prefers active when it matches stored target", () => {
    expect(
      resolveTargetFilePath("notes/a.md", "notes/a.md", () => true),
    ).toBe("notes/a.md");
  });

  it("resolveTargetFilePath uses stored target when active note differs", () => {
    expect(
      resolveTargetFilePath("notes/b.md", "notes/a.md", (p) => p === "notes/a.md"),
    ).toBe("notes/a.md");
  });

  it("resolveTargetFilePath falls back to active when stored missing", () => {
    expect(
      resolveTargetFilePath("notes/b.md", "notes/missing.md", () => false),
    ).toBe("notes/b.md");
  });

  it("sourceHashMismatch detects changed content", () => {
    expect(sourceHashMismatch("abc", "abc")).toBe(false);
    expect(sourceHashMismatch("abc", "def")).toBe(true);
    expect(sourceHashMismatch(null, "def")).toBe(false);
  });
});

describe("selection apply safety", () => {
  it("canApplyToSelection blocks when selection missing from note", () => {
    expect(canApplyToSelection("aaa\nccc", "bbb")).toBe(false);
    expect(canApplyToSelection("aaa\nbbb\nccc", "bbb")).toBe(true);
    expect(canApplyToSelection("full note", undefined)).toBe(true);
  });
});
