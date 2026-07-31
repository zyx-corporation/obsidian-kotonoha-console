import { describe, expect, it } from "vitest";
import type { GenerationRequest, NoteContext, Proposal } from "../src/domain/types";
import {
  buildSidecarExportCorrelation,
  checkM6ExportCorrelation,
  M6_PROJECT_AUDIT_EXPORT_FORMAT,
} from "../src/sidecar/exportCorrelation";

const ctx: NoteContext = {
  vaultPath: "/vault",
  filePath: "notes/a.md",
  title: "a",
  sourceText: "body",
  sourceHash: "source-hash",
  tags: [],
  links: [],
  frontmatter: {},
  git: {
    root: "/repo",
    branch: "main",
    commit: "abc123",
    dirty: false,
    repoRelativePath: "notes/a.md",
  },
};

const request: GenerationRequest = {
  id: "req1",
  createdAt: "2026-07-31T00:00:00.000Z",
  operation: "rewrite",
  instruction: "tighten",
  context: ctx,
  language: "ja",
};

const proposal: Proposal = {
  id: "proposal1",
  requestId: "req1",
  createdAt: "2026-07-31T00:01:00.000Z",
  proposedText: "BODY",
};

describe("sidecar export correlation", () => {
  it("builds available read-only correlation hints", () => {
    const correlation = buildSidecarExportCorrelation({
      request,
      proposal,
      proposalHash: "proposal-hash",
      projectId: "project1",
    });

    expect(correlation.status).toBe("available");
    expect(correlation.canonical).toBe(false);
    expect(correlation.local.gitCommit).toBe("abc123");
    expect(correlation.local.projectId).toBe("project1");
    expect(correlation.m6.expectedFormat).toBe(M6_PROJECT_AUDIT_EXPORT_FORMAT);
  });

  it("labels missing data without failing", () => {
    const correlation = buildSidecarExportCorrelation({
      request: { ...request, context: { ...ctx, git: undefined } },
      proposal,
      projectId: "",
    });

    expect(correlation.status).toBe("missing");
    expect(correlation.missingReason).toContain("projectId");
    expect(correlation.missingReason).toContain("gitCommit");
  });

  it("matches an M6 export by project, git commit, and file path", () => {
    const correlation = buildSidecarExportCorrelation({
      request,
      proposal,
      projectId: "project1",
    });

    const result = checkM6ExportCorrelation(correlation, {
      format: M6_PROJECT_AUDIT_EXPORT_FORMAT,
      project_id: "project1",
      exports: [
        {
          meaning_delta: {
            id: "delta1",
            git_commit: "abc123",
            file_path: "notes/a.md",
          },
          rde_assessments: [{ audit_correlation_id: "corr1" }],
        },
      ],
    });

    expect(result.status).toBe("correlated");
    expect(result.meaningDeltaId).toBe("delta1");
    expect(result.auditCorrelationIds).toEqual(["corr1"]);
  });

  it("reports missing M6 exports", () => {
    const correlation = buildSidecarExportCorrelation({
      request,
      proposal,
      projectId: "project1",
    });

    const result = checkM6ExportCorrelation(correlation, undefined);
    expect(result.status).toBe("missing");
  });

  it("reports mismatched M6 exports", () => {
    const correlation = buildSidecarExportCorrelation({
      request,
      proposal,
      projectId: "project1",
    });

    const result = checkM6ExportCorrelation(correlation, {
      format: M6_PROJECT_AUDIT_EXPORT_FORMAT,
      project_id: "project1",
      exports: [
        {
          meaning_delta: {
            id: "delta-other",
            git_commit: "def456",
            file_path: "notes/other.md",
          },
        },
      ],
    });

    expect(result.status).toBe("mismatched");
  });
});
