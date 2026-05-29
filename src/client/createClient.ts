import type { App } from "obsidian";
import type { KotonohaConsoleSettings } from "../settings/PluginSettings";
import { buildCliEnv } from "../cli/buildCliEnv";
import { vaultBasePath } from "../util/vaultPath";
import type { KotonohaClient } from "./KotonohaClient";
import { CliKotonohaClient } from "./CliKotonohaClient";
import { MockKotonohaClient } from "./MockKotonohaClient";

const OBSERVATION_REL = ".kotonoha/cli-observation.json";

export function createKotonohaClient(
  settings: KotonohaConsoleSettings,
  app: App,
): KotonohaClient {
  switch (settings.backendMode) {
    case "cli": {
      const cwd =
        settings.cliWorkdir?.trim() || vaultBasePath(app) || process.cwd();
      return new CliKotonohaClient({
        bin: settings.cliCommand?.trim() || "kotonoha",
        cwd,
        gitMode: settings.gitMode,
        env: buildCliEnv(settings),
        writeObservation: async (payload) => {
          const dir = ".kotonoha";
          const adapter = app.vault.adapter;
          if (!(await adapter.exists(dir))) {
            await adapter.mkdir(dir);
          }
          await adapter.write(
            OBSERVATION_REL,
            JSON.stringify(payload, null, 2),
          );
          return OBSERVATION_REL;
        },
      });
    }
    case "mock":
      return new MockKotonohaClient();
    case "http":
      // Phase 2b: HttpKotonohaClient
      return new MockKotonohaClient();
    default:
      return new MockKotonohaClient();
  }
}
