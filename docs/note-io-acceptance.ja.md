# Note I/O acceptance（Obsidian Console v0.3）

**プラグイン:** `obsidian-kotonoha-console`  
**関連 issue:** #40  
**正本:** `kotonoha-spec` — Obsidian は first usable UI

---

## 受け入れ項目

| 項目 | v0.3 方針 |
| --- | --- |
| Active note read | filePath / title / sourceText / sourceHash / tags / links / frontmatter |
| Selection | 選択範囲がある場合 `selectionText` を context に含める。Console フォーカス中も対象ノートの open editor から取得 |
| Selection apply | 選択範囲のみ置換。未検出時は whole-note 誤上書きを **ブロック** |
| Frontmatter | apply 後も既存 frontmatter を保持 |
| metadataWriteMode | off / prompt / always（git-aware + always → prompt） |
| Source hash guard | 生成後に本文が変わったら apply 前に警告 |
| Target focus guard | Console focus 移動後も `targetFilePath` で正しいノートに apply |
| Human approval | Apply は常に explicit confirm |

---

## テスト

- `tests/buildNoteContext.test.ts`
- `tests/applyNoteContent.test.ts`
- `tests/noteIoGuards.test.ts`
- `tests/noteIoAcceptance.test.ts`
- `tests/metadataLineage.test.ts`

```bash
npm test -- activeNoteReader applyNoteContent noteIo metadataLineage
```

---

## 手動確認

1. `notes/sample1.md` を開く
2. 一部テキストを選択
3. mock または http backend で要約 / 書き換え
4. 「範囲: 選択テキスト」表示を確認
5. Apply → confirm ダイアログ
6. frontmatter 付きノートで apply 後も FM が保持されること

---

## 非目標（#40 scope 外）

- Release v0.3.0（#43）
- Advanced partial apply UX（v0.4）
- Sidecar schema redesign
- Backend UX redesign
