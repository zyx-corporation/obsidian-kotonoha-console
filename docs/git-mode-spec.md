# Git Mode Specification

created: 2026-05-29T14:00:45+09:00
author: Tomoyuki Kano <tomyuk@zyxcorp.jp>
status: Design specification — Obsidian Kotonoha Console
version: 0.2.0
language: en

This document defines how Obsidian Kotonoha Console works with both non-Git vaults and Git-backed vaults.

The primary recommendation is:

> Obsidian Kotonoha Console must work fully without Git. Git is optional evidence infrastructure, not a foundation of Kotonoha.

## 1. Core Principle

Obsidian Kotonoha Console is **semantic-lineage-first**.

Git records file history. Kotonoha records semantic lineage. Obsidian remains the writing and thinking surface.

Therefore:

- Kotonoha Console must not require Git.
- Kotonoha Console must work in ordinary Obsidian vaults.
- Git-backed vault support is optional.
- When Git is available, Kotonoha may use Git context as evidence for semantic lineage.
- Kotonoha must not own Git synchronization.

The system distinction is:

```text
Git answers:
  What changed in files?

Kotonoha answers:
  What changed in meaning, responsibility, loss, and deviation risk?
```

This distinction must be preserved in all modes.

## 2. Recommended Default

The recommended default for the MVP is Git-independent operation.

```text
kotonoha.gitMode = off
kotonoha.sidecarMode = enabled
kotonoha.snapshotMode = on_demand
kotonoha.metadataWriteMode = prompt
kotonoha.auditLogMode = summary
```

This means:

- the plugin does not require a Git repository;
- the plugin stores proposal, audit, review, and optional snapshot data under `.kotonoha/`;
- the plugin verifies source hashes before applying proposals;
- note metadata writes require user confirmation by default;
- Git integration can be enabled later without changing the core semantic-lineage model.

Git should be treated as an optional layer that increases evidential strength, not as a dependency.

## 3. Non-Goals

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

Commit, pull, push, sync, branch management, and conflict resolution remain outside Kotonoha Console.

Users may handle them through terminal Git, VS Code, GitHub Desktop, Obsidian Git plugin, cron jobs, or another explicit Git workflow.

## 4. Non-Git Vault Mode

A non-Git vault is a normal Obsidian vault that is not managed as a Git repository.

This must be a first-class supported mode, not a fallback.

### 4.1 Behavior

When `kotonoha.gitMode = off`, Kotonoha Console:

- does not detect Git root;
- does not read branch, commit, or dirty state;
- does not call Git-aware CLI flows;
- works with vault-relative note paths;
- stores proposal and audit records under `.kotonoha/`;
- uses source hashes and optional snapshots as semantic-lineage anchors;
- verifies the current source hash before applying a proposal;
- warns if the source text changed after proposal generation.

### 4.2 Recommended Directory Layout

```text
.vault-root/
├─ notes/
│  └─ example.md
└─ .kotonoha/
   ├─ config.json
   ├─ snapshots/
   ├─ proposals/
   ├─ audit/
   └─ reviews/
```

### 4.3 Semantic Anchors Without Git

Because there is no commit hash, Kotonoha Console should use the following anchors:

- vault-relative note path
- target range or target mode
- source hash
- proposal hash
- optional source excerpt
- optional snapshot
- RDE audit result
- human review decision
- meaning delta identifier

Recommended identifiers:

```text
snapshotId
proposalId
rdeAssessmentId
meaningDeltaId
reviewDecisionId
```

These identifiers should not pretend to be Git commits. They are semantic-lineage event identifiers.

### 4.4 Apply-Time Hash Verification

Before applying any proposal, Kotonoha Console must recalculate the current source hash.

```text
if currentHash == proposal.sourceHash:
  allow apply

if currentHash != proposal.sourceHash:
  warn the user
  require re-audit, regeneration, or explicit override
```

This is especially important in non-Git vaults because there is no external commit boundary to verify the original file state.

### 4.5 Snapshot Policy

Non-Git vaults need optional snapshots because Git commits are not available as recovery anchors.

Recommended setting:

```text
kotonoha.snapshotMode = off | hash_only | on_demand | full
```

Recommended default:

```text
kotonoha.snapshotMode = on_demand
```

Mode definitions:

