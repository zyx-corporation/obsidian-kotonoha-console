import { describe, expect, it } from "vitest";
import { performRdeAudit } from "../src/services/RdeAuditService";
import { localizeBundleForDisplay } from "../src/services/localizeBundle";
import type { GenerationRequest, NoteContext, RdeAudit } from "../src/domain/types";
import type { ProposalBundle } from "../src/services/ProposalService";

const ctx: NoteContext = {
  vaultPath: "/v",
  filePath: "note.md",
  title: "sample",
  sourceText: "This may be possible.",
  sourceHash: "abc",
  tags: [],
  links: [],
  frontmatter: {},
};

const requestEn: GenerationRequest = {
  id: "r1",
  createdAt: new Date().toISOString(),
  operation: "rde_audit",
  instruction: "",
  context: ctx,
  language: "en",
};

describe("localizeBundleForDisplay", () => {
  it("relocalizes RDE audit report to zh_CN", () => {
    const audit = performRdeAudit(requestEn, "p1", { sourceReview: true });
    const b: ProposalBundle = {
      proposal: {
        id: "p1",
        requestId: "r1",
        createdAt: new Date().toISOString(),
        proposedText: "# RDE audit",
        summary: "[mock] RDE audit · sample",
      },
      audit,
    };
    const zh = localizeBundleForDisplay(b, requestEn, "rde_audit", "zh_CN");
    expect(zh.proposal.summary).toBe("[mock] RDE audit · sample");
    expect(zh.proposal.proposedText).toContain("# RDE 审计");
    expect(zh.audit?.unresolvedElements[0]).toContain("未确定");
  });

  it("relocalizes RDE audit report to ja", () => {
    const audit = performRdeAudit(requestEn, "p1", { sourceReview: true }) as RdeAudit;
    const b: ProposalBundle = {
      proposal: {
        id: "p1",
        requestId: "r1",
        createdAt: new Date().toISOString(),
        proposedText: "# RDE audit",
        summary: "[mock] RDE audit · sample",
      },
      audit,
    };
    const ja = localizeBundleForDisplay(b, requestEn, "rde_audit", "ja");
    expect(ja.proposal.proposedText).toContain("# RDE 監査");
    expect(ja.audit?.unresolvedElements[0]).toContain("未確定");
  });
});
