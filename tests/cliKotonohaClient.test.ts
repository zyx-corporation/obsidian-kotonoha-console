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

const RDE_EMIT = {
  rde_review_output: {
    categories: { preserved: ["intent"] },
    spec_version: "0.1",
    subject_ref: "https://example.invalid/subject/REPLACE",
  },
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

function versionRunner(extra: KotonohaRunner): KotonohaRunner {
  return async (opts) => {
    if (opts.args[0] === "version") {
      return { stdout: "kotonoha 0.3.1\n", stderr: "", exitCode: 0 };
    }
    return extra(opts);
  };
}

describe("CliKotonohaClient", () => {
  it("calls context export when gitMode is not off", async () => {
    const calls: string[][] = [];
    const runner = versionRunner(async (opts) => {
      calls.push(opts.args);
      if (opts.args[0] === "context") {
        return {
          stdout: JSON.stringify(CONTEXT_PACK),
          stderr: "",
          exitCode: 0,
        };
      }
      return { stdout: "", stderr: "unexpected", exitCode: 1 };
    });

    const client = new CliKotonohaClient({
      bin: "kotonoha",
      cwd: "/vault",
      gitMode: "passive-observing",
      runner,
    });

    const result = await client.generate(request);
    expect(calls.some((a) => a[0] === "context")).toBe(true);
    expect(result.proposal.proposedText).toContain("hello world");
    expect(result.audit).toBeDefined();
    expect(result.audit?.engine).toBe("local");
  });

  it("does not call context export when gitMode is off", async () => {
    const calls: string[][] = [];
    const runner = versionRunner(async (opts) => {
      calls.push(opts.args);
      return { stdout: "", stderr: "unexpected", exitCode: 1 };
    });

    const client = new CliKotonohaClient({
      bin: "kotonoha",
      cwd: "/vault",
      gitMode: "off",
      runner,
    });

    const result = await client.generate(request);
    expect(calls.some((a) => a[0] === "context")).toBe(false);
    expect(result.proposal.summary).toContain("[cli-local]");
    expect(result.proposal.proposedText).toContain("hello world");
    expect(result.audit).toBeDefined();
    expect(result.audit?.engine).toBe("local");
  });

  it("rde_audit uses rde emit/validate only (no context export, gitMode off)", async () => {
    const calls: string[][] = [];
    const runner = versionRunner(async (opts) => {
      calls.push(opts.args);
      if (opts.args[0] === "rde" && opts.args[1] === "emit") {
        return {
          stdout: JSON.stringify(RDE_EMIT),
          stderr: "",
          exitCode: 0,
        };
      }
      if (opts.args[0] === "rde" && opts.args[1] === "validate") {
        return { stdout: "", stderr: "", exitCode: 0 };
      }
      return { stdout: "", stderr: "", exitCode: 1 };
    });

    const client = new CliKotonohaClient({
      bin: "kotonoha",
      cwd: "/vault",
      gitMode: "off",
      runner,
    });

    const result = await client.generate({
      ...request,
      operation: "rde_audit",
    });

    expect(calls.some((a) => a[0] === "context")).toBe(false);
    expect(calls.some((a) => a[0] === "rde" && a[1] === "emit")).toBe(true);
    expect(calls.some((a) => a[0] === "rde" && a[1] === "validate")).toBe(true);
    expect(result.proposal.proposedText).toContain("# RDE 監査");
    expect(result.audit?.preservedElements.some((e) => e.includes("path:"))).toBe(
      true,
    );
    expect(
      result.audit?.unresolvedElements.some((e) => e.includes("未確定") || e.includes("hedging")),
    ).toBe(true);
    expect(result.audit?.engine).toBe("cli");
    expect(result.audit?.engineTier).toBe("runtime_cli");
  });
});
