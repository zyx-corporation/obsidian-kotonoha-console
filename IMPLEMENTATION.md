# Implementation status

Aligned with [`docs/architecture.ja.md`](docs/architecture.ja.md) phases.

| Phase | Status | Notes |
| --- | --- | --- |
| 0 Plugin skeleton | **done** | `main.ts`, settings, commands, side panel |
| 1 Note I/O | **partial** | active note, selection via editor on apply, frontmatter/tags |
| 2 Kotonoha client | **partial** | `CliKotonohaClient`, **`HttpKotonohaClient`** (orchestrator/gateway/console); see [`docs/http-client-contract.md`](docs/http-client-contract.md) |
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

**i18n:** `defaultLanguage` / `request.language` (`ja` default) localizes Console UI, settings, command palette, guardrail messages, audit report markdown, and RDE audit panel. Supported: `ja`, `en`, `zh_CN`. Category enums in JSON remain English; Orchestrator responses can override when implemented.

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
npm run link:dev-vault    # copies main.js into dev-vault/.obsidian/plugins/
open -a Obsidian dev-vault
```

**プラグインが見えない場合**

1. **Restricted mode を OFF** — Settings → Community plugins → 「Restricted mode」を無効化（新規 vault ではデフォルト ON のため、これをしないと一覧に出ません）
2. **Reload** — Settings → Community plugins → 右上のリロードアイコン
3. **再コピー** — `npm run build && npm run link:dev-vault`（vault 外 symlink は Obsidian が読み込みません）

手順:
2. **Settings → Kotonoha Console** → Backend: `mock`, **sidecarMode**: on
3. Open `notes/rde-sample.md`
4. Command palette → **RDE 監査を実施（アクティブノート）** (or Console panel → **RDE 監査を実施**)
5. Confirm: RDE audit panel shows `unresolved` (hedging), report is **not** Apply-able
6. Click **記録を閉じる** → check `dev-vault/.kotonoha/audit/*.rde-audit.json`

Headless pre-check: `npm run demo:rde-audit`

## Next

- Orchestrator **LLM proxy** — set `OPENAI_API_KEY` for generative rewrite via `POST /v1/proposals/generate`
- Git passive mode via read-only subprocess
