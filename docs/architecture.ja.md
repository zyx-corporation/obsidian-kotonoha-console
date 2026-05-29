# obsidian-kotonoha-console アーキテクチャ

created: 2026-05-29T13:48:00+09:00
author: Tomoyuki Kano <tomyuk@zyxcorp.jp>
status: draft
version: 0.1.0
language: ja
source: docs/architecture.md

## 1. 目的

`obsidian-kotonoha-console` は、Obsidian の Markdown ベースの思考作業空間を、Kotonoha 関連の生成・整理・監査ワークフローへ接続するための Obsidian プラグインである。

このプラグインは、自動改稿ツールとして設計しない。主たる役割は、ノートに対する意味変化を、提案・確認・監査・承認・適用するためのコンソールを提供することにある。

中核となる設計原則は次の通りである。

> Obsidian は思考の作業場である。Kotonoha は生成・整理・接続を支援する層である。RDE は意味変化を監査する層である。

したがって、このプラグインは利用者の著者性を保存し、黙示的な上書きを防ぎ、Vault に変更を適用する前に意味的変換を可視化しなければならない。

## 2. 設計目標

初期アーキテクチャは、以下の目標に基づく。

1. Obsidian 固有 API をドメインロジックから隔離する。
2. AI 出力を直接編集ではなく、提案として扱う。
3. ノート変更の前に人間の承認を必要とする。
4. 元テキスト、提案、判断、結果としての変更を監査可能にする。
5. Kotonoha 連携を mock、local HTTP、CLI、将来の orchestrator interface など複数 backend に対応可能にする。
6. MVP 段階で完全な RDE engine を要求せず、RDE ベースの意味監査に備える。
7. local-first portability を維持し、不要な cloud 依存を避ける。
8. 生成された変更が推論に依存する場合は、不確実性を明示する。

## 3. MVP における非目標

MVP では過剰な範囲拡大を避ける。

以下は初期実装の対象外とする。

- Vault 全体の自動再構成
- 黙示的なノート改稿
- Vault 全体に対するタグ・リンクの自動正規化
- Obsidian 内での自律的な長時間稼働エージェント
- Kotonoha Orchestrator への必須依存
- remote LLM provider への必須依存
- 完全な Semantic Lineage System 統合
- RDE 安全判断を単一スコアだけに圧縮すること

これらは、提案・承認・監査の基本要素が安定した後の段階で検討する。

## 4. 高水準アーキテクチャ

```text
obsidian-kotonoha-console
├─ UI Layer
│  ├─ Command Palette integration
│  ├─ Side Panel
│  ├─ Proposal Viewer
│  ├─ RDE Audit Viewer
│  └─ Settings Tab
├─ Obsidian Adapter
│  ├─ Active Note Reader
│  ├─ Selection Reader
│  ├─ Markdown Writer
│  ├─ Vault Metadata Reader
│  └─ Frontmatter Parser
├─ Application Services
│  ├─ NoteContextService
│  ├─ GenerationRequestService
│  ├─ ProposalService
│  ├─ ApprovalService
│  └─ AuditLogService
├─ Kotonoha Client
│  ├─ KotonohaClient interface
│  ├─ MockKotonohaClient
│  ├─ HttpKotonohaClient
│  └─ CliKotonohaClient
├─ RDE Layer
│  ├─ StructuralDiffBuilder
│  ├─ RdeAuditRequestBuilder
│  ├─ RdeAuditParser
│  ├─ RdeAuditRenderer
│  └─ RdeAuditLogWriter
└─ Domain Model
   ├─ NoteContext
   ├─ GenerationRequest
   ├─ Proposal
   ├─ RdeAudit
   └─ ApprovalDecision
```

ドメインモデルとアプリケーションサービスは、Obsidian を起動しなくてもテストできるようにする。

## 5. 各レイヤの責務

### 5.1 UI Layer

UI Layer は、コマンド、パネル、利用者操作を提供する。

主な責務は以下である。

