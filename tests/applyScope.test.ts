import { describe, expect, it } from "vitest";
import {
  describeApplyScope,
  isApplyScopeSupported,
} from "../src/obsidian/applyScope";

describe("describeApplyScope", () => {
  it("uses whole-note scope when no selection exists", () => {
    expect(describeApplyScope({})).toEqual({ kind: "whole_note" });
    expect(describeApplyScope({ selectionText: "   " })).toEqual({
      kind: "whole_note",
    });
  });

  it("uses selection scope with visible character count", () => {
    expect(describeApplyScope({ selectionText: "言の葉" })).toEqual({
      kind: "selection",
      selectedChars: 3,
    });
  });

  it("represents future unsupported partial apply states explicitly", () => {
    const scope = describeApplyScope({
      unsupportedPartialReason: "semantic span mapping unavailable",
    });
    expect(scope).toEqual({
      kind: "unsupported_partial",
      reason: "semantic span mapping unavailable",
    });
    expect(isApplyScopeSupported(scope)).toBe(false);
  });
});
