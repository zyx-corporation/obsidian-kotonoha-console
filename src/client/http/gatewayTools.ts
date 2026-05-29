import { parseContextPack } from "../../cli/proposalFromContextPack";
import type { HttpGatewayToolResponse } from "./httpTypes";
import { HttpClientError } from "./httpClient";

export function parseGatewayToolStdout(response: HttpGatewayToolResponse): string {
  const result = response.result;
  if (result.stdout?.trim()) return result.stdout.trim();
  const text = result.content?.[0]?.text;
  if (!text) {
    throw new HttpClientError("Gateway tool returned empty stdout");
  }
  try {
    const payload = JSON.parse(text) as { stdout?: string };
    if (payload.stdout?.trim()) return payload.stdout.trim();
  } catch {
    return text.trim();
  }
  throw new HttpClientError("Gateway tool returned empty stdout");
}

export function parseGatewayContextPack(response: HttpGatewayToolResponse) {
  if (!response.ok || response.result.isError) {
    throw new HttpClientError(
      "Gateway context export failed",
      undefined,
      parseGatewayToolStdout(response),
    );
  }
  return parseContextPack(parseGatewayToolStdout(response));
}
