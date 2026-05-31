import { describe, expect, it } from "vitest";
import { MockKotonohaClient } from "../src/client/MockKotonohaClient";
import type { GenerationRequest, NoteContext } from "../src/domain/types";

const ctx: NoteContext = {
  vaultPath: "/v",
  filePath: "note.md",
  title: "sample",
  sourceText: "Body text.",
  sourceHash: "abc123",
  tags: [],
  links: [],
  frontmatter: {},
};

const request: GenerationRequest = {
  id: "r1",
  createdAt: new Date().toISOString(),
  operation: "summarize",
  instruction: "",
  context: ctx,
  language: "ja",
};

describe("MockKotonohaClient engine labeling", () => {
  it("generate attaches mock engine metadata", async () => {
    const client = new MockKotonohaClient();
    const result = await client.generate(request);
    expect(result.audit?.engine).toBe("mock");
    expect(result.audit?.engineTier).toBe("test_backend");
  });

  it("auditProposal returns mock engine", async () => {
    const client = new MockKotonohaClient();
    const { audit, engine } = await client.auditProposal(request, "p1", "proposal");
    expect(engine).toBe("mock");
    expect(audit.engine).toBe("mock");
  });
});
