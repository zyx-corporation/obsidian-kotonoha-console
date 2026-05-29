import type { GenerationRequest, RdeAudit } from "../domain/types";
import { normalizeRdeLang, rdeMsg } from "./rdeI18n";

/** Attach non-Git semantic anchors to an RDE audit (git-mode-spec §4.3). */
export function enrichAuditFromSource(
  audit: RdeAudit,
  request: GenerationRequest,
): RdeAudit {
  const lang = normalizeRdeLang(request.language);
  const excerpt =
    request.context.sourceText.slice(0, 200).replace(/\n/g, " ") +
    (request.context.sourceText.length > 200 ? "…" : "");

  const unresolvedElements = [...audit.unresolvedElements];
  if (!request.context.git) {
    unresolvedElements.push(rdeMsg(lang, "nonGitVault"));
  }

  return {
    ...audit,
    preservedElements: [
      `path:${request.context.filePath}`,
      `source_hash:${request.context.sourceHash.slice(0, 16)}…`,
      excerpt,
      ...audit.preservedElements,
    ],
    unresolvedElements,
  };
}
