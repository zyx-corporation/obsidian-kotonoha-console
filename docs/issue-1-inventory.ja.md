# Obsidian Issue #1 棚卸し

棚卸し日: 2026-08-01

対象: [#1 Personal M4 UI: Obsidian plugin for note-centered RDE and semantic lineage workflow](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/1)

## GitHub Issue 状態

| 項目 | 状態 |
| --- | --- |
| Repository | `zyx-corporation/obsidian-kotonoha-console` |
| Issue | [#1](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/1) |
| 状態 | **Closed** |
| 作成 | 2026-05-22 |
| 最終更新 | 2026-08-01 |
| Close | 2026-08-01（[close comment](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/1#issuecomment-5149807290)） |
| ラベル | `M4`, `obsidian`, `personal-use`, `ui`, `spec-alignment` |
| マイルストーン | なし |
| 位置づけ | Obsidian personal UI の初期 Epic / anchor |

## 要旨

Issue #1 は、Obsidian を「個人のノート・草稿・研究メモ向け RDE / semantic lineage UI」として位置づける初期 Epic である。

当初本文の最小ワークフローは、v0.3.0 から v0.5.0 にかけて実装・文書化済みと判断できる。追加コメントで増えた Git-aware 方針、Git を所有しない境界、GitHub Issue / PR handoff は、現在の README、Git mode spec、v0.5 dogfood record、および #70〜#75 の完了で受け止め済みである。

したがって、#1 は「未完の実装 Issue」ではなく、**初期 Epic として Close**した。今後の作業は個別 Issue へ分解して扱う。

## 本文の Acceptance 棚卸し

### Minimum useful personal workflow

| #1 の完了条件 | 現状 | 主な証跡 |
| --- | --- | --- |
| Plugin loads in Obsidian development mode | 充足 | `README.md`, `IMPLEMENTATION.md`, `docs/dogfood-acceptance.ja.md` |
| CLI path, project path, database URL を設定できる | 充足 | `README.md` Backend setup, `src/settings/PluginSettings.ts`, `docs/backend-setup.ja.md` |
| Current note を CLI-backed flow に渡せる | 充足 | `src/client/CliKotonohaClient.ts`, `src/obsidian/buildNoteContext.ts`, `tests/cliKotonohaClient.test.ts` |
| RDE JSON を CLI/core 経由で validate できる | 充足 | `README.md` Current status, `IMPLEMENTATION.md`, `src/services/RdeAuditService.ts` |
| Validation errors を UI に表示できる | 充足 | `src/ui/RdeAuditView.ts`, `src/rde/*`, `tests/rdeAuditAcceptance.test.ts` |
| Valid RDE を current note / MeaningDelta に attach する導線 | 部分充足 | v0.5 では local sidecar / summary block / handoff が中心。完全な canonical SLS storage ではないことを明示 |
| Human review decision を記録できる | 充足 | `IMPLEMENTATION.md` Phase 5, `src/services/ApprovalService.ts`, `tests/approvalService.test.ts` |
| Human-readable RDE summary block を note に挿入できる | 充足 | `docs/v0.5-dogfood-record.ja.md` Phase 2, `src/reviewDestination/reviewHandoff.ts`, `tests/reviewHandoff.test.ts` |

### Boundary and safety

| #1 の完了条件 | 現状 | 主な証跡 |
| --- | --- | --- |
| 任意 shell command を呼ばない | 充足方針あり | CLI backend は `kotonoha` 委譲。Git mutation は禁止 |
| Kotonoha 操作は CLI / core へ委譲 | 充足 | `README.md`, `docs/backend-setup.ja.md`, `src/client/CliKotonohaClient.ts` |
| RDE output を final approval と主張しない | 充足 | `README.md` Boundary, `docs/rde-audit-policy.ja.md`, UI文言 |
| 新しい SLS normative interchange を定義しない | 充足 | `README.md` Boundary, `docs/architecture.ja.md` |
| Obsidian metadata は local/plugin metadata と文書化 | 充足 | `README.md` Current status, `docs/git-mode-spec.ja.md`, `docs/v0.5-dogfood-record.ja.md` |

### Phase / Milestone alignment

| #1 の完了条件 | 現状 | 主な証跡 |
| --- | --- | --- |
| phase/milestone 定義へのリンク | 部分充足 | README は runtime / docs への導線を持つが、本文の指定リンクそのものは現状の文脈で置換されている |
| M4 practical operations の personal/UI surface と明記 | 充足 | #1 本文、README Current status / Boundary |
| SLS-9 Phase 2 validation は CLI/core に残す | 充足 | README CLI mode, backend setup, CLI runtime compatibility |

## 追加コメントの棚卸し

| 追加論点 | 現状 | 主な証跡 |
| --- | --- | --- |
| Git-aware vault integration | 充足 / 方針確定 | `docs/git-mode-spec.ja.md`, `src/obsidian/GitContextReader.ts`, `tests/gitReadonly.test.ts` |
| No Obsidian Git plugin mode | 充足 | `docs/git-mode-spec.ja.md`: Git は optional、default `off` |
| Git-aware but not Git-owning | 充足 | README Git mode policy, `docs/git-mode-spec.ja.md` |
| Commit comments / annotations | Future / opt-in | v0.5 では planned handoff 扱い。自動投稿なし |
| Issue / PR correlation and publishing workflow | 充足 / v0.5 化 | `docs/v0.5-dogfood-record.ja.md`, `src/reviewDestination/*`, #70〜#75 |

## v0.5 分解 Issue

| Issue | Focus | 状態 |
| --- | --- | --- |
| [#70](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/70) | review destination model and local-only UX | Closed |
| [#71](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/71) | copy / insert RDE summary block | Closed |
| [#72](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/72) | GitHub Issue draft text | Closed |
| [#73](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/73) | existing Issue / PR references | Closed |
| [#74](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/74) | PR summary handoff | Closed |
| [#75](https://github.com/zyx-corporation/obsidian-kotonoha-console/issues/75) | v0.5 release prep | Closed |

Management parent: [kotonoha-management#184](https://github.com/zyx-corporation/kotonoha-management/issues/184)

## Release / distribution 状態

| 項目 | 状態 |
| --- | --- |
| package version | `0.5.0` |
| manifest version | `0.5.0` |
| latest checked tag | `v0.5.0` |
| GitHub Release | [v0.5.0 — Review Destination / Publication Handoff](https://github.com/zyx-corporation/obsidian-kotonoha-console/releases/tag/v0.5.0) |
| release assets | `main.js`, `manifest.json`, `styles.css`, zip, sha256 files |

## 残判断（採用済み）

Issue #1 に対して残っていたのは、実装タスクではなく Issue 運用上の判断であった。

採用: **1. #1 を初期 Epic として Close する。**

Close コメントでは、v0.3〜v0.5 の証跡、#70〜#75、v0.5.0 release、今後は個別 Issue へ分解する方針を示した。

理由は、Issue #1 の本文と追加コメントで定義された主要な境界・ワークフローが、v0.5.0 までに個別 Issue と release evidence へ移ったため。
