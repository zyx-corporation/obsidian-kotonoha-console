import type { GenerateResult, KotonohaClient, AuditProposalResult } from "./KotonohaClient";
import type { GenerationRequest, GitMode } from "../domain/types";
import {
  cliErrorMessage,
  runKotonoha,
  type KotonohaRunner,
  type RunKotonohaOptions,
} from "../cli/runKotonoha";
import {
  checkKotonohaCliVersion,
  KOTONOHA_CLI_MIN_VERSION,
} from "../cli/kotonohaVersion";
import {
  parseContextPack,
  proposalTextFromContextPack,
} from "../cli/proposalFromContextPack";
import { proposalTextFromLocalContext } from "../cli/proposalFromLocal";
import { consoleMsg } from "../i18n/consoleI18n";
import { performRdeAudit } from "../services/RdeAuditService";
import { rdeAuditReportMarkdown } from "../rde/rdeAuditReport";
import { attachAuditEngine } from "../rde/auditEngine";

export interface CliKotonohaClientOptions {
  bin: string;
  /** Vault root for `--path` when Git-aware CLI is allowed. */
  cwd: string;
  /** When `off`, Git-aware commands (`context export`) are never called. */
  gitMode: GitMode;
  env?: Record<string, string>;
  runner?: KotonohaRunner;
  writeObservation?: (payload: Record<string, unknown>) => Promise<string | undefined>;
}

export class CliKotonohaClient implements KotonohaClient {
  private readonly runner: KotonohaRunner;

  constructor(private readonly options: CliKotonohaClientOptions) {
    this.runner = options.runner ?? runKotonoha;
  }

  async generate(request: GenerationRequest): Promise<GenerateResult> {
    await this.assertCliAvailable();
    const proposalId = crypto.randomUUID();

    if (request.operation === "rde_audit") {
      return this.generateRdeAudit(request, proposalId);
    }

    if (this.mayUseContextExport(request)) {
      try {
        return await this.generateWithContextExport(request, proposalId);
      } catch (e) {
        const fallback = this.generateLocal(request, proposalId);
        fallback.proposal.uncertaintyNote = [
          fallback.proposal.uncertaintyNote,
          consoleMsg(request.language, "cliUncertaintyExportFailed"),
          e instanceof Error ? e.message : String(e),
        ].join(" ");
        return fallback;
      }
    }

    return this.generateLocal(request, proposalId);
  }

  async auditProposal(
    request: GenerationRequest,
    proposalId: string,
    proposalText: string,
  ): Promise<AuditProposalResult> {
    await this.assertCliAvailable();
    const emitStdout = await this.runRdeEmitValidate();
    const audit = attachAuditEngine(
      performRdeAudit(request, proposalId, {
        proposalText,
        cli: { emitStdout },
      }),
      "cli",
    );
    return { audit, engine: "cli" };
  }

  /** git-mode-spec §10: non-Git mode must not require Git-aware CLI. */
  private mayUseContextExport(request: GenerationRequest): boolean {
    return this.options.gitMode !== "off" && Boolean(request.context.git?.commit);
  }

  private async generateRdeAudit(
    request: GenerationRequest,
    proposalId: string,
  ): Promise<GenerateResult> {
    const emitStdout = await this.runRdeEmitValidate();
    const audit = attachAuditEngine(
      performRdeAudit(request, proposalId, {
        cli: { emitStdout },
        sourceReview: true,
      }),
      "cli",
    );
    const proposedText = rdeAuditReportMarkdown(request, audit);

    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary: consoleMsg(request.language, "cliRdeSummary", {
          path: request.context.filePath,
        }),
        uncertaintyNote: consoleMsg(request.language, "cliUncertaintyRdeAudit"),
      },
      audit,
    };
  }

  private async runRdeEmitValidate(): Promise<string> {
    const emitResult = await this.run({ args: ["rde", "emit"] });
    if (emitResult.exitCode !== 0) {
      throw new Error(cliErrorMessage(emitResult));
    }

    const validateResult = await this.run({
      args: ["rde", "validate", "--strict"],
      stdin: emitResult.stdout,
    });
    if (validateResult.exitCode !== 0) {
      throw new Error(cliErrorMessage(validateResult));
    }

    return emitResult.stdout;
  }

  private async generateWithContextExport(
    request: GenerationRequest,
    proposalId: string,
  ): Promise<GenerateResult> {
    const relFile = request.context.filePath;
    const args = ["context", "export", relFile, "--path", this.options.cwd];
    const obsPath = await this.maybeObservationPath(request);
    if (obsPath) args.push("--observation", obsPath);

    const packResult = await this.run({ args });
    if (packResult.exitCode !== 0) {
      throw new Error(cliErrorMessage(packResult));
    }

    const pack = parseContextPack(packResult.stdout);
    const proposedText = proposalTextFromContextPack(request, pack);

    return this.withLocalAudit(request, proposalId, proposedText, {
      summary: `[cli] context export · ${request.operation} · ${relFile}`,
      uncertaintyNote: consoleMsg(request.language, "cliUncertaintyContextExport"),
    });
  }

  private generateLocal(
    request: GenerationRequest,
    proposalId: string,
  ): GenerateResult {
    const proposedText = proposalTextFromLocalContext(request);
    return this.withLocalAudit(request, proposalId, proposedText, {
      summary: `[cli-local] ${request.operation} · ${request.context.filePath}`,
      uncertaintyNote:
        this.options.gitMode === "off"
          ? consoleMsg(request.language, "cliUncertaintyGitOff")
          : consoleMsg(request.language, "cliUncertaintyLocalOnly"),
    });
  }

  private withLocalAudit(
    request: GenerationRequest,
    proposalId: string,
    proposedText: string,
    meta: { summary: string; uncertaintyNote: string },
  ): GenerateResult {
    const audit = attachAuditEngine(
      performRdeAudit(request, proposalId, { proposalText: proposedText }),
      "local",
    );
    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary: meta.summary,
        uncertaintyNote: meta.uncertaintyNote,
      },
      audit,
    };
  }

  private async assertCliAvailable(): Promise<void> {
    const result = await this.run({ args: ["version"] });
    const check = checkKotonohaCliVersion(result);
    if (check.ok) return;
    const prefix = `kotonoha (${this.options.bin}, cwd=${this.options.cwd})`;
    switch (check.reason) {
      case "exit_error":
        throw new Error(`${prefix}: CLI exited with non-zero status — ${check.detail}`);
      case "unparseable":
        throw new Error(
          `${prefix}: could not parse version from stdout — ${check.detail}`,
        );
      case "too_old":
        throw new Error(
          `${prefix}: CLI version too old — ${check.detail} (need >= ${KOTONOHA_CLI_MIN_VERSION})`,
        );
    }
  }

  private async maybeObservationPath(
    request: GenerationRequest,
  ): Promise<string | undefined> {
    if (!this.options.writeObservation) return undefined;
    const hasInstruction = request.instruction.trim().length > 0;
    if (!hasInstruction && request.operation === "custom") return undefined;
    return this.options.writeObservation({
      operation: request.operation,
      instruction: request.instruction,
      source_hash: request.context.sourceHash,
    });
  }

  private run(
    partial: Pick<RunKotonohaOptions, "args" | "stdin">,
  ): Promise<Awaited<ReturnType<KotonohaRunner>>> {
    return this.runner({
      bin: this.options.bin,
      cwd: this.options.cwd,
      env: this.options.env,
      args: partial.args,
      stdin: partial.stdin,
    });
  }
}
