import { describe, expect, it } from "vitest";
import {
  attachAuditEngine,
  auditEngineDisplayName,
  formatAuditEngineNoticeLine,
  formatAuditEnginePanelLine,
  readAuditEngineFromSidecar,
} from "../src/rde/auditEngine";
import type { RdeAudit } from "../src/domain/types";

const baseAudit: RdeAudit = {
  proposalId: "p1",
  createdAt: "2026-05-31T00:00:00.000Z",
  categories: ["preserved"],
  preservedElements: ["intent"],
  transformedElements: [],
  inferredExtensions: [],
  unresolvedElements: [],
  driftRisks: [],
  recommendedDecision: "human_review",
  confidence: 0.5,
};

describe("auditEngine", () => {
  it("attachAuditEngine sets orchestrator stable adapter metadata", () => {
    const audit = attachAuditEngine(baseAudit, "orchestrator");
    expect(audit.engine).toBe("orchestrator");
    expect(audit.engineTier).toBe("stable_adapter");
    expect(audit.engineNote).toContain("/v1/rde/evaluate");
  });

  it("local panel line includes not-full-RDE caution", () => {
    const audit = attachAuditEngine(baseAudit, "local");
    const line = formatAuditEnginePanelLine("ja", audit);
    expect(line).toContain("監査エンジン");
    expect(line).toContain("full RDE ではありません");
    expect(line).not.toMatch(/full RDE evaluation/i);
  });

  it("orchestrator panel line does not claim full RDE via local caution", () => {
    const audit = attachAuditEngine(baseAudit, "orchestrator");
    const line = formatAuditEnginePanelLine("en", audit);
    expect(line).toContain("orchestrator / stable adapter");
    expect(line).not.toContain("not full RDE");
  });

  it("mock and cli display names are distinct", () => {
    expect(auditEngineDisplayName("en", "mock")).toContain("mock");
    expect(auditEngineDisplayName("en", "cli")).toContain("cli");
  });

  it("notice line omits label prefix", () => {
    const audit = attachAuditEngine(baseAudit, "mock");
    const notice = formatAuditEngineNoticeLine("en", audit);
    expect(notice).not.toMatch(/^Engine:/);
    expect(notice).toContain("mock / test backend");
  });

  it("readAuditEngineFromSidecar supports legacy records without engine", () => {
    const legacy = {
      rde: { ...baseAudit },
      proposalId: "p1",
    };
    expect(readAuditEngineFromSidecar(legacy).engine).toBeUndefined();
  });

  it("readAuditEngineFromSidecar reads top-level engine fields", () => {
    const body = {
      engine: "cli",
      engineTier: "runtime_cli",
      engineNote: "kotonoha rde emit / validate runtime path",
      rde: baseAudit,
    };
    expect(readAuditEngineFromSidecar(body).engine).toBe("cli");
  });
});
