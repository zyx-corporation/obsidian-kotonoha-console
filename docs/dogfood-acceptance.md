# Obsidian Kotonoha Console Dogfood Acceptance

## Goal

Treat Obsidian Kotonoha Console as the first usable UI for Kotonoha context review and RDE audit workflows.

## Scope

This document defines the current dogfood acceptance criteria for `obsidian-kotonoha-console`.

The goal is not to complete every Kotonoha feature, but to validate the minimum UI loop for human-reviewed context and semantic audit.

Normative contracts: [`kotonoha-spec`](https://github.com/zyx-corporation/kotonoha-spec).  
Japanese companion (detailed dev-vault steps): [`dogfood-acceptance.ja.md`](dogfood-acceptance.ja.md).

## Acceptance Criteria

- [ ] Active note can be read.
- [ ] Proposed changes can be generated or displayed.
- [ ] Proposal sidecar is written under `.kotonoha/proposals/`.
- [ ] RDE audit sidecar is written under `.kotonoha/audit/`.
- [ ] Review decision sidecar is written under `.kotonoha/reviews/`.
- [ ] Apply requires human confirmation.
- [ ] Reject records a review decision.
- [ ] Revise records a hold or partial decision.
- [ ] Re-audit can be performed against a revised proposal.
- [ ] Source hash mismatch blocks unsafe apply.
- [ ] Re-audit works with orchestrator when available.
- [ ] Re-audit falls back to local rule-based audit when orchestrator is unavailable.
- [ ] Metadata/frontmatter write behavior follows `metadataWriteMode`.
- [ ] Obsidian manual acceptance can be performed in a dev vault.

## Metadata Write Policy

The following behavior is expected:

- `metadataWriteMode = off`: no frontmatter mutation.
- `metadataWriteMode = prompt`: ask before writing Kotonoha metadata.
- `metadataWriteMode = always`: write Kotonoha metadata without a second confirmation only when safe.
- `obsidian-git-aware + always`: treat as `prompt`; do not silently write metadata.

## Non-goals

- No silent automatic rewriting of user notes.
- No mandatory Git dependency.
- No claim that local rule-based audit is equivalent to full RDE evaluation.
- No requirement that Obsidian directly implements all CLI behavior.
- No autonomous AI decision-making.

## Manual Dogfood Scenario

1. Open a dev vault.
2. Open a sample active note.
3. Generate or load a proposal.
4. Confirm proposal sidecar creation.
5. Run RDE audit.
6. Confirm audit sidecar creation.
7. Reject once and confirm review sidecar creation.
8. Revise once and run re-audit.
9. Apply only after explicit confirmation.
10. Confirm source hash mismatch prevents unsafe apply.
11. Confirm metadata write mode behavior.

### Detailed checklist (dev-vault, v0.2.x)

See [`dogfood-acceptance.ja.md`](dogfood-acceptance.ja.md) sections A–E for step-by-step verification (UI/busy cursor, orchestrator RDE, obsidian-git-aware, metadataWriteMode, mock RDE regression).

## RDE Check

### Preserved Elements

Obsidian remains the first human-facing UI for context, review, and RDE audit.

### Authorized Transformations

The UI is treated as a dogfood surface rather than the full Kotonoha runtime.

### Inferred Extensions

The acceptance criteria formalize the minimum loop: proposal → audit → review → revise → re-audit → apply.

### Unresolved Elements

- exact orchestrator contract
- local audit severity mapping
- long-term UI design
- sidecar schema versioning

### Drift Risks

- Treating local rule-based audit as full RDE.
- Allowing silent note rewriting.
- Making Git mandatory too early.
- Reimplementing CLI behavior inside the plugin.

### Next Revision Policy

Revise this document when dogfood testing reveals a missing safety condition or when the sidecar contract changes in `kotonoha-spec`.

## Sign-off

| Section | Tester | Date | Pass |
| --- | --- | --- | --- |
| Manual scenario | | | |
| A–E (ja checklist) | | | |
