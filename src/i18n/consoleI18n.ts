import type { OperationType } from "../domain/types";
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
    confirmSourceChanged:
      "Source has changed. Re-audit or explicit override is required. Continue?",
    confirmApply: "Apply this proposal to the note? Original text will be overwritten.",
    noticeOpenEditor: "Open the note in the editor to apply selection",
    mockRdeSummary: "[mock] RDE audit · {title}",
    mockOpSummary: "[mock] {operation} · {title}",
    mockUncertainty:
      "Mock backend — connect HTTP or CLI in settings for real Kotonoha output.",
    cliRdeSummary: "[cli] RDE audit · {path}",
    noInstruction: "(no instruction)",
  },
  ja: {
    viewTitle: "Kotonoha Console",
    tagline: "提案は自動適用されません。",
    noActiveNote: "アクティブな Markdown ノートを開いてください。",
    scopeSelection: "範囲: 選択テキスト",
    gitMode: "Git: {mode}",
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
    confirmSourceChanged:
      "ソースが変更されています。再監査または明示的な上書きが必要です。続行しますか？",
    confirmApply: "この提案をノートに適用しますか？元のテキストは上書きされます。",
    noticeOpenEditor: "エディタでノートを開いてから選択範囲に適用してください",
    mockRdeSummary: "[mock] RDE 監査 · {title}",
    mockOpSummary: "[mock] {operation} · {title}",
    mockUncertainty:
      "Mock バックエンド — 設定で HTTP または CLI に接続してください。",
    cliRdeSummary: "[cli] RDE 監査 · {path}",
    noInstruction: "（指示なし）",
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
