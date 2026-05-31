import { describe, expect, it } from "vitest";
import {
  normalizeProposalText,
  unwrapSingleMarkdownFence,
} from "../src/services/normalizeProposalText";

describe("unwrapSingleMarkdownFence", () => {
  it("unwraps single ```markdown fence", () => {
    expect(unwrapSingleMarkdownFence("```markdown\n# Title\nbody\n```")).toBe(
      "# Title\nbody",
    );
  });

  it("unwraps single ```md fence", () => {
    expect(unwrapSingleMarkdownFence("```md\n# Title\n```")).toBe("# Title");
  });

  it("unwraps single unlabeled fence", () => {
    expect(unwrapSingleMarkdownFence("```\n# Title\n```")).toBe("# Title");
  });

  it("unwraps single ```text fence", () => {
    expect(unwrapSingleMarkdownFence("```text\n# Title\n```")).toBe("# Title");
  });

  it("preserves inner code blocks inside markdown body", () => {
    const input = "```markdown\n# Title\n\n本文\n\n```ts\nconst x = 1\n```\n```";
    expect(unwrapSingleMarkdownFence(input)).toBe(
      "# Title\n\n本文\n\n```ts\nconst x = 1\n```",
    );
  });

  it("does not unwrap ts/python/bash/json fences", () => {
    expect(unwrapSingleMarkdownFence("```ts\nconst x = 1\n```")).toBe(
      "```ts\nconst x = 1\n```",
    );
    expect(unwrapSingleMarkdownFence("```python\nprint(1)\n```")).toBe(
      "```python\nprint(1)\n```",
    );
    expect(unwrapSingleMarkdownFence("```bash\necho hi\n```")).toBe(
      "```bash\necho hi\n```",
    );
    expect(unwrapSingleMarkdownFence('```json\n{"a":1}\n```')).toBe(
      '```json\n{"a":1}\n```',
    );
  });

  it("does not unwrap when prose exists outside the outer fence", () => {
    const input = "before\n```markdown\n# Title\n```\nafter";
    expect(unwrapSingleMarkdownFence(input)).toBe(input);
  });

  it("does not unwrap when markdown body starts without outer fence", () => {
    const input = "# Title\n\n```ts\nconst x = 1\n```";
    expect(unwrapSingleMarkdownFence(input)).toBe(input);
  });

  it("trims only fence wrapper, not meaningful body content", () => {
    expect(unwrapSingleMarkdownFence("```markdown\n# Title\n\n末尾\n```")).toBe(
      "# Title\n\n末尾",
    );
  });

  it("is case-insensitive for markdown language tag", () => {
    expect(unwrapSingleMarkdownFence("```Markdown\n# Title\n```")).toBe("# Title");
  });
});

describe("normalizeProposalText", () => {
  it("delegates to unwrapSingleMarkdownFence", () => {
    expect(normalizeProposalText("```md\nhello\n```")).toBe("hello");
  });
});
