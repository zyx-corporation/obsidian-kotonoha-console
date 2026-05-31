/**
 * Minimal sidecar validation (#41).
 * Compatibility-first: unknown fields tolerated; engine metadata optional.
 * Normative source: kotonoha-spec — these records are local/plugin evidence only.
 */

export interface SidecarValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const REVIEW_STATUSES = new Set([
  "approved",
  "rejected",
  "partially_applied",
  "hold",
  "pending",
]);

const RDE_DECISIONS = new Set([
  "approve",
  "revise",
  "reject",
  "human_review",
]);

const AUDIT_ENGINES = new Set([
  "orchestrator",
  "local",
  "mock",
  "cli",
  "gateway",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function pushTypeError(errors: string[], field: string, expected: string, actual: unknown): void {
  errors.push(`${field}: expected ${expected}, got ${typeof actual}`);
}

/** Log validation issues without blocking writes (v0.3 policy). */
export function logSidecarValidation(
  kind: "proposal" | "audit" | "review",
  path: string,
  result: SidecarValidationResult,
): void {
  for (const error of result.errors) {
    console.warn(`[kotonoha-console] ${kind} sidecar validation error (${path}): ${error}`);
  }
  for (const warning of result.warnings) {
    console.warn(`[kotonoha-console] ${kind} sidecar validation warning (${path}): ${warning}`);
  }
}

export function validateProposalSidecar(value: unknown): SidecarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["root: expected object"], warnings };
  }

  for (const field of [
    "proposalId",
    "requestId",
    "createdAt",
    "operation",
    "filePath",
    "sourceHash",
    "proposalHash",
  ] as const) {
    if (!isNonEmptyString(value[field])) {
      errors.push(`${field}: required non-empty string`);
    }
  }

  if (value.decision !== undefined && !isRecord(value.decision)) {
    pushTypeError(errors, "decision", "object", value.decision);
  } else if (isRecord(value.decision) && value.decision.status !== undefined) {
    if (!REVIEW_STATUSES.has(String(value.decision.status))) {
      errors.push(`decision.status: unknown value "${String(value.decision.status)}"`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateRdeAuditPayload(value: unknown, prefix = "rde"): SidecarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: [`${prefix}: expected object`], warnings };
  }

  if (!isNonEmptyString(value.proposalId)) {
    errors.push(`${prefix}.proposalId: required non-empty string`);
  }
  if (!isNonEmptyString(value.createdAt)) {
    errors.push(`${prefix}.createdAt: required non-empty string`);
  }
  if (!Array.isArray(value.categories)) {
    pushTypeError(errors, `${prefix}.categories`, "array", value.categories);
  }
  for (const field of [
    "preservedElements",
    "transformedElements",
    "inferredExtensions",
    "unresolvedElements",
    "driftRisks",
  ] as const) {
    if (!isStringArray(value[field])) {
      pushTypeError(errors, `${prefix}.${field}`, "string[]", value[field]);
    }
  }
  if (!isNonEmptyString(value.recommendedDecision)) {
    errors.push(`${prefix}.recommendedDecision: required non-empty string`);
  } else if (!RDE_DECISIONS.has(value.recommendedDecision)) {
    errors.push(`${prefix}.recommendedDecision: unknown value "${value.recommendedDecision}"`);
  }
  if (typeof value.confidence !== "number" || Number.isNaN(value.confidence)) {
    pushTypeError(errors, `${prefix}.confidence`, "number", value.confidence);
  }

  if (value.engine !== undefined && !AUDIT_ENGINES.has(String(value.engine))) {
    errors.push(`${prefix}.engine: unknown value "${String(value.engine)}"`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateAuditSidecar(value: unknown): SidecarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["root: expected object"], warnings };
  }

  for (const field of ["proposalId", "filePath", "sourceHash", "createdAt"] as const) {
    if (!isNonEmptyString(value[field])) {
      errors.push(`${field}: required non-empty string`);
    }
  }

  const rdeResult = validateRdeAuditPayload(value.rde, "rde");
  errors.push(...rdeResult.errors);
  warnings.push(...rdeResult.warnings);

  if (value.engine !== undefined && !AUDIT_ENGINES.has(String(value.engine))) {
    errors.push(`engine: unknown value "${String(value.engine)}"`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateReviewSidecar(value: unknown): SidecarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["root: expected object"], warnings };
  }

  if (!isNonEmptyString(value.proposalId)) {
    errors.push("proposalId: required non-empty string");
  }

  if (!isRecord(value.decision)) {
    errors.push("decision: required object");
  } else {
    if (!isNonEmptyString(value.decision.status)) {
      errors.push("decision.status: required non-empty string");
    } else if (!REVIEW_STATUSES.has(String(value.decision.status))) {
      errors.push(`decision.status: unknown value "${String(value.decision.status)}"`);
    }
    if (!isNonEmptyString(value.decision.decidedAt)) {
      errors.push("decision.decidedAt: required non-empty string");
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** Merge multiple validation results (e.g. envelope + nested payload). */
export function mergeSidecarValidation(
  ...results: SidecarValidationResult[]
): SidecarValidationResult {
  const errors = results.flatMap((r) => r.errors);
  const warnings = results.flatMap((r) => r.warnings);
  return { ok: errors.length === 0, errors, warnings };
}
