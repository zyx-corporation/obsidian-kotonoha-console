# Backend setup — Obsidian Kotonoha Console

**Japanese:** [`backend-setup.ja.md`](backend-setup.ja.md)

Obsidian Kotonoha Console is the **UI plugin**. Generation and audit run through a **backend mode**.

- Plugin install: [`install.md`](install.md)
- CLI compatibility: [`cli-runtime-compatibility.md`](cli-runtime-compatibility.md)

---

## Mode overview

| Mode | Requires | Use case |
| --- | --- | --- |
| **Mock** | Obsidian Console only | UI / dev smoke test |
| **CLI** | Console + [`kotonoha-cli >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/tutorials/install_kotonoha_cli.md) | local-first RDE audit and sidecar workflow |
| **HTTP orchestrator** | Console + [`kotonoha-orchestrator`](https://github.com/zyx-corporation/kotonoha-orchestrator) | LLM proposals and orchestrator RDE evaluate |

---

## Mode A: Mock

**Settings → Backend mode:** `mock`

No external runtime. Output is not real RDE or LLM.

---

## Mode B: CLI

Install CLI:

```bash
curl -fsSL https://raw.githubusercontent.com/zyx-corporation/kotonoha-cli/main/scripts/install.sh | bash -s -- --version v0.3.1
```

Verify:

```bash
kotonoha version
```

**Obsidian:** Backend `cli`, CLI command `kotonoha`, gitMode `off` for first run.

CLI is runtime, not normative spec. Local/interchange skeleton is not full RDE evaluation.

See [Install Kotonoha CLI](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/tutorials/install_kotonoha_cli.md).

---

## Mode C: HTTP orchestrator

Start API (example port 8001):

```bash
cd kotonoha-orchestrator/orchestrator
pip install -e ./api -e ./rde-engine
uvicorn kotonoha_orchestrator_api.main:app --app-dir api/src --port 8001
```

Probe:

```bash
curl http://127.0.0.1:8001/health
```

**Obsidian:** Backend `http`, HTTP endpoint `http://127.0.0.1:8001`.

| Endpoint | Tier |
| --- | --- |
| `/v1/rde/evaluate` | stable adapter |
| `/v1/proposals/generate` | experimental / best-effort |

Apply always requires human confirmation.

---

## Quick paths

| Goal | Steps |
| --- | --- |
| UI only | Install plugin → Backend `mock` |
| CLI dogfood | Install plugin → install CLI → Backend `cli` → RDE audit |
| LLM summarize | Install plugin → start orchestrator → Backend `http` → summarize |

See [`backend-setup.ja.md`](backend-setup.ja.md) for full Japanese detail.
