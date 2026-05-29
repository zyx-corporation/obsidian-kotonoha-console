import type { BackendMode } from "../domain/types";
import type { KotonohaConsoleSettings } from "../settings/PluginSettings";
import type { KotonohaClient } from "./KotonohaClient";
import { MockKotonohaClient } from "./MockKotonohaClient";

export function createKotonohaClient(settings: KotonohaConsoleSettings): KotonohaClient {
  const mode: BackendMode = settings.backendMode;
  switch (mode) {
    case "mock":
      return new MockKotonohaClient();
    case "http":
    case "cli":
      // Phase 2: HttpKotonohaClient / CliKotonohaClient
      return new MockKotonohaClient();
    default:
      return new MockKotonohaClient();
  }
}
