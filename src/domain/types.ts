/** Domain types — see docs/architecture.ja.md §6 */

export type OperationType =
  | "summarize"
  | "rewrite"
  | "expand"
  | "rde_audit"
  | "custom";

export type BackendMode = "mock" | "http" | "cli";

export type GitMode =
  | "off"
  | "external"
  | "passive-observing"
  | "obsidian-git-aware";

/** git-mode-spec §8 — frontmatter lineage writes on apply. */
export type MetadataWriteMode = "off" | "prompt" | "always";

export type AuditLogMode = "hash_only" | "summary" | "full_text";

export type RdeCategory =
  | "preserved"
  | "authorized_transformation"
  | "inferred_extension"
  | "unresolved"
  | "suspicious_drift"
  | "critical_distortion";

export interface NoteContext {
  vaultPath: string;
  filePath: string;
  title: string;
  sourceText: string;
  selectionText?: string;
  sourceHash: string;
  tags: string[];
  links: string[];
  frontmatter: Record<string, unknown>;
  git?: GitContextSnapshot;
}

export interface GitContextSnapshot {
  root?: string;
  branch?: string;
  commit?: string;
  dirty: boolean;
  repoRelativePath: string;
  /** Set in `obsidian-git-aware` mode when Obsidian Git plugin is active. */
  obsidianGitDetected?: boolean;
}

export interface GenerationRequest {
  id: string;
  createdAt: string;
  operation: OperationType;
  instruction: string;
  context: NoteContext;
  language: "ja" | "en" | "zh_CN";
}

export interface Proposal {
  id: string;
  requestId: string;
  createdAt: string;
  proposedText: string;
  summary?: string;
  uncertaintyNote?: string;
}

export interface RdeAudit {
  proposalId: string;
  createdAt: string;
  categories: RdeCategory[];
  preservedElements: string[];
  transformedElements: string[];
  inferredExtensions: string[];
  unresolvedElements: string[];
  driftRisks: string[];
  recommendedDecision: "approve" | "revise" | "reject" | "human_review";
  confidence: number;
}

export interface ApprovalDecision {
  proposalId: string;
  decidedAt: string;
  decision: "approved" | "rejected" | "partially_applied" | "hold";
  appliedText?: string;
  comment?: string;
}
