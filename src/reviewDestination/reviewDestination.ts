import type { ConsoleMsgKey } from "../i18n/consoleI18n";

export type ReviewDestinationKind =
  | "local_only"
  | "existing_issue"
  | "issue_draft"
  | "existing_pr"
  | "pr_summary"
  | "commit_annotation_future";

export type ReviewDestinationAvailability = "available" | "planned";

export type ReviewDestinationExternalSurface =
  | "none"
  | "github_issue"
  | "github_pr"
  | "git_commit";

export interface ReviewDestinationOption {
  kind: ReviewDestinationKind;
  availability: ReviewDestinationAvailability;
  externalSurface: ReviewDestinationExternalSurface;
  boundaryMessageKey: ConsoleMsgKey;
  /**
   * The Kotonoha-owned record stays local in v0.5. External destinations are
   * publication/correlation handoffs, not semantic authority.
   */
  canonicalRecord: "local_sidecar";
}

export const DEFAULT_REVIEW_DESTINATION: ReviewDestinationKind = "local_only";

export const REVIEW_DESTINATION_OPTIONS: readonly ReviewDestinationOption[] = [
  {
    kind: "local_only",
    availability: "available",
    externalSurface: "none",
    boundaryMessageKey: "reviewDestinationLocalOnly",
    canonicalRecord: "local_sidecar",
  },
  {
    kind: "existing_issue",
    availability: "planned",
    externalSurface: "github_issue",
    boundaryMessageKey: "reviewDestinationLocalOnly",
    canonicalRecord: "local_sidecar",
  },
  {
    kind: "issue_draft",
    availability: "planned",
    externalSurface: "github_issue",
    boundaryMessageKey: "reviewDestinationLocalOnly",
    canonicalRecord: "local_sidecar",
  },
  {
    kind: "existing_pr",
    availability: "planned",
    externalSurface: "github_pr",
    boundaryMessageKey: "reviewDestinationLocalOnly",
    canonicalRecord: "local_sidecar",
  },
  {
    kind: "pr_summary",
    availability: "planned",
    externalSurface: "github_pr",
    boundaryMessageKey: "reviewDestinationLocalOnly",
    canonicalRecord: "local_sidecar",
  },
  {
    kind: "commit_annotation_future",
    availability: "planned",
    externalSurface: "git_commit",
    boundaryMessageKey: "reviewDestinationLocalOnly",
    canonicalRecord: "local_sidecar",
  },
] as const;

export function getReviewDestination(
  kind: ReviewDestinationKind = DEFAULT_REVIEW_DESTINATION,
): ReviewDestinationOption {
  return REVIEW_DESTINATION_OPTIONS.find((option) => option.kind === kind)
    ?? REVIEW_DESTINATION_OPTIONS[0];
}

export function availableReviewDestinations(): ReviewDestinationOption[] {
  return REVIEW_DESTINATION_OPTIONS.filter(
    (option) => option.availability === "available",
  );
}

export function plannedReviewDestinations(): ReviewDestinationOption[] {
  return REVIEW_DESTINATION_OPTIONS.filter(
    (option) => option.availability === "planned",
  );
}
