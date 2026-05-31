import { describe, expect, it } from "vitest";
import {
  checkKotonohaCliVersion,
  compareSemver,
  isKotonohaVersionSupported,
  parseKotonohaVersion,
} from "../src/cli/kotonohaVersion";

describe("kotonohaVersion", () => {
  it("parses version from stdout", () => {
    expect(parseKotonohaVersion("kotonoha 0.3.1\n")).toBe("0.3.1");
    expect(parseKotonohaVersion("0.3.2-beta\n")).toBe("0.3.2-beta");
  });

  it("compareSemver orders dotted versions", () => {
    expect(compareSemver("0.3.1", "0.3.0")).toBeGreaterThan(0);
    expect(compareSemver("0.3.0", "0.3.1")).toBeLessThan(0);
    expect(compareSemver("0.3.1", "0.3.1")).toBe(0);
  });

  it("supports recommended minimum 0.3.1", () => {
    expect(isKotonohaVersionSupported("0.3.1")).toBe(true);
    expect(isKotonohaVersionSupported("0.3.0")).toBe(false);
    expect(isKotonohaVersionSupported("0.4.0")).toBe(true);
  });

  it("checkKotonohaCliVersion passes on ok stdout", () => {
    const check = checkKotonohaCliVersion({
      stdout: "kotonoha 0.3.1\n",
      stderr: "",
      exitCode: 0,
    });
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.version).toBe("0.3.1");
  });

  it("checkKotonohaCliVersion fails on too old version", () => {
    const check = checkKotonohaCliVersion({
      stdout: "kotonoha 0.2.0\n",
      stderr: "",
      exitCode: 0,
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("too_old");
  });

  it("checkKotonohaCliVersion fails on non-zero exit", () => {
    const check = checkKotonohaCliVersion({
      stdout: "",
      stderr: "DATABASE_URL missing",
      exitCode: 3,
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("exit_error");
  });
});