- Obsidian command palette にコマンドを登録する。
- Kotonoha Console の side panel を表示する。
- 利用者が操作種別を選択できるようにする。
- 自由入力の instruction を受け取る。
- 生成された proposal を表示する。
- RDE audit の結果を表示する。
- Apply、Revise、Reject、Copy の操作を提供する。
- 不確実性と drift warning を明確に示す。

UI は、adapter を通さずに低水準の Obsidian API を直接呼び出してはならない。また、生成内容を自動適用してはならない。

### 5.2 Obsidian Adapter

Obsidian Adapter は、plugin 固有の API 利用を隔離する。

主な責務は以下である。

- active file を読む。
- 現在 editor の selected text を読む。
- frontmatter、tags、links、metadata を抽出する。
- 承認済みの変更を現在ノートへ適用する。
- `.kotonoha/` 配下に local audit file を書き出す。
- vault-relative file path を解決する。

このレイヤは薄く、置換可能であるべきである。

### 5.3 Application Services

Application Services は use case を調整する。

主な責務は以下である。

- active note または selected range から `NoteContext` を作成する。
- user operation と note context から `GenerationRequest` を作成する。
- `KotonohaClient` を呼び出す。
- proposal を保存する。
- RDE audit を起動する。
- 承認された proposal を適用する。
- audit log を書き出す。
- transaction boundary を明確に保つ。

Application Services は UI component に依存してはならない。

### 5.4 Kotonoha Client

Kotonoha Client は、生成・orchestration backend との通信を抽象化する。

初期 client 実装は以下とする。

- `MockKotonohaClient`: test と offline development のため、決定的な mock proposal を返す。
- `HttpKotonohaClient`: local HTTP endpoint に request を送る。
- `CliKotonohaClient`: local CLI command を呼び出し、結果を parse する。

将来、WebSocket、MCP-style、Kotonoha Orchestrator 固有 client を追加できる。

Client interface は backend 変更に対して安定している必要がある。

### 5.5 RDE Layer

RDE Layer は source text と proposed text の間の意味変化を評価する。

主な責務は以下である。

- structural diff を作成する。
- audit request を準備する。
- audit response を parse する。
- semantic change を分類する。
- audit result を人間が読める形で描画する。
- audit log を書き出す。

MVP では rule-based または mock RDE layer から開始してよい。ただし output schema は長期的な RDE model と整合させる。

### 5.6 Domain Model

Domain Model は、UI や backend から独立した安定概念を定義する。

中核 entity は以下である。

- `NoteContext`
- `GenerationRequest`
- `Proposal`
- `RdeAudit`
- `ApprovalDecision`

これらは、外部依存を最小化した plain TypeScript type または class として実装する。

## 6. 中核データモデル

### 6.1 OperationKind

```ts
export type OperationKind =
  | "summarize"
  | "rewrite"
  | "expand"
  | "extract_tasks"
  | "add_metadata"
  | "rde_audit";
```

### 6.2 NoteContext

```ts
export interface NoteContext {
  vaultName?: string;
  filePath: string;
  title: string;
  fullText: string;
  selectedText?: string;
  frontmatter?: Record<string, unknown>;
  links?: string[];
  tags?: string[];
}
```

### 6.3 GenerationRequest

```ts
export interface GenerationRequest {
  operation: OperationKind;
  instruction: string;
  note: NoteContext;
  constraints?: {
    language?: "ja" | "en";
    preserveFrontmatter?: boolean;
    doNotOverwrite?: boolean;
    requireHumanApproval?: boolean;
  };
}
```

### 6.4 Proposal

```ts
export interface Proposal {
  id: string;
  requestId: string;
  createdAt: string;
  operation: OperationKind;
  sourceText: string;
  proposedText: string;
  summary: string;
}
```

### 6.5 RDE Categories

```ts
export type RdeCategory =
  | "preserved"
  | "authorized_transformation"
  | "inferred_extension"
  | "unresolved"
  | "suspicious_drift"
  | "critical_distortion";
```

### 6.6 RdeAudit

