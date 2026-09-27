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
- Optional: provider API key (for live LLM)

### Start example

```bash
git clone https://github.com/zyx-corporation/kotonoha-orchestrator.git
cd kotonoha-orchestrator/orchestrator
pip install -e ./api -e ./rde-engine
cp .env.example .env   # edit KOTONOHA_LLM_PROVIDER and provider credentials

# OpenAI-compatible default
export KOTONOHA_LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...          # optional; unset falls back to local draft
export OPENAI_BASE_URL=https://api.openai.com/v1
export OPENAI_MODEL=gpt-4o-mini

# Other supported providers:
#   claude      ANTHROPIC_API_KEY / ANTHROPIC_MODEL
#   kimi        KIMI_API_KEY / KIMI_MODEL
#   local_gemma OLLAMA_BASE_URL / LOCAL_GEMMA_MODEL

uvicorn kotonoha_orchestrator_api.main:app --app-dir api/src --port 18081
```

Provider examples:

| Provider | Minimal env |
| --- | --- |
| OpenAI | `KOTONOHA_LLM_PROVIDER=openai`, `OPENAI_API_KEY=...` |
| Claude | `KOTONOHA_LLM_PROVIDER=claude`, `ANTHROPIC_API_KEY=...`, `ANTHROPIC_MODEL=claude-sonnet-4-5` |
| Kimi | `KOTONOHA_LLM_PROVIDER=kimi`, `KIMI_API_KEY=...`, `KIMI_MODEL=moonshot-v1-8k` |
| Local Gemma | `KOTONOHA_LLM_PROVIDER=local_gemma`, `OLLAMA_BASE_URL=http://127.0.0.1:11434/v1`, `LOCAL_GEMMA_MODEL=gemma3:4b` |

### Probe

```bash
curl http://127.0.0.1:18081/health
curl http://127.0.0.1:18081/v1/agents
```

Expected: JSON such as `{"status":"ok"}` from `/health`.

### Obsidian settings

| Setting | Recommended |
| --- | --- |
| Backend mode | `http` |
| HTTP endpoint | `http://127.0.0.1:18081` |
| HTTP API key | empty (only when orchestrator auth is enabled) |
| Enable RDE audit panel | on |
| Require human approval before apply | on |

The plugin default HTTP endpoint is `http://127.0.0.1:18081`.

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
3. `curl http://127.0.0.1:18081/health`
4. Backend mode: `http`
5. HTTP endpoint: `http://127.0.0.1:18081`
6. Use summarize / rewrite / expand

---

## Related

- [`install.md`](install.md)
- [`v0.3-dogfood-record.ja.md`](v0.3-dogfood-record.ja.md)
- [Release Train 2026-05](https://github.com/zyx-corporation/kotonoha-docs/blob/main/en/releases/kotonoha-release-train-2026-05.md)
