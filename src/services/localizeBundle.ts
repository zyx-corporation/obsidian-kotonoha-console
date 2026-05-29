import type { GenerationRequest, OperationType } from "../domain/types";
import type { ProposalBundle } from "./ProposalService";
import type { RdeLang } from "../rde/rdeI18n";
import { rdeAuditReportMarkdown } from "../rde/rdeAuditReport";
import { performRdeAudit } from "./RdeAuditService";

/** Re-run rule-based audit + UI strings for the current display language. */
export function localizeBundleForDisplay(
  bundle: ProposalBundle,
  request: GenerationRequest,
  operation: OperationType,
  lang: RdeLang,
): ProposalBundle {
  const localizedRequest: GenerationRequest = { ...request, language: lang };
  const proposalId = bundle.proposal.id;

  if (operation === "rde_audit") {
    const audit = performRdeAudit(localizedRequest, proposalId, { sourceReview: true });
    return {
      proposal: {
        ...bundle.proposal,
        proposedText: rdeAuditReportMarkdown(localizedRequest, audit),
      },
      audit,
    };
  }

  const proposalText = bundle.proposal.proposedText;
  const audit = performRdeAudit(localizedRequest, proposalId, { proposalText });
  return {
    proposal: {
      ...bundle.proposal,
    },
    audit,
  };
}
