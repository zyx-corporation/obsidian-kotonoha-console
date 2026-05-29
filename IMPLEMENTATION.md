# Implementation status

Aligned with [`docs/architecture.ja.md`](docs/architecture.ja.md) phases.

| Phase | Status | Notes |
| --- | --- | --- |
| 0 Plugin skeleton | **done** | `main.ts`, settings, commands, side panel |
| 1 Note I/O | **partial** | active note, selection via editor on apply, frontmatter/tags |
| 2 Kotonoha client | **partial** | `CliKotonohaClient`: RDE audit without Git (`rde emit`/`validate`); `context export` only if `gitMode ≠ off` |
| 3 Proposal mode | **done** | generate, copy, reject, confirm apply |
| 4 RDE audit | **done** | structural diff + CLI `rde emit`/`validate`; `.kotonoha/audit/` sidecar |
| 5 Approval workflow | **partial** | audit log to `.kotonoha/audit/` |

## Develop

```bash
npm ci
npm run dev          # watch → main.js
npm run typecheck
npm test
```

Link into a vault: copy or symlink this folder to `Vault/.obsidian/plugins/kotonoha-console/` (needs `main.js`, `manifest.json`, `styles.css`).

## Next

- `HttpKotonohaClient` · orchestrator LLM for generative rewrite
- Git passive mode via read-only subprocess
- Git passive mode via read-only `git` subprocess
- Proposal sidecar under `.kotonoha/proposals/`
