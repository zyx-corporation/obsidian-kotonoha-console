export function endpointCandidates(endpoint: string): string[] {
  const base = endpoint.replace(/\/+$/, "");
  const out = [base];
  if (base.includes("127.0.0.1")) {
    out.push(base.replace("127.0.0.1", "localhost"));
  } else if (base.includes("localhost")) {
    out.push(base.replace("localhost", "127.0.0.1"));
  }
  return [...new Set(out)];
}
