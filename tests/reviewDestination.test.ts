import { describe, expect, it } from "vitest";
import {
  availableReviewDestinations,
  DEFAULT_REVIEW_DESTINATION,
  getReviewDestination,
  plannedReviewDestinations,
  REVIEW_DESTINATION_OPTIONS,
} from "../src/reviewDestination/reviewDestination";

describe("reviewDestination", () => {
  it("defaults to local-only as the only available v0.5 destination", () => {
    expect(DEFAULT_REVIEW_DESTINATION).toBe("local_only");
    expect(availableReviewDestinations()).toEqual([
      {
        kind: "local_only",
        availability: "available",
        externalSurface: "none",
        boundaryMessageKey: "reviewDestinationLocalOnly",
        canonicalRecord: "local_sidecar",
      },
    ]);
  });

  it("keeps GitHub and commit surfaces planned handoffs, not canonical records", () => {
    expect(plannedReviewDestinations().map((option) => option.kind)).toEqual([
      "existing_issue",
      "issue_draft",
      "existing_pr",
      "pr_summary",
      "commit_annotation_future",
    ]);
    expect(
      REVIEW_DESTINATION_OPTIONS.every(
        (option) => option.canonicalRecord === "local_sidecar",
      ),
    ).toBe(true);
  });

  it("resolves unknown/default lookup to the local-only destination", () => {
    expect(getReviewDestination().kind).toBe("local_only");
  });
});