```ts
export interface RdeAudit {
  proposalId: string;
  createdAt: string;
  categories: RdeCategory[];
  preservedElements: string[];
  transformedElements: string[];
  inferredExtensions: string[];
  unresolvedElements: string[];
  driftRisks: string[];
  recommendedDecision: "approve" | "revise" | "reject" | "human_review";
  confidence: number;
}
```

### 6.7 ApprovalDecision

```ts
export interface ApprovalDecision {
  proposalId: string;
  decidedAt: string;
  decision: "approved" | "rejected" | "partially_applied";
  appliedText?: string;
  comment?: string;
}
```

## 7. 主要ワークフロー

```text
Active Note or Selection
        ↓
NoteContextService
        ↓
GenerationRequestService
        ↓
KotonohaClient
        ↓
ProposalService
        ↓
RDE Layer
        ↓
Human Review
        ↓
ApprovalService
        ↓
Markdown Writer
        ↓
AuditLogService
```

proposal は、人間の approval action なしに vault を変更してはならない。

## 8. MVP ワークフロー

MVP は以下の最小 workflow を支援する。

1. 利用者が Markdown note を開く。
2. 利用者が text を選択する、または active note 全体を対象にする。
3. 利用者が Kotonoha Console を開く。
4. summarize、rewrite、expand、RDE audit などの operation を選択する。
5. 利用者が instruction を入力する。
6. plugin が `GenerationRequest` を作成する。
7. mock または local Kotonoha client が `Proposal` を返す。
8. proposal が side panel に表示される。
9. optional な RDE audit が表示される。
10. 利用者が Apply、Revise、Reject、Copy を選択する。
11. Apply が選ばれた場合のみ、plugin が note を変更する。
12. local audit log が書き出される。

## 9. ファイル・ディレクトリ構成

推奨 source layout:

```text
src/
├─ main.ts
├─ settings/
│  ├─ PluginSettings.ts
│  └─ SettingsTab.ts
├─ ui/
│  ├─ KotonohaConsoleView.ts
│  ├─ ProposalView.ts
│  └─ RdeAuditView.ts
├─ obsidian/
│  ├─ ActiveNoteReader.ts
│  ├─ SelectionReader.ts
│  ├─ MarkdownWriter.ts
│  └─ VaultMetadataReader.ts
├─ domain/
│  ├─ types.ts
│  ├─ Proposal.ts
│  └─ RdeAudit.ts
├─ services/
│  ├─ NoteContextService.ts
│  ├─ GenerationRequestService.ts
│  ├─ ProposalService.ts
│  ├─ ApprovalService.ts
│  └─ AuditLogService.ts
├─ client/
│  ├─ KotonohaClient.ts
│  ├─ MockKotonohaClient.ts
│  ├─ HttpKotonohaClient.ts
│  └─ CliKotonohaClient.ts
└─ rde/
   ├─ StructuralDiffBuilder.ts
   ├─ RdeAuditRequestBuilder.ts
   ├─ RdeAuditParser.ts
   └─ RdeAuditRenderer.ts
```

推奨 local vault files:

```text
.vault-root/
└─ .kotonoha/
   ├─ config.json
   ├─ proposals/
   │  └─ 2026-05-29T000000+09-00.proposal.json
   └─ audit/
      └─ 2026-05-29T000000+09-00.rde-audit.json
```

## 10. Settings

初期 settings:

```ts
export interface KotonohaConsoleSettings {
  backendMode: "mock" | "http" | "cli";
  httpEndpoint?: string;
  cliCommand?: string;
  defaultLanguage: "ja" | "en";
  requireHumanApproval: boolean;
  preserveFrontmatter: boolean;
  auditLogMode: "hash_only" | "summary" | "full_text";
  enableRdeAudit: boolean;
}
```

推奨 default:

```ts
export const DEFAULT_SETTINGS: KotonohaConsoleSettings = {
  backendMode: "mock",
  defaultLanguage: "ja",
  requireHumanApproval: true,
  preserveFrontmatter: true,
  auditLogMode: "summary",
  enableRdeAudit: true,
};
```

## 11. Audit Log 方針

