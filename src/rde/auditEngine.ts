import type { AuditEngine, AuditEngineTier, RdeAudit } from "../domain/types";
import { consoleMsg, type ConsoleMsgKey } from "../i18n/consoleI18n";
import type { RdeLang } from "./rdeI18n";

const ENGINE_TIERS: Record<AuditEngine, AuditEngineTier> = {
  orchestrator: "stable_adapter",
  local: "rule_based_guardrails",
  mock: "test_backend",
  cli: "runtime_cli",
  gateway: "gateway_local",
};

const ENGINE_NOTES: Record<AuditEngine, string> = {
  orchestrator:
    "orchestrator /v1/rde/evaluate + local structural guardrails",
  local: "Local rule-based guardrails only; not full RDE evaluation",
  mock: "Mock backend for UI/dev testing",
  cli: "kotonoha rde emit / validate runtime path (interchange skeleton — not full RDE)",
  gateway: "Gateway backend; local rule-based audit",
};

const ENGINE_MSG_KEYS: Record<AuditEngine, ConsoleMsgKey> = {
  orchestrator: "auditEngineOrchestrator",
  local: "auditEngineLocal",
  mock: "auditEngineMock",
  cli: "auditEngineCli",
  gateway: "auditEngineGateway",
};

export function attachAuditEngine(audit: RdeAudit, engine: AuditEngine): RdeAudit {
  return {
    ...audit,
    engine,
    engineTier: ENGINE_TIERS[engine],
    engineNote: ENGINE_NOTES[engine],
  };
}

export function auditEngineDisplayName(
  lang: RdeLang | undefined,
  engine: AuditEngine,
): string {
  return consoleMsg(lang, ENGINE_MSG_KEYS[engine]);
}

export function formatAuditEnginePanelLine(
  lang: RdeLang | undefined,
  audit: RdeAudit,
): string {
  const engine = audit.engine ?? "local";
  const label = consoleMsg(lang, "auditEngineLabel");
  const name = auditEngineDisplayName(lang, engine);
  let line = `${label}: ${name}`;
  if (engine === "local" || engine === "gateway" || engine === "cli") {
    const cautionKey =
      engine === "cli" ? "auditEngineCliCaution" : "auditEngineLocalCaution";
    line += ` (${consoleMsg(lang, cautionKey)})`;
  }
  return line;
}

export function formatAuditEngineNoticeLine(
  lang: RdeLang | undefined,
  audit: RdeAudit,
): string {
  return formatAuditEnginePanelLine(lang, audit).replace(
    `${consoleMsg(lang, "auditEngineLabel")}: `,
    "",
  );
}

/** Sidecar records without engine metadata remain valid. */
export function readAuditEngineFromSidecar(
  body: Record<string, unknown>,
): Pick<RdeAudit, "engine" | "engineTier" | "engineNote"> {
  const rde = body.rde as Record<string, unknown> | undefined;
  const engine = (body.engine ?? rde?.engine) as AuditEngine | undefined;
  const engineTier = (body.engineTier ?? rde?.engineTier) as AuditEngineTier | undefined;
  const engineNote = (body.engineNote ?? rde?.engineNote) as string | undefined;
  return { engine, engineTier, engineNote };
}
