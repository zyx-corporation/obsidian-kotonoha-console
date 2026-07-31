# Sidecar spec alignment（Obsidian Console）

**プラグイン:** `obsidian-kotonoha-console` v0.3  
**関連 issue:** #41  
**正本:** [`kotonoha-spec`](https://github.com/zyx-corporation/kotonoha-spec)

English summary: sidecars under `.kotonoha/` are **local/plugin evidence records**, not normative SLS storage.

---

## 方針

| 項目 | v0.3 方針 |
| --- | --- |
| 正本 | `kotonoha-spec/docs/` |
| Sidecar の位置づけ | local/plugin records（complete SLS storage ではない） |
| Schema migration | 破壊的変更しない |
| Engine metadata (#38) | optional、欠落しても invalid にしない |
| Unknown fields | 互換性のため許容（validator は warning も出さない） |
| Validation レベル | lint/helper（runtime hard-fail しない） |

参照すべき spec 文書:

- `kotonoha-spec/docs/current-official-architecture.md`
- `kotonoha-spec/docs/core-responsibility-boundary.md`
- `kotonoha-spec/docs/orchestrator-api-stability-boundary.md`

---

## 生成される sidecar

| パス | 用途 |
| --- | --- |
| `.kotonoha/proposals/*.proposal.json` | 提案メタデータ + source anchor |
| `.kotonoha/audit/*.rde-audit.json` | RDE 監査 envelope + `rde` payload |
| `.kotonoha/reviews/*.review.json` | 人手レビュー決定 |

提案本文（`proposedText`）は sidecar には hash のみ保存し、UI / vault 上の提案表示が実体です。

v0.4 では各 sidecar に任意の `exportCorrelation` を付ける。これは Obsidian sidecar と CLI/M6 export を照合するための **read-only hint** であり、canonical SLS storage ではない。

`exportCorrelation` が参照する主なキー:

- local: `proposalId`, `requestId`, `filePath`, `sourceHash`, `proposalHash`, `gitCommit`, `projectId`
- M6 export: `kotonoha.m6_project_audit_export.v0.1`, `project_id`, `exports[].meaning_delta.id`, `exports[].meaning_delta.git_commit`, `exports[].meaning_delta.file_path`, `exports[].rde_assessments[].audit_correlation_id`

`projectId` や `gitCommit` がない場合、`status: "missing"` として保存し、処理は継続する。

---

## 最小 validation（実装）

`src/sidecar/validateSidecar.ts`:

- `validateProposalSidecar`
- `validateAuditSidecar`
- `validateReviewSidecar`

`SidecarStore` 書き込み時に validation を実行し、問題があれば `console.warn` のみ（書き込みは継続）。

必須フィールド欠落 → **error**（テストで assert、runtime では warn）  
engine metadata 欠落 → **OK**（legacy 互換）  
unknown field → **OK**

---

## 非目標（#41 scope 外）

- `kotonoha-spec` への JSON Schema 昇格
- complete SLS storage 実装
- Complete SLS storage 実装
- Note I/O 完了（#40）
- Release 作業（#43）

---

## テスト

`tests/sidecarValidation.test.ts` — valid/legacy/invalid fixture と unknown field 許容。

```bash
npm test -- sidecarValidation
```
