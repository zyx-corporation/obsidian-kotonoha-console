import type { GenerateResult, KotonohaClient } from "./KotonohaClient";
import type { GenerationRequest } from "../domain/types";
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
import { rdeAuditFromEmit } from "../rde/parseRdeEmit";

export interface CliKotonohaClientOptions {
  bin: string;
  /** Vault root / Git repo root for `--path`. */
  cwd: string;
  env?: Record<string, string>;
  runner?: KotonohaRunner;
  /** Writes observation JSON under vault; returns repo-relative path for `--observation`. */
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
    const relFile = request.context.filePath;
    const args = ["context", "export", relFile, "--path", this.options.cwd];

    const obsPath = await this.maybeObservationPath(request);
    if (obsPath) {
      args.push("--observation", obsPath);
    }

    const packResult = await this.run({ args });
    if (packResult.exitCode !== 0) {
      throw new Error(cliErrorMessage(packResult));
    }

    const pack = parseContextPack(packResult.stdout);
    const proposedText = proposalTextFromContextPack(request, pack);

    let audit: GenerateResult["audit"];
    if (request.operation === "rde_audit") {
      const rdeResult = await this.run({ args: ["rde", "emit"] });
      if (rdeResult.exitCode === 0) {
        audit = rdeAuditFromEmit(rdeResult.stdout, proposalId);
      }
    } else {
      const hints = pack.meaning_delta_draft?.observation;
      if (hints && typeof hints === "object") {
        audit = {
          proposalId,
          createdAt: new Date().toISOString(),
          categories: ["preserved"],
          preservedElements: [JSON.stringify(hints).slice(0, 120)],
          transformedElements: [`cli context export · ${request.operation}`],
          inferredExtensions: [],
          unresolvedElements: [],
          driftRisks: [],
          recommendedDecision: "human_review",
          confidence: 0.6,
        };
      }
    }

    return {
      proposal: {
        id: proposalId,
        requestId: request.id,
        createdAt: new Date().toISOString(),
        proposedText,
        summary: `[cli] context export · ${request.operation} · ${relFile}`,
        uncertaintyNote:
          "Generative rewrite requires an orchestrator/LLM; this proposal embeds `kotonoha context export` output.",
      },
      audit,
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
