# obsidian-kotonoha-console RDE監査ポリシー

created: 2026-05-29T13:48:00+09:00
author: Tomoyuki Kano <tomyuk@zyxcorp.jp>
status: draft
version: 0.1.0
language: ja
source: docs/rde-audit-policy.md

## 1. 目的

この文書は、`obsidian-kotonoha-console` における RDE audit policy を定義する。

RDE は Resonant Deviation Evaluator の略称である。この project において RDE は、Obsidian 内の AI 支援 note transformation に対する意味変化監査層として用いられる。

RDE audit の目的は、生成された text が単に良いか悪いかを判定することではない。目的は、proposal が生成・修正・承認・却下される過程で、original note の意味がどのように変化するかを検査することにある。

中心となる問いは次である。

> 意味において何が変わったのか。そしてその変化は、利用者の意図、文書文脈、明示された制約によって許可されているのか。

## 2. 中核原則

AI-generated text は、人間が承認するまで proposal として扱わなければならない。

RDE audit は、proposal を vault に適用する前に、source text と proposal の semantic difference を利用者が理解できるよう支援しなければならない。

plugin は user notes を黙示的に書き換えてはならない。

## 3. 適用範囲

この policy は以下の operation に適用される。

- summarize
- rewrite
- expand
- extract_tasks
- add_metadata
- rde_audit
- note content を変更または変更提案する将来の operation

この policy は、proposal が mock backend、local HTTP backend、CLI backend、Kotonoha Orchestrator、その他将来の backend によって生成される場合にも適用される。

## 4. RDE Categories

RDE audit は semantic change を以下の category で分類する。

### 4.1 Preserved

`preserved` は、source text の要素が proposal 内で意味的に維持されていることを意味する。

例:

- original thesis が維持されている。
- key distinction が保存されている。
- 重要な uncertainty marker が残っている。
- author の normative stance が上書きされていない。
- original scope が維持されている。

### 4.2 Authorized Transformation

`authorized_transformation` は、proposal が表現、構造、順序、抽象度、強調を変更しているが、それが user request と整合していることを意味する。

例:

- 粗い memo が structured draft に再構成される。
- 長い paragraph が core claim を変えずに summarization される。
- Japanese note が uncertainty と intent を保存したまま English に translation される。
- technical note が implementation tasks に refactor される。

### 4.3 Inferred Extension

`inferred_extension` は、source に明示されていない content が proposal に追加されたが、context から合理的に推論できることを意味する。

例:

- missing implementation step が追加される。
- document が暗示していた concept が明示化される。
- likely risk が caution として追加される。
- argument を明確にするため related term が導入される。

Inferred extension は自動的に誤りではない。しかし direct preservation ではないため、利用者に可視化されなければならない。

### 4.4 Unresolved

`unresolved` は、proposal 後も ambiguity、missing information、conflict、uncertainty が残っていることを意味する。

例:

- original instruction が曖昧である。
- source text に unresolved contradiction がある。
- cited concept の context が不足している。
- proposal が missing external facts に依存している。
- 利用可能な note だけでは decision できない。

### 4.5 Suspicious Drift

`suspicious_drift` は、proposal が source text または instruction によって許可される範囲を超えて意味を移動させた可能性を意味する。

例:

- possibility が certainty になる。
- hypothesis が established fact として提示される。
- political or philosophical stance が狭められる。
- local design choice が universal theory claim になる。
- caution が根拠なく削除される。
- weak claim が strong claim になる。

### 4.6 Critical Distortion

`critical_distortion` は、proposal が original meaning、intent、values、authorship、constraints を重大に侵害していることを意味する。

例:

- central claim が反転している。
- author position が incompatible position に置き換えられている。
- proposal が evidence を捏造している。
- user が行っていない claim を user に帰属している。
- essential uncertainty が消されている。
- user が明示的に禁じた変更を適用している。

Critical distortion は通常、reject または major revision につながる。

## 5. 必須 Audit Fields

すべての RDE audit result は以下の fields を含まなければならない。

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

confidence value よりも categorical explanation の方が重要である。

## 6. Decision Semantics

RDE は decision を recommend できるが、最終承認の責任は user に残る。

### 6.1 approve

core meaning が保存され、transformation が許可されている場合に `approve` を用いる。

significant unresolved issue や drift risk がない場合に限り推奨する。

### 6.2 revise

proposal は有用だが、適用前に修正すべき issue が含まれる場合に `revise` を用いる。

典型的原因:

- excessive abstraction
- missing uncertainty marker
- minor inferred extension
- incomplete preservation
- emphasis を強く変えすぎる wording

### 6.3 reject

