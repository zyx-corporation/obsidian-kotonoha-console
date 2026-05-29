import { describe, expect, it } from "vitest";
import { endpointCandidates } from "../src/client/http/httpEndpoint";

describe("endpointCandidates", () => {
  it("includes localhost alias for 127.0.0.1", () => {
    expect(endpointCandidates("http://127.0.0.1:8000")).toEqual([
      "http://127.0.0.1:8000",
      "http://localhost:8000",
    ]);
  });
});
