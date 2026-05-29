import type {
  AuditLogMode,
  BackendMode,
  GitMode,
} from "../domain/types";

/** Plugin settings — docs/architecture.ja.md §10, docs/git-mode-spec.ja.md §2 */
export interface KotonohaConsoleSettings {
  backendMode: BackendMode;
  httpEndpoint?: string;
  cliCommand?: string;
  defaultLanguage: "ja" | "en";
  requireHumanApproval: boolean;
  preserveFrontmatter: boolean;
  auditLogMode: AuditLogMode;
  enableRdeAudit: boolean;
  gitMode: GitMode;
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
  sidecarMode: true,
  cliCommand: "kotonoha",
};
