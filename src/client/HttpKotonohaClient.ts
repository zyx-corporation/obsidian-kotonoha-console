import type { GenerateResult, KotonohaClient, AuditProposalResult } from "./KotonohaClient";
import type { GenerationRequest } from "../domain/types";
import { consoleMsg } from "../i18n/consoleI18n";
import { proposalTextFromContextPack } from "../cli/proposalFromContextPack";
import { proposalTextFromLocalContext } from "../cli/proposalFromLocal";
import { performRdeAudit } from "../services/RdeAuditService";
import { rdeAuditReportMarkdown } from "../rde/rdeAuditReport";
import {
  buildSourceReview,
  buildStructuralDiff,
  type StructuralDiffResult,
} from "../rde/StructuralDiffBuilder";
import { HttpClient, HttpClientError } from "./http/httpClient";
import { detectHttpBackend, type HttpBackendKind } from "./http/detectBackend";
import { parseGatewayContextPack } from "./http/gatewayTools";
import {
  orchestratorEvaluateToEmitStdout,
  structuralToMeaningChanges,
  subjectRefForRequest,
} from "./http/orchestratorRde";
import {
  toGenerateResult,
  toHttpGenerateBody,
  type HttpGatewayToolResponse,
  type HttpProposalGenerateResponse,
  type OrchestratorRdeEvaluateResponse,
} from "./http/httpTypes";

export interface HttpKotonohaClientOptions {
  endpoint: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  /** Skip auto-detect; force backend kind. */
  backendKind?: HttpBackendKind;
}

export class HttpKotonohaClient implements KotonohaClient {
  private readonly http: HttpClient;
  private readonly fetchFn: typeof fetch;
  private backendKind?: HttpBackendKind;

  constructor(private readonly options: HttpKotonohaClientOptions) {
    this.http = new HttpClient(options);
    this.fetchFn = options.fetchFn ?? fetch;
    this.backendKind = options.backendKind;
  }

  async generate(request: GenerationRequest): Promise<GenerateResult> {
    const kind = await this.resolveBackendKind();
    switch (kind) {
      case "orchestrator":
        return this.generateOrchestrator(request);
      case "gateway":
        return this.generateGateway(request);
      default:
        return this.generateConsole(request);
    }
  }

  async auditProposal(
    request: GenerationRequest,
    proposalId: string,
    proposalText: string,
  ): Promise<AuditProposalResult> {
    const structural = buildStructuralDiff(
      request.context.sourceText,
      proposalText,
      {
        language: request.language,
        operation: request.operation,
        frontmatter: request.context.frontmatter,
        sourceLinks: request.context.links,
      },
    );
    const kind = await this.resolveBackendKind();
    if (kind === "orchestrator") {
      try {
        const emitStdout = await this.orchestratorEvaluate(request, structural);
        return {
          audit: performRdeAudit(request, proposalId, {
            proposalText,
            cli: { emitStdout },
          }),
          engine: "orchestrator",
        };
      } catch {
        /* fall through to local rule-based audit */
      }
    }
    return {
      audit: performRdeAudit(request, proposalId, { proposalText }),
      engine: "local",
    };
  }

  /** Health probe for settings UI. */
  async pingHealth(): Promise<string> {
    const body = await this.http.getJson<{ status?: string }>("/health");
    return body.status ?? "ok";
  }

  /** Health + auto-detected backend kind (orchestrator / gateway / console). */
  async probe(): Promise<{ health: string; backend: HttpBackendKind }> {
    const health = await this.pingHealth();
    const backend = await this.resolveBackendKind();
    return { health, backend };
  }

  private async resolveBackendKind(): Promise<HttpBackendKind> {
    if (this.backendKind) return this.backendKind;
    this.backendKind = await detectHttpBackend(this.http.baseUrl, this.fetchFn);
    return this.backendKind;
  }

  private async generateConsole(request: GenerationRequest): Promise<GenerateResult> {
    const proposalId = crypto.randomUUID();
    try {
      const body = await this.http.postJson<HttpProposalGenerateResponse>(
        "/v1/proposals/generate",
        toHttpGenerateBody(request),
      );
      const { proposal, audit } = toGenerateResult(request, proposalId, body);
      return await this.withAudit(request, proposalId, proposal, audit);
    } catch (e) {
      if (e instanceof HttpClientError && e.status === 404) {
        throw new HttpClientError(
          consoleMsg(request.language, "httpProposalEndpointMissing"),
          e.status,
          e.detail,
        );
      }
      throw e;
    }
  }

