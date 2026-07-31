# Obsidian Kotonoha Console — インストール

**プラグイン:** `obsidian-kotonoha-console` **v0.4.0**\
**manifest id:** `kotonoha-console`  
**English:** [`install.md`](install.md)  
**Backend setup:** [`backend-setup.ja.md`](backend-setup.ja.md)（Mock / CLI / HTTP orchestrator）

---

## 前提

| 項目 | 要件 |
| --- | --- |
| Obsidian | **1.4.0+**（`manifest.json` の `minAppVersion`） |
| 配布形態 | [GitHub Release v0.4.0](https://github.com/zyx-corporation/obsidian-kotonoha-console/releases/tag/v0.4.0) |
| CLI backend を使う場合 | [`kotonoha-cli >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/tutorials/install_kotonoha_cli.md) |
| mock / http backend | CLI 不要（HTTP 要約には [orchestrator](backend-setup.ja.md#mode-c-http-orchestrator-backend) 起動が必要） |

---

## 最短手順

| 目的 | 手順 |
| --- | --- |
| UI 確認だけ | プラグイン配置 → 有効化 → Backend `mock` |
| CLI で RDE 監査 | プラグイン + [`kotonoha-cli >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/tutorials/install_kotonoha_cli.md) → Backend `cli` |
| LLM 要約・拡張 | プラグイン + [orchestrator 起動](backend-setup.ja.md#mode-c-http-orchestrator-backend) → Backend `http` |

詳細: [`backend-setup.ja.md`](backend-setup.ja.md)

## 1. Release 資産を取得する

| 方法 | 資産 |
| --- | --- |
| **zip（推奨）** | `obsidian-kotonoha-console-v0.4.0.zip` |
| 個別ファイル | `main.js`, `manifest.json`, `styles.css` |

---

## 2. vault に配置する

### 推奨パス

```text
<vault>/.obsidian/plugins/kotonoha-console/
├── main.js
├── manifest.json
└── styles.css
```

### zip から入れる場合

Release zip 内のフォルダ名は **`kotonoha-console/`** です。そのまま配置できます。

```bash
cd /path/to/your-vault/.obsidian/plugins
unzip ~/Downloads/obsidian-kotonoha-console-v0.4.0.zip
```

### 個別ファイルをコピーする場合

3 ファイルを上記ディレクトリに置きます。checksum は Release 添付の `*.sha256` を参照できます。

---

## 3. Obsidian で有効化する

1. vault を開く（またはリロード）
2. **Settings → Community plugins** → **Restricted mode を OFF**
3. **Kotonoha Console** を **Enable**
4. 更新時はプラグイン OFF → ON

---

## 4. 初回設定

**Settings → Kotonoha Console**

| 設定 | 初回おすすめ |
| --- | --- |
| Backend | `mock` または `http` |
| sidecarMode | on |
| gitMode | `off` または `passive-observing` |

CLI / HTTP の詳細: [`backend-setup.ja.md`](backend-setup.ja.md)

---

## 5. 動作確認

1. Markdown ノートを開く
2. Command palette → **Kotonoha Console を開く**
3. 提案生成 → Apply 前に確認ダイアログが出ること

---

## 開発者向け

```bash
npm ci && npm run build && npm run link:dev-vault
```

詳細: [`IMPLEMENTATION.md`](../IMPLEMENTATION.md)

---

## 関連

- [`README.md`](../README.md)
- [`backend-setup.ja.md`](backend-setup.ja.md)
- [`note-io-acceptance.ja.md`](note-io-acceptance.ja.md)
