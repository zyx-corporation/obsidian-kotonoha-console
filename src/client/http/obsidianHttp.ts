import { requestUrl } from "obsidian";
import { endpointCandidates } from "./httpEndpoint";

export interface ObsidianHttpResult<T = unknown> {
  status: number;
  text: string;
  json: T;
}

/** Low-level Obsidian HTTP — uses requestUrl (reliable for localhost). */
export async function obsidianHttpRequest<T = unknown>(
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
): Promise<ObsidianHttpResult<T>> {
  const res = await requestUrl({
    url,
    method: init?.method ?? "GET",
    headers: init?.headers,
    body: init?.body,
    throw: false,
  });
  const text = res.text ?? "";
  let json = res.json as T;
  if ((json === undefined || json === null) && text.trim()) {
    try {
      json = JSON.parse(text) as T;
    } catch {
      json = text as T;
    }
  }
  return { status: res.status, text, json };
}

export { endpointCandidates };
