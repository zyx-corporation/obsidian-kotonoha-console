import { describe, expect, it } from "vitest";
import { buildGitContext, type GitExec } from "../src/util/gitReadonly";

function mockExec(responses: Record<string, string>): GitExec {
  return async (args, cwd) => {
    const key = `${cwd}::${args.join(" ")}`;
    return responses[key];
  };
}

describe("buildGitContext", () => {
  it("returns undefined-equivalent minimal when not a git repo", async () => {
    const exec = mockExec({});
    const ctx = await buildGitContext("/vault", "notes/a.md", "passive-observing", exec);
    expect(ctx?.root).toBe("/vault");
    expect(ctx?.repoRelativePath).toBe("notes/a.md");
    expect(ctx?.dirty).toBe(false);
    expect(ctx?.branch).toBeUndefined();
  });

  it("passive-observing: branch, commit, dirty from porcelain", async () => {
    const root = "/repo";
    const exec = mockExec({
      [`${root}::rev-parse --show-toplevel`]: root,
      [`${root}::rev-parse --abbrev-ref HEAD`]: "main",
      [`${root}::rev-parse --short HEAD`]: "abc1234",
      [`${root}::status --porcelain -- notes/a.md`]: " M notes/a.md",
      [`${root}::status --porcelain`]: " M notes/a.md",
    });
    const ctx = await buildGitContext(root, "notes/a.md", "passive-observing", exec);
    expect(ctx).toMatchObject({
      root,
      branch: "main",
      commit: "abc1234",
      repoRelativePath: "notes/a.md",
      dirty: true,
    });
  });

  it("external: root and path only", async () => {
    const root = "/repo";
    const exec = mockExec({
      [`${root}::rev-parse --show-toplevel`]: root,
    });
    const ctx = await buildGitContext(root, "notes/a.md", "external", exec);
    expect(ctx).toEqual({
      root,
      repoRelativePath: "notes/a.md",
      dirty: false,
    });
  });

  it("off via caller returns undefined before buildGitContext", async () => {
    const exec = mockExec({});
    const ctx = await buildGitContext("/vault", "a.md", "off", exec);
    expect(ctx).toBeUndefined();
  });
});
