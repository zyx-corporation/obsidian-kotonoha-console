import { describe, expect, it } from "vitest";
import {
  backendModeInfoKey,
  formatCliProbeNotice,
  formatHttpExperimentalCapability,
  formatHttpProbeNotice,
  formatHttpStableCapability,
  formatMockProbeNotice,
  httpShowsProposalExperimentalWarning,
} from "../src/settings/backendConnectionUx";

describe("backendConnectionUx", () => {
  it("labels mock backend as test backend", () => {
    const msg = formatMockProbeNotice("en");
    expect(msg).toContain("test backend");
    expect(msg).toMatch(/mock/i);
  });

  it("orchestrator HTTP probe includes stable and experimental distinction", () => {
    const msg = formatHttpProbeNotice("en", {
      endpoint: "http://127.0.0.1:8001",
      health: "ok",
      backend: "orchestrator",
    });
    expect(msg).toContain("orchestrator");
    expect(msg).toContain("Stable:");
    expect(msg).toContain("/v1/rde/evaluate");
    expect(msg).toContain("Experimental:");
    expect(msg).toContain("/v1/proposals/generate");
    expect(msg).toContain("experimental");
    expect(msg).toContain("best-effort");
  });

  it("labels /v1/proposals/generate as experimental for orchestrator", () => {
    const experimental = formatHttpExperimentalCapability("en", "orchestrator");
    expect(experimental).toContain("/v1/proposals/generate");
    expect(experimental).toContain("experimental");
  });

  it("gateway stable/experimental lines do not claim full RDE", () => {
    const stable = formatHttpStableCapability("en", "gateway");
    const experimental = formatHttpExperimentalCapability("en", "gateway");
    expect(stable).toContain("context export");
    expect(experimental).toContain("local rule-based guardrails");
    expect(experimental).not.toMatch(/full RDE evaluation/i);
  });

  it("CLI probe notice mentions version and runtime-not-spec", () => {
    const msg = formatCliProbeNotice("en", "kotonoha 0.3.1", "0.3.1");
    expect(msg).toContain("0.3.1");
    expect(msg).toContain("runtime");
    expect(msg).not.toMatch(/normative spec/i);
    expect(msg).toMatch(/not the normative|not the normative kotonoha-spec/i);
  });

  it("backend mode info keys cover mock http cli", () => {
    expect(backendModeInfoKey("mock")).toBe("settingsBackendMockInfo");
    expect(backendModeInfoKey("http")).toBe("settingsBackendHttpInfo");
    expect(backendModeInfoKey("cli")).toBe("settingsBackendCliInfo");
  });

  it("shows proposal experimental warning for orchestrator and console only", () => {
    expect(httpShowsProposalExperimentalWarning("orchestrator")).toBe(true);
    expect(httpShowsProposalExperimentalWarning("console")).toBe(true);
    expect(httpShowsProposalExperimentalWarning("gateway")).toBe(false);
  });
});
