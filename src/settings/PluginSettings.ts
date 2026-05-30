import type {
  AuditLogMode,
  BackendMode,
  GitMode,
  MetadataWriteMode,
} from "../domain/types";

/** Plugin settings — docs/architecture.ja.md §10, docs/git-mode-spec.ja.md §2 */
export interface KotonohaConsoleSettings {
  backendMode: BackendMode;
  httpEndpoint?: string;
  /** Bearer token for gateway / orchestrator when auth is enabled. */
  httpApiKey?: string;
  cliCommand?: string;
  defaultLanguage: "ja" | "en" | "zh_CN";
  requireHumanApproval: boolean;
  preserveFrontmatter: boolean;
  auditLogMode: AuditLogMode;
  enableRdeAudit: boolean;
  gitMode: GitMode;
  /** git-mode-spec §8 — optional `kotonoha:` YAML on apply. */
  metadataWriteMode: MetadataWriteMode;
  sidecarMode: boolean;
  /** Vault / Git repo root for `kotonoha --path` (cli mode). Empty = detected vault path. */
  cliWorkdir?: string;
  databaseUrl?: string;
  principalId?: string;
  projectId?: string;
}

export const DEFAULT_SETTINGS: KotonohaConsoleSettings = {
  backendMode: "mock",
  defaultLanguage: "ja",
  requireHumanApproval: true,
  preserveFrontmatter: true,
  auditLogMode: "summary",
  enableRdeAudit: true,
  gitMode: "off",
  metadataWriteMode: "prompt",
  sidecarMode: true,
  cliCommand: "kotonoha",
  httpEndpoint: "http://127.0.0.1:8000",
};
