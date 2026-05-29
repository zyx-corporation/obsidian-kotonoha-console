import type { KotonohaConsoleSettings } from "../settings/PluginSettings";

/** Child-process env for `kotonoha` (M6/M7 optional). */
export function buildCliEnv(settings: KotonohaConsoleSettings): Record<string, string> {
  const env: Record<string, string> = {};
  if (settings.databaseUrl?.trim()) {
    env.DATABASE_URL = settings.databaseUrl.trim();
  }
  if (settings.principalId?.trim()) {
    env.KOTONOHA_PRINCIPAL_ID = settings.principalId.trim();
  }
  if (settings.projectId?.trim()) {
    env.KOTONOHA_PROJECT_ID = settings.projectId.trim();
  }
  return env;
}
