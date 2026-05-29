import { describe, expect, it } from "vitest";
import {
  parseContextPack,
  proposalTextFromContextPack,
} from "../src/cli/proposalFromContextPack";
import type { GenerationRequest, NoteContext } from "../src/domain/types";

describe("proposalFromContextPack", () => {
  it("parses kotonoha.context_pack.v0.1", () => {
    const pack = parseContextPack(
      JSON.stringify({ format: "kotonoha.context_pack.v0.1", git_anchor: {} }),
    );
    expect(pack.format).toBe("kotonoha.context_pack.v0.1");
  });

  it("rejects unknown format", () => {
    expect(() => parseContextPack(JSON.stringify({ format: "other" }))).toThrow();
  });

  it("embeds source in proposal text", () => {
    const ctx: NoteContext = {
      vaultPath: "/v",
      filePath: "a.md",
      title: "a",
      sourceText: "body",
      sourceHash: "x",
      tags: [],
      links: [],
      frontmatter: {},
    };
    const req: GenerationRequest = {
      id: "1",
      createdAt: "",
      operation: "expand",
      instruction: "more detail",
      context: ctx,
      language: "en",
    };
    const text = proposalTextFromContextPack(req, {
      format: "kotonoha.context_pack.v0.1",
      git_anchor: { git_commit: "c1", file_path: "a.md" },
    });
    expect(text).toContain("body");
    expect(text).toContain("more detail");
  });
});
