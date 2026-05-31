import { describe, expect, it } from "vitest";
import {
  validateAuditSidecar,
  validateProposalSidecar,
  validateReviewSidecar,
} from "../src/sidecar/validateSidecar";

const validProposal = {
  schemaVersion: "0.1.0",
  plugin: "obsidian-kotonoha-console",
  format: "kotonoha.obsidian.proposal.v0.1",
  proposalId: "p1",
  requestId: "r1",
  operation: "summarize",
  filePath: "notes/sample.md",
  sourceHash: "abc123",
  proposalHash: "def456",
  createdAt: "2026-05-31T00:00:00.000Z",
  summary: "[cli-local] summarize",
  decision: { status: "pending" },
};

const validRde = {
  proposalId: "p1",
  createdAt: "2026-05-31T00:00:00.000Z",
  categories: ["preserved"],
  preservedElements: ["path:notes/sample.md"],
  transformedElements: [],
  inferredExtensions: [],
  unresolvedElements: [],
  driftRisks: [],
  recommendedDecision: "human_review",
  confidence: 0.5,
};

const validAuditWithEngine = {
  schemaVersion: "0.1.0",
  plugin: "obsidian-kotonoha-console",
  format: "kotonoha.obsidian.rde_audit.v0.1",
  proposalId: "p1",
  filePath: "notes/sample.md",
  sourceHash: "abc123",
  proposalHash: "def456",
  operation: "rde_audit",
  createdAt: "2026-05-31T00:00:00.000Z",
  engine: "cli",
  engineTier: "runtime_cli",
  engineNote: "kotonoha rde emit / validate runtime path",
  rde: {
    ...validRde,
    engine: "cli",
    engineTier: "runtime_cli",
    engineNote: "kotonoha rde emit / validate runtime path",
  },
  decision: { status: "pending" },
};

const validAuditLegacy = {
  schemaVersion: "0.1.0",
  plugin: "obsidian-kotonoha-console",
  format: "kotonoha.obsidian.rde_audit.v0.1",
  proposalId: "p-legacy",
  filePath: "notes/rde-sample.md",
  sourceHash: "734f7b989f536e96963421a09bbe585e6987df95830bf6ec1851968b10ef1cad",
  proposalHash: "821a016788440ee4466ce9d5092d4acf78b6a6f0e6b92767193d26696a4fa06f",
  operation: "rde_audit",
  createdAt: "2026-05-29T20:52:27.052Z",
  rde: validRde,
  decision: { status: "rejected", decidedAt: "2026-05-29T20:55:33.479Z" },
};

const validReview = {
  schemaVersion: "0.1.0",
  plugin: "obsidian-kotonoha-console",
  format: "kotonoha.obsidian.review.v0.1",
  proposalId: "p1",
  filePath: "notes/sample.md",
  sourceHash: "abc123",
  operation: "rde_audit",
  decision: {
    status: "rejected",
    decidedAt: "2026-05-31T00:00:00.000Z",
  },
  rdeRecommended: "reject",
  rdeCategories: ["preserved"],
};

describe("sidecarValidation", () => {
  it("validates a proposal sidecar", () => {
    const result = validateProposalSidecar(validProposal);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates audit sidecar with engine metadata", () => {
    const result = validateAuditSidecar(validAuditWithEngine);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates legacy audit sidecar without engine metadata", () => {
    const result = validateAuditSidecar(validAuditLegacy);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("validates review sidecar", () => {
    const result = validateReviewSidecar(validReview);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("tolerates unknown fields on proposal sidecar", () => {
    const result = validateProposalSidecar({
      ...validProposal,
      futureField: "experimental",
    });
    expect(result.ok).toBe(true);
  });

  it("errors when proposal sidecar missing source anchor", () => {
    const { sourceHash: _removed, ...incomplete } = validProposal;
    const result = validateProposalSidecar(incomplete);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("sourceHash"))).toBe(true);
  });

  it("errors when audit sidecar missing categories", () => {
    const result = validateAuditSidecar({
      ...validAuditWithEngine,
      rde: { ...validRde, categories: undefined },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("categories"))).toBe(true);
  });

  it("errors when audit sidecar missing recommendedDecision", () => {
    const result = validateAuditSidecar({
      ...validAuditWithEngine,
      rde: { ...validRde, recommendedDecision: "" },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("recommendedDecision"))).toBe(true);
  });

  it("errors when review sidecar missing decision", () => {
    const { decision: _removed, ...incomplete } = validReview;
    const result = validateReviewSidecar(incomplete);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("decision"))).toBe(true);
  });
});

describe("sidecarCompatibility", () => {
  it("accepts minimal legacy rde payload from issue spec", () => {
    const result = validateAuditSidecar({
      proposalId: "p1",
      filePath: "notes/x.md",
      sourceHash: "hash",
      createdAt: "2026-05-31T00:00:00.000Z",
      rde: {
        proposalId: "p1",
        createdAt: "2026-05-31T00:00:00.000Z",
        categories: [],
        preservedElements: [],
        transformedElements: [],
        inferredExtensions: [],
        unresolvedElements: [],
        driftRisks: [],
        recommendedDecision: "human_review",
        confidence: 0.5,
      },
    });
    expect(result.ok).toBe(true);
  });
});
