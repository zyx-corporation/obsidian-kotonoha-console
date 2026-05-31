/** Languages allowed for outer fence unwrap (Markdown transport artifact). */
const UNWRAP_LANGS = new Set(["", "markdown", "md", "text"]);

const OUTER_FENCE =
  /^```([a-zA-Z0-9_-]*)\s*\r?\n([\s\S]*)\r?\n```\s*$/;

/**
 * Remove a single outer Markdown/text fence when the entire payload is wrapped.
 * Preserves inner code blocks and does not unwrap code-language fences.
 */
export function unwrapSingleMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(OUTER_FENCE);
  if (!match) return text;

  const lang = match[1].toLowerCase();
  if (!UNWRAP_LANGS.has(lang)) return text;

  return match[2];
}

/** Apply transport normalization to proposal body text. */
export function normalizeProposalText(proposedText: string): string {
  return unwrapSingleMarkdownFence(proposedText);
}
