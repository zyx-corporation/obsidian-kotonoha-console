import { describe, expect, it } from "vitest";
import { composeAppliedNote } from "../src/obsidian/applyNoteContent";

describe("composeAppliedNote", () => {
  it("replaces full note body", () => {
    expect(
      composeAppliedNote("# Old\nbody", "# New\nbody", { preserveFrontmatter: false }),
    ).toBe("# New\nbody");
  });

  it("preserves original frontmatter when proposal has none", () => {
    const original = "---\ntitle: Sample\n---\n\n# Old";
    expect(
      composeAppliedNote(original, "# New summary", { preserveFrontmatter: true }),
    ).toBe("---\ntitle: Sample\n---\n# New summary");
  });

  it("replaces selection span when selectionText provided", () => {
    const original = "Hello world\nFooter";
    expect(
      composeAppliedNote(original, "universe", {
        preserveFrontmatter: false,
        selectionText: "world",
      }),
    ).toBe("Hello universe\nFooter");
  });
});
