# Implementation status

Aligned with [`docs/architecture.ja.md`](docs/architecture.ja.md) phases.

| Phase | Status | Notes |
| --- | --- | --- |
| 0 Plugin skeleton | **done** | `main.ts`, settings, commands, side panel |
| 1 Note I/O | **partial** | active note, selection via editor on apply, frontmatter/tags |
| 2 Kotonoha client | **partial** | `CliKotonohaClient`: RDE audit without Git; `context export` only if `gitMode ≠ off` |
| 3 Proposal mode | **done** | generate, copy, reject, revise, confirm apply |
| 4 RDE audit | **done** | source review + structural diff + CLI `rde emit`/`validate`; sidecar |
| 5 Approval workflow | **done** | audit log + `.kotonoha/reviews/` (approve/reject/hold/partial) |

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

### Obsidian manual acceptance (RDE 監査)

```bash
npm run build
npm run link:dev-vault    # creates dev-vault/ + plugin symlink
open -a Obsidian dev-vault
```

1. **Settings → Community plugins** → enable **Kotonoha Console**
2. **Settings → Kotonoha Console** → Backend: `mock`, **sidecarMode**: on
3. Open `notes/rde-sample.md`
4. Command palette → **RDE 監査を実施（アクティブノート）** (or Console panel → **RDE 監査を実施**)
5. Confirm: RDE audit panel shows `unresolved` (hedging), report is **not** Apply-able
6. Click **記録を閉じる** → check `dev-vault/.kotonoha/audit/*.rde-audit.json`

Headless pre-check: `npm run demo:rde-audit`

## Next

- `HttpKotonohaClient` · orchestrator LLM for generative rewrite
- Git passive mode via read-only subprocess
- Obsidian manual acceptance checklist
