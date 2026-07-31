export type ApplyScope =
  | { kind: "whole_note" }
  | { kind: "selection"; selectedChars: number }
  | { kind: "unsupported_partial"; reason: string };

export function describeApplyScope(input: {
  selectionText?: string;
  unsupportedPartialReason?: string;
}): ApplyScope {
  const unsupported = input.unsupportedPartialReason?.trim();
  if (unsupported) {
    return { kind: "unsupported_partial", reason: unsupported };
  }

  const selection = input.selectionText?.trim();
  if (selection) {
    return { kind: "selection", selectedChars: Array.from(selection).length };
  }

  return { kind: "whole_note" };
}

export function isApplyScopeSupported(
  scope: ApplyScope,
): scope is Exclude<ApplyScope, { kind: "unsupported_partial" }> {
  return scope.kind !== "unsupported_partial";
}
