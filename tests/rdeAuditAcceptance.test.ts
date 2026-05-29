import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { performRdeAudit } from "../src/services/RdeAuditService";
import { rdeAuditReportMarkdown } from "../src/rde/rdeAuditReport";
import { sha256Hex } from "../src/util/hash";
import type { GenerationRequest, NoteContext } from "../src/domain/types";

const SAMPLE_PATH = join(import.meta.dirname, "../fixtures/sample-note.md");
const DEMO_OUT = join(import.meta.dirname, "../fixtures/demo-output");

async function buildRdeAuditRequest(): Promise<{
  request: GenerationRequest;
  audit: ReturnType<typeof performRdeAudit>;
  report: string;
}> {
  const sourceText = readFileSync(SAMPLE_PATH, "utf-8");
  const sourceHash = await sha256Hex(sourceText);
  const ctx: NoteContext = {
    vaultPath: "/demo-vault",
    filePath: "fixtures/sample-note.md",
    title: "RDE Sample",
    sourceText,
    sourceHash,
    tags: ["kotonoha/demo"],
    links: ["Related Concept"],
    frontmatter: { title: "RDE Sample", tags: ["kotonoha/demo"] },
  };
  const request: GenerationRequest = {
    id: "demo-req",
    createdAt: new Date().toISOString(),
    operation: "rde_audit",
    instruction: "RDE acceptance demo",
    context: ctx,
    language: "ja",
  };
  const audit = performRdeAudit(request, "demo-proposal", { sourceReview: true });
  const report = rdeAuditReportMarkdown(request, audit);
  return { request, audit, report };
}

describe("RDE audit acceptance (mock / source review)", () => {
  it("detects hedging and anchors on sample note", async () => {
    const { audit } = await buildRdeAuditRequest();
    expect(audit.categories).toContain("preserved");
    expect(audit.unresolvedElements.some((e) => e.includes("hedging"))).toBe(true);
    expect(audit.preservedElements.some((e) => e.includes("path:"))).toBe(true);
    expect(audit.recommendedDecision).toBeDefined();
  });

  it("writes demo sidecar artifacts when DEMO_WRITE=1", async () => {
    if (process.env.DEMO_WRITE !== "1") return;

    const { request, audit, report } = await buildRdeAuditRequest();
    const root = join(DEMO_OUT, ".kotonoha");
    mkdirSync(join(root, "audit"), { recursive: true });
    mkdirSync(join(root, "proposals"), { recursive: true });

    const proposalId = "demo-proposal";
    writeFileSync(
      join(root, "audit", `${proposalId}.rde-audit.json`),
      JSON.stringify(
        {
          schemaVersion: "0.1.0",
          plugin: "obsidian-kotonoha-console",
          proposalId,
          filePath: request.context.filePath,
          sourceHash: request.context.sourceHash,
          operation: "rde_audit",
          rde: audit,
          decision: { status: "pending" },
        },
        null,
        2,
      ),
    );
    writeFileSync(join(DEMO_OUT, "rde-audit-report.md"), report);
    expect(report).toContain("# RDE audit");
  });
});
