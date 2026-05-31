# CLI 実行互換（Obsidian Console）

**プラグイン:** `obsidian-kotonoha-console`  
**正本ポリシー:** [`kotonoha-docs` CLI 推奨バージョン](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/manual/cli_version_policy.md)

English: [`cli-runtime-compatibility.md`](cli-runtime-compatibility.md)

---

## 概要

| Backend | CLI 要否 | 最小 CLI |
| --- | --- | --- |
| **cli** | 必須 | **v0.3.1** |
| **mock** | 不要 | — |
| **http**（orchestrator） | 不要 | — |

**Kotonoha 全体の推奨 CLI:** v0.3.1

---

## CLI backend

設定 → Backend **cli** → `kotonoha` バイナリパスを指定。

利用コマンド:

- `kotonoha version` — 設定画面のヘルスチェック
- `kotonoha rde emit` / `kotonoha rde validate` — RDE 監査
- `kotonoha context export` — `gitMode` が `off` 以外のときのみ

Obsidian Console は Git の commit / push 等を実行しない。詳細は [`git-mode-spec.ja.md`](git-mode-spec.ja.md)。

---

## CLI 以外の backend

- **mock:** ローカル guardrails のみ。`kotonoha` 不要。
- **http:** 監査省略時および再監査で orchestrator `POST /v1/rde/evaluate`（プラグイン v0.2.13 以降）。安定/実験区分と fallback: [orchestrator API 境界](https://github.com/zyx-corporation/kotonoha-spec/blob/main/docs/orchestrator-api-stability-boundary.md)。

dogfood では CLI 未インストールでも http / mock で進められる。

---

## RDE note

CLI は first stable runtime であり、仕様正本ではない。監査カテゴリ・sidecar・interchange の契約は [`kotonoha-spec`](https://github.com/zyx-corporation/kotonoha-spec) が正本。本書は **Obsidian が検証した CLI リリース** を記録するもので、意味論を定義しない。

---

## 関連

- [`README.md`](../README.md) — クイックスタート
- [`dogfood-acceptance.ja.md`](dogfood-acceptance.ja.md) — 受け入れチェックリスト
- [`IMPLEMENTATION.md`](../IMPLEMENTATION.md) — ビルドと dev-vault
