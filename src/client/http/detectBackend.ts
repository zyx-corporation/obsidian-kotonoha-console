import type { HttpFetchFn } from "./httpClient";

export type HttpBackendKind = "orchestrator" | "gateway" | "console";

export async function detectHttpBackend(
  baseUrl: string,
  fetchFn: HttpFetchFn,
): Promise<HttpBackendKind> {
  const base = baseUrl.replace(/\/+$/, "");
  try {
    const res = await fetchFn(`${base}/v1/agents`, { method: "GET" });
    if (res.ok) return "orchestrator";
  } catch {
    /* try next */
  }
  try {
    const res = await fetchFn(`${base}/v1/tools`, { method: "GET" });
    if (res.ok) return "gateway";
  } catch {
    /* fall through */
  }
  return "console";
}
