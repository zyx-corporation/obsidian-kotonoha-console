import type { GenerationRequest } from "../domain/types";

/** Non-Git proposal body (git-mode-spec §4 — path + source hash anchors). */
export function proposalTextFromLocalContext(request: GenerationRequest): string {
  const { context, operation, instruction } = request;
  return [
    `<!-- kotonoha cli-local ${operation} -->`,
    "",
    `## Operation`,
    operation,
    "",
    `## Instruction`,
    instruction || "(none)",
    "",
    `## Anchor (non-Git)`,
    `- path: \`${context.filePath}\``,
    `- source_hash: \`${context.sourceHash.slice(0, 16)}…\``,
    "",
    "## Source",
    "",
    context.sourceText,
    "",
    "---",
    "",
    "*Git-aware `context export` skipped (`gitMode: off` or unavailable). Semantic anchors use path + source hash per git-mode-spec.*",
  ].join("\n");
}
