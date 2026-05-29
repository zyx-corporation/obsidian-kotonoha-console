import type { App } from "obsidian";
import type { GenerationRequest, Proposal, RdeAudit } from "../domain/types";

const ROOT = ".kotonoha";
const PROPOSALS = `${ROOT}/proposals`;
const AUDIT = `${ROOT}/audit`;
const PLUGIN_ID = "obsidian-kotonoha-console";
const SCHEMA_VERSION = "0.1.0";

export class SidecarStore {
  constructor(private readonly app: App) {}

  async saveProposalRecord(
    request: GenerationRequest,
    proposal: Proposal,
  ): Promise<void> {
    await this.ensureDirs();
    const path = `${PROPOSALS}/${proposal.id}.proposal.json`;
    const body = {
      schemaVersion: SCHEMA_VERSION,
      plugin: PLUGIN_ID,
      format: "kotonoha.obsidian.proposal.v0.1",
      proposalId: proposal.id,
      requestId: request.id,
      operation: request.operation,
      filePath: request.context.filePath,
      sourceHash: request.context.sourceHash,
      proposalHash: await hash(proposal.proposedText),
      createdAt: proposal.createdAt,
      summary: proposal.summary,
      decision: { status: "pending" as const },
    };
    await this.app.vault.adapter.write(path, JSON.stringify(body, null, 2));
  }

  async saveRdeAuditRecord(
    request: GenerationRequest,
    proposal: Proposal,
    audit: RdeAudit,
  ): Promise<void> {
    await this.ensureDirs();
    const path = `${AUDIT}/${proposal.id}.rde-audit.json`;
    const proposalHash = await hash(proposal.proposedText);
    const body = {
      schemaVersion: SCHEMA_VERSION,
      plugin: PLUGIN_ID,
      format: "kotonoha.obsidian.rde_audit.v0.1",
      proposalId: proposal.id,
      filePath: request.context.filePath,
      sourceHash: request.context.sourceHash,
      proposalHash,
      operation: request.operation,
      createdAt: audit.createdAt,
      rde: audit,
      decision: { status: "pending" as const },
    };
    await this.app.vault.adapter.write(path, JSON.stringify(body, null, 2));
  }

  private async ensureDirs(): Promise<void> {
    const adapter = this.app.vault.adapter;
    for (const dir of [ROOT, PROPOSALS, AUDIT]) {
      if (!(await adapter.exists(dir))) {
        await adapter.mkdir(dir);
      }
    }
  }
}

async function hash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
