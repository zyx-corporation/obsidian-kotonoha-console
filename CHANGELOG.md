# Changelog

## v0.5.3 — Attested Community release

### Added

- GitHub Actions release workflow that validates metadata, runs typecheck / tests / build, generates GitHub artifact attestations, and publishes the three Community-supported release assets.

## v0.5.2 — Community warning trim

### Changed

- Lowered `minAppVersion` to `1.7.2`, matching the oldest API currently required by the plugin.
- Removed an empty declarative settings stub so the existing imperative settings tab remains on the compatible path.

### Fixed

- Removed unnecessary regex match assertions from structural diff link scanning.

## v0.5.1 — Community review fixes

### Changed

- Updated the Community listing manifest metadata for the current review rules.
- Raised `minAppVersion` to `1.13.0` and declared the plugin desktop-only.
- Replaced settings headings with Obsidian `Setting#setHeading()` UI.
- Removed the `builtin-modules` dev dependency by using Node's built-in module list.

### Fixed

- Awaited `workspace.revealLeaf()` so the console view activation settles cleanly.
- Removed global `fetch` fallback usage from the HTTP client path.
- Removed a CSS `!important` rule from the busy cursor state.

### Distribution

- Community review release assets are the three supported plugin files only: `main.js`, `manifest.json`, and `styles.css`.

## v0.5.0 — Review Destination / Publication Handoff

### Added

- Review Destination model with `Local only` as the visible default.
- Review handoff panel for copying a Kotonoha RDE summary block.
- Insert action for appending a review summary block into the current note.
- Copy-ready GitHub Issue draft text generated from proposal / RDE audit context.
- Existing GitHub Issue / PR reference parsing for correlation metadata.
- Copy-ready PR summary text for publication handoff.
- `docs/v0.5-dogfood-record.ja.md` records Phase 1–6 evidence.

### Changed

- Proposal / audit UI now states that sidecar and note history remain the Kotonoha-owned record surface.
- GitHub is presented as an explicit review/correlation/publication handoff, not as semantic authority.

### Distribution

- Release zip folder name remains `kotonoha-console/` (manifest id).
- Release asset: `obsidian-kotonoha-console-v0.5.0.zip` (folder `kotonoha-console/`).

### Boundaries

- No automatic GitHub Issue / PR publishing is introduced.
- Existing GitHub links are correlation metadata only.
- Local sidecars and note history remain the Kotonoha-owned record surface.

## v0.4.0 — Integration depth

### Added

- `passive-observing` Git dogfood guardrails: read branch / commit / dirty state without invoking Git writes.
- Revise → re-audit → apply stale-audit guard: warns when revised text changes after the latest audit.
- Partial apply scope UX: proposal cards and confirmation dialogs distinguish whole-note apply from selection apply.
- CLI `context export` integration is gated on read-only Git snapshot availability and falls back to path + source hash anchors.
- Sidecar ↔ CLI/M6 export correlation hints on proposal / audit / review sidecars.
- `docs/v0.4-dogfood-record.ja.md` records Phase 1–5 evidence.

### Changed

- CLI backend now calls `kotonoha context export` only when `gitMode` is enabled and a Git commit snapshot exists.
- Proposal UI shows local-only vs available export correlation status.
- Sidecar validation remains compatibility-first: malformed `exportCorrelation` fields warn but do not block legacy sidecars.

### Distribution

- Release zip folder name remains `kotonoha-console/` (manifest id).
- Release asset: `obsidian-kotonoha-console-v0.4.0.zip` (folder `kotonoha-console/`).

### Boundaries

- Obsidian sidecars remain local/plugin evidence records, not canonical SLS storage.
- Git integration remains read-only; no commit, pull, push, stage, reset, merge, rebase, checkout, switch, or restore operations are invoked.
- Sidecar ↔ M6 correlation is a read-only hint, not DB sync.

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
