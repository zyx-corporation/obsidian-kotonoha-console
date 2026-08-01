# obsidian-kotonoha-console

Kotonoha UI plugin for Obsidian (proposal · RDE audit · human approval).

**Docs:** [`docs/install.ja.md`](docs/install.ja.md) · [`docs/backend-setup.ja.md`](docs/backend-setup.ja.md) · [`docs/architecture.ja.md`](docs/architecture.ja.md) · [`docs/git-mode-spec.ja.md`](docs/git-mode-spec.ja.md) · [`docs/cli-runtime-compatibility.ja.md`](docs/cli-runtime-compatibility.ja.md) · [`docs/v0.5-dogfood-record.ja.md`](docs/v0.5-dogfood-record.ja.md)

**Build:** see [`IMPLEMENTATION.md`](IMPLEMENTATION.md).

## Install

Manual install from [GitHub Release 0.5.4](https://github.com/zyx-corporation/obsidian-kotonoha-console/releases/tag/0.5.4):

```text
<vault>/.obsidian/plugins/kotonoha-console/
├── main.js
├── manifest.json
└── styles.css
```

Download `main.js`, `manifest.json`, and `styles.css`, place them in the plugin folder above, then enable the plugin (turn off Restricted mode first).

Full steps: [`docs/install.ja.md`](docs/install.ja.md) · [`docs/backend-setup.ja.md`](docs/backend-setup.ja.md) · [kotonoha-docs tutorial](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/manual/install_obsidian_kotonoha_console.md)

## Backend setup

This plugin is the Obsidian UI. Choose a backend mode:

| Backend | Required component | Use case |
| --- | --- | --- |
| `mock` | none | UI / dev smoke test |
| `cli` | [`kotonoha-cli >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/tutorials/install_kotonoha_cli.md) | local-first RDE audit and sidecar workflow |
| `http` | running [`kotonoha-orchestrator`](https://github.com/zyx-corporation/kotonoha-orchestrator) | LLM proposal generation; `/v1/rde/evaluate` stable, `/v1/proposals/generate` experimental |

For day-to-day local-first use, start with **CLI** backend.  
For LLM summarize / rewrite / expand, use **HTTP orchestrator** backend.

Full guide: [`docs/backend-setup.ja.md`](docs/backend-setup.ja.md)

## Current status

`obsidian-kotonoha-console` **v0.5.4** replaces native confirmation prompts with Obsidian modals.

It focuses on:

- local-only review destination as the visible default,
- copy/insert RDE review summary blocks into the current note,
- copy-ready GitHub Issue draft text from RDE categories,
- existing GitHub Issue / PR reference parsing as correlation metadata,
- PR summary text for publication handoff.

The plugin remains Git-aware but not Git-owning. It does not commit, pull, push, stage, or synchronize repositories.

The public listing build is desktop-only because CLI and read-only Git context features rely on desktop runtime capabilities.

`/v1/proposals/generate` is experimental. `orchestrator /v1/rde/evaluate` is treated as the stable adapter path when orchestrator is detected.

Sidecars under `.kotonoha/` are local/plugin records and are not complete SLS storage. v0.5 adds explicit publication handoff text for GitHub Issues / PRs; it does not post automatically and does not make GitHub the semantic source of truth.

**CLI mode** requires [`kotonoha`](https://github.com/zyx-corporation/kotonoha-cli) **>= 0.3.1**. **Git は必須ではない**（既定 `gitMode: off`）。**RDE 監査**は `rde emit` / `rde validate` のみ。`context export` は `gitMode` が `off` 以外のときのみ。

This plugin is intended to provide a personal writing and knowledge-work UI for Kotonoha / SLS workflows: MeaningDelta creation, RDE validation, RDE attachment, review decisions, and note-centered semantic lineage.

## Git mode policy

Obsidian Kotonoha Console is **Git-aware but not Git-owning**.

Git records file history. Kotonoha records semantic lineage. Obsidian remains the writing and thinking surface.

The plugin may read Git context, but it must not own repository synchronization. It must not implement or invoke commit, pull, push, stage, unstage, reset, merge, rebase, auto-sync, or scheduled background Git writes.

See [`docs/git-mode-spec.md`](docs/git-mode-spec.md).

## Git modes

The plugin should expose:

```text
kotonoha.gitMode = external | passive-observing | obsidian-git-aware | off
```

Recommended default:

```text
kotonoha.gitMode = passive-observing
```

Mode summary:

| Mode | Meaning |
| --- | --- |
| `off` | Ignore Git entirely; use note paths and manual subject references only. |
| `external` | Read Git context only on explicit user actions; Git sync is handled outside Kotonoha. |
| `passive-observing` | Show branch, commit, dirty state, and repo-relative note path; never mutate Git. |
| `obsidian-git-aware` | Coexist with Obsidian Git plugin; avoid metadata writes that may race with auto-sync. |

Obsidian Git plugin is optional, not required. Users may manage Git through terminal Git, VS Code, GitHub Desktop, Obsidian Git plugin, cron jobs, or another explicit workflow.

## Boundary

Kotonoha Console delegates Kotonoha operations to the configured `kotonoha` CLI / `kotonoha-core`. It does not define new SLS normative interchange and does not make RDE output final approval.

Git answers: **what changed in files?**

Kotonoha answers: **what changed in meaning, responsibility, loss, and deviation risk?**
