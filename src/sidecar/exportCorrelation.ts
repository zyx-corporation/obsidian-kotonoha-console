import type { GenerationRequest, Proposal } from "../domain/types";

export const SIDECAR_EXPORT_CORRELATION_FORMAT =
  "kotonoha.obsidian.export_correlation.v0.1";
export const M6_PROJECT_AUDIT_EXPORT_FORMAT =
  "kotonoha.m6_project_audit_export.v0.1";

export interface SidecarExportCorrelation {
  format: typeof SIDECAR_EXPORT_CORRELATION_FORMAT;
  canonical: false;
  status: "available" | "missing";
  missingReason?: string;
  local: {
    proposalId: string;
    requestId: string;
    filePath: string;
    sourceHash: string;
    proposalHash?: string;
    gitCommit?: string;
    projectId?: string;
  };
  m6: {
    expectedFormat: typeof M6_PROJECT_AUDIT_EXPORT_FORMAT;
    projectId?: string;
    gitCommit?: string;
    filePath: string;
  };
  note: string;
}

export interface M6ExportLike {
  format?: string;
  project_id?: string;
  exports?: Array<{
    meaning_delta?: {
      id?: string;
      git_commit?: string;
      file_path?: string;
    };
    rde_assessments?: Array<{
      audit_correlation_id?: string;
    }>;
  }>;
}

export interface ExportCorrelationCheck {
  status: "correlated" | "missing" | "mismatched";
  message: string;
  meaningDeltaId?: string;
  auditCorrelationIds?: string[];
}

export function buildSidecarExportCorrelation(input: {
  request: GenerationRequest;
  proposal: Proposal;
  proposalHash?: string;
  projectId?: string;
}): SidecarExportCorrelation {
  const projectId = clean(input.projectId);
  const gitCommit = clean(input.request.context.git?.commit);
  const missing = missingCorrelationReason(projectId, gitCommit);

  return {
    format: SIDECAR_EXPORT_CORRELATION_FORMAT,
    canonical: false,
    status: missing ? "missing" : "available",
    ...(missing ? { missingReason: missing } : {}),
    local: {
      proposalId: input.proposal.id,
      requestId: input.request.id,
      filePath: input.request.context.filePath,
      sourceHash: input.request.context.sourceHash,
      ...(input.proposalHash ? { proposalHash: input.proposalHash } : {}),
      ...(gitCommit ? { gitCommit } : {}),
      ...(projectId ? { projectId } : {}),
    },
    m6: {
      expectedFormat: M6_PROJECT_AUDIT_EXPORT_FORMAT,
      ...(projectId ? { projectId } : {}),
      ...(gitCommit ? { gitCommit } : {}),
      filePath: input.request.context.filePath,
    },
    note:
      "Read-only correlation hint. Obsidian sidecars are local evidence records, not canonical SLS storage.",
  };
}

export function checkM6ExportCorrelation(
  correlation: SidecarExportCorrelation,
  m6: M6ExportLike | undefined,
): ExportCorrelationCheck {
  if (!m6) {
    return { status: "missing", message: "No M6 export provided." };
  }
  if (m6.format !== M6_PROJECT_AUDIT_EXPORT_FORMAT) {
    return {
      status: "mismatched",
      message: `Unexpected M6 export format: ${m6.format ?? "(missing)"}.`,
    };
  }
  if (correlation.local.projectId && m6.project_id !== correlation.local.projectId) {
    return {
      status: "mismatched",
      message: "M6 project_id does not match sidecar projectId.",
    };
  }

  const exports = m6.exports ?? [];
  if (exports.length === 0) {
    return { status: "missing", message: "M6 export contains no exports." };
  }

  const match = exports.find((item) => {
    const delta = item.meaning_delta;
    if (!delta) return false;
    const commitOk =
      !correlation.local.gitCommit ||
      delta.git_commit === correlation.local.gitCommit;
    const fileOk = delta.file_path === correlation.local.filePath;
    return commitOk && fileOk;
  });

  if (!match?.meaning_delta) {
    return {
      status: "mismatched",
      message: "No M6 meaning_delta matched sidecar gitCommit/filePath.",
    };
  }

  const auditCorrelationIds = (match.rde_assessments ?? [])
    .map((a) => a.audit_correlation_id)
    .filter((id): id is string => Boolean(id));

  return {
    status: "correlated",
    message: "Sidecar correlation matches an M6 meaning_delta export.",
    meaningDeltaId: match.meaning_delta.id,
    ...(auditCorrelationIds.length ? { auditCorrelationIds } : {}),
  };
}

function missingCorrelationReason(
  projectId: string | undefined,
  gitCommit: string | undefined,
): string | undefined {
  if (!projectId && !gitCommit) return "projectId and gitCommit unavailable";
  if (!projectId) return "projectId unset";
  if (!gitCommit) return "gitCommit unavailable";
  return undefined;
}

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}
