import type { GenerationRequest } from "../domain/types";

export interface ContextPackJson {
  format?: string;
  git_anchor?: {
    git_commit?: string;
    file_path?: string;
    line_range_start?: number | null;
    line_range_end?: number | null;
    diff_ref?: string | null;
  };
  meaning_delta_draft?: {
    observation?: Record<string, unknown>;
  };
  policy_ref?: string;
}

export function parseContextPack(stdout: string): ContextPackJson {
  const pack = JSON.parse(stdout) as ContextPackJson;
  if (pack.format !== "kotonoha.context_pack.v0.1") {
    throw new Error(`unexpected context pack format: ${pack.format ?? "(missing)"}`);
  }
  return pack;
}

export function proposalTextFromContextPack(
  request: GenerationRequest,
  pack: ContextPackJson,
): string {
  const anchor = pack.git_anchor;
  const lines = [
    `<!-- kotonoha cli ${request.operation} -->`,
    "",
    `## Operation`,
    request.operation,
    "",
    `## Instruction`,
    request.instruction || "(none)",
    "",
  ];

  if (anchor?.git_commit) {
    lines.push(`## Git anchor`, `- commit: \`${anchor.git_commit}\``, `- file: \`${anchor.file_path ?? request.context.filePath}\``);
    if (anchor.line_range_start != null) {
      lines.push(`- lines: ${anchor.line_range_start}–${anchor.line_range_end ?? anchor.line_range_start}`);
    }
    lines.push("");
  }

  lines.push("## Source", "", request.context.sourceText, "", "---", "", "*CLI mode uses `kotonoha context export` only; connect an orchestrator/LLM for generative rewrite.*");

  return lines.join("\n");
}
