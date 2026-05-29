# Implementation status

Aligned with [`docs/architecture.ja.md`](docs/architecture.ja.md) phases.

| Phase | Status | Notes |
| --- | --- | --- |
| 0 Plugin skeleton | **done** | `main.ts`, settings, commands, side panel |
| 1 Note I/O | **partial** | active note, selection via editor on apply, frontmatter/tags |
| 2 Kotonoha client | **partial** | `CliKotonohaClient`: RDE audit without Git; `context export` only if `gitMode ≠ off` |
| 3 Proposal mode | **done** | generate, copy, reject, confirm apply |
| 4 RDE audit | **done** | source review + structural diff + CLI `rde emit`/`validate`; sidecar |
| 5 Approval workflow | **partial** | audit log + `.kotonoha/reviews/` on approve/reject |

## Sidecar layout (git-mode-spec §9.1)

```text
.kotonoha/
├─ proposals/{id}.proposal.json
├─ audit/{id}.rde-audit.json
└─ reviews/{id}.review.json   ← approve / reject 時
```

## RDE MVP guardrails (rde-audit-policy §14)

Rule-based checks in `StructuralDiffBuilder`: hedging, frontmatter, links, rewrite length, URL/date introduction, approval-language removal, final-decision tone. **Not** a full RDE engine — UI labels confidence as informative.

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
- Revise action in UI (architecture §15)
- `.kotonoha/reviews/` hold / partial apply semantics
