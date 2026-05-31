# Obsidian Kotonoha Console ドッグフード受け入れ

**状態:** 受け入れ完了（v0.2.15、dev-vault、2026-05-31 sign-off）。  
**目的:** Obsidian Kotonoha Console を、Kotonoha のコンテキストレビューと RDE 監査ワークフローの **最初の usable UI** として扱う。

規範的正本: `[kotonoha-spec](https://github.com/zyx-corporation/kotonoha-spec)`。  
English: `[dogfood-acceptance.md](dogfood-acceptance.md)`。

## 受け入れ基準

- アクティブノートを読み、提案を生成できる。
- 提案 sidecar が `.kotonoha/proposals/` に書かれる。
- RDE 監査 sidecar が `.kotonoha/audit/` に書かれる。
- レビュー決定 sidecar が `.kotonoha/reviews/` に書かれる。
- 適用には人間の確認が必要。
- ソース hash 不一致時、安全でない適用はブロック（明示的 confirm で上書き可）。
- orchestrator 利用時、再監査が `/v1/rde/evaluate` で動作する。
- orchestrator 不可時、再監査は local rule-based にフォールバックする。
- `metadataWriteMode` に従い frontmatter 書き込みが制御される。
- `dev-vault/` で手動受け入れが実施できる。

## 非目標

- ノートの黙示的自動改稿はしない。
- Git 必須にしない（`gitMode: off` は有効な MVP）。
- local rule-based 監査を完全 RDE 評価と同等と称しない。

## 手順概要

### 0. 準備

```bash
npm run build && npm run link:dev-vault
```

Obsidian: `dev-vault` を開く、プラグイン **0.2.15+** を無効→有効。

HTTP テスト: orchestrator 起動、`backendMode: http`、接続テスト OK。

### A. UI・適用（v0.2.11+）

1. `notes/rde-sample.md` を開く。
2. **要約** を生成。
3. 生成中: Console パネル内のみ wait カーソル。
4. 改訂モードなしで **再監査** ボタン表示。
5. Console フォーカス時も **適用** でノート更新（frontmatter 保持）。

### B. orchestrator RDE（v0.2.13 / v0.2.14）

1. HTTP orchestrator で要約。
2. 初回生成直後から RDE パネル表示。
3. **再監査** → `orchestrator /v1/rde/evaluate` 通知。
4. `.kotonoha/proposals/` `.kotonoha/audit/` を確認。

### C. obsidian-git-aware（v0.2.12）

1. `gitMode: obsidian-git-aware`。
2. branch/commit + Obsidian Git 状態表示。
3. HEAD / ソース変更後、適用時に confirm。

### D. metadataWriteMode（v0.2.15）

1. `prompt` → FM 追記前に confirm。
2. `off` → FM 変更なし、sidecar は保存。
3. `always`（git-aware 以外）→ FM 追記の 2 回目 confirm なし。
4. `always` + `obsidian-git-aware` → FM も confirm。

### E. RDE 監査回帰（mock）

1. `backendMode: mock`、**RDE 監査**。
2. 適用不可、**記録を閉じる** で audit sidecar。

## サインオフ


| 区分  | 実施者    | 日付         | 合格  |
| --- | ------ | ---------- | --- |
| A   | tomyuk | 2026-05-31 | OK |
| B   | tomyuk | 2026-05-31 | OK |
| C   | tomyuk | 2026-05-31 | OK |
| D   | tomyuk | 2026-05-31 | OK |
| E   | tomyuk | 2026-05-31 | OK |


