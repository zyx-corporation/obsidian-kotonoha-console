import { describe, expect, it } from "vitest";
import { buildNoteContext } from "../src/obsidian/buildNoteContext";

describe("buildNoteContext", () => {
  it("includes frontmatter tags links and selection-scoped hash", async () => {
    const ctx = await buildNoteContext({
      vaultPath: "/vault",
      filePath: "notes/sample.md",
      title: "sample",
      fullSourceText: "line one\nline two",
      selectionText: "line one",
      frontmatter: { title: "Sample", custom: "x" },
      tags: ["kotonoha"],
      links: ["Other"],
    });

    expect(ctx.filePath).toBe("notes/sample.md");
    expect(ctx.sourceText).toBe("line one");
    expect(ctx.selectionText).toBe("line one");
    expect(ctx.tags).toEqual(["kotonoha"]);
    expect(ctx.links).toEqual(["Other"]);
    expect(ctx.frontmatter.custom).toBe("x");
    expect(ctx.sourceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses full note when selection is absent", async () => {
    const ctx = await buildNoteContext({
      vaultPath: "/vault",
      filePath: "notes/x.md",
      title: "x",
      fullSourceText: "full body",
      frontmatter: {},
      tags: [],
      links: [],
    });

    expect(ctx.sourceText).toBe("full body");
    expect(ctx.selectionText).toBeUndefined();
  });
});
