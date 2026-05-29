export class HttpClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "HttpClientError";
  }
}

export type HttpFetchFn = typeof fetch;

export interface HttpClientOptions {
  endpoint: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchFn?: HttpFetchFn;
}

function normalizeBase(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

function authHeaders(apiKey?: string): Record<string, string> {
  if (!apiKey?.trim()) return {};
  return { Authorization: `Bearer ${apiKey.trim()}` };
}

export class HttpClient {
  private readonly base: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: HttpFetchFn;

  constructor(options: HttpClientOptions) {
    this.base = normalizeBase(options.endpoint);
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  get baseUrl(): string {
    return this.base;
  }

  async getJson<T>(path: string): Promise<T> {
    return this.requestJson<T>("GET", path);
  }

  async postJson<T>(path: string, body: unknown): Promise<T> {
    return this.requestJson<T>("POST", path, body);
  }

  private async requestJson<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchFn(`${this.base}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(this.apiKey),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const errBody = (await res.json()) as { detail?: string; message?: string };
          detail = errBody.detail ?? errBody.message ?? detail;
        } catch {
          /* ignore */
        }
        throw new HttpClientError(`HTTP ${res.status}`, res.status, detail);
      }
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof HttpClientError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new HttpClientError(`HTTP timeout after ${this.timeoutMs}ms`);
      }
      throw new HttpClientError(e instanceof Error ? e.message : String(e));
    } finally {
      clearTimeout(timer);
    }
  }
}