```text
off:
  Do not store snapshots.

hash_only:
  Store only sourceHash and proposalHash.

on_demand:
  Store excerpts or target-range snapshots when proposal generation, RDE audit, or apply operations require them.

full:
  Store full source and proposal text. This must be opt-in.
```

The default should balance privacy, portability, and auditability.

## 5. `kotonoha.gitMode`

The plugin should expose the following setting:

```text
kotonoha.gitMode = off | external | passive-observing | obsidian-git-aware
```

The recommended MVP default is:

```text
kotonoha.gitMode = off
```

For users who explicitly maintain Git-backed vaults, the recommended advanced default is:

```text
kotonoha.gitMode = passive-observing
```

## 6. Mode Definitions

### 6.1 `off`

Kotonoha does not inspect Git.

Behavior:

- do not detect Git root;
- do not show branch, commit, or dirty state;
- do not call Git-aware CLI flows;
- use note paths, source hashes, snapshots, sidecar records, and manually supplied `subject_ref` values only.

Use when:

- the vault is not a Git repository;
- the user wants the simplest note-only RDE workflow;
- Git context is irrelevant or intentionally hidden;
- the MVP is running without external repository assumptions.

### 6.2 `external`

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

### 6.3 `passive-observing`

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
- the user wants Git to increase the evidential strength of semantic lineage.

### 6.4 `obsidian-git-aware`

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

## 7. Sidecar-First Storage

Kotonoha Console should store semantic-lineage artifacts in sidecar files by default.

Recommended layout:

```text
.kotonoha/
├─ config.json
├─ snapshots/
│  └─ <snapshotId>.json
├─ proposals/
│  └─ <proposalId>.proposal.json
├─ audit/
│  └─ <rdeAssessmentId>.rde-audit.json
└─ reviews/
   └─ <reviewDecisionId>.review.json
```

Sidecar-first storage has several advantages:

- it works without Git;
- it avoids polluting note bodies;
- it reduces conflict risk with Obsidian sync tools;
- it preserves proposal and audit records even when the user rejects a proposal;
- it prepares for future SLS integration.

## 8. Metadata Writes

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
- if no Git context exists, the plugin should still verify `sourceHash`;
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

## 9. Recommended Workflows

### 9.1 Recommended MVP Workflow Without Git

1. Edit notes in Obsidian.
2. Let Kotonoha Console operate with `kotonoha.gitMode = off`.
3. Generate a proposal from the current note or selected range.
4. Store the proposal under `.kotonoha/proposals/`.
5. Create or attach RDE audit under `.kotonoha/audit/`.
6. Review preserved elements, transformations, inferred extensions, unresolved elements, and drift risks.
7. Approve, hold, reject, or partially apply the proposal.
8. Before applying, verify that the current source hash still matches the proposal source hash.
9. Apply only after explicit human approval.
10. Store the review decision under `.kotonoha/reviews/`.

### 9.2 Recommended Git-Backed Workflow

1. Edit notes in Obsidian.
2. Let Kotonoha observe Git context in `passive-observing` mode.
3. Create MeaningDelta from the current note through the `kotonoha` CLI.
4. Validate and attach RDE output through `kotonoha rde validate --strict` and `kotonoha rde attach`.
5. Record human review decision through `kotonoha review approve|hold|reject`.
6. Commit / pull / push outside Kotonoha, using the user's chosen Git workflow.

## 10. Allowed CLI-Backed Operations

The plugin may delegate to the configured `kotonoha` CLI for:

- `kotonoha status`
- `kotonoha diff --file <current-note>`
- `kotonoha delta create <current-note>`
- `kotonoha rde validate --strict`
- `kotonoha rde attach`
- `kotonoha review approve|hold|reject`
- `kotonoha export --format m2`

These operations must not be treated as Git synchronization operations.

In non-Git mode, commands requiring Git context should be disabled, hidden, or clearly marked unavailable.

## 11. Obsidian Git Plugin Coexistence

If Obsidian Git plugin is installed, Kotonoha should not compete with it.

Obsidian Git manages file history and synchronization. Kotonoha observes semantic lineage.

Conflict avoidance rules:

- do not implement commit/pull/push/stage/unstage;
- do not schedule background writes;
- do not assume Git HEAD remains stable during long operations;
- re-check file modification time and Git HEAD before writing note metadata;
- provide sidecar-only mode for users relying on auto-sync;
- document that Obsidian Git plugin is optional, not required.

