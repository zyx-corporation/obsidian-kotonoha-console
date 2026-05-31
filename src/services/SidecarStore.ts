import type { App } from "obsidian";
import type {
  ApprovalDecision,
  GenerationRequest,
  Proposal,
  RdeAudit,
} from "../domain/types";
import {
  logSidecarValidation,
  validateAuditSidecar,
  validateProposalSidecar,
  validateReviewSidecar,
} from "../sidecar/validateSidecar";

const ROOT = ".kotonoha";
const PROPOSALS = `${ROOT}/proposals`;
const AUDIT = `${ROOT}/audit`;
const REVIEWS = `${ROOT}/reviews`;
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
    logSidecarValidation("proposal", path, validateProposalSidecar(body));
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
      ...(audit.engine ? { engine: audit.engine } : {}),
      ...(audit.engineTier ? { engineTier: audit.engineTier } : {}),
      ...(audit.engineNote ? { engineNote: audit.engineNote } : {}),
      rde: audit,
      decision: { status: "pending" as const },
    };
    logSidecarValidation("audit", path, validateAuditSidecar(body));
    await this.app.vault.adapter.write(path, JSON.stringify(body, null, 2));
  }

  /** git-mode-spec §9.1 step 10 — human review decision sidecar. */
  async saveReviewRecord(
    request: GenerationRequest,
    proposal: Proposal,
    decision: ApprovalDecision,
    audit?: RdeAudit,
  ): Promise<void> {
    await this.ensureDirs();
    const path = `${REVIEWS}/${proposal.id}.review.json`;
    const body = {
      schemaVersion: SCHEMA_VERSION,
      plugin: PLUGIN_ID,
      format: "kotonoha.obsidian.review.v0.1",
      proposalId: proposal.id,
      filePath: request.context.filePath,
      sourceHash: request.context.sourceHash,
      operation: request.operation,
      decision: {
        status: decision.decision,
        decidedAt: decision.decidedAt,
        comment: decision.comment,
      },
      rdeRecommended: audit?.recommendedDecision,
      rdeCategories: audit?.categories,
    };
    logSidecarValidation("review", path, validateReviewSidecar(body));
    await this.app.vault.adapter.write(path, JSON.stringify(body, null, 2));
    await this.patchSidecarDecision(proposal.id, decision.decision);
  }

  private async patchSidecarDecision(
    proposalId: string,
    status: ApprovalDecision["decision"],
  ): Promise<void> {
    const adapter = this.app.vault.adapter;
    const sidecarStatus =
      status === "approved"
        ? "approved"
        : status === "partially_applied"
          ? "partially_applied"
          : status === "hold"
            ? "hold"
            : "rejected";
    for (const path of [
      `${PROPOSALS}/${proposalId}.proposal.json`,
      `${AUDIT}/${proposalId}.rde-audit.json`,
    ]) {
      if (!(await adapter.exists(path))) continue;
      try {
        const raw = await adapter.read(path);
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        parsed.decision = { status: sidecarStatus, decidedAt: new Date().toISOString() };
        await adapter.write(path, JSON.stringify(parsed, null, 2));
      } catch {
        /* non-fatal — review file is canonical */
      }
    }
  }

  private async ensureDirs(): Promise<void> {
    const adapter = this.app.vault.adapter;
    for (const dir of [ROOT, PROPOSALS, AUDIT, REVIEWS]) {
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
