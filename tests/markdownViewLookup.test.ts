import { describe, expect, it, vi } from "vitest";
import { findMarkdownViewForFile } from "../src/obsidian/markdownViewLookup";
import { readSelection } from "../src/obsidian/SelectionReader";

describe("findMarkdownViewForFile", () => {
  it("returns markdown view matching file path when Console is focused", () => {
    const noteView = {
      file: { path: "notes/sample1.md" },
      editor: { getSelection: () => "selected part" },
    };
    const consoleLeaf = { view: { getViewType: () => "kotonoha-console-view" } };
    const noteLeaf = { view: noteView };

    const app = {
      workspace: {
        getActiveViewOfType: () => consoleLeaf.view,
        getLeavesOfType: (type: string) =>
          type === "markdown" ? [noteLeaf] : [],
      },
    };

    const found = findMarkdownViewForFile(app as never, "notes/sample1.md");
    expect(found).toBe(noteView);
    expect(readSelection(found!.editor as never)).toBe("selected part");
  });

  it("returns null when no open editor for file", () => {
    const app = {
      workspace: {
        getLeavesOfType: () => [],
      },
    };
    expect(findMarkdownViewForFile(app as never, "notes/missing.md")).toBeNull();
  });
});

describe("readSelectionForFile behavior", () => {
  it("prefers active markdown view when it matches target file", () => {
    const activeEditor = { getSelection: () => "  active sel  " };
    const otherEditor = { getSelection: () => "other" };
    const file = { path: "notes/a.md" };

    const activeView = { file, editor: activeEditor };
    const otherLeaf = {
      view: { file, editor: otherEditor },
    };

    const app = {
      workspace: {
        getActiveViewOfType: () => activeView,
        getLeavesOfType: () => [otherLeaf],
      },
    };

    const active = app.workspace.getActiveViewOfType() as typeof activeView;
    expect(active.file.path).toBe(file.path);
    expect(readSelection(active.editor as never)).toBe("active sel");
  });
});
