import type { GenerateResult, KotonohaClient } from "./KotonohaClient";
import type { GenerationRequest, GitMode } from "../domain/types";
import {
  cliErrorMessage,
  runKotonoha,
  type KotonohaRunner,
  type RunKotonohaOptions,
} from "../cli/runKotonoha";
import {
  parseContextPack,
  proposalTextFromContextPack,
} from "../cli/proposalFromContextPack";
import { proposalTextFromLocalContext } from "../cli/proposalFromLocal";
import { performRdeAudit } from "../services/RdeAuditService";
import { rdeAuditReportMarkdown } from "../rde/rdeAuditReport";

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

    if (this.mayUseContextExport()) {
      try {
        return await this.generateWithContextExport(request, proposalId);
      } catch (e) {
        const fallback = this.generateLocal(request, proposalId);
        fallback.proposal.uncertaintyNote = [
          "Git-aware context export failed; using path + source_hash anchors.",
          e instanceof Error ? e.message : String(e),
        ].join(" ");
        return fallback;
      }
    }

    return this.generateLocal(request, proposalId);
  }

  /** git-mode-spec §10: non-Git mode must not require Git-aware CLI. */
  private mayUseContextExport(): boolean {
    return this.options.gitMode !== "off";
  }

  private async generateRdeAudit(
    request: GenerationRequest,
    proposalId: string,
  ): Promise<GenerateResult> {
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

    const audit = performRdeAudit(request, proposalId, {
      cli: { emitStdout: emitResult.stdout },
    });
    const proposedText = rdeAuditReportMarkdown(request, audit);

    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary: `[cli] RDE audit · ${request.context.filePath}`,
        uncertaintyNote:
          "RDE audit uses `rde emit` + `rde validate` only (no Git). Attach via DB workflow when DATABASE_URL is configured.",
      },
      audit,
    };
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

    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary: `[cli] context export · ${request.operation} · ${relFile}`,
        uncertaintyNote:
          "Generative rewrite requires an orchestrator/LLM; proposal embeds `kotonoha context export`.",
      },
    };
  }

  private generateLocal(
    request: GenerationRequest,
    proposalId: string,
  ): GenerateResult {
    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText: proposalTextFromLocalContext(request),
        summary: `[cli-local] ${request.operation} · ${request.context.filePath}`,
        uncertaintyNote:
          this.options.gitMode === "off"
            ? "gitMode is off — Git-aware CLI not used (git-mode-spec §4)."
            : "Local anchors only (path + source_hash).",
      },
    };
  }

  private async assertCliAvailable(): Promise<void> {
    const result = await this.run({ args: ["version"] });
    if (result.exitCode !== 0) {
      throw new Error(
        `kotonoha not available (${this.options.bin}): ${cliErrorMessage(result)}`,
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
