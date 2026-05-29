import { describe, expect, it } from "vitest";
import { CliKotonohaClient } from "../src/client/CliKotonohaClient";
import type { GenerationRequest, NoteContext } from "../src/domain/types";
import type { KotonohaRunner } from "../src/cli/runKotonoha";

const CONTEXT_PACK = {
  format: "kotonoha.context_pack.v0.1",
  git_anchor: {
    git_commit: "abc123",
    file_path: "note.md",
  },
  meaning_delta_draft: { observation: { note: "test" } },
};

const ctx: NoteContext = {
  vaultPath: "/vault",
  filePath: "note.md",
  title: "note",
  sourceText: "hello world",
  sourceHash: "deadbeef",
  tags: [],
  links: [],
  frontmatter: {},
};

const request: GenerationRequest = {
  id: "req-1",
  createdAt: new Date().toISOString(),
  operation: "summarize",
  instruction: "shorten",
  context: ctx,
  language: "ja",
};

describe("CliKotonohaClient", () => {
  it("calls context export and builds proposal", async () => {
    const calls: string[][] = [];
    const runner: KotonohaRunner = async (opts) => {
      calls.push(opts.args);
      if (opts.args[0] === "version") {
        return { stdout: "kotonoha 0.3.1\n", stderr: "", exitCode: 0 };
      }
      if (opts.args[0] === "context") {
        return {
          stdout: JSON.stringify(CONTEXT_PACK),
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "unexpected", exitCode: 1 };
    };

    const client = new CliKotonohaClient({
      bin: "kotonoha",
      cwd: "/vault",
      runner,
    });

    const result = await client.generate(request);
    expect(calls[1]).toEqual([
      "context",
      "export",
      "note.md",
      "--path",
      "/vault",
    ]);
    expect(result.proposal.proposedText).toContain("hello world");
    expect(result.proposal.summary).toContain("[cli]");
  });

  it("runs rde emit for rde_audit operation", async () => {
    const runner: KotonohaRunner = async (opts) => {
      if (opts.args[0] === "version") {
        return { stdout: "kotonoha 0.3.1\n", stderr: "", exitCode: 0 };
      }
      if (opts.args[0] === "context") {
        return {
          stdout: JSON.stringify(CONTEXT_PACK),
          stderr: "",
          exitCode: 0,
        };
      }
      if (opts.args[0] === "rde" && opts.args[1] === "emit") {
        return {
          stdout: JSON.stringify({
            rde_review_output: {
              categories: { preserved: ["intent"] },
            },
          }),
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "", exitCode: 1 };
    };

    const client = new CliKotonohaClient({
      bin: "kotonoha",
      cwd: "/vault",
      runner,
    });
    const result = await client.generate({
      ...request,
      operation: "rde_audit",
    });
    expect(result.audit?.preservedElements).toContain("intent");
  });
});
