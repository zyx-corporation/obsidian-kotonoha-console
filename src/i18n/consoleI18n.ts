import type { OperationType, GitContextSnapshot, GitMode } from "../domain/types";
import type { RdeLang } from "../rde/rdeI18n";
import { normalizeRdeLang } from "../rde/rdeI18n";

type Params = Record<string, string | number>;

function fmt(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

const MSGS = {
  en: {
    viewTitle: "Kotonoha Console",
    tagline: "Proposals are never auto-applied.",
    noActiveNote: "Open an active Markdown note.",
    scopeSelection: "Scope: selection",
    gitMode: "Git: {mode}",
    gitPassiveSnapshot: "{branch} @ {commit} · {dirty}",
    gitDirty: "dirty",
    gitClean: "clean",
    gitObsidianGitActive: "Obsidian Git: active",
    gitObsidianGitAbsent: "Obsidian Git: not detected (read-only Git context only)",
    gitRepoPath: "path: {path}",
    labelOperation: "Operation",
    labelInstruction: "Instruction",
    instructionPlaceholder: "Optional instruction…",
    btnRdeAudit: "Run RDE audit",
    btnGenerate: "Generate proposal",
    proposalTitle: "Proposal",
    proposalReviseTitle: "Proposal (editing)",
    auditReportTitle: "RDE audit report",
    btnApply: "Apply",
    btnRevise: "Revise",
    btnReject: "Reject",
    btnCopy: "Copy",
    btnCloseRecord: "Close record",
    btnApplyRevision: "Apply revision",
    btnReAudit: "Re-audit",
    btnCancelRevise: "Cancel revise",
    opRdeAudit: "RDE audit",
    opSummarize: "Summarize",
    opRewrite: "Rewrite",
    opExpand: "Expand",
    opCustom: "Custom",
    noticeNoNote: "No active note",
    noticeTargetFileMissing: "Target note not found: {path}",
    noticeAuditDone: "RDE audit complete{saved}",
    noticeSavedSidecar: " (saved to .kotonoha/)",
    noticeSavedUiOnly: " (UI only — sidecarMode off)",
    noticeProposalReady: "Proposal ready (not applied)",
    noticeFailed: "Failed: {msg}",
    noticeAuditNoApply: "RDE audit report cannot be applied to the note (use Copy)",
    noticeApplied: "Applied (audit logged)",
    noticeAppliedRevised: "Applied revised text (partially_applied)",
    noticeRejected: "Rejected",
    noticeAuditDismissed: "Audit recorded (dismissed)",
    noticeCopied: "Copied to clipboard",
    noticeReviseMode: "Revise mode — edit, then Apply revision or Re-audit",
    noticeReAuditDone: "Re-audit complete (local rule-based)",
    noticeReAuditDoneOrchestrator: "Re-audit complete (orchestrator /v1/rde/evaluate)",
    noticeRdeAuditWithEngine: "RDE audit complete — {engineLine}{saved}",
    auditEngineLabel: "Engine",
    auditEngineOrchestrator: "orchestrator / stable adapter",
    auditEngineLocal: "local / rule-based guardrails",
    auditEngineMock: "mock / test backend",
    auditEngineCli: "cli / rde emit + validate",
    auditEngineGateway: "gateway / local rule-based audit",
    auditEngineLocalCaution: "not full RDE evaluation",
    auditEngineCliCaution:
      "interchange skeleton / local rule-based guardrails only; not full RDE evaluation",
    applyScopeWholeNote: "Apply scope: whole note",
    applyScopeSelection: "Apply scope: selected text ({chars} chars)",
    applyScopeUnsupported: "Apply scope unavailable: {reason}",
    exportCorrelationAvailable:
      "Export correlation: project {projectId} · commit {commit} · {path}",
    exportCorrelationMissing:
      "Export correlation: local sidecar only ({reason} unavailable)",
    reviewDestinationLocalOnly:
      "Review destination: Local only — sidecar/note history is the Kotonoha record; GitHub handoff is explicit.",
    confirmSourceChanged:
      "Source has changed. Re-audit or explicit override is required. Continue?",
    confirmGitHeadChanged:
      "Git HEAD changed since generation (Obsidian Git may have synced). Re-audit recommended. Continue?",
    confirmRevisionAuditStale:
      "The revised text changed after the last audit. Re-audit is recommended. Continue anyway?",
    confirmApply: "Apply this proposal to the note? Original text will be overwritten.",
    confirmApplyWholeNote:
      "Apply this proposal to the whole note? Original note content will be overwritten.",
    confirmApplySelection:
      "Apply this proposal to the selected text only? The rest of the note will be preserved.",
    noticeApplyScopeUnsupported: "Apply blocked: {reason}",
    noticeOpenEditor: "Open the note in the editor to apply selection",
    noticeSelectionNotFound:
      "Selection text was not found in the note — apply blocked to avoid whole-note overwrite",
    mockRdeSummary: "[mock] RDE audit · {title}",
    mockOpSummary: "[mock] {operation} · {title}",
    mockUncertainty:
      "Mock backend — connect HTTP or CLI in settings for real Kotonoha output.",
    cliRdeSummary: "[cli] RDE audit · {path}",
    noInstruction: "(no instruction)",
    settingsTitle: "Kotonoha Console",
    settingsBackendModeName: "Backend mode",
    settingsBackendModeDesc:
      "cli = kotonoha CLI; RDE audit works without Git; context export only when gitMode ≠ off",
    settingsBackendMockInfo:
      "Backend: mock / test backend\nNo remote connection is required.\nOutput is for UI/dev testing only.",
    settingsBackendHttpInfo:
      "Backend: http\nAuto-detects orchestrator / gateway / console proxy.\nStable adapter: /v1/rde/evaluate when orchestrator is detected.\nExperimental: /v1/proposals/generate.",
    settingsBackendCliInfo:
      "Backend: cli / first stable runtime\nRequires kotonoha >= 0.3.1.\nCLI is runtime, not the normative specification.",
    settingsCliRuntimeWarning:
      "CLI is the first stable runtime — not the normative kotonoha-spec source.",
    settingsHttpStableOrchestrator: "/v1/rde/evaluate (stable adapter)",
    settingsHttpStableGateway: "tool / context export where supported",
    settingsHttpStableConsole: "health / console proxy detection",
    settingsHttpExperimentalOrchestrator: "/v1/proposals/generate (experimental / best-effort)",
    settingsHttpExperimentalGateway:
      "generative rewrite via external orchestrator; RDE: local rule-based guardrails only",
    settingsHttpExperimentalConsole:
      "proposal generation may be available; RDE may fall back to local guardrails",
    settingsHttpProposalExperimentalWarning:
      "/v1/proposals/generate is experimental and best-effort. Do not treat generated proposals as accepted lineage.",
    settingsHttpEndpointPortNote:
      "Default example: http://127.0.0.1:8000 — dogfood/local dev may use http://127.0.0.1:8001.",
    noticeHttpCapabilitiesStable: "Stable: {line}",
    noticeHttpCapabilitiesExperimental: "Experimental: {line}",
    settingsCliSection: "CLI (kotonoha ≥ 0.3.1)",
    settingsCliCommandName: "CLI command",
    settingsCliCommandDesc: "Path to the kotonoha binary (absolute path if not on PATH)",
    settingsBtnTestVersion: "Test version",
    settingsCliWorkdirName: "CLI workdir",
    settingsCliWorkdirDesc:
      "Vault path or project root used as cwd / --path (empty = vault folder)",
    settingsCliWorkdirPlaceholder: "(vault path)",
    settingsDatabaseUrlDesc: "Optional; passed to CLI env for DB-backed commands",
    settingsCliPrincipalDesc: "Optional; passed to CLI as KOTONOHA_PRINCIPAL_ID",
    settingsCliProjectDesc: "Optional; passed to CLI as KOTONOHA_PROJECT_ID",
    settingsGitModeName: "Git mode",
    settingsGitModeDesc: "Git-aware but never mutates the repo (git-mode-spec)",
    settingsMetadataWriteModeName: "Metadata write mode",
    settingsMetadataWriteModeDesc:
      "Optional `kotonoha:` YAML in frontmatter on apply (git-mode-spec §8). Sidecar records are always kept.",
    confirmWriteMetadata:
      "Add Kotonoha lineage fields to note frontmatter (review_status, proposal id)?",
    settingsDefaultLanguageName: "Default language",
    settingsLangJa: "Japanese (ja)",
    settingsLangEn: "English (en)",
    settingsLangZhCn: "Simplified Chinese (zh_CN)",
    settingsRequireApprovalName: "Require human approval before apply",
    settingsEnableRdeAuditName: "Enable RDE audit panel",
    settingsAuditLogModeName: "Audit log mode",
    noticeCliOk: "kotonoha ok",
    noticeCliVersionOk: "CLI OK: {line} (>= {version})",
    noticeCliVersionTooOld: "CLI version too old: {version} (need >= {min}). cwd: {cwd}",
    noticeCliVersionUnparseable: "CLI version unparseable: {line}. {msg}",
    noticeCliCommandNotFound: "CLI command not found: {bin} (cwd: {cwd}). {msg}",
    noticeCliError: "CLI error: {msg}",
    noticeCliSpawnFailed: "CLI spawn failed: {msg}",
    settingsDiagnostic: "Plugin v{version} · UI sample: {sample}",
    settingsBtnReloadPlugin: "Reload plugin (apply code updates)",
    noticePluginReloaded: "Kotonoha Console reloaded (v{version})",
    noticeLanguageChanged: "Display language: {lang}",
    cmdOpenConsole: "Open Kotonoha Console",
    cmdRunRdeAudit: "Run RDE audit (active note)",
    cliUncertaintyRdeAudit:
      "Rule-based source review + CLI `rde emit`/`validate` (interchange skeleton only — not full RDE). DB attach when DATABASE_URL is configured.",
    cliUncertaintyContextExport:
      "Generative rewrite requires an orchestrator/LLM; proposal embeds `kotonoha context export`. Local rule-based RDE audit attached.",
    cliUncertaintyGitOff:
      "gitMode is off — Git-aware CLI not used (git-mode-spec §4). Local rule-based RDE audit attached.",
    cliUncertaintyLocalOnly:
      "Local anchors only (path + source_hash). Local rule-based RDE audit attached.",
    cliUncertaintyExportFailed:
      "Git-aware context export failed; using path + source_hash anchors.",
    settingsHttpSection: "HTTP (orchestrator / gateway / LLM proxy)",
    settingsHttpEndpointName: "HTTP endpoint",
    settingsHttpEndpointDesc:
      "Orchestrator (default :8000), Gateway (:8787), or console LLM proxy. Auto-detects backend.",
    settingsHttpEndpointPlaceholder: "http://127.0.0.1:8000",
    settingsHttpApiKeyName: "HTTP API key (optional)",
    settingsHttpApiKeyDesc: "Bearer token when gateway/orchestrator auth is enabled",
    settingsBtnTestHttp: "Test connection",
    noticeHttpOk: "HTTP OK: {status} · {backend} @ {endpoint}",
    noticeHttpFailed: "HTTP failed @ {endpoint}: {msg}",
    settingsTestBackendName: "Test backend connection",
    settingsTestBackendDesc: "mock / CLI version / HTTP health + backend auto-detect",
    settingsBtnTestBackend: "Run connection test",
    cmdTestBackend: "Test Kotonoha backend connection",
    noticeMockBackendOk:
      "Mock backend / test backend — no remote connection required",
    httpOrchestratorRdeSummary: "[http/orchestrator] RDE audit · {path}",
    httpGatewaySummary: "[http/gateway] {operation} · {path}",
    httpLocalSummary: "[http/local] {operation} · {path}",
    httpUncertaintyOrchestratorRde:
      "Orchestrator RDE evaluate + local rule-based guardrails (not full LLM RDE).",
    httpUncertaintyOrchestratorNoLlm:
      "Orchestrator has no /v1/proposals/generate LLM proxy — local anchors only.",
    httpUncertaintyGateway:
      "Gateway context export only — connect /v1/proposals/generate for generative rewrite.",
    httpUncertaintyGatewayRde:
      "Gateway mode — local rule-based RDE audit (use orchestrator for /v1/rde/evaluate).",
    httpProposalEndpointMissing:
      "POST /v1/proposals/generate not found — deploy an orchestrator LLM proxy or use CLI/mock.",
  },
  ja: {
    viewTitle: "Kotonoha Console",
    tagline: "提案は自動適用されません。",
    noActiveNote: "アクティブな Markdown ノートを開いてください。",
    scopeSelection: "範囲: 選択テキスト",
    gitMode: "Git: {mode}",
    gitPassiveSnapshot: "{branch} @ {commit} · {dirty}",
    gitDirty: "変更あり",
    gitClean: "クリーン",
    gitObsidianGitActive: "Obsidian Git: 有効",
    gitObsidianGitAbsent: "Obsidian Git: 未検出（Git context のみ読取）",
    gitRepoPath: "パス: {path}",
    labelOperation: "操作",
    labelInstruction: "指示",
    instructionPlaceholder: "任意の指示…",
    btnRdeAudit: "RDE 監査を実施",
    btnGenerate: "提案を生成",
    proposalTitle: "提案",
    proposalReviseTitle: "提案（改訂中）",
    auditReportTitle: "RDE 監査レポート",
    btnApply: "適用",
    btnRevise: "改訂",
    btnReject: "却下",
    btnCopy: "コピー",
    btnCloseRecord: "記録を閉じる",
    btnApplyRevision: "改訂を適用",
    btnReAudit: "再監査",
    btnCancelRevise: "改訂をキャンセル",
    opRdeAudit: "RDE 監査",
    opSummarize: "要約",
    opRewrite: "書き換え",
    opExpand: "拡張",
    opCustom: "カスタム",
    noticeNoNote: "アクティブなノートがありません",
    noticeTargetFileMissing: "対象ノートが見つかりません: {path}",
    noticeAuditDone: "RDE 監査完了{saved}",
    noticeSavedSidecar: "（.kotonoha/ に保存）",
    noticeSavedUiOnly: "（sidecarMode off — UI のみ）",
    noticeProposalReady: "提案の準備完了（未適用）",
    noticeFailed: "失敗: {msg}",
    noticeAuditNoApply: "RDE 監査レポートはノートに適用できません（コピーを使用）",
    noticeApplied: "適用しました（監査ログ記録済み）",
    noticeAppliedRevised: "改訂テキストを適用しました（partially_applied）",
    noticeRejected: "却下しました",
    noticeAuditDismissed: "監査を記録（却下）",
    noticeCopied: "クリップボードにコピーしました",
    noticeReviseMode: "改訂モード — 編集後、改訂を適用または再監査",
    noticeReAuditDone: "再監査完了（local rule-based）",
    noticeReAuditDoneOrchestrator: "再監査完了（orchestrator /v1/rde/evaluate）",
    noticeRdeAuditWithEngine: "RDE監査完了 — {engineLine}{saved}",
    auditEngineLabel: "監査エンジン",
    auditEngineOrchestrator: "orchestrator / stable adapter",
    auditEngineLocal: "local / rule-based guardrails",
    auditEngineMock: "mock / test backend",
    auditEngineCli: "cli / rde emit + validate",
    auditEngineGateway: "gateway / local rule-based audit",
    auditEngineLocalCaution: "full RDE ではありません",
    auditEngineCliCaution:
      "interchange skeleton / rule-based guardrails のみ — full RDE ではありません",
    applyScopeWholeNote: "適用範囲: ノート全体",
    applyScopeSelection: "適用範囲: 選択テキスト（{chars}文字）",
    applyScopeUnsupported: "適用範囲を確定できません: {reason}",
    exportCorrelationAvailable:
      "Export 相関: project {projectId} · commit {commit} · {path}",
    exportCorrelationMissing:
      "Export 相関: local sidecar のみ（{reason} 不明）",
    reviewDestinationLocalOnly:
      "レビュー先: Local only — sidecar / ノート履歴が Kotonoha の記録です。GitHub への引き渡しは明示操作です。",
    confirmSourceChanged:
      "ソースが変更されています。再監査または明示的な上書きが必要です。続行しますか？",
    confirmGitHeadChanged:
      "生成後に Git HEAD が変わっています（Obsidian Git の同期の可能性）。再監査を推奨します。続行しますか？",
    confirmRevisionAuditStale:
      "最後の監査後に改訂テキストが変更されています。再監査を推奨します。このまま続行しますか？",
    confirmApply: "この提案をノートに適用しますか？元のテキストは上書きされます。",
    confirmApplyWholeNote:
      "この提案をノート全体に適用しますか？元のノート本文は上書きされます。",
    confirmApplySelection:
      "この提案を選択テキストだけに適用しますか？ノートの他の部分は保持されます。",
    noticeApplyScopeUnsupported: "適用を中止しました: {reason}",
    noticeOpenEditor: "エディタでノートを開いてから選択範囲に適用してください",
    noticeSelectionNotFound:
      "選択テキストがノート内に見つかりません — ノート全体の誤上書きを防ぐため適用を中止しました",
    mockRdeSummary: "[mock] RDE 監査 · {title}",
    mockOpSummary: "[mock] {operation} · {title}",
    mockUncertainty:
      "Mock バックエンド — 設定で HTTP または CLI に接続してください。",
    cliRdeSummary: "[cli] RDE 監査 · {path}",
    noInstruction: "（指示なし）",
    settingsTitle: "Kotonoha Console",
    settingsBackendModeName: "バックエンドモード",
    settingsBackendModeDesc:
      "cli = kotonoha CLI。RDE 監査は Git なしで動作。context export は gitMode ≠ off のときのみ",
    settingsBackendMockInfo:
      "Backend: mock / test backend\nリモート接続は不要です。\n出力は UI / 開発テスト用です。",
    settingsBackendHttpInfo:
      "Backend: http\norchestrator / gateway / console proxy を自動検出します。\nStable adapter: orchestrator 検出時の /v1/rde/evaluate。\nExperimental: /v1/proposals/generate。",
    settingsBackendCliInfo:
      "Backend: cli / first stable runtime\nkotonoha >= 0.3.1 が必要です。\nCLI は runtime であり、仕様正本ではありません。",
    settingsCliRuntimeWarning:
      "CLI は first stable runtime です — kotonoha-spec の正本ではありません。",
    settingsHttpStableOrchestrator: "/v1/rde/evaluate（stable adapter）",
    settingsHttpStableGateway: "tool / context export（対応時）",
    settingsHttpStableConsole: "health / console proxy 検出",
    settingsHttpExperimentalOrchestrator:
      "/v1/proposals/generate（experimental / best-effort）",
    settingsHttpExperimentalGateway:
      "生成系 rewrite は外部 orchestrator 経由；RDE は local rule-based guardrails のみ",
    settingsHttpExperimentalConsole:
      "proposal 生成が利用可能な場合あり；RDE は local guardrails にフォールバック可",
    settingsHttpProposalExperimentalWarning:
      "/v1/proposals/generate は experimental / best-effort です。生成 proposal を承認済み lineage として扱ってはいけません。",
    settingsHttpEndpointPortNote:
      "既定例: http://127.0.0.1:8000 — dogfood / local dev では http://127.0.0.1:8001 を使う場合があります。",
    noticeHttpCapabilitiesStable: "Stable: {line}",
    noticeHttpCapabilitiesExperimental: "Experimental: {line}",
    settingsCliSection: "CLI（kotonoha ≥ 0.3.1）",
    settingsCliCommandName: "CLI コマンド",
    settingsCliCommandDesc: "kotonoha バイナリのパス（PATH に無い場合は絶対パス）",
    settingsBtnTestVersion: "バージョン確認",
    settingsCliWorkdirName: "CLI 作業ディレクトリ",
    settingsCliWorkdirDesc:
      "cwd / --path に使う vault またはプロジェクトルート（空 = vault フォルダ）",
    settingsCliWorkdirPlaceholder: "（vault パス）",
    settingsDatabaseUrlDesc: "任意。CLI 環境変数として DB 連携コマンドに渡されます",
    settingsCliPrincipalDesc: "任意。CLI 環境変数 KOTONOHA_PRINCIPAL_ID として渡されます",
    settingsCliProjectDesc: "任意。CLI 環境変数 KOTONOHA_PROJECT_ID として渡されます",
    settingsGitModeName: "Git モード",
    settingsGitModeDesc: "Git 連携（リポジトリは変更しません — git-mode-spec）",
    settingsMetadataWriteModeName: "メタデータ書き込み",
    settingsMetadataWriteModeDesc:
      "適用時に frontmatter へ任意の `kotonoha:` YAML を追記（git-mode-spec §8）。sidecar は常に保存されます。",
    confirmWriteMetadata:
      "ノートの frontmatter に Kotonoha 系譜フィールド（review_status、proposal id）を追記しますか？",
    settingsDefaultLanguageName: "表示言語",
    settingsLangJa: "日本語 (ja)",
    settingsLangEn: "English (en)",
    settingsLangZhCn: "简体中文 (zh_CN)",
    settingsRequireApprovalName: "適用前に人手承認を必須にする",
    settingsEnableRdeAuditName: "RDE 監査パネルを有効化",
    settingsAuditLogModeName: "監査ログモード",
    noticeCliOk: "kotonoha ok",
    noticeCliVersionOk: "CLI OK: {line}（>= {version}）",
    noticeCliVersionTooOld: "CLI バージョンが古い: {version}（>= {min} 必要）。cwd: {cwd}",
    noticeCliVersionUnparseable: "CLI バージョンを解析できません: {line}。{msg}",
    noticeCliCommandNotFound: "CLI コマンドが見つかりません: {bin}（cwd: {cwd}）。{msg}",
    noticeCliError: "CLI エラー: {msg}",
    noticeCliSpawnFailed: "CLI 起動失敗: {msg}",
    settingsDiagnostic: "プラグイン v{version} · UI 確認: {sample}",
    settingsBtnReloadPlugin: "プラグインを再読み込み（コード更新を反映）",
    noticePluginReloaded: "Kotonoha Console を再読み込みしました（v{version}）",
    noticeLanguageChanged: "表示言語: {lang}",
    cmdOpenConsole: "Kotonoha Console を開く",
    cmdRunRdeAudit: "RDE 監査を実施（アクティブノート）",
    cliUncertaintyRdeAudit:
      "ルールベース source review + CLI `rde emit`/`validate`（interchange スケルトンのみ — full RDE ではない）。DATABASE_URL 設定時は DB 連携可。",
    cliUncertaintyContextExport:
      "生成系 rewrite には orchestrator/LLM が必要。提案に `kotonoha context export` を埋め込み。local rule-based RDE 監査付き。",
    cliUncertaintyGitOff:
      "gitMode off — Git 連携 CLI 未使用（git-mode-spec §4）。local rule-based RDE 監査付き。",
    cliUncertaintyLocalOnly:
      "ローカルアンカーのみ（path + source_hash）。local rule-based RDE 監査付き。",
    cliUncertaintyExportFailed:
      "Git 連携 context export 失敗。path + source_hash アンカーを使用。",
    settingsHttpSection: "HTTP（orchestrator / gateway / LLM proxy）",
    settingsHttpEndpointName: "HTTP エンドポイント",
    settingsHttpEndpointDesc:
      "Orchestrator（既定 :8000）、Gateway（:8787）、または console LLM proxy。バックエンド自動検出。",
    settingsHttpEndpointPlaceholder: "http://127.0.0.1:8000",
    settingsHttpApiKeyName: "HTTP API キー（任意）",
    settingsHttpApiKeyDesc: "gateway/orchestrator 認証有効時の Bearer トークン",
    settingsBtnTestHttp: "接続テスト",
    noticeHttpOk: "HTTP OK: {status} · {backend} @ {endpoint}",
    noticeHttpFailed: "HTTP 失敗 @ {endpoint}: {msg}",
    settingsTestBackendName: "バックエンド接続テスト",
    settingsTestBackendDesc: "mock / CLI バージョン / HTTP ヘルス + バックエンド自動検出",
    settingsBtnTestBackend: "接続テストを実行",
    cmdTestBackend: "Kotonoha バックエンド接続テスト",
    noticeMockBackendOk:
      "Mock backend / test backend — リモート接続は不要です",
    httpOrchestratorRdeSummary: "[http/orchestrator] RDE 監査 · {path}",
    httpGatewaySummary: "[http/gateway] {operation} · {path}",
    httpLocalSummary: "[http/local] {operation} · {path}",
    httpUncertaintyOrchestratorRde:
      "Orchestrator RDE evaluate + local rule-based guardrails（full LLM RDE ではない）。",
    httpUncertaintyOrchestratorNoLlm:
      "Orchestrator に /v1/proposals/generate LLM proxy なし — ローカルアンカーのみ。",
    httpUncertaintyGateway:
      "Gateway context export のみ — 生成系は /v1/proposals/generate を接続。",
    httpUncertaintyGatewayRde:
      "Gateway モード — local rule-based RDE 監査（orchestrator の /v1/rde/evaluate は別途）。",
    httpProposalEndpointMissing:
      "POST /v1/proposals/generate がありません — orchestrator LLM proxy または CLI/mock を使用。",
  },
  zh_CN: {
    viewTitle: "Kotonoha Console",
    tagline: "提案不会自动应用。",
    noActiveNote: "请打开一个活动的 Markdown 笔记。",
    scopeSelection: "范围: 选区",
    gitMode: "Git: {mode}",
    gitPassiveSnapshot: "{branch} @ {commit} · {dirty}",
    gitDirty: "有变更",
    gitClean: "干净",
    gitObsidianGitActive: "Obsidian Git: 已启用",
    gitObsidianGitAbsent: "Obsidian Git: 未检测到（仅读取 Git 上下文）",
    gitRepoPath: "路径: {path}",
    labelOperation: "操作",
    labelInstruction: "指示",
    instructionPlaceholder: "可选指示…",
    btnRdeAudit: "运行 RDE 审计",
    btnGenerate: "生成提案",
    proposalTitle: "提案",
    proposalReviseTitle: "提案（编辑中）",
    auditReportTitle: "RDE 审计报告",
    btnApply: "应用",
    btnRevise: "修订",
    btnReject: "拒绝",
    btnCopy: "复制",
    btnCloseRecord: "关闭记录",
    btnApplyRevision: "应用修订",
    btnReAudit: "重新审计",
    btnCancelRevise: "取消修订",
    opRdeAudit: "RDE 审计",
    opSummarize: "摘要",
    opRewrite: "改写",
    opExpand: "扩展",
    opCustom: "自定义",
    noticeNoNote: "没有活动笔记",
    noticeTargetFileMissing: "找不到目标笔记: {path}",
    noticeAuditDone: "RDE 审计完成{saved}",
    noticeSavedSidecar: "（已保存至 .kotonoha/）",
    noticeSavedUiOnly: "（sidecarMode 关闭 — 仅 UI）",
    noticeProposalReady: "提案已就绪（未应用）",
    noticeFailed: "失败: {msg}",
    noticeAuditNoApply: "RDE 审计报告无法应用到笔记（请使用复制）",
    noticeApplied: "已应用（审计已记录）",
    noticeAppliedRevised: "已应用修订文本（partially_applied）",
    noticeRejected: "已拒绝",
    noticeAuditDismissed: "审计已记录（已关闭）",
    noticeCopied: "已复制到剪贴板",
    noticeReviseMode: "修订模式 — 编辑后应用修订或重新审计",
    noticeReAuditDone: "重新审计完成（local rule-based）",
    noticeReAuditDoneOrchestrator: "重新审计完成（orchestrator /v1/rde/evaluate）",
    noticeRdeAuditWithEngine: "RDE 审计完成 — {engineLine}{saved}",
    auditEngineLabel: "审计引擎",
    auditEngineOrchestrator: "orchestrator / stable adapter",
    auditEngineLocal: "local / rule-based guardrails",
    auditEngineMock: "mock / test backend",
    auditEngineCli: "cli / rde emit + validate",
    auditEngineGateway: "gateway / local rule-based audit",
    auditEngineLocalCaution: "非完整 RDE 评估",
    auditEngineCliCaution:
      "interchange skeleton / 基于规则的 guardrails — 非完整 RDE 评估",
    applyScopeWholeNote: "应用范围：整篇笔记",
    applyScopeSelection: "应用范围：选中文本（{chars} 字）",
    applyScopeUnsupported: "无法确定应用范围：{reason}",
    exportCorrelationAvailable:
      "Export 关联：project {projectId} · commit {commit} · {path}",
    exportCorrelationMissing:
      "Export 关联：仅 local sidecar（{reason} 不可用）",
    reviewDestinationLocalOnly:
      "Review destination：Local only — sidecar/笔记历史是 Kotonoha 记录；GitHub 交接需显式操作。",
    confirmSourceChanged:
      "源已更改。需要重新审计或明确覆盖。是否继续？",
    confirmGitHeadChanged:
      "生成后 Git HEAD 已变化（可能由 Obsidian Git 同步引起）。建议重新审计。是否继续？",
    confirmRevisionAuditStale:
      "修订文本在上次审计后已更改。建议重新审计。仍要继续吗？",
    confirmApply: "将此提案应用到笔记？原始文本将被覆盖。",
    confirmApplyWholeNote: "将此提案应用到整篇笔记？原始笔记内容将被覆盖。",
    confirmApplySelection: "仅将此提案应用到选中文本？笔记其他部分将保留。",
    noticeApplyScopeUnsupported: "已阻止应用：{reason}",
    noticeOpenEditor: "请在编辑器中打开笔记后再应用到选区",
    noticeSelectionNotFound:
      "选区文本在笔记中未找到 — 已阻止应用以避免整篇覆盖",
    mockRdeSummary: "[mock] RDE 审计 · {title}",
    mockOpSummary: "[mock] {operation} · {title}",
    mockUncertainty:
      "Mock 后端 — 请在设置中连接 HTTP 或 CLI 以获取真实 Kotonoha 输出。",
    cliRdeSummary: "[cli] RDE 审计 · {path}",
    noInstruction: "（无指示）",
    settingsTitle: "Kotonoha Console",
    settingsBackendModeName: "后端模式",
    settingsBackendModeDesc:
      "cli = kotonoha CLI；RDE 审计无需 Git；context export 仅在 gitMode ≠ off 时可用",
    settingsBackendMockInfo:
      "Backend: mock / test backend\n无需远程连接。\n输出仅用于 UI/开发测试。",
    settingsBackendHttpInfo:
      "Backend: http\n自动检测 orchestrator / gateway / console proxy。\nStable adapter: 检测到 orchestrator 时的 /v1/rde/evaluate。\nExperimental: /v1/proposals/generate。",
    settingsBackendCliInfo:
      "Backend: cli / first stable runtime\n需要 kotonoha >= 0.3.1。\nCLI 是 runtime，不是规范正本。",
    settingsCliRuntimeWarning:
      "CLI 是 first stable runtime — 不是 kotonoha-spec 规范正本。",
    settingsHttpStableOrchestrator: "/v1/rde/evaluate（stable adapter）",
    settingsHttpStableGateway: "tool / context export（如支持）",
    settingsHttpStableConsole: "health / console proxy 检测",
    settingsHttpExperimentalOrchestrator:
      "/v1/proposals/generate（experimental / best-effort）",
    settingsHttpExperimentalGateway:
      "生成式 rewrite 需外部 orchestrator；RDE 仅 local rule-based guardrails",
    settingsHttpExperimentalConsole:
      "可能提供 proposal 生成；RDE 可能回退到 local guardrails",
    settingsHttpProposalExperimentalWarning:
      "/v1/proposals/generate 为 experimental / best-effort。勿将生成 proposal 视为已接受 lineage。",
    settingsHttpEndpointPortNote:
      "默认示例: http://127.0.0.1:8000 — dogfood/本地开发可能使用 http://127.0.0.1:8001。",
    noticeHttpCapabilitiesStable: "Stable: {line}",
    noticeHttpCapabilitiesExperimental: "Experimental: {line}",
    settingsCliSection: "CLI（kotonoha ≥ 0.3.1）",
    settingsCliCommandName: "CLI 命令",
    settingsCliCommandDesc: "kotonoha 可执行文件路径（不在 PATH 时请用绝对路径）",
    settingsBtnTestVersion: "测试版本",
    settingsCliWorkdirName: "CLI 工作目录",
    settingsCliWorkdirDesc: "用作 cwd / --path 的 vault 或项目根目录（空 = vault 文件夹）",
    settingsCliWorkdirPlaceholder: "（vault 路径）",
    settingsDatabaseUrlDesc: "可选；作为 CLI 环境变量传递给 DB 相关命令",
    settingsCliPrincipalDesc: "可选；作为 KOTONOHA_PRINCIPAL_ID 传递给 CLI",
    settingsCliProjectDesc: "可选；作为 KOTONOHA_PROJECT_ID 传递给 CLI",
    settingsGitModeName: "Git 模式",
    settingsGitModeDesc: "Git 感知但不修改仓库（git-mode-spec）",
    settingsMetadataWriteModeName: "元数据写入模式",
    settingsMetadataWriteModeDesc:
      "应用时在 frontmatter 中可选写入 `kotonoha:` YAML（git-mode-spec §8）。sidecar 记录始终保留。",
    confirmWriteMetadata:
      "是否在笔记 frontmatter 中添加 Kotonoha 系谱字段（review_status、proposal id）？",
    settingsDefaultLanguageName: "显示语言",
    settingsLangJa: "日语 (ja)",
    settingsLangEn: "English (en)",
    settingsLangZhCn: "简体中文 (zh_CN)",
    settingsRequireApprovalName: "应用前必须人工批准",
    settingsEnableRdeAuditName: "启用 RDE 审计面板",
    settingsAuditLogModeName: "审计日志模式",
    noticeCliOk: "kotonoha ok",
    noticeCliVersionOk: "CLI OK: {line}（>= {version}）",
    noticeCliVersionTooOld: "CLI 版本过旧: {version}（需要 >= {min}）。cwd: {cwd}",
    noticeCliVersionUnparseable: "无法解析 CLI 版本: {line}。{msg}",
    noticeCliCommandNotFound: "找不到 CLI 命令: {bin}（cwd: {cwd}）。{msg}",
    noticeCliError: "CLI 错误: {msg}",
    noticeCliSpawnFailed: "CLI 启动失败: {msg}",
    settingsDiagnostic: "插件 v{version} · UI 示例: {sample}",
    settingsBtnReloadPlugin: "重新加载插件（应用代码更新）",
    noticePluginReloaded: "Kotonoha Console 已重新加载（v{version}）",
    noticeLanguageChanged: "显示语言: {lang}",
    cmdOpenConsole: "打开 Kotonoha Console",
    cmdRunRdeAudit: "运行 RDE 审计（活动笔记）",
    cliUncertaintyRdeAudit:
      "基于规则的 source review + CLI `rde emit`/`validate`（仅 interchange 骨架 — 非完整 RDE）。配置 DATABASE_URL 后可连接 DB。",
    cliUncertaintyContextExport:
      "生成式 rewrite 需要 orchestrator/LLM；提案嵌入 `kotonoha context export`。附带 local rule-based RDE 审计。",
    cliUncertaintyGitOff:
      "gitMode 关闭 — 未使用 Git 感知 CLI（git-mode-spec §4）。附带 local rule-based RDE 审计。",
    cliUncertaintyLocalOnly:
      "仅本地锚点（path + source_hash）。附带 local rule-based RDE 审计。",
    cliUncertaintyExportFailed:
      "Git 感知 context export 失败；使用 path + source_hash 锚点。",
    settingsHttpSection: "HTTP（orchestrator / gateway / LLM proxy）",
    settingsHttpEndpointName: "HTTP 端点",
    settingsHttpEndpointDesc:
      "Orchestrator（默认 :8000）、Gateway（:8787）或 console LLM 代理。自动检测后端。",
    settingsHttpEndpointPlaceholder: "http://127.0.0.1:8000",
    settingsHttpApiKeyName: "HTTP API 密钥（可选）",
    settingsHttpApiKeyDesc: "启用 gateway/orchestrator 认证时的 Bearer 令牌",
    settingsBtnTestHttp: "测试连接",
    noticeHttpOk: "HTTP 正常: {status} · {backend} @ {endpoint}",
    noticeHttpFailed: "HTTP 失败 @ {endpoint}: {msg}",
    settingsTestBackendName: "后端连接测试",
    settingsTestBackendDesc: "mock / CLI 版本 / HTTP 健康检查 + 后端自动检测",
    settingsBtnTestBackend: "运行连接测试",
    cmdTestBackend: "测试 Kotonoha 后端连接",
    noticeMockBackendOk: "Mock backend / test backend — 无需远程连接",
    httpOrchestratorRdeSummary: "[http/orchestrator] RDE 审计 · {path}",
    httpGatewaySummary: "[http/gateway] {operation} · {path}",
    httpLocalSummary: "[http/local] {operation} · {path}",
    httpUncertaintyOrchestratorRde:
      "Orchestrator RDE evaluate + local rule-based guardrails（非完整 LLM RDE）。",
    httpUncertaintyOrchestratorNoLlm:
      "Orchestrator 无 /v1/proposals/generate LLM 代理 — 仅本地锚点。",
    httpUncertaintyGateway:
      "仅 Gateway context export — 生成式改写需连接 /v1/proposals/generate。",
    httpUncertaintyGatewayRde:
      "Gateway 模式 — local rule-based RDE 审计（orchestrator 的 /v1/rde/evaluate 另行配置）。",
    httpProposalEndpointMissing:
      "未找到 POST /v1/proposals/generate — 请部署 orchestrator LLM 代理或使用 CLI/mock。",
  },
} as const;

export type ConsoleMsgKey = keyof (typeof MSGS)["en"];

export function consoleMsg(
  lang: RdeLang | undefined,
  key: ConsoleMsgKey,
  params?: Params,
): string {
  const L = normalizeRdeLang(lang);
  return fmt(MSGS[L][key], params);
}

const OP_KEYS: Record<OperationType, ConsoleMsgKey> = {
  rde_audit: "opRdeAudit",
  summarize: "opSummarize",
  rewrite: "opRewrite",
  expand: "opExpand",
  custom: "opCustom",
};

export function operationLabel(lang: RdeLang | undefined, op: OperationType): string {
  return consoleMsg(lang, OP_KEYS[op]);
}

export function gitContextLines(
  lang: RdeLang | undefined,
  git: GitContextSnapshot,
  mode: GitMode,
): string[] {
  const lines: string[] = [];
  if (mode === "passive-observing" || mode === "obsidian-git-aware") {
    if (git.branch && git.commit) {
      lines.push(
        consoleMsg(lang, "gitPassiveSnapshot", {
          branch: git.branch,
          commit: git.commit,
          dirty: consoleMsg(lang, git.dirty ? "gitDirty" : "gitClean"),
        }),
      );
    } else {
      lines.push(consoleMsg(lang, "gitMode", { mode }));
    }
    if (mode === "obsidian-git-aware") {
      lines.push(
        consoleMsg(
          lang,
          git.obsidianGitDetected ? "gitObsidianGitActive" : "gitObsidianGitAbsent",
        ),
      );
    }
  } else if (mode !== "off") {
    lines.push(consoleMsg(lang, "gitMode", { mode }));
  }
  lines.push(consoleMsg(lang, "gitRepoPath", { path: git.repoRelativePath }));
  return lines;
}
