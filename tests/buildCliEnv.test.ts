import { describe, expect, it } from "vitest";
import { buildCliEnv } from "../src/cli/buildCliEnv";
import { DEFAULT_SETTINGS } from "../src/settings/PluginSettings";

describe("buildCliEnv", () => {
  it("passes optional KOTONOHA env vars to child process", () => {
    const env = buildCliEnv({
      ...DEFAULT_SETTINGS,
      databaseUrl: "postgres://example/db",
      principalId: "principal-1",
      projectId: "project-1",
    });
    expect(env.DATABASE_URL).toBe("postgres://example/db");
    expect(env.KOTONOHA_PRINCIPAL_ID).toBe("principal-1");
    expect(env.KOTONOHA_PROJECT_ID).toBe("project-1");
  });

  it("omits empty optional env vars", () => {
    const env = buildCliEnv({ ...DEFAULT_SETTINGS });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.KOTONOHA_PRINCIPAL_ID).toBeUndefined();
    expect(env.KOTONOHA_PROJECT_ID).toBeUndefined();
  });
});
