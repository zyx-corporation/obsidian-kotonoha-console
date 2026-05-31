# Backend setup — Obsidian Kotonoha Console

**English:** [`backend-setup.md`](backend-setup.md)

Obsidian Kotonoha Console は **UI プラグイン** です。生成・監査の実処理は **backend mode** によって変わります。

- プラグイン配置: [`install.ja.md`](install.ja.md)
- CLI 互換: [`cli-runtime-compatibility.ja.md`](cli-runtime-compatibility.ja.md)

---

## 利用モード一覧

| Mode | 必要なもの | 用途 |
| --- | --- | --- |
| **Mock** | Obsidian Console のみ | UI 確認・開発 smoke test |
| **CLI** | Console + [`kotonoha-cli >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/tutorials/install_kotonoha_cli.md) | local-first な RDE 監査・sidecar 確認 |
| **HTTP orchestrator** | Console + [`kotonoha-orchestrator`](https://github.com/zyx-corporation/kotonoha-orchestrator) | LLM 要約・提案生成・orchestrator RDE evaluate |

| 目的 | 選ぶ mode |
| --- | --- |
| まず UI だけ確認 | **Mock** |
| local-first / CLI dogfood | **CLI** |
| LLM 要約・書き換え・拡張 | **HTTP orchestrator** |

---

## Mode A: Mock backend

Mock backend はリモート接続なしで UI を確認するモードです。

**Settings → Kotonoha Console**

| 設定 | 値 |
| --- | --- |
| Backend mode | `mock` |

**用途**

- UI 確認
- proposal / audit / review 画面の smoke test
- 開発時の最小動作確認

**注意:** Mock 出力は実際の RDE 監査や LLM 出力ではありません。

---

## Mode B: CLI backend

CLI backend は `kotonoha-cli` を使う local-first runtime です。

### 必要

- `kotonoha-cli` **>= 0.3.1**

### インストール

```bash
curl -fsSL https://raw.githubusercontent.com/zyx-corporation/kotonoha-cli/main/scripts/install.sh | bash -s -- --version v0.3.1
```

詳細: [kotonoha-docs — CLI インストール](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/tutorials/install_kotonoha_cli.md)

### 確認

```bash
kotonoha version
kotonoha status
```

### Obsidian 設定

| 設定 | 推奨 |
| --- | --- |
| Backend mode | `cli` |
| CLI command | `kotonoha`（またはフルパス） |
| CLI workdir | vault path または project root |
| Git mode | 初回は `off` |
| Enable RDE audit panel | on |
| Require human approval before apply | on |

### できること

- active note の RDE 監査
- `rde emit` / `rde validate` 経路
- proposal / audit / review sidecar の確認
- local-first な dogfood

### 注意

- CLI は first stable **runtime** であり、仕様正本（[`kotonoha-spec`](https://github.com/zyx-corporation/kotonoha-spec)）ではありません。
- CLI の local / interchange skeleton は **full RDE evaluation ではありません**。

---

## Mode C: HTTP orchestrator backend

HTTP orchestrator backend は、LLM 要約・提案生成・orchestrator `/v1/rde/evaluate` を使うモードです。

### 必要

- [`kotonoha-orchestrator`](https://github.com/zyx-corporation/kotonoha-orchestrator)（API サーバー起動）
- 任意: `OPENAI_API_KEY`（live LLM 利用時）

### 起動例

```bash
git clone https://github.com/zyx-corporation/kotonoha-orchestrator.git
cd kotonoha-orchestrator/orchestrator
pip install -e ./api -e ./rde-engine
cp .env.example .env   # OPENAI_API_KEY 等を編集

export OPENAI_API_KEY=sk-...          # 任意
export OPENAI_BASE_URL=https://api.openai.com/v1
export OPENAI_MODEL=gpt-4o-mini

uvicorn kotonoha_orchestrator_api.main:app --app-dir api/src --port 8001
```

### 疎通確認

```bash
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8001/v1/agents
```

期待: `{"status":"ok"}` など（`/health` の JSON）

### Obsidian 設定

| 設定 | 推奨 |
| --- | --- |
| Backend mode | `http` |
| HTTP endpoint | `http://127.0.0.1:8001` |
| HTTP API key | 空欄（orchestrator で認証を有効にした場合のみ） |
| Enable RDE audit panel | on |
| Require human approval before apply | on |

プラグイン既定の HTTP endpoint は `http://127.0.0.1:8000` です。dogfood では **8001** を使用している場合は Settings で明示的に変更してください。

### できること

- 要約 / 書き換え / 拡張
- proposal generation（`/v1/proposals/generate`）
- orchestrator `/v1/rde/evaluate` による再監査

### 安定性

| Endpoint | Tier |
| --- | --- |
| `/health`, `/v1/agents` | stable adapter surface |
| `/v1/rde/evaluate` | **stable adapter contract** |
| `/v1/proposals/generate` | **experimental / best-effort** |

境界: [orchestrator API stability boundary](https://github.com/zyx-corporation/kotonoha-spec/blob/main/docs/orchestrator-api-stability-boundary.md)

### 注意

- 生成された proposal は承認済み lineage ではありません。**Apply には必ず人間の確認**が必要です。
- `/v1/proposals/generate` を stable とみなさないでください。

---

## 最短手順

### UI 確認だけ

1. Plugin を `<vault>/.obsidian/plugins/kotonoha-console/` に配置
2. Obsidian で有効化
3. Backend mode: `mock`

### CLI で使う

1. Plugin を配置
2. `kotonoha-cli >= 0.3.1` をインストール
3. `kotonoha version` を確認
4. Backend mode: `cli`
5. RDE 監査を実行

### LLM 要約を使う

1. Plugin を配置
2. `kotonoha-orchestrator` を起動（上記 Mode C）
3. `curl http://127.0.0.1:8001/health`
4. Backend mode: `http`
5. HTTP endpoint: `http://127.0.0.1:8001`
6. 操作: 要約 / 書き換え / 拡張

---

## 関連

- [`install.ja.md`](install.ja.md)
- [`v0.3-dogfood-record.ja.md`](v0.3-dogfood-record.ja.md)
- [Release Train 2026-05](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/releases/kotonoha-release-train-2026-05.md)