  private async generateOrchestrator(request: GenerationRequest): Promise<GenerateResult> {
    const proposalId = crypto.randomUUID();

    if (request.operation === "rde_audit") {
      const structural = buildSourceReview(request.context.sourceText, request.language);
      const emitStdout = await this.orchestratorEvaluate(request, structural);
      const audit = performRdeAudit(request, proposalId, {
        sourceReview: true,
        cli: { emitStdout },
      });
      const proposedText = rdeAuditReportMarkdown(request, audit);
      return {
        proposal: {
          id: proposalId,
          requestId: request.id,
          createdAt: new Date().toISOString(),
          proposedText,
          summary: consoleMsg(request.language, "httpOrchestratorRdeSummary", {
            path: request.context.filePath,
          }),
          uncertaintyNote: consoleMsg(request.language, "httpUncertaintyOrchestratorRde"),
        },
        audit,
      };
    }

    try {
      return await this.generateConsole(request);
    } catch (e) {
      if (e instanceof HttpClientError && (e.status === 404 || e.detail?.includes("404"))) {
        return this.generateLocalWithNote(
          request,
          proposalId,
          consoleMsg(request.language, "httpUncertaintyOrchestratorNoLlm"),
        );
      }
      throw e;
    }
  }

  private async generateGateway(request: GenerationRequest): Promise<GenerateResult> {
    const proposalId = crypto.randomUUID();

    if (request.operation === "rde_audit") {
      return this.generateLocalWithNote(
        request,
        proposalId,
        consoleMsg(request.language, "httpUncertaintyGatewayRde"),
      );
    }

    const toolRes = await this.http.postJson<HttpGatewayToolResponse>(
      "/v1/tools/kotonoha_context_export",
      { file: request.context.filePath },
    );
    const pack = parseGatewayContextPack(toolRes);
    const proposedText = proposalTextFromContextPack(request, pack);
    const audit = performRdeAudit(request, proposalId, { proposalText: proposedText });
    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary: consoleMsg(request.language, "httpGatewaySummary", {
          operation: request.operation,
          path: request.context.filePath,
        }),
        uncertaintyNote: consoleMsg(request.language, "httpUncertaintyGateway"),
      },
      audit,
    };
  }

  private generateLocalWithNote(
    request: GenerationRequest,
    proposalId: string,
    uncertaintyNote: string,
  ): GenerateResult {
    const proposedTextForDiff =
      request.operation === "rde_audit"
        ? undefined
        : proposalTextFromLocalContext(request);
    const audit = performRdeAudit(request, proposalId, {
      sourceReview: request.operation === "rde_audit",
      proposalText: proposedTextForDiff,
    });
    const proposedText =
      request.operation === "rde_audit"
        ? rdeAuditReportMarkdown(request, audit)
        : proposedTextForDiff!;
    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary:
          request.operation === "rde_audit"
            ? consoleMsg(request.language, "httpOrchestratorRdeSummary", {
                path: request.context.filePath,
              })
            : consoleMsg(request.language, "httpLocalSummary", {
                operation: request.operation,
                path: request.context.filePath,
              }),
        uncertaintyNote,
      },
      audit,
    };
  }

  private async withAudit(
    request: GenerationRequest,
    proposalId: string,
    proposal: GenerateResult["proposal"],
    audit?: GenerateResult["audit"],
  ): Promise<GenerateResult> {
    if (audit) return { proposal, audit };
    if (request.operation === "rde_audit") {
      return {
        proposal,
        audit: performRdeAudit(request, proposalId, { sourceReview: true }),
      };
    }
    const { audit: computed } = await this.auditProposal(
      request,
      proposalId,
      proposal.proposedText,
    );
    return { proposal, audit: computed };
  }

  private async orchestratorEvaluate(
    request: GenerationRequest,
    structural: StructuralDiffResult,
  ): Promise<string> {
    const evaluate = await this.http.postJson<OrchestratorRdeEvaluateResponse>(
      "/v1/rde/evaluate",
      {
        subject_ref: subjectRefForRequest(request),
        meaning_changes: structuralToMeaningChanges(structural),
      },
    );
    return orchestratorEvaluateToEmitStdout(evaluate);
  }
}
