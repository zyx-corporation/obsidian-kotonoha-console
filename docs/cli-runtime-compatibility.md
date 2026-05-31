# CLI runtime compatibility (Obsidian Console)

**Plugin:** `obsidian-kotonoha-console`  
**Canonical policy:** [`kotonoha-docs` CLI version policy (JA)](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/manual/cli_version_policy.md)

Japanese companion: [`cli-runtime-compatibility.ja.md`](cli-runtime-compatibility.ja.md)

---

## Summary

| Backend | CLI required | Minimum CLI |
| --- | --- | --- |
| **cli** | Yes | **v0.3.1** |
| **mock** | No | — |
| **http** (orchestrator) | No | — |

**Recommended CLI for all Kotonoha surfaces:** v0.3.1

---

## CLI backend

Settings → Backend **cli** → configure `kotonoha` binary path.

Required commands:

- `kotonoha version` — settings health check
- `kotonoha rde emit` / `kotonoha rde validate` — RDE audit path
- `kotonoha context export` — only when `gitMode` is not `off`

Obsidian Console does **not** invoke Git write operations. See [`git-mode-spec.md`](git-mode-spec.md).

---

## Non-CLI backends

- **mock:** local guardrails merge only; no `kotonoha` binary.
- **http:** orchestrator `POST /v1/rde/evaluate` when audit is omitted or on re-audit (plugin v0.2.13+). See [orchestrator API stability boundary](https://github.com/zyx-corporation/kotonoha-spec/blob/main/docs/orchestrator-api-stability-boundary.md) for stable vs experimental tiers and fallback policy.

These modes support dogfood without a local CLI install.

---

## RDE note

The CLI is the first stable runtime, not the normative specification. Audit categories, sidecar layout, and interchange contracts are defined in [`kotonoha-spec`](https://github.com/zyx-corporation/kotonoha-spec). This document records **which CLI release Obsidian was tested against**, not semantic rules.

---

## Related

- [`README.md`](../README.md) — quick start
- [`dogfood-acceptance.md`](dogfood-acceptance.md) — sign-off checklist
- [`IMPLEMENTATION.md`](../IMPLEMENTATION.md) — build and dev vault
