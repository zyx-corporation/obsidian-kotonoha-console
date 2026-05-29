import type { App } from "obsidian";
import type {
  ApprovalDecision,
  AuditLogMode,
  Proposal,
  RdeAudit,
} from "../domain/types";
import { sha256Hex } from "../util/hash";

const KOTONOHA_DIR = ".kotonoha/audit";

export class AuditLogService {
  constructor(
    private readonly app: App,
    private readonly mode: AuditLogMode,
  ) {}

  async logProposal(proposal: Proposal, sourceExcerpt: string): Promise<void> {
    const entry = {
      kind: "proposal" as const,
      proposalId: proposal.id,
      createdAt: proposal.createdAt,
      proposalHash: await sha256Hex(proposal.proposedText),
      sourceExcerpt: excerpt(sourceExcerpt, this.mode),
      summary: proposal.summary,
    };
    await this.append(entry);
  }

  async logDecision(
    decision: ApprovalDecision,
    audit?: RdeAudit,
  ): Promise<void> {
    const entry = {
      kind: "decision" as const,
      ...decision,
      rdeCategories: audit?.categories,
    };
    await this.append(entry);
  }

  private async append(entry: unknown): Promise<void> {
    const name = `${isoFileStamp()}.json`;
    const path = `${KOTONOHA_DIR}/${name}`;
    await this.ensureDir();
    const line = JSON.stringify(entry, null, 2);
    await this.app.vault.adapter.write(path, line);
  }

  private async ensureDir(): Promise<void> {
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(KOTONOHA_DIR))) {
      await adapter.mkdir(KOTONOHA_DIR);
    }
  }
}

function isoFileStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function excerpt(text: string, mode: AuditLogMode): string {
  if (mode === "hash_only") return "";
  const max = mode === "summary" ? 200 : 4000;
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}
