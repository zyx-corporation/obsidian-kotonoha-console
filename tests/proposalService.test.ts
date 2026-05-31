import { describe, expect, it, vi } from "vitest";
import type { GenerationRequest, NoteContext, Proposal } from "../src/domain/types";
import { ProposalService } from "../src/services/ProposalService";

const ctx: NoteContext = {
  vaultPath: "/v",
  filePath: "note.md",
  title: "sample",
  sourceText: "Body text.",
  sourceHash: "abc123",
  tags: [],
  links: [],
  frontmatter: {},
};

const request: GenerationRequest = {
  id: "r1",
  createdAt: new Date().toISOString(),
  operation: "expand",
  instruction: "expand",
  context: ctx,
  language: "ja",
};

function proposal(proposedText: string): Proposal {
  return {
    id: "p1",
    requestId: request.id,
    createdAt: new Date().toISOString(),
    proposedText,
  };
}

describe("ProposalService normalization", () => {
  it("stores normalized proposedText", async () => {
    const raw = "```markdown\n# Title\n```";
    const client = {
      generate: vi.fn().mockResolvedValue({
        proposal: proposal(raw),
        audit: undefined,
      }),
      auditProposal: vi.fn(),
    };
    const svc = new ProposalService(client);
    const bundle = await svc.generate(request);
    expect(bundle.proposal.proposedText).toBe("# Title");
    expect(client.auditProposal).not.toHaveBeenCalled();
  });

  it("re-audits when fence unwrap changes proposedText", async () => {
    const raw = "```markdown\n# Title\n```";
    const normalizedAudit = { proposalId: "p1", categories: [] };
    const client = {
      generate: vi.fn().mockResolvedValue({
        proposal: proposal(raw),
        audit: { proposalId: "p1", categories: ["unresolved"] },
      }),
      auditProposal: vi.fn().mockResolvedValue({
        audit: normalizedAudit,
        engine: "local",
      }),
    };
    const svc = new ProposalService(client);
    const bundle = await svc.generate(request);
    expect(bundle.proposal.proposedText).toBe("# Title");
    expect(client.auditProposal).toHaveBeenCalledWith(request, "p1", "# Title");
    expect(bundle.audit).toBe(normalizedAudit);
  });

  it("normalizes text on auditProposal", async () => {
    const client = {
      generate: vi.fn(),
      auditProposal: vi.fn().mockResolvedValue({ audit: {}, engine: "mock" }),
    };
    const svc = new ProposalService(client);
    await svc.auditProposal(request, "p1", "```md\nbody\n```");
    expect(client.auditProposal).toHaveBeenCalledWith(request, "p1", "body");
  });
});