plugin は proposal generation と approval decision について audit log を書き出さなければならない。

default log mode では、full note text の保存を避ける。推奨 default は以下である。

- source hash
- proposal hash
- short source excerpt
- short proposal excerpt
- operation type
- RDE categories
- human decision
- timestamp
- file path

Full-text logging は研究・再現性には有用だが、opt-in にしなければならない。

## 12. Testing Strategy

project は testable な domain layer と service layer を優先する。

推奨 test order:

1. `NoteContextService`
2. `GenerationRequestService`
3. `MockKotonohaClient`
4. `ProposalService`
5. `RdeAuditParser`
6. `ApprovalService`
7. `AuditLogService`
8. UI smoke tests

MVP の test は live Kotonoha server に依存してはならない。

## 13. Implementation Phases

### Phase 0: Plugin Skeleton

- Obsidian plugin structure を初期化する。
- basic settings を追加する。
- command palette actions を登録する。
- side panel を追加する。

### Phase 1: Note I/O

- active note を読む。
- selection を読む。
- frontmatter、tags、links を抽出する。
- 承認された text を note へ書き戻す。

### Phase 2: Kotonoha Client Abstraction

- `KotonohaClient` を定義する。
- mock client を実装する。
- HTTP client を追加する。
- 必要に応じて CLI client を追加する。

### Phase 3: Proposal Mode

- generated proposal を表示する。
- 自動適用しない。
- Copy と Reject を支援する。
- 明示的確認つき Apply を支援する。

### Phase 4: RDE Audit

- RDE data model を追加する。
- basic structural diff を追加する。
- audit display を追加する。
- backend または mock から RDE audit result を parse する。

### Phase 5: Human Approval Workflow

- approve、reject、partial apply を支援する。
- decision log を書き出す。
- source hash と proposal hash を保存する。
- 将来の SLS 統合に備える。

## 14. RDE 設計制約

RDE を単一の quality score に還元してはならない。

UI は confidence を表示してもよいが、中心となる表示は category と explanation でなければならない。

- preserved elements
- transformed elements
- inferred extensions
- unresolved elements
- drift risks
- recommended decision

流暢性が高くても semantic drift が疑わしい proposal は flag されなければならない。

## 15. Security and Privacy Considerations

plugin は private notes を扱う可能性がある。したがって以下を守る。

- remote endpoint は明示的でなければならない。
- local-first mode が動作しなければならない。
- full-text logging は opt-in でなければならない。
- vault content の黙示的送信は禁止する。
- 送信対象 text を user が確認できるようにする。
- 将来 API key を導入する場合、Obsidian の通常 plugin settings mechanism に保存し、commit してはならない。

## 16. Future Extensions

将来拡張の候補は以下である。

- Semantic Lineage System integration
- ΔM timeline visualization
- Vault-level proposal queue
- Multi-note context builder
- RDE calibration profiles
- Relation-aware context retrieval
- Git-backed audit export
- note transformation の pull-request-style review

これらは、基本的な proposal and approval workflow が安定するまで MVP に含めない。

## 17. このアーキテクチャ自身への RDE Self-Audit

### 保存された要素

この architecture は、Kotonoha が思考を上書きするのではなく、人間の review のもとで意味形成を支援するという中核思想を保存している。

### 許可された変換

Kotonoha / RDE / SLS の広い vision を、Obsidian plugin architecture として具体的な layer、interface、workflow へ変換している。

### 補完された要素

source layout、settings schema、audit directory layout は implementation detail として補完されたものであり、最終理論の主張ではない。

### 未解決の要素

正確な Kotonoha Orchestrator protocol、RDE engine の配置、SLS integration timing は未解決である。

### 逸脱リスク

approval と audit が弱まると、この plugin は便利な rewriting tool へ drift する危険がある。また UI が numerical confidence を過度に強調すると、RDE が superficial scoring へ還元される危険がある。

### 次回更新方針

次回は `src/domain/types.ts` に実際の TypeScript interface を定義し、その後 mock-client-driven に MVP workflow を実装する。
