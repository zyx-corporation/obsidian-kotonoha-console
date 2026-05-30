import { describe, expect, it } from "vitest";
import {
  effectiveMetadataWriteMode,
  mergeKotonohaFrontmatter,
  shouldWriteMetadata,
} from "../src/obsidian/metadataLineage";

describe("metadataLineage", () => {
  it("effectiveMetadataWriteMode downgrades always under obsidian-git-aware", () => {
    expect(effectiveMetadataWriteMode("always", "obsidian-git-aware")).toBe("prompt");
    expect(effectiveMetadataWriteMode("always", "passive-observing")).toBe("always");
  });

  it("shouldWriteMetadata", () => {
    expect(shouldWriteMetadata("off")).toBe(false);
    expect(shouldWriteMetadata("prompt")).toBe(true);
  });

  it("mergeKotonohaFrontmatter prepends when no frontmatter", () => {
    const out = mergeKotonohaFrontmatter("# Note", {
      review_status: "applied",
      latest_proposal_id: "p-1",
    });
    expect(out).toMatch(/^---\n/);
    expect(out).toContain("review_status: applied");
    expect(out).toContain("latest_proposal_id: p-1");
    expect(out).toContain("# Note");
  });

  it("mergeKotonohaFrontmatter updates existing kotonoha block", () => {
    const original = `---
title: Sample
kotonoha:
  review_status: hold
---
# Body`;
    const out = mergeKotonohaFrontmatter(original, {
      review_status: "applied",
      latest_proposal_id: "p-2",
      project_id: "proj-9",
    });
    expect(out).toContain("review_status: applied");
    expect(out).toContain("latest_proposal_id: p-2");
    expect(out).toContain("project_id: proj-9");
    expect(out).toContain("title: Sample");
    expect(out).not.toContain("review_status: hold");
  });
});
