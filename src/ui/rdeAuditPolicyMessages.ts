import type { RdeAudit } from "../domain/types";
import { type RdeLang, rdeMsg } from "../rde/rdeI18n";

export const LOW_CONFIDENCE_THRESHOLD = 0.55;

export function rdeAuditUnavailableMessage(lang?: RdeLang): string {
  return rdeMsg(lang, "auditUnavailable");
}

export function rdeAuditLowConfidenceMessage(lang?: RdeLang): string {
  return rdeMsg(lang, "auditLowConfidence");
}

export function shouldShowLowConfidenceWarning(audit: RdeAudit): boolean {
  return (
    audit.confidence < LOW_CONFIDENCE_THRESHOLD ||
    audit.recommendedDecision === "human_review"
  );
}
