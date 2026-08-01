import { requestUrl } from "obsidian";
import type { HttpFetchFn } from "./httpClient";

/**
 * Obsidian-compatible fetch for localhost HTTP (avoids desktop/mobile fetch restrictions).
 */
export function createObsidianFetch(): HttpFetchFn {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const res = await requestUrl({
      url,
      method: init?.method?.toString() ?? "GET",
      headers: normalizeHeaders(init?.headers),
      body:
        typeof init?.body === "string" || init?.body instanceof ArrayBuffer
          ? init.body
          : undefined,
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

function normalizeHeaders(headers?: HeadersInit): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    const normalized: Record<string, string> = {};
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}
