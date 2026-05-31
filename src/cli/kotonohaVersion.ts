import type { RunKotonohaResult } from "./runKotonoha";
import { cliErrorMessage } from "./runKotonoha";

/** Recommended minimum CLI runtime (#167 / #39). */
export const KOTONOHA_CLI_MIN_VERSION = "0.3.1";

export type CliVersionFailureReason =
  | "exit_error"
  | "unparseable"
  | "too_old";

export type CliVersionCheckResult =
  | { ok: true; version: string; line: string }
  | {
      ok: false;
      reason: CliVersionFailureReason;
      detail: string;
      line?: string;
      version?: string;
    };

/** Parse semver from `kotonoha version` stdout (first line). */
export function parseKotonohaVersion(stdout: string): string | null {
  const line = stdout.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!line) return null;
  const match = line.match(/(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/);
  return match?.[1] ?? null;
}

/** Compare dotted semver tuples; ignores pre-release suffix for minimum check. */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    v.split(/[-+]/, 1)[0].split(".").map((n) => Number.parseInt(n, 10) || 0);
  const av = parse(a);
  const bv = parse(b);
  const len = Math.max(av.length, bv.length, 3);
  for (let i = 0; i < len; i += 1) {
    const diff = (av[i] ?? 0) - (bv[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isKotonohaVersionSupported(
  version: string,
  minVersion = KOTONOHA_CLI_MIN_VERSION,
): boolean {
  return compareSemver(version, minVersion) >= 0;
}

export function checkKotonohaCliVersion(
  result: RunKotonohaResult,
  minVersion = KOTONOHA_CLI_MIN_VERSION,
): CliVersionCheckResult {
  const line = result.stdout.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (result.exitCode !== 0) {
    return {
      ok: false,
      reason: "exit_error",
      detail: cliErrorMessage(result),
      line: line || undefined,
    };
  }
  const version = parseKotonohaVersion(result.stdout);
  if (!version) {
    return {
      ok: false,
      reason: "unparseable",
      detail: line || "(empty stdout)",
      line: line || undefined,
    };
  }
  if (!isKotonohaVersionSupported(version, minVersion)) {
    return {
      ok: false,
      reason: "too_old",
      detail: `found ${version}, need >= ${minVersion}`,
      line,
      version,
    };
  }
  return { ok: true, version, line: line || `kotonoha ${version}` };
}
