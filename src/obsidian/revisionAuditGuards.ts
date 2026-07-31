/** Whether the edited proposal has diverged from the last audited proposal text. */
export function isRevisionAuditStale(
  reviseMode: boolean,
  currentProposalText: string,
  auditedProposalText: string | null,
  auditPresent: boolean,
): boolean {
  if (!reviseMode || !auditPresent || auditedProposalText === null) {
    return false;
  }
  return currentProposalText.trim() !== auditedProposalText.trim();
}
