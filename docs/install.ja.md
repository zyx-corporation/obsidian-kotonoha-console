# Obsidian Kotonoha Console — インストール

**プラグイン:** `obsidian-kotonoha-console` v0.3.0  
**manifest id:** `kotonoha-console`  
**English:** [`install.md`](install.md)

---

## 前提

| 項目 | 要件 |
| --- | --- |
| Obsidian | **1.4.0+**（`manifest.json` の `minAppVersion`） |
| 配布形態 | GitHub Release のバイナリ資産（Community plugins 未掲載） |
| CLI backend を使う場合 | [`kotonoha >= 0.3.1`](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/tutorials/install_kotonoha_cli.md) |
| mock / http backend | CLI 不要 |

---

## 1. Release 資産を取得する

最新 Release: [obsidian-kotonoha-console Releases](https://github.com/zyx-corporation/obsidian-kotonoha-console/releases)

v0.3.0 以降、次のいずれかで入手できます。

| 方法 | 資産 |
| --- | --- |
| **zip（推奨）** | `obsidian-kotonoha-console-v0.3.0.zip` |
| 個別ファイル | `main.js`, `manifest.json`, `styles.css` |

---

## 2. vault に配置する

### 推奨パス（manifest id に合わせる）

```text
<vault>/.obsidian/plugins/kotonoha-console/
├── main.js
├── manifest.json
└── styles.css
```

### zip から入れる場合

Release zip 内のフォルダ名は `obsidian-kotonoha-console/` です。**配置時は `kotonoha-console` にリネーム**してください。

```bash
cd /path/to/your-vault/.obsidian/plugins
unzip ~/Downloads/obsidian-kotonoha-console-v0.3.0.zip
mv obsidian-kotonoha-console kotonoha-console
```

### 個別ファイルをコピーする場合

3 ファイルを上記ディレクトリに置きます。checksum は Release 添付の `*.sha256` を参照できます。

---

## 3. Obsidian で有効化する

1. vault を開く（またはリロード）
2. **Settings → Community plugins** → **Restricted mode を OFF**（初回必須）
3. 一覧で **Kotonoha Console** を **Enable**
4. バージョンが古い場合は、プラグインを OFF → ON で再読み込み

---

## 4. 初回設定

**Settings → Kotonoha Console**

| 設定 | 初回おすすめ |
| --- | --- |
| Backend | `mock`（CLI / orchestrator 不要）または `http` |
| sidecarMode | on（`.kotonoha/` に記録） |
| gitMode | `off` または `passive-observing` |

CLI backend を使う場合は、先に [CLI インストール](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/tutorials/install_kotonoha_cli.md) を完了し、Settings で `kotonoha` バイナリパスを指定してください。詳細: [`cli-runtime-compatibility.ja.md`](cli-runtime-compatibility.ja.md)

---

## 5. 動作確認

1. Markdown ノートを開く（例: 任意の `.md`）
2. Command palette → **Kotonoha Console を開く** または **RDE 監査を実施（アクティブノート）**
3. 提案生成 → Apply 前に確認ダイアログが出ること

受け入れチェックリスト: [`dogfood-acceptance.ja.md`](dogfood-acceptance.ja.md)

---

## 開発者向け（ソースからビルド）

Release 資産ではなくリポジトリから試す場合:

```bash
git clone https://github.com/zyx-corporation/obsidian-kotonoha-console.git
cd obsidian-kotonoha-console
npm ci && npm run build
npm run link:dev-vault   # dev-vault/.obsidian/plugins/kotonoha-console/ にコピー
```

詳細: [`IMPLEMENTATION.md`](../IMPLEMENTATION.md)

---

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| プラグイン一覧に出ない | Restricted mode OFF、vault リロード、`plugins/kotonoha-console/` に 3 ファイルがあるか確認 |
| 更新が反映されない | プラグイン OFF → ON、または manifest の version が変わっているか確認 |
| CLI backend が動かない | `kotonoha version` が **>= 0.3.1** か確認 |
| 選択範囲 Apply が全体置換になる | v0.3.0 以降を使用。Console 操作前にノートタブを開いたまま選択 |

---

## 関連

- [`README.md`](../README.md) — 現在地と境界
- [`cli-runtime-compatibility.ja.md`](cli-runtime-compatibility.ja.md) — backend / CLI 要件
- [`note-io-acceptance.ja.md`](note-io-acceptance.ja.md) — Note I/O 受け入れ
- [kotonoha-docs — Obsidian インストール](https://github.com/zyx-corporation/kotonoha-docs/blob/main/ja/manual/install_obsidian_kotonoha_console.md)