## 12. Sync Tools Other Than Git

Many users may use Obsidian Sync, iCloud, Dropbox, Google Drive, OneDrive, Syncthing, or other file synchronization tools instead of Git.

Kotonoha Console should treat these as external synchronization layers.

Rules:

- do not assume atomic sync behavior;
- do not assume conflict-free writes;
- re-check file modification time before applying proposals;
- re-check source hash before applying proposals;
- prefer sidecar-first storage;
- show a warning if the source changed after proposal generation.

Kotonoha Console must not become the owner of file synchronization.

## 13. Acceptance Criteria

### 13.1 Non-Git MVP Acceptance Criteria

- [ ] Plugin works in an ordinary non-Git Obsidian vault.
- [ ] Default `kotonoha.gitMode` is `off` for MVP.
- [ ] `.kotonoha/` sidecar directory is created when needed.
- [ ] Proposal records are stored under `.kotonoha/proposals/`.
- [ ] RDE audit records are stored under `.kotonoha/audit/`.
- [ ] Review decisions are stored under `.kotonoha/reviews/`.
- [ ] `sourceHash` is recorded for each proposal.
- [ ] Apply operation verifies current source hash before writing.
- [ ] If source hash changed, the plugin warns and requires re-audit, regeneration, or explicit override.
- [ ] Full-text snapshot storage is opt-in.
- [ ] Metadata writes default to `prompt`.

### 13.2 Git-Aware Acceptance Criteria

- [ ] `kotonoha.gitMode` setting supports `off`, `external`, `passive-observing`, and `obsidian-git-aware`.
- [ ] `off` mode ignores Git entirely.
- [ ] `external` mode reads Git context only on explicit actions.
- [ ] `passive-observing` mode shows branch, commit, dirty state, and repo-relative note path.
- [ ] `obsidian-git-aware` mode avoids metadata writes that may race with Obsidian Git auto-sync.
- [ ] No mode implements commit, pull, push, stage, unstage, reset, merge, rebase, or auto-sync.
- [ ] Plugin delegates Kotonoha operations to the configured `kotonoha` CLI when enabled.
- [ ] README documents the Git mode model.
- [ ] README clarifies that Obsidian Git plugin is optional.

## 14. RDE Boundary

Git answers:

> What changed in files?

Kotonoha answers:

> What changed in meaning, responsibility, loss, and deviation risk?

Git may strengthen the evidence base for semantic lineage, but it must not define semantic lineage.

RDE audit must not depend on Git. RDE may use Git context when available, but its core evidence should remain source text, proposal text, source hash, audit result, and human review decision.

## 15. Design Rationale

The system should work without Git because many Obsidian users do not use Git, and because Kotonoha's core object is not the file commit but the meaning transition.

Git-backed vaults are valuable for developers and researchers because they improve reproducibility, external diffing, rollback, and collaboration. However, making Git mandatory would distort the purpose of Kotonoha Console and make the MVP unnecessarily complex.

The correct relation is:

```text
MVP:
  semantic lineage with sidecar logs, snapshots, hashes, and human decisions

Advanced Git mode:
  semantic lineage anchored to optional Git file history
```

Git is a witness, not the judge.

## 16. RDE Self-Audit of This Specification

### Preserved Elements

This specification preserves the original boundary that Kotonoha is Git-aware but not Git-owning. It also preserves the distinction between file history and semantic lineage.

### Authorized Transformations

The previous Git-backed-first framing is transformed into a Git-optional architecture. This transformation is authorized by the decision to support non-Git Obsidian vaults as a first-class MVP mode.

### Inferred Extensions

The sidecar-first storage model, snapshot modes, source-hash apply verification, and non-Git acceptance criteria are implementation-oriented extensions derived from the adopted recommendation.

### Unresolved Elements

Exact JSON schemas for snapshots, proposals, RDE audits, and review decisions remain to be specified. The relation between local sidecar logs and future SLS storage also remains unresolved.

### Drift Risks

There is a risk that sidecar logs may be mistaken for full Semantic Lineage System storage. They should be documented as local plugin records and future-compatible evidence, not as the complete SLS layer.

### Next Update Policy

The next update should define concrete JSON schemas for `.kotonoha/snapshots`, `.kotonoha/proposals`, `.kotonoha/audit`, and `.kotonoha/reviews`.