proposal に critical distortion または重大な suspicious drift がある場合に `reject` を用いる。

典型的原因:

- central thesis inversion
- false attribution
- unsupported factual claims
- important constraints の削除
- unauthorized ideological narrowing

### 6.4 human_review

system が change を十分に分類できない場合、または domain-specific judgment が必要な場合に `human_review` を用いる。

early version では一般的な推奨判断になりうる。

## 7. Audit Workflow

標準 workflow は以下である。

```text
Source Text
    ↓
User Instruction
    ↓
Generation Request
    ↓
Proposal
    ↓
Structural Diff
    ↓
RDE Audit
    ↓
Human Review
    ↓
Approval Decision
    ↓
Apply or Reject
    ↓
Audit Log
```

vault は approval decision 後にのみ変更されなければならない。

## 8. Structural Diff と RDE

Structural diff と RDE は異なる。

Structural diff は additions、deletions、replacements などの表層的変更を特定する。

RDE は、それらの変更の semantic significance を解釈する。

例:

```text
Source:
This may be possible.

Proposal:
This is clearly true.
```

character-level diff は小さく見えるかもしれない。しかし RDE は uncertainty が削除されているため、possible suspicious drift として分類しなければならない。

別の例:

```text
Source:
RDE can evaluate AI outputs.

Proposal:
RDE can evaluate meaning changes in collaborative thinking between humans and AI.
```

surrounding context がこの broader claim を支える場合、これは authorized transformation または inferred extension になりうる。

## 9. 特別な Drift Patterns

RDE audit は以下の drift patterns を明示的に確認する。

### 9.1 Claim Strength Drift

弱い claim が強い claim に変換される。

例:

- may -> must
- possible -> certain
- suggests -> proves
- hypothesis -> fact
- design direction -> completed system

### 9.2 Evidence Drift

proposal が evidence を実際より強く見せる。

例:

- unverified observation が established data になる。
- personal interpretation が cited fact になる。
- draft argument が research conclusion になる。

### 9.3 Scope Drift

限定された claim が universal になる。

例:

- This implementation may work for the MVP.
- This is the correct architecture for all Kotonoha systems.

後者は前者よりも強く、広い claim である。

### 9.4 Responsibility Drift

proposal が judgment や action の責任所在を変える。

例:

- human approval が automatic execution に置き換えられる。
- AI recommendation が final decision として提示される。
- audit assistance が authoritative judgment になる。

### 9.5 Ideological Narrowing

proposal が user の philosophical、political、design stance を狭めたり、馴化したりする。

例:

- structural critique が neutral productivity statement になる。
- relation-based theory が conventional tool description になる。
- institutional responsibility が personal preference に還元される。

### 9.6 Implementation-Theory Substitution

実装上の便宜が theoretical claim として提示される。

例:

- temporary schema が formal ontology になる。
- mock RDE implementation が RDE theory そのものとして扱われる。
- UI decision が governance principle と誤認される。

### 9.7 Authorship Drift

proposal が AI に user の思考の所有や確定権を持たせるように見える。

例:

- rewriting が author の distinctive stance を削除する。
- proposal が user intention を完全に知っているかのように語る。
- generated extension が generated または inferred として明示されない。

## 10. Audit Display Requirements

UI は RDE audit result を badge や score だけでなく、explanatory sections として表示する。

必須 display sections:

- Preserved elements
- Transformed elements
- Inferred extensions
- Unresolved elements
- Drift risks
- Recommended decision
- Confidence and uncertainty note

UI は high confidence score が proposal の安全性を意味するかのように示してはならない。

## 11. Logging Policy

各 proposal と audit は `.kotonoha/` 配下に log される。

推奨 layout:

```text
.kotonoha/
├─ proposals/
│  └─ 2026-05-29T000000+09-00.proposal.json
└─ audit/
   └─ 2026-05-29T000000+09-00.rde-audit.json
```

### 11.1 Default Log Mode

default mode は `summary` とする。

含めるべきもの:

- schema version
- plugin name
- created timestamp
- file path
- operation kind
- source hash
- proposal hash
- short source excerpt
- short proposal excerpt
- RDE categories
- recommended decision
- human decision if available

### 11.2 Hash-Only Mode

Hash-only mode は以下を含める。

- source hash
- proposal hash
- metadata
- audit categories
- human decision

text excerpt の保存は避ける。

### 11.3 Full-Text Mode

Full-text mode は source text と proposal text を保存してよいが、opt-in でなければならない。

この mode は reproducible research と full semantic lineage に有用だが、private note content を露出しうる。

## 12. Audit Log Example

