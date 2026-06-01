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

| Goal | Choose |
| --- | --- |
| UI only | **Mock** |
| local-first / CLI dogfood | **CLI** |
| LLM summarize / rewrite / expand | **HTTP orchestrator** |

For local-first use, start with **CLI** backend.  
For LLM proposal generation, use **HTTP orchestrator** backend.

---

## Mode A: Mock backend

Mock backend runs the UI without a remote connection.

**Settings → Kotonoha Console**

| Setting | Value |
| --- | --- |
| Backend mode | `mock` |

**Use cases**

- UI smoke test
- proposal / audit / review screen checks
- minimal dev verification

**Note:** Mock output is not real RDE audit or LLM output.

---

## Mode B: CLI backend

CLI backend uses `kotonoha-cli` as a local-first runtime.

### Requirements

- `kotonoha-cli` **>= 0.3.1**

### Install

```bash
curl -fsSL https://raw.githubusercontent.com/zyx-corporation/kotonoha-cli/main/scripts/install.sh | bash -s -- --version v0.3.1
```

See [Install Kotonoha CLI](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/tutorials/install_kotonoha_cli.md).

### Verify

```bash
kotonoha version
kotonoha status
```

### Obsidian settings

| Setting | Recommended |
| --- | --- |
| Backend mode | `cli` |
| CLI command | `kotonoha` (or full path) |
| CLI workdir | vault path or project root |
| Git mode | `off` for first run |
| Enable RDE audit panel | on |
| Require human approval before apply | on |

### Capabilities

- RDE audit on the active note
- `rde emit` / `rde validate` path
- proposal / audit / review sidecar workflow
- local-first dogfood

### Notes

- CLI is the first stable **runtime**, not the normative spec ([`kotonoha-spec`](https://github.com/zyx-corporation/kotonoha-spec)).
- CLI local / interchange skeleton is **not full RDE evaluation**.

---

## Mode C: HTTP orchestrator backend

HTTP orchestrator backend uses LLM summarize / proposal generation and orchestrator `/v1/rde/evaluate`.

### Requirements

- [`kotonoha-orchestrator`](https://github.com/zyx-corporation/kotonoha-orchestrator) (API server running)
- Optional: `OPENAI_API_KEY` (for live LLM)

### Start example

```bash
git clone https://github.com/zyx-corporation/kotonoha-orchestrator.git
cd kotonoha-orchestrator/orchestrator
pip install -e ./api -e ./rde-engine
cp .env.example .env   # edit OPENAI_API_KEY etc.

export OPENAI_API_KEY=sk-...          # optional
export OPENAI_BASE_URL=https://api.openai.com/v1
export OPENAI_MODEL=gpt-4o-mini

uvicorn kotonoha_orchestrator_api.main:app --app-dir api/src --port 8001
```

### Probe

```bash
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8001/v1/agents
```

Expected: JSON such as `{"status":"ok"}` from `/health`.

### Obsidian settings

| Setting | Recommended |
| --- | --- |
| Backend mode | `http` |
| HTTP endpoint | `http://127.0.0.1:8001` |
| HTTP API key | empty (only when orchestrator auth is enabled) |
| Enable RDE audit panel | on |
| Require human approval before apply | on |

The plugin default HTTP endpoint is `http://127.0.0.1:8000`. Change it in Settings when using port **8001** (dogfood default).

### Capabilities

- summarize / rewrite / expand
- proposal generation (`/v1/proposals/generate`)
- re-audit via orchestrator `/v1/rde/evaluate`

### Stability

| Endpoint | Tier |
| --- | --- |
| `/health`, `/v1/agents` | stable adapter surface |
| `/v1/rde/evaluate` | **stable adapter contract** |
| `/v1/proposals/generate` | **experimental / best-effort** |

Boundary: [orchestrator API stability boundary](https://github.com/zyx-corporation/kotonoha-spec/blob/main/docs/orchestrator-api-stability-boundary.md)

### Notes

- Generated proposals are not approved lineage. **Apply always requires human confirmation.**
- Do not treat `/v1/proposals/generate` as stable.

---

## Quick paths

### UI only

1. Install plugin under `<vault>/.obsidian/plugins/kotonoha-console/`
2. Enable in Obsidian
3. Backend mode: `mock`

### CLI backend

1. Install plugin
2. Install `kotonoha-cli >= 0.3.1`
3. Run `kotonoha version`
4. Backend mode: `cli`
5. Run RDE audit

### LLM summarize

1. Install plugin
2. Start `kotonoha-orchestrator` (Mode C above)
3. `curl http://127.0.0.1:8001/health`
4. Backend mode: `http`
5. HTTP endpoint: `http://127.0.0.1:8001`
6. Use summarize / rewrite / expand

---

## Related

- [`install.md`](install.md)
- [`v0.3-dogfood-record.ja.md`](v0.3-dogfood-record.ja.md)
- [Release Train 2026-05](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/releases/kotonoha-release-train-2026-05.md)
