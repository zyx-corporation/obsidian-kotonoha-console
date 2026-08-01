import type { GenerationRequest, Proposal, RdeAudit } from "../domain/types";
import {
  formatCategory,
  formatDecision,
  normalizeRdeLang,
  rdeMsg,
} from "../rde/rdeI18n";

export type GitHubReferenceKind = "issue" | "pr";

export interface GitHubReference {
  kind: GitHubReferenceKind;
  owner?: string;
  repo?: string;
  number: number;
  url?: string;
  raw: string;
}

export interface ReviewHandoffReferences {
  issue?: GitHubReference;
  pr?: GitHubReference;
}

export interface ReviewHandoffInput {
  request: GenerationRequest;
  proposal: Proposal;
  audit?: RdeAudit;
  references?: ReviewHandoffReferences;
}

export function parseGitHubReference(
  raw: string,
  expectedKind: GitHubReferenceKind,
): GitHubReference | null {
  const input = raw.trim();
  if (!input) return null;

  const urlMatch = input.match(
    /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/(issues|pull)\/(\d+)(?:[/?#].*)?$/i,
  );
  if (urlMatch) {
    const kind: GitHubReferenceKind = urlMatch[3].toLowerCase() === "pull" ? "pr" : "issue";
    if (kind !== expectedKind) return null;
    return {
      kind,
      owner: urlMatch[1],
      repo: urlMatch[2],
      number: Number(urlMatch[4]),
      url: `https://github.com/${urlMatch[1]}/${urlMatch[2]}/${urlMatch[3].toLowerCase()}/${urlMatch[4]}`,
      raw: input,
    };
  }

  const ownerRepoMatch = input.match(/^([^/\s#]+)\/([^/\s#!]+)([#|!])(\d+)$/);
  if (ownerRepoMatch) {
    const kind: GitHubReferenceKind = ownerRepoMatch[3] === "!" ? "pr" : "issue";
    if (kind !== expectedKind) return null;
    const path = kind === "pr" ? "pull" : "issues";
    return {
      kind,
      owner: ownerRepoMatch[1],
      repo: ownerRepoMatch[2],
      number: Number(ownerRepoMatch[4]),
      url: `https://github.com/${ownerRepoMatch[1]}/${ownerRepoMatch[2]}/${path}/${ownerRepoMatch[4]}`,
      raw: input,
    };
  }

  const shortMatch = input.match(/^(#|!)(\d+)$/);
  if (shortMatch) {
    const kind: GitHubReferenceKind = shortMatch[1] === "!" ? "pr" : "issue";
    if (kind !== expectedKind) return null;
    return {
      kind,
      number: Number(shortMatch[2]),
      raw: input,
    };
  }

  return null;
}

export function formatReference(ref: GitHubReference): string {
  if (ref.url) return ref.url;
  return `${ref.kind === "pr" ? "PR" : "Issue"} #${ref.number}`;
}

export function buildReviewSummaryBlock(input: ReviewHandoffInput): string {
  const lang = normalizeRdeLang(input.request.language);
  const audit = input.audit;
  const lines = [
    "<!-- kotonoha review-handoff v0.5 -->",
    "",
    `## Kotonoha RDE review handoff`,
    "",
    `- File: \`${input.request.context.filePath}\``,
    `- Proposal: \`${input.proposal.id}\``,
    `- Source hash: \`${input.request.context.sourceHash.slice(0, 16)}…\``,
    "- Review destination: Local only / explicit publication handoff",
    "- Canonical Kotonoha record: local sidecar and note history",
  ];

  appendReferences(lines, input.references);

  if (audit) {
    lines.push(
      `- Recommended decision: ${formatDecision(lang, audit.recommendedDecision)}`,
      `- Categories: ${formatCategories(lang, audit)}`,
    );
    appendItems(lines, "Preserved", audit.preservedElements);
    appendItems(lines, "Transformed", audit.transformedElements);
    appendItems(lines, "Inferred", audit.inferredExtensions);
    appendItems(lines, "Unresolved", audit.unresolvedElements);
    appendItems(lines, "Drift risks", audit.driftRisks);
  } else {
    lines.push("- RDE audit: not attached to this proposal");
  }

  lines.push(
    "",
    "### Proposed text excerpt",
    "",
    excerpt(input.proposal.proposedText),
  );

  return lines.join("\n");
}

export function buildIssueDraft(input: ReviewHandoffInput): string {
  const audit = input.audit;
  const categorySlug = audit?.categories.join(", ") || "review";
  const lines = [
    `Title: Kotonoha RDE review: ${input.request.context.title || input.request.context.filePath}`,
    "",
    "Body:",
    "",
    "## Review context",
    "",
    `- File: \`${input.request.context.filePath}\``,
    `- Proposal: \`${input.proposal.id}\``,
    `- Source hash: \`${input.request.context.sourceHash.slice(0, 16)}…\``,
    `- Category: ${categorySlug}`,
    "",
    "## Boundary",
    "",
    "This Issue is a publication/review handoff. Kotonoha's canonical record remains the local sidecar and note history.",
    "",
    "## Review summary",
    "",
    buildReviewSummaryBlock(input),
  ];
  return lines.join("\n");
}

export function buildPrSummary(input: ReviewHandoffInput): string {
  const lang = normalizeRdeLang(input.request.language);
  const audit = input.audit;
  const lines = [
    "## Summary",
    "",
    "- Prepared from Kotonoha RDE review output.",
    `- File: \`${input.request.context.filePath}\``,
    `- Proposal: \`${input.proposal.id}\``,
  ];

  appendReferences(lines, input.references);

  lines.push(
    "",
    "## Semantic review",
    "",
  );

  if (audit) {
    lines.push(
      `- Recommended decision: ${formatDecision(lang, audit.recommendedDecision)}`,
      `- Categories: ${formatCategories(lang, audit)}`,
    );
    appendItems(lines, "Drift risks", audit.driftRisks);
    appendItems(lines, "Unresolved", audit.unresolvedElements);
  } else {
    lines.push("- RDE audit: not attached to this proposal");
  }

  lines.push(
    "",
    "## Boundary",
    "",
    "- GitHub is a review/correlation/publication surface.",
    "- The Kotonoha-owned semantic record remains local sidecars and note history.",
    "- Human review is still required before treating the change as accepted lineage.",
    "",
    "## Verification",
    "",
    "- [ ] Confirm the PR diff matches the reviewed note/proposal scope.",
    "- [ ] Confirm RDE risks are accepted, revised, or explicitly rejected.",
  );

  return lines.join("\n");
}

function appendReferences(lines: string[], references?: ReviewHandoffReferences): void {
  if (references?.issue) {
    lines.push(`- Existing Issue: ${formatReference(references.issue)}`);
  }
  if (references?.pr) {
    lines.push(`- Existing PR: ${formatReference(references.pr)}`);
  }
}

function appendItems(lines: string[], title: string, items: string[]): void {
  if (items.length === 0) return;
  lines.push("", `### ${title}`, "");
  for (const item of items) {
    lines.push(`- ${item}`);
  }
}

function formatCategories(
  lang: ReturnType<typeof normalizeRdeLang>,
  audit: RdeAudit,
): string {
  return audit.categories.map((category) => formatCategory(lang, category)).join(", ")
    || rdeMsg(lang, "categoryNone");
}

function excerpt(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 1200) return trimmed;
  return `${trimmed.slice(0, 1200)}\n…`;
}
