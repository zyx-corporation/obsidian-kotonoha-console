import { describe, expect, it } from "vitest";
import { GenerationRequestService } from "../src/services/GenerationRequestService";
import type { NoteContext } from "../src/domain/types";

const sampleContext: NoteContext = {
  vaultPath: "/vault",
  filePath: "notes/demo.md",
  title: "demo",
  sourceText: "hello",
  sourceHash: "abc",
  tags: [],
  links: [],
  frontmatter: {},
};

describe("GenerationRequestService", () => {
  it("creates a request with operation and instruction", () => {
    const svc = new GenerationRequestService();
    const req = svc.create(sampleContext, "summarize", "shorten", "ja");
    expect(req.operation).toBe("summarize");
    expect(req.instruction).toBe("shorten");
    expect(req.context.filePath).toBe("notes/demo.md");
    expect(req.id).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
