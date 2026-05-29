# obsidian-kotonoha-console

Kotonoha UI plugin for Obsidian (proposal · RDE audit · human approval).

**Docs:** [`docs/architecture.ja.md`](docs/architecture.ja.md) · [`docs/git-mode-spec.ja.md`](docs/git-mode-spec.ja.md)

**Build:** see [`IMPLEMENTATION.md`](IMPLEMENTATION.md).

**CLI mode:** Settings → Backend **cli** → requires [`kotonoha`](https://github.com/zyx-corporation/kotonoha-cli) ≥ v0.3.1 and a **Git** vault (`kotonoha context export`).

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
