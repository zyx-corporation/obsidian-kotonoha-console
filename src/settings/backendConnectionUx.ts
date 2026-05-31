import type { BackendMode } from "../domain/types";
import type { HttpBackendKind } from "../client/http/detectBackend";
import type { HttpProbeResult } from "../client/http/probeHttpBackend";
import { consoleMsg, type ConsoleMsgKey } from "../i18n/consoleI18n";
import type { RdeLang } from "../rde/rdeI18n";

export function backendModeInfoKey(mode: BackendMode): ConsoleMsgKey {
  switch (mode) {
    case "mock":
      return "settingsBackendMockInfo";
    case "http":
      return "settingsBackendHttpInfo";
    case "cli":
      return "settingsBackendCliInfo";
  }
}

function httpStableCapabilityKey(backend: HttpBackendKind): ConsoleMsgKey {
  switch (backend) {
    case "orchestrator":
      return "settingsHttpStableOrchestrator";
    case "gateway":
      return "settingsHttpStableGateway";
    default:
      return "settingsHttpStableConsole";
  }
}

function httpExperimentalCapabilityKey(backend: HttpBackendKind): ConsoleMsgKey {
  switch (backend) {
    case "orchestrator":
      return "settingsHttpExperimentalOrchestrator";
    case "gateway":
      return "settingsHttpExperimentalGateway";
    default:
      return "settingsHttpExperimentalConsole";
  }
}

/** Whether to show the experimental proposal-generation warning after HTTP probe. */
export function httpShowsProposalExperimentalWarning(backend: HttpBackendKind): boolean {
  return backend === "orchestrator" || backend === "console";
}

export function formatHttpStableCapability(
  lang: RdeLang | undefined,
  backend: HttpBackendKind,
): string {
  return consoleMsg(lang, httpStableCapabilityKey(backend));
}

export function formatHttpExperimentalCapability(
  lang: RdeLang | undefined,
  backend: HttpBackendKind,
): string {
  return consoleMsg(lang, httpExperimentalCapabilityKey(backend));
}

/** Multi-line connection test summary for HTTP probe (#42 / #164). */
export function formatHttpProbeNotice(
  lang: RdeLang | undefined,
  result: HttpProbeResult,
): string {
  const lines = [
    consoleMsg(lang, "noticeHttpOk", {
      status: result.health,
      backend: result.backend,
      endpoint: result.endpoint,
    }),
    consoleMsg(lang, "noticeHttpCapabilitiesStable", {
      line: formatHttpStableCapability(lang, result.backend),
    }),
    consoleMsg(lang, "noticeHttpCapabilitiesExperimental", {
      line: formatHttpExperimentalCapability(lang, result.backend),
    }),
  ];
  if (httpShowsProposalExperimentalWarning(result.backend)) {
    lines.push(consoleMsg(lang, "settingsHttpProposalExperimentalWarning"));
  }
  return lines.join("\n");
}

/** CLI connection test success with runtime boundary note. */
export function formatCliProbeNotice(
  lang: RdeLang | undefined,
  line: string,
  version: string,
): string {
  return [
    consoleMsg(lang, "noticeCliVersionOk", { line, version }),
    consoleMsg(lang, "settingsCliRuntimeWarning"),
  ].join("\n");
}

/** Mock backend connection test message. */
export function formatMockProbeNotice(lang: RdeLang | undefined): string {
  return consoleMsg(lang, "noticeMockBackendOk");
}
