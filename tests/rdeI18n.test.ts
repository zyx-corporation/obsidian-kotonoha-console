import { describe, expect, it } from "vitest";
import { buildSourceReview } from "../src/rde/StructuralDiffBuilder";
import { performRdeAudit } from "../src/services/RdeAuditService";
import { rdeAuditReportMarkdown } from "../src/rde/rdeAuditReport";
import type { GenerationRequest, NoteContext } from "../src/domain/types";

const ctx: NoteContext = {
  vaultPath: "/v",
  filePath: "note.md",
  title: "n",
  sourceText: "This may be possible.",
  sourceHash: "abc",
  tags: [],
  links: [],
  frontmatter: {},
};

const requestJa: GenerationRequest = {
  id: "r1",
  createdAt: new Date().toISOString(),
  operation: "rde_audit",
  instruction: "",
  context: ctx,
  language: "ja",
};

describe("RDE i18n (ja)", () => {
  it("source review messages in Japanese", () => {
    const result = buildSourceReview(ctx.sourceText, "ja");
    expect(result.unresolvedElements[0]).toContain("hedging");
    expect(result.unresolvedElements[0]).toContain("未確定");
  });

  it("audit report markdown in Japanese", () => {
    const audit = performRdeAudit(requestJa, "p1", { sourceReview: true });
    const md = rdeAuditReportMarkdown(requestJa, audit);
    expect(md).toContain("# RDE 監査");
    expect(md).toContain("## 未解決");
    expect(md).toContain("推奨判断");
  });
});

const requestZh: GenerationRequest = { ...requestJa, language: "zh_CN" };

describe("RDE i18n (zh_CN)", () => {
  it("source review messages in Simplified Chinese", () => {
    const result = buildSourceReview(ctx.sourceText, "zh_CN");
    expect(result.unresolvedElements[0]).toContain("hedging");
    expect(result.unresolvedElements[0]).toContain("未确定");
  });

  it("audit report markdown in Simplified Chinese", () => {
    const audit = performRdeAudit(requestZh, "p1", { sourceReview: true });
    const md = rdeAuditReportMarkdown(requestZh, audit);
    expect(md).toContain("# RDE 审计");
    expect(md).toContain("## 未解决");
    expect(md).toContain("建议决策");
  });

  it("normalizes cn_zn alias to zh_CN", () => {
    const result = buildSourceReview(ctx.sourceText, "cn_zn");
    expect(result.unresolvedElements[0]).toContain("未确定");
  });
});
