import { requestUrl } from "obsidian";

/**
 * Obsidian-compatible fetch for localhost HTTP (avoids desktop/mobile fetch restrictions).
 */
export function createObsidianFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const res = await requestUrl({
      url,
      method: (init?.method as string | undefined) ?? "GET",
      headers: init?.headers as Record<string, string> | undefined,
      body: typeof init?.body === "string" ? init.body : undefined,
      throw: false,
    });
    return new Response(res.text || (res.json != null ? JSON.stringify(res.json) : ""), {
      status: res.status,
      headers: new Headers(
        Object.entries(res.headers ?? {}).map(
          ([k, v]) => [k, String(v)] as [string, string],
        ),
      ),
    });
  };
}
