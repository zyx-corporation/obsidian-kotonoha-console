# Git mode specification

Status: **Design specification — Obsidian Kotonoha Console**.

This document defines how Obsidian Kotonoha Console interacts with Git-backed vaults.

## 1. Principle

Obsidian Kotonoha Console is **Git-aware but not Git-owning**.

Git records file history. Kotonoha records semantic lineage. Obsidian remains the writing and thinking surface.

Kotonoha may read Git context and use it as semantic-lineage evidence, but it must not own repository synchronization.

## 2. Non-goals

Obsidian Kotonoha Console must not implement or invoke repository mutation commands such as:

- `git add`
- `git commit`
- `git pull`
- `git push`
- `git reset`
- `git merge`
- `git rebase`
- stage / unstage operations
- auto-sync
- scheduled background Git writes

Commit, pull, push, sync, branch management, and conflict resolution remain outside Kotonoha Console. Users may handle them through terminal Git, VS Code, GitHub Desktop, Obsidian Git plugin, cron jobs, or another explicit Git workflow.

## 3. `kotonoha.gitMode`

The plugin should expose the following setting:

```text
kotonoha.gitMode = external | passive-observing | obsidian-git-aware | off
```

The recommended default is:

```text
kotonoha.gitMode = passive-observing
```

### 3.1 `off`

Kotonoha does not inspect Git.

Behavior:

- do not detect Git root;
- do not show branch, commit, or dirty state;
- do not call Git-aware CLI flows;
- work with note paths, snapshots, or manually supplied `subject_ref` values only.

Use when:

- the vault is not a Git repository;
- the user wants the simplest note-only RDE workflow;
- Git context is irrelevant or intentionally hidden.

### 3.2 `external`

Git synchronization is handled outside Obsidian Kotonoha Console.

Behavior:

- detect Git root when needed;
- read Git context only on explicit user actions;
- allow CLI-backed reads such as:
  - `kotonoha status`
  - `kotonoha diff --file <current-note>`
  - `kotonoha delta create <current-note>`
- do not continuously watch Git state;
- do not mutate Git.

Use when:

- the user manages Git in terminal, VS Code, GitHub Desktop, or another explicit workflow;
- the user wants Kotonoha to stay focused on semantic lineage;
- the user wants fewer background interactions.

### 3.3 `passive-observing`

Kotonoha continuously or periodically displays Git context but does not mutate Git.

Behavior:

- detect Git root;
- show branch, commit, dirty/clean state, and current note path relative to Git root;
- show whether the current note has uncommitted changes when available;
- allow explicit CLI-backed context commands such as `kotonoha status`, `kotonoha diff --file`, and `kotonoha delta create`;
- do not commit, pull, push, stage, unstage, or auto-sync.

Use when:

- the vault is Git-backed;
- the user wants semantic review anchored to the current Git state;
- the user wants the recommended personal M4 workflow.

### 3.4 `obsidian-git-aware`

Kotonoha assumes the Obsidian Git plugin or another Obsidian-side Git sync layer may be active.

Behavior:

- detect Git root;
- detect Obsidian Git plugin if the Obsidian API allows it;
- show Git context;
- avoid automatic metadata writes that could race with auto-sync;
- before writing front matter or summary blocks, re-check file modification time and Git HEAD;
- prefer prompt-based writes or sidecar-only behavior;
- never call Git mutation commands.

Use when:

- the user also uses Obsidian Git plugin;
- auto-commit or auto-sync may run inside Obsidian;
- metadata write conflicts must be minimized.

## 4. Recommended default workflow

For personal use, the recommended workflow is:

1. Edit notes in Obsidian.
2. Let Kotonoha observe Git context in `passive-observing` mode.
3. Create MeaningDelta from the current note through the `kotonoha` CLI.
4. Validate and attach RDE output through `kotonoha rde validate --strict` and `kotonoha rde attach`.
5. Record human review decision through `kotonoha review approve|hold|reject`.
6. Commit / pull / push outside Kotonoha, using the user's chosen Git workflow.

## 5. Allowed CLI-backed operations

The plugin may delegate to the configured `kotonoha` CLI for:

- `kotonoha status`
- `kotonoha diff --file <current-note>`
- `kotonoha delta create <current-note>`
- `kotonoha rde validate --strict`
- `kotonoha rde attach`
- `kotonoha review approve|hold|reject`
- `kotonoha export --format m2`

These operations must not be treated as Git synchronization operations.

## 6. Metadata writes

Kotonoha may support writing Obsidian metadata, but this must be explicit and configurable.

Recommended setting:

```text
kotonoha.metadataWriteMode = off | prompt | always
```

Recommended default:

```text
kotonoha.metadataWriteMode = prompt
```

Rules:

- metadata writes must be opt-in or user-confirmed by default;
- metadata writes must not stage or commit files;
- if Git context changes during an operation, the plugin should warn before writing;
- sidecar-only operation should remain available for users who do not want note mutation.

Optional YAML metadata proposal:

```yaml
kotonoha:
  project_id: "..."
  latest_meaning_delta_id: "..."
  latest_rde_assessment_id: "..."
  review_status: "hold"
```

These fields are local/plugin metadata only. They are not normative SLS storage.

## 7. Obsidian Git plugin coexistence

If Obsidian Git plugin is installed, Kotonoha should not compete with it.

Obsidian Git manages file history and synchronization. Kotonoha observes semantic lineage.

Conflict avoidance rules:

- do not implement commit/pull/push/stage/unstage;
- do not schedule background writes;
- do not assume Git HEAD remains stable during long operations;
- re-check file modification time and Git HEAD before writing note metadata;
- provide sidecar-only mode for users relying on auto-sync;
- document that Obsidian Git plugin is optional, not required.

## 8. Acceptance criteria

- [ ] `kotonoha.gitMode` setting is implemented.
- [ ] Default mode is `passive-observing`.
- [ ] `off` mode ignores Git entirely.
- [ ] `external` mode reads Git context only on explicit actions.
- [ ] `passive-observing` mode shows branch, commit, dirty state, and repo-relative note path.
- [ ] `obsidian-git-aware` mode avoids metadata writes that may race with Obsidian Git auto-sync.
- [ ] No mode implements commit, pull, push, stage, unstage, reset, merge, rebase, or auto-sync.
- [ ] Plugin delegates Kotonoha operations to the configured `kotonoha` CLI.
- [ ] README documents the Git mode model.
- [ ] README clarifies that Obsidian Git plugin is optional.

## 9. RDE boundary

Git answers: **what changed in files?**

Kotonoha answers: **what changed in meaning, responsibility, loss, and deviation risk?**

The plugin must preserve this distinction. Git state may anchor semantic lineage, but Git synchronization must not become Kotonoha's responsibility.