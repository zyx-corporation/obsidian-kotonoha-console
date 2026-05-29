import { spawn } from "child_process";

export interface RunKotonohaOptions {
  bin: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  stdin?: string;
}

export interface RunKotonohaResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type KotonohaRunner = (options: RunKotonohaOptions) => Promise<RunKotonohaResult>;

/** Spawn `kotonoha` CLI (desktop Node/Electron). */
export function runKotonoha(options: RunKotonohaOptions): Promise<RunKotonohaResult> {
  const useStdin = options.stdin !== undefined;

  return new Promise((resolve, reject) => {
    const child = spawn(options.bin, options.args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: useStdin ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    if (useStdin && child.stdin) {
      child.stdin.write(options.stdin);
      child.stdin.end();
    }

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code, signal) => {
      if (signal) {
        reject(new Error(`kotonoha terminated by signal ${signal}`));
        return;
      }
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
  });
}

export function cliErrorMessage(result: RunKotonohaResult): string {
  const err = result.stderr.trim();
  if (err) return err;
  switch (result.exitCode) {
    case 1:
      return "CLI usage or environment error (exit 1)";
    case 2:
      return "CLI validation or capability deny (exit 2)";
    case 3:
      return "CLI database or I/O error (exit 3)";
    default:
      return `kotonoha exited with code ${result.exitCode}`;
  }
}
