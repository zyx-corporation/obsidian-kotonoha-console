import type { RdeAudit } from "../domain/types";

/** rde-audit-policy.ja.md §16 */
export const RDE_AUDIT_UNAVAILABLE =
  "RDE audit is not available for this proposal. Review carefully before applying.";

export const RDE_AUDIT_LOW_CONFIDENCE =
  "RDE audit confidence is low. Human review is required.";

export const LOW_CONFIDENCE_THRESHOLD = 0.55;

export function shouldShowLowConfidenceWarning(audit: RdeAudit): boolean {
  return (
    audit.confidence < LOW_CONFIDENCE_THRESHOLD ||
    audit.recommendedDecision === "human_review"
  );
}
