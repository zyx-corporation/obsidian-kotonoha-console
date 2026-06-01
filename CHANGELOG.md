# Changelog

## v0.3.0 — First UI hardening

### Added

- Audit engine labeling for orchestrator, local, mock, CLI, and gateway paths.
- CLI backend dogfood parity for `kotonoha >= 0.3.1`.
- Minimal sidecar validation helpers for proposal, audit, and review records.
- Settings / connection UX explaining backend capabilities and stability tiers.
- Note I/O acceptance hardening for active note reading, selection handling, frontmatter preservation, metadata write policy, source hash guard, and target note focus guard.
- [`docs/backend-setup.ja.md`](docs/backend-setup.ja.md) — Mock / CLI / HTTP orchestrator setup paths for practical use.

### Changed

- HTTP backend messaging now distinguishes stable adapter endpoints from experimental proposal generation.
- CLI backend messaging now clarifies that CLI is runtime, not normative spec.
- Sidecar validation remains compatibility-first and tolerates legacy records without engine metadata.
- Note mutation remains explicit, source-hash guarded, and human-reviewed.

### Fixed

- Unwrap a single outer `markdown` / `md` / `text` fence from LLM proposal output so Apply inserts Markdown body instead of a code block (#51).
- Re-audit with normalized `proposedText` when unwrap changes generated content.
- Preserve inner code blocks and non-Markdown language fences (`ts`, `python`, `json`, etc.).

### Distribution

- Release zip folder name is `kotonoha-console/` (manifest id).
- Release asset: `obsidian-kotonoha-console-v0.3.0.zip` (folder `kotonoha-console/`).

### Dogfood

- HTTP orchestrator path verified with `http://127.0.0.1:8001`.
- CLI backend path verified with `kotonoha >= 0.3.1`.
- `obsidian-git-aware` context display verified.
- Proposal / audit / review sidecar loop verified.
- Selection and frontmatter safety tested.

### Known limitations

- `/v1/proposals/generate` remains experimental / best-effort.
- Local rule-based and CLI interchange skeleton paths are not full RDE evaluation.
- Sidecars are local/plugin records, not complete SLS storage.
- Advanced partial apply UX is deferred to v0.4.
- Git context export integration is deferred to v0.4.
- Sidecar ↔ CLI/M6 export correlation is deferred to v0.4.
