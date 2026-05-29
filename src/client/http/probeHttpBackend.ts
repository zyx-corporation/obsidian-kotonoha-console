import type { HttpBackendKind } from "./detectBackend";
import { endpointCandidates, obsidianHttpRequest } from "./obsidianHttp";

export interface HttpProbeResult {
  endpoint: string;
  health: string;
  backend: HttpBackendKind;
}

export class HttpProbeError extends Error {
  constructor(
    message: string,
    readonly attempts: Array<{ endpoint: string; status?: number; detail: string }>,
  ) {
    super(message);
    this.name = "HttpProbeError";
  }
}

/** Probe /health and detect orchestrator vs gateway vs console (Obsidian requestUrl). */
export async function probeHttpBackend(
  endpoint: string,
  apiKey?: string,
): Promise<HttpProbeResult> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey?.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;

  const attempts: HttpProbeError["attempts"] = [];

  for (const base of endpointCandidates(endpoint)) {
    try {
      const health = await obsidianHttpRequest<{ status?: string }>(`${base}/health`, {
        headers,
      });
      if (health.status !== 200) {
        attempts.push({
          endpoint: base,
          status: health.status,
          detail: health.text.slice(0, 200) || `HTTP ${health.status}`,
        });
        continue;
      }

      const healthStatus = health.json?.status ?? "ok";

      const agents = await obsidianHttpRequest(`${base}/v1/agents`, { headers });
      if (agents.status === 200) {
        return { endpoint: base, health: healthStatus, backend: "orchestrator" };
      }

      const tools = await obsidianHttpRequest(`${base}/v1/tools`, { headers });
      if (tools.status === 200) {
        return { endpoint: base, health: healthStatus, backend: "gateway" };
      }

      return { endpoint: base, health: healthStatus, backend: "console" };
    } catch (e) {
      attempts.push({
        endpoint: base,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  throw new HttpProbeError(
    attempts.map((a) => `${a.endpoint}: ${a.detail}`).join(" · ") ||
      "no endpoint candidates",
    attempts,
  );
}
