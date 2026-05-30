import type { GitMode, MetadataWriteMode } from "../domain/types";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface KotonohaLineageFields {
  review_status: string;
  latest_proposal_id: string;
  project_id?: string;
}

/** git-mode-spec §6.4: in obsidian-git-aware, never auto-write without confirm. */
export function effectiveMetadataWriteMode(
  mode: MetadataWriteMode,
  gitMode: GitMode,
): MetadataWriteMode {
  if (mode === "off") return "off";
  if (gitMode === "obsidian-git-aware" && mode === "always") return "prompt";
  return mode;
}

export function shouldWriteMetadata(mode: MetadataWriteMode): boolean {
  return mode !== "off";
}

export function mergeKotonohaFrontmatter(
  content: string,
  fields: KotonohaLineageFields,
): string {
  const lines: string[] = [
    `  review_status: ${quoteYaml(fields.review_status)}`,
    `  latest_proposal_id: ${quoteYaml(fields.latest_proposal_id)}`,
  ];
  if (fields.project_id?.trim()) {
    lines.push(`  project_id: ${quoteYaml(fields.project_id.trim())}`);
  }
  const kotonohaBlock = `kotonoha:\n${lines.join("\n")}`;

  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    return `---\n${kotonohaBlock}\n---\n\n${content}`;
  }

  let body = match[1];
  const rest = content.slice(match[0].length);
  body = stripKotonohaSection(body);
  body = `${body.trimEnd()}\n${kotonohaBlock}\n`;
  return `---\n${body}\n---\n${rest}`;
}

/** Remove existing `kotonoha:` subtree from frontmatter body. */
function stripKotonohaSection(fmBody: string): string {
  const lines = fmBody.split("\n");
  const out: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (/^kotonoha:/.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping && /^[^\s#]/.test(line)) {
      skipping = false;
    }
    if (skipping) continue;
    out.push(line);
  }
  return out.join("\n");
}

function quoteYaml(value: string): string {
  if (/[:#\n\r]/.test(value) || value.startsWith(" ") || value.endsWith(" ")) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}