```json
{
  "schemaVersion": "0.1.0",
  "plugin": "obsidian-kotonoha-console",
  "createdAt": "2026-05-29T00:00:00+09:00",
  "filePath": "notes/example.md",
  "operation": "rewrite",
  "sourceHash": "sha256:...",
  "proposalHash": "sha256:...",
  "rde": {
    "categories": [
      "preserved",
      "authorized_transformation",
      "suspicious_drift"
    ],
    "preservedElements": [
      "The original topic is maintained."
    ],
    "transformedElements": [
      "The prose was reorganized into a more formal structure."
    ],
    "inferredExtensions": [
      "A future implementation risk was added."
    ],
    "unresolvedElements": [
      "The backend protocol is not yet specified."
    ],
    "driftRisks": [
      "The proposal may imply the architecture is final, although it is still draft."
    ],
    "recommendedDecision": "revise",
    "confidence": 0.72
  },
  "decision": {
    "status": "pending"
  }
}
```

## 13. Backend Contract

Kotonoha または RDE backend は audit result を直接返してもよい。

推奨 response shape:

```ts
export interface KotonohaProposalResponse {
  proposal: Proposal;
  audit?: RdeAudit;
}
```

backend が RDE audit を提供しない場合、plugin は以下を行える。

1. audit なしで proposal を表示する。
2. local rule-based audit を実行する。
3. separate RDE backend を呼び出す。
4. user に manual review を求める。

plugin は、実際には audit が行われていないのに、行われたかのように装ってはならない。

## 14. MVP 用の最小 Rule-Based Audit

full RDE engine が存在する前に、plugin は minimal rule-based audit を実装してよい。

初期 checks:

- uncertainty weakening の検出:
  - "may" to "is"
  - "possible" to "certain"
  - "hypothesis" to "fact"
- frontmatter の削除検出。
- citations または links の削除検出。
- rewrite operation における text length の大幅減少検出。
- source に存在しない URL や dates を含む generated claims の検出。
- explicit human approval language の削除検出。
- proposal language から final decision language への変換検出。

これらの checks は RDE の代替ではないが、有用な guardrails になる。

## 15. Human Approval Requirements

proposal を適用する前に、UI は以下を表示しなければならない。

- source target: full note or selected range
- operation kind
- user instruction
- proposal text
- RDE audit summary if available
- audit がない場合の warning
- Apply, Revise, Reject, Copy actions

default action は Apply であってはならない。

## 16. Missing or Uncertain Audit の扱い

RDE audit が利用できない場合、plugin は以下を表示する。

```text
RDE audit is not available for this proposal.
Review carefully before applying.
```

RDE audit confidence が低い場合、plugin は以下を表示する。

```text
RDE audit confidence is low.
Human review is required.
```

低 confidence は通常 `human_review` に対応させる。

## 17. Privacy Requirements

RDE audit は sensitive note content を露出しうる。

plugin は以下を守らなければならない。

- backend mode を可視化する。
- text が local machine 外へ送信されるかを明示する。
- mock/local mode を利用可能にする。
- summary log mode を default にする。
- full-text logging を opt-in にする。
- 明示的要請なしに whole vault を送信しない。
- user action なしに background transmission を行わない。

## 18. Failure Handling

generation または audit が失敗した場合:

- note を変更しない。
- error message を表示する。
- source text を保存する。
- misleading approval logs を作成しない。
- 必要であれば metadata only の error log を書き出す。

apply が失敗した場合:

- proposal を保存する。
- note が変更されていないことを報告する。
- write が成功していない限り、decision を approved として mark しない。

## 19. SLS との関係

RDE audit logs は full Semantic Lineage System ではない。

ただし、将来の SLS integration と互換になるようにする。

audit log は以下を保存すべきである。

- source hash
- proposal hash
- operation kind
- semantic categories
- decision
- timestamps
- file path
- optional excerpts or full text

将来の SLS integration では、各 approved proposal を semantic transition event として扱える。

## 20. このポリシー自身への RDE Self-Audit

### 保存された要素

この policy は、RDE が surface quality や simple safety ではなく meaning change を評価するという考えを保存している。

### 許可された変換

一般的な RDE framework を、Obsidian plugin の operational rules に変換している。

### 補完された要素

minimal rule-based audit checks、log modes、backend response shape は implementation-oriented extensions である。

### 未解決の要素

full RDE scoring algorithm、calibration process、Kotonoha Orchestrator integration は未解決である。

### 逸脱リスク

rule-based MVP が full RDE theory と誤認される危険がある。UI と documentation は、MVP checks が provisional guardrails であることを明示しなければならない。

### 次回更新方針

次回は RDE categories、audit parsing、audit log writing の TypeScript definitions と initial tests を作成する。
