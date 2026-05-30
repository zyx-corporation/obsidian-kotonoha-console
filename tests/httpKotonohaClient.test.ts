import { describe, expect, it } from "vitest";
import { HttpKotonohaClient } from "../src/client/HttpKotonohaClient";
import type { GenerationRequest, NoteContext } from "../src/domain/types";

const ctx: NoteContext = {
  vaultPath: "/v",
  filePath: "note.md",
  title: "sample",
  sourceText: "This may be possible.",
  sourceHash: "abc123",
  tags: [],
  links: [],
  frontmatter: {},
};

const request: GenerationRequest = {
  id: "r1",
  createdAt: new Date().toISOString(),
  operation: "summarize",
  instruction: "shorten",
  context: ctx,
  language: "ja",
};

function mockFetch(routes: Record<string, (init?: RequestInit) => Response | Promise<Response>>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [prefix, handler] of Object.entries(routes)) {
      if (url.includes(prefix)) return handler(init);
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

describe("HttpKotonohaClient", () => {
  it("console mode: POST /v1/proposals/generate", async () => {
    const fetchFn = mockFetch({
      "/v1/agents": () => new Response("not found", { status: 404 }),
      "/v1/tools": () => new Response("not found", { status: 404 }),
      "/v1/proposals/generate": () =>
        new Response(
          JSON.stringify({
            proposal: {
              proposedText: "summary text",
              summary: "[http] summarize",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });

    const client = new HttpKotonohaClient({
      endpoint: "http://127.0.0.1:9000",
      fetchFn,
      backendKind: "console",
    });
    const result = await client.generate(request);
    expect(result.proposal.proposedText).toBe("summary text");
    expect(result.audit).toBeDefined();
  });

  it("orchestrator mode: summarize uses /v1/rde/evaluate when audit omitted", async () => {
    let evaluateCalls = 0;
    const fetchFn = mockFetch({
      "/v1/proposals/generate": () =>
        new Response(
          JSON.stringify({
            proposal: { proposedText: "Rewritten summary.", summary: "[llm]" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      "/v1/rde/evaluate": () => {
        evaluateCalls += 1;
        return new Response(
          JSON.stringify({
            rde_review_output: {
              spec_version: "0.1",
              subject_ref: "obsidian://note.md#abc",
              categories: {
                preserved: [{ summary: "core intent kept" }],
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    });

    const client = new HttpKotonohaClient({
      endpoint: "http://127.0.0.1:8000",
      fetchFn,
      backendKind: "orchestrator",
    });
    const result = await client.generate(request);
    expect(evaluateCalls).toBe(1);
    expect(
      result.audit?.preservedElements.some((e) => e.includes("core intent kept")),
    ).toBe(true);
  });

  it("orchestrator mode: rde_audit via /v1/rde/evaluate", async () => {
    const fetchFn = mockFetch({
      "/v1/rde/evaluate": () =>
        new Response(
          JSON.stringify({
            rde_review_output: {
              spec_version: "0.1",
              subject_ref: "obsidian://note.md#abc",
              categories: {
                preserved: [{ summary: "intent" }],
                intentionally_unresolved: [{ summary: "hedging open" }],
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });

    const client = new HttpKotonohaClient({
      endpoint: "http://127.0.0.1:8000",
      fetchFn,
      backendKind: "orchestrator",
    });
    const result = await client.generate({ ...request, operation: "rde_audit" });
    expect(result.proposal.proposedText).toContain("# RDE 監査");
    expect(result.audit?.preservedElements.some((e) => e.includes("intent"))).toBe(true);
  });

  it("orchestrator mode: re-audit via /v1/rde/evaluate on proposal diff", async () => {
    let evaluateCalls = 0;
    const fetchFn = mockFetch({
      "/v1/proposals/generate": () =>
        new Response(
          JSON.stringify({
            proposal: { proposedText: "Rewritten summary.", summary: "[llm]" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      "/v1/rde/evaluate": () => {
        evaluateCalls += 1;
        return new Response(
          JSON.stringify({
            rde_review_output: {
              spec_version: "0.1",
              subject_ref: "obsidian://note.md#abc",
              categories: {
                transformed: [{ summary: "condensed phrasing" }],
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    });

    const client = new HttpKotonohaClient({
      endpoint: "http://127.0.0.1:8000",
      fetchFn,
      backendKind: "orchestrator",
    });
    const { audit, engine } = await client.auditProposal(
      request,
      "p-reaudit",
      "Rewritten summary.",
    );
    expect(engine).toBe("orchestrator");
    expect(evaluateCalls).toBe(1);
    expect(
      audit.transformedElements.some((e) => e.includes("condensed phrasing")),
    ).toBe(true);
  });

  it("gateway mode: context export for summarize", async () => {
    const pack = {
      format: "kotonoha.context_pack.v0.1",
      git_anchor: { git_commit: "abc", file_path: "note.md" },
      meaning_delta_draft: { observation: { note: "test" } },
    };
    const fetchFn = mockFetch({
      "/v1/tools/kotonoha_context_export": () =>
        new Response(
          JSON.stringify({
            tool: "kotonoha_context_export",
            ok: true,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ exit_code: 0, stdout: JSON.stringify(pack) }),
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });

    const client = new HttpKotonohaClient({
      endpoint: "http://127.0.0.1:8787",
      fetchFn,
      backendKind: "gateway",
    });
    const result = await client.generate(request);
    expect(result.proposal.proposedText).toContain("This may be possible");
    expect(result.audit).toBeDefined();
  });
});
