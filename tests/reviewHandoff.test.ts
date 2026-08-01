import { describe, expect, it } from "vitest";
import type { GenerationRequest, Proposal, RdeAudit } from "../src/domain/types";
import {
  buildIssueDraft,
  buildPrSummary,
  buildReviewSummaryBlock,
  parseGitHubReference,
} from "../src/reviewDestination/reviewHandoff";

const request: GenerationRequest = {
  id: "req-1",
  createdAt: "2026-08-01T00:00:00.000Z",
  operation: "rde_audit",
  instruction: "",
  language: "en",
  context: {
    vaultPath: "/vault",
    filePath: "notes/example.md",
    title: "Example note",
    sourceText: "source",
    sourceHash: "abcdef0123456789abcdef",
    tags: [],
    links: [],
    frontmatter: {},
  },
};

const proposal: Proposal = {
  id: "proposal-1",
  requestId: "req-1",
  createdAt: "2026-08-01T00:00:00.000Z",
  proposedText: "Proposed note text",
};

const audit: RdeAudit = {
  proposalId: "proposal-1",
  createdAt: "2026-08-01T00:00:00.000Z",
  categories: ["unresolved", "suspicious_drift"],
  preservedElements: ["keeps original claim"],
  transformedElements: [],
  inferredExtensions: [],
  unresolvedElements: ["missing evidence"],
  driftRisks: ["new conclusion"],
  recommendedDecision: "human_review",
  confidence: 0.62,
};

describe("reviewHandoff", () => {
  it("parses issue and PR references without treating them as authority", () => {
    expect(
      parseGitHubReference("https://github.com/zyx-corporation/kotonoha/issues/123", "issue"),
    ).toMatchObject({ kind: "issue", owner: "zyx-corporation", repo: "kotonoha", number: 123 });
    expect(parseGitHubReference("zyx-corporation/kotonoha!45", "pr")).toMatchObject({
      kind: "pr",
      number: 45,
    });
    expect(parseGitHubReference("#71", "issue")).toMatchObject({ kind: "issue", number: 71 });
    expect(parseGitHubReference("#71", "pr")).toBeNull();
  });

  it("builds a local review summary block with explicit boundary", () => {
    const text = buildReviewSummaryBlock({ request, proposal, audit });
    expect(text).toContain("kotonoha review-handoff v0.5");
    expect(text).toContain("Canonical Kotonoha record: local sidecar and note history");
    expect(text).toContain("Recommended decision");
    expect(text).toContain("new conclusion");
  });

  it("builds copy-ready Issue and PR handoff text", () => {
    const references = {
      issue: parseGitHubReference("#71", "issue") ?? undefined,
      pr: parseGitHubReference("!76", "pr") ?? undefined,
    };
    const issueDraft = buildIssueDraft({ request, proposal, audit, references });
    const prSummary = buildPrSummary({ request, proposal, audit, references });

    expect(issueDraft).toContain("Title: Kotonoha RDE review: Example note");
    expect(issueDraft).toContain("This Issue is a publication/review handoff");
    expect(prSummary).toContain("GitHub is a review/correlation/publication surface");
    expect(prSummary).toContain("Existing PR: PR #76");
  });
});
