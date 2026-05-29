# HTTP client contract (Obsidian Console)

`HttpKotonohaClient` talks to three backend shapes on one `httpEndpoint`:

| Detected backend | Probe | Generative ops | RDE audit |
| --- | --- | --- | --- |
| **Orchestrator** | `GET /v1/agents` → 200 | `POST /v1/proposals/generate` (LLM proxy) or local fallback | `POST /v1/rde/evaluate` + local guardrails |
| **Gateway** | `GET /v1/tools` → 200 | `POST /v1/tools/kotonoha_context_export` + local audit | Local rule-based audit |
| **Console proxy** | (default) | `POST /v1/proposals/generate` | Same endpoint or local audit |

Auto-detection runs once per client instance (first `generate` call).

## Auth

When the server requires keys (e.g. Kotonoha Gateway), set **HTTP API key** in plugin settings. Sent as:

```http
Authorization: Bearer <token>
```

## Console / LLM proxy — `POST /v1/proposals/generate`

Request body:

```json
{
  "operation": "summarize",
  "instruction": "optional user instruction",
  "language": "ja",
  "context": {
    "filePath": "notes/sample.md",
    "title": "sample",
    "sourceText": "...",
    "sourceHash": "...",
    "selectionText": "...",
    "tags": [],
    "links": [],
    "frontmatter": {}
  }
}
```

Response:

```json
{
  "proposal": {
    "proposedText": "markdown or plain text",
    "summary": "optional one-line summary",
    "uncertaintyNote": "optional"
  },
  "audit": { }
}
```

`audit` is optional; the plugin runs local rule-based RDE when omitted.

Orchestrator deployments can expose this route as an **LLM orchestrator proxy** (OpenAI-compatible or custom) without changing the Obsidian plugin.

## Orchestrator — `POST /v1/rde/evaluate`

Used when `operation === "rde_audit"` and orchestrator is detected.

```json
{
  "subject_ref": "obsidian://notes/sample.md#abc123",
  "meaning_changes": {
    "preserved": ["..."],
    "transformed": ["..."],
    "complemented": ["..."],
    "unresolved": ["..."],
    "deviation_risk": ["..."]
  }
}
```

Response follows orchestrator SLS-4 shape (`rde_review_output.categories`). The plugin merges with local structural guardrails (rde-audit-policy §14).

## Gateway — `POST /v1/tools/kotonoha_context_export`

Body: `{ "file": "notes/sample.md" }`

Response envelope: `{ "tool", "ok", "result" }` where `result.content[0].text` is JSON with CLI `stdout` containing a `kotonoha.context_pack.v0.1` document.

Generative rewrite still requires `/v1/proposals/generate` or CLI/orchestrator LLM; gateway alone embeds context export only.

## Defaults

| Setting | Default |
| --- | --- |
| `httpEndpoint` | `http://127.0.0.1:8000` (orchestrator) |
| Gateway example | `http://127.0.0.1:8787` |

## Health

`GET /health` → `{ "status": "ok" }` — used by **Test connection** in settings.

## Orchestrator LLM proxy (generative rewrite)

Set environment variables before starting uvicorn:

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | (unset) | When set, `POST /v1/proposals/generate` calls OpenAI-compatible chat completions |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Compatible API base (Azure, local proxy, etc.) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model id |

```bash
export OPENAI_API_KEY=sk-...
cd kotonoha-orchestrator/orchestrator
uvicorn kotonoha_orchestrator_api.main:app --app-dir api/src
```

Without `OPENAI_API_KEY`, the endpoint returns a **rule-based local draft** (same anchor pattern as CLI local mode). Obsidian Console shows `[orchestrator/local]` in the proposal summary.
