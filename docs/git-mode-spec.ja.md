# Git Mode Specification 日本語版

created: 2026-05-29T14:00:45+09:00
author: Tomoyuki Kano <tomyuk@zyxcorp.jp>
status: Design specification — Obsidian Kotonoha Console
version: 0.2.0
language: ja

この文書は、Obsidian Kotonoha Console が Git を使わない通常の Vault と Git-backed vault の両方でどのように動作するかを定義する。

主たる推奨は次である。

> Obsidian Kotonoha Console は Git なしで完全に動作しなければならない。Git は Kotonoha の基盤ではなく、任意の証拠基盤である。

## 1. 中核原則

Obsidian Kotonoha Console は **semantic-lineage-first** である。

Git は file history を記録する。Kotonoha は semantic lineage を記録する。Obsidian は writing and thinking surface であり続ける。

したがって、以下を原則とする。

- Kotonoha Console は Git を必須にしてはならない。
- Kotonoha Console は通常の Obsidian vault で動作しなければならない。
- Git-backed vault support は optional である。
- Git が利用可能な場合、Kotonoha は Git context を semantic lineage の証拠として使ってよい。
- Kotonoha は Git synchronization を所有してはならない。

system distinction は以下である。

```text
Git answers:
  What changed in files?

Kotonoha answers:
  What changed in meaning, responsibility, loss, and deviation risk?
```

この区別はすべての mode で保存されなければならない。

## 2. 推奨 Default

MVP における推奨 default は Git-independent operation である。

```text
kotonoha.gitMode = off
kotonoha.sidecarMode = enabled
kotonoha.snapshotMode = on_demand
kotonoha.metadataWriteMode = prompt
kotonoha.auditLogMode = summary
```

これは以下を意味する。

- plugin は Git repository を要求しない。
- plugin は `.kotonoha/` 配下に proposal、audit、review、optional snapshot data を保存する。
- plugin は proposal 適用前に source hash を検証する。
- note metadata writes は default で user confirmation を必要とする。
- Git integration は core semantic-lineage model を変更せず後から有効化できる。

Git は dependency ではなく、evidential strength を高める optional layer として扱う。

## 3. 非目標

Obsidian Kotonoha Console は、以下の repository mutation commands を実装または呼び出してはならない。

- `git add`
- `git commit`
- `git pull`
- `git push`
- `git reset`
- `git merge`
- `git rebase`
- stage / unstage operations
- auto-sync
- scheduled background Git writes

commit、pull、push、sync、branch management、conflict resolution は Kotonoha Console の外側に置く。

利用者は terminal Git、VS Code、GitHub Desktop、Obsidian Git plugin、cron jobs、その他の明示的な Git workflow によって扱ってよい。

## 4. Non-Git Vault Mode

non-Git vault とは、Git repository として管理されていない通常の Obsidian vault である。

これは fallback ではなく、第一級の supported mode でなければならない。

### 4.1 Behavior

`kotonoha.gitMode = off` の場合、Kotonoha Console は以下のように動作する。

- Git root を検出しない。
- branch、commit、dirty state を読まない。
- Git-aware CLI flows を呼び出さない。
- vault-relative note paths で動作する。
- proposal and audit records を `.kotonoha/` 配下に保存する。
- source hashes と optional snapshots を semantic-lineage anchors として使う。
- proposal 適用前に current source hash を検証する。
- proposal generation 後に source text が変わっている場合は warning を出す。

### 4.2 推奨 Directory Layout

```text
.vault-root/
├─ notes/
│  └─ example.md
└─ .kotonoha/
   ├─ config.json
   ├─ snapshots/
   ├─ proposals/
   ├─ audit/
   └─ reviews/
```

### 4.3 Gitなしの Semantic Anchors

commit hash が存在しないため、Kotonoha Console は以下を anchor として用いる。

- vault-relative note path
- target range or target mode
- source hash
- proposal hash
- optional source excerpt
- optional snapshot
- RDE audit result
- human review decision
- meaning delta identifier

推奨 identifiers:

```text
snapshotId
proposalId
rdeAssessmentId
meaningDeltaId
reviewDecisionId
```

これらの identifiers は Git commit を装ってはならない。これらは semantic-lineage event identifiers である。

### 4.4 Apply-Time Hash Verification

proposal を適用する前に、Kotonoha Console は current source hash を再計算しなければならない。

```text
if currentHash == proposal.sourceHash:
  allow apply

if currentHash != proposal.sourceHash:
  warn the user
  require re-audit, regeneration, or explicit override
```

non-Git vault では、original file state を検証する external commit boundary が存在しないため、これは特に重要である。

### 4.5 Snapshot Policy

non-Git vault では、Git commits を recovery anchors として利用できないため、optional snapshots が必要になる。

推奨 setting:

```text
kotonoha.snapshotMode = off | hash_only | on_demand | full
```

推奨 default:

```text
kotonoha.snapshotMode = on_demand
```

Mode definitions:

```text
off:
  snapshot を保存しない。

hash_only:
  sourceHash と proposalHash のみ保存する。

on_demand:
  proposal generation、RDE audit、apply operations が必要とする場合に excerpt または target-range snapshot を保存する。

full:
  full source text と proposal text を保存する。これは opt-in でなければならない。
```

default は privacy、portability、auditability の balance を取るべきである。

## 5. `kotonoha.gitMode`

plugin は以下の setting を提供するべきである。

```text
kotonoha.gitMode = off | external | passive-observing | obsidian-git-aware
```

MVP の推奨 default は以下である。

```text
kotonoha.gitMode = off
```

Git-backed vault を明示的に運用する user に対する advanced default は以下である。

```text
kotonoha.gitMode = passive-observing
```

## 6. Mode Definitions

### 6.1 `off`

Kotonoha は Git を検査しない。

Behavior:

- Git root を検出しない。
- branch、commit、dirty state を表示しない。
- Git-aware CLI flows を呼び出さない。
- note paths、source hashes、snapshots、sidecar records、manual supplied `subject_ref` values のみを使う。

Use when:

- vault が Git repository ではない。
- user が最も単純な note-only RDE workflow を望む。
- Git context が irrelevant または intentionally hidden である。
- MVP が external repository assumptions なしで動作している。

### 6.2 `external`

Git synchronization は Obsidian Kotonoha Console の外部で扱われる。

Behavior:

- 必要な場合に Git root を検出する。
- explicit user actions の時だけ Git context を読む。
- 以下のような CLI-backed reads を許可する。
  - `kotonoha status`
  - `kotonoha diff --file <current-note>`
  - `kotonoha delta create <current-note>`
- Git state を継続的に watch しない。
- Git を mutate しない。

Use when:

- user が Git を terminal、VS Code、GitHub Desktop、または別の明示的 workflow で管理している。
- user が Kotonoha を semantic lineage に集中させたい。
- user が background interactions を減らしたい。

### 6.3 `passive-observing`

Kotonoha は Git context を継続的または定期的に表示するが、Git を mutate しない。

Behavior:

- Git root を検出する。
- branch、commit、dirty/clean state、Git root から見た current note path を表示する。
- 可能な場合、current note に uncommitted changes があるかを表示する。
- `kotonoha status`、`kotonoha diff --file`、`kotonoha delta create` などの explicit CLI-backed context commands を許可する。
- commit、pull、push、stage、unstage、auto-sync を行わない。

Use when:

- vault が Git-backed である。
- user が current Git state に anchored した semantic review を望む。
- user が Git によって semantic lineage の evidential strength を高めたい。

### 6.4 `obsidian-git-aware`

Kotonoha は、Obsidian Git plugin または別の Obsidian-side Git sync layer が active である可能性を前提にする。

Behavior:

- Git root を検出する。
- Obsidian API が許せば Obsidian Git plugin を検出する。
- Git context を表示する。
- auto-sync と競合しうる automatic metadata writes を避ける。
- front matter または summary blocks を書き込む前に、file modification time と Git HEAD を再確認する。
- prompt-based writes または sidecar-only behavior を優先する。
- Git mutation commands は決して呼び出さない。

Use when:

- user が Obsidian Git plugin も使用している。
- auto-commit または auto-sync が Obsidian 内で走る可能性がある。
- metadata write conflicts を最小化する必要がある。

## 7. Sidecar-First Storage

Kotonoha Console は、semantic-lineage artifacts を default で sidecar files に保存するべきである。

推奨 layout:

```text
.kotonoha/
├─ config.json
├─ snapshots/
│  └─ <snapshotId>.json
├─ proposals/
│  └─ <proposalId>.proposal.json
├─ audit/
│  └─ <rdeAssessmentId>.rde-audit.json
└─ reviews/
   └─ <reviewDecisionId>.review.json
```

Sidecar-first storage には以下の利点がある。

- Git なしで動作する。
- note body を汚しにくい。
- Obsidian sync tools との conflict risk を減らす。
- user が proposal を reject した場合でも proposal and audit records が残る。
- 将来の SLS integration に備えられる。

## 8. Metadata Writes

Kotonoha は Obsidian metadata の書き込みを支援してよいが、それは明示的かつ configurable でなければならない。

推奨 setting:

```text
kotonoha.metadataWriteMode = off | prompt | always
```

推奨 default:

```text
kotonoha.metadataWriteMode = prompt
```

Rules:

- metadata writes は default で opt-in または user-confirmed でなければならない。
- metadata writes は files を stage または commit してはならない。
- operation 中に Git context が変化した場合、plugin は書き込み前に warning を出すべきである。
- Git context が存在しない場合でも、plugin は `sourceHash` を検証すべきである。
- note mutation を望まない user のため、sidecar-only operation を利用可能にするべきである。

Optional YAML metadata proposal:

```yaml
kotonoha:
  project_id: "..."
  latest_meaning_delta_id: "..."
  latest_rde_assessment_id: "..."
  review_status: "hold"
```

これらの fields は local/plugin metadata にすぎない。normative SLS storage ではない。

## 9. 推奨 Workflows

### 9.1 Gitなし MVP 推奨 Workflow

1. Obsidian で notes を編集する。
2. Kotonoha Console を `kotonoha.gitMode = off` で動作させる。
3. current note または selected range から proposal を生成する。
4. proposal を `.kotonoha/proposals/` に保存する。
5. RDE audit を `.kotonoha/audit/` に作成または attach する。
6. preserved elements、transformations、inferred extensions、unresolved elements、drift risks を review する。
7. proposal を approve、hold、reject、または partially apply する。
8. apply 前に、current source hash が proposal source hash と一致するか検証する。
9. explicit human approval の後にのみ apply する。
10. review decision を `.kotonoha/reviews/` に保存する。

### 9.2 Git-Backed 推奨 Workflow

1. Obsidian で notes を編集する。
2. Kotonoha を `passive-observing` mode にして Git context を観察させる。
3. `kotonoha` CLI を通じて current note から MeaningDelta を作成する。
4. `kotonoha rde validate --strict` と `kotonoha rde attach` により RDE output を validate and attach する。
5. `kotonoha review approve|hold|reject` により human review decision を記録する。
6. commit / pull / push は Kotonoha の外側で、user が選んだ Git workflow により行う。

## 10. 許可される CLI-Backed Operations

plugin は、configured `kotonoha` CLI に以下を委譲してよい。

- `kotonoha status`
- `kotonoha diff --file <current-note>`
- `kotonoha delta create <current-note>`
- `kotonoha rde validate --strict`
- `kotonoha rde attach`
- `kotonoha review approve|hold|reject`
- `kotonoha export --format m2`

これらの operations は Git synchronization operations として扱ってはならない。

non-Git mode では、Git context を要求する commands は disabled、hidden、または clearly marked unavailable にするべきである。

## 11. Obsidian Git Plugin Coexistence

Obsidian Git plugin が installed されている場合、Kotonoha はそれと競合してはならない。

Obsidian Git は file history と synchronization を管理する。Kotonoha は semantic lineage を観察する。

Conflict avoidance rules:

- commit/pull/push/stage/unstage を実装しない。
- background writes を schedule しない。
- long operations 中に Git HEAD が stable のままだと仮定しない。
- note metadata を書き込む前に file modification time と Git HEAD を再確認する。
- auto-sync に依存する user のため sidecar-only mode を提供する。
- Obsidian Git plugin は optional であり required ではないことを document する。

## 12. Git以外の Sync Tools

多くの user は Git の代わりに Obsidian Sync、iCloud、Dropbox、Google Drive、OneDrive、Syncthing、その他の file synchronization tools を使う可能性がある。

Kotonoha Console はこれらを external synchronization layers として扱うべきである。

Rules:

- atomic sync behavior を仮定しない。
- conflict-free writes を仮定しない。
- proposal を apply する前に file modification time を再確認する。
- proposal を apply する前に source hash を再確認する。
- sidecar-first storage を優先する。
- proposal generation 後に source が変わっている場合は warning を表示する。

Kotonoha Console は file synchronization の所有者になってはならない。

## 13. Acceptance Criteria

### 13.1 Non-Git MVP Acceptance Criteria

- [ ] Plugin は通常の non-Git Obsidian vault で動作する。
- [ ] MVP における default `kotonoha.gitMode` は `off` である。
- [ ] 必要に応じて `.kotonoha/` sidecar directory が作成される。
- [ ] Proposal records は `.kotonoha/proposals/` に保存される。
- [ ] RDE audit records は `.kotonoha/audit/` に保存される。
- [ ] Review decisions は `.kotonoha/reviews/` に保存される。
- [ ] 各 proposal に `sourceHash` が記録される。
- [ ] Apply operation は書き込み前に current source hash を検証する。
- [ ] source hash が変化している場合、plugin は warning を表示し、re-audit、regeneration、または explicit override を要求する。
- [ ] Full-text snapshot storage は opt-in である。
- [ ] Metadata writes は default で `prompt` である。

### 13.2 Git-Aware Acceptance Criteria

- [ ] `kotonoha.gitMode` setting は `off`、`external`、`passive-observing`、`obsidian-git-aware` を支援する。
- [ ] `off` mode は Git を完全に無視する。
- [ ] `external` mode は explicit actions の時だけ Git context を読む。
- [ ] `passive-observing` mode は branch、commit、dirty state、repo-relative note path を表示する。
- [ ] `obsidian-git-aware` mode は Obsidian Git auto-sync と競合しうる metadata writes を避ける。
- [ ] どの mode も commit、pull、push、stage、unstage、reset、merge、rebase、auto-sync を実装しない。
- [ ] 有効化されている場合、plugin は Kotonoha operations を configured `kotonoha` CLI に委譲する。
- [ ] README は Git mode model を document する。
- [ ] README は Obsidian Git plugin が optional であることを明示する。

## 14. RDE Boundary

Git が答えるのは次である。

> What changed in files?

Kotonoha が答えるのは次である。

> What changed in meaning, responsibility, loss, and deviation risk?

Git は semantic lineage の evidence base を強化しうる。しかし semantic lineage を定義してはならない。

RDE audit は Git に依存してはならない。RDE は Git context が利用可能であれば使ってよいが、その core evidence は source text、proposal text、source hash、audit result、human review decision であり続けるべきである。

## 15. Design Rationale

system は Git なしで動作するべきである。多くの Obsidian user は Git を使わない。また Kotonoha の core object は file commit ではなく meaning transition だからである。

Git-backed vault は developer や researcher にとって有用である。reproducibility、external diffing、rollback、collaboration を強化するからである。しかし Git を mandatory にすると、Kotonoha Console の目的を歪め、MVP を不必要に複雑化する。

正しい関係は以下である。

```text
MVP:
  semantic lineage with sidecar logs, snapshots, hashes, and human decisions

Advanced Git mode:
  semantic lineage anchored to optional Git file history
```

Git は witness であり、judge ではない。

## 16. この仕様自身への RDE Self-Audit

### 保存された要素

この specification は、Kotonoha が Git-aware だが Git-owning ではないという original boundary を保存している。また file history と semantic lineage の区別も保存している。

### 許可された変換

以前の Git-backed-first framing は、Git-optional architecture へ変換された。この変換は、non-Git Obsidian vault を first-class MVP mode として支援するという判断によって許可されている。

### 補完された要素

sidecar-first storage model、snapshot modes、source-hash apply verification、non-Git acceptance criteria は、採用された推奨から導かれた implementation-oriented extensions である。

### 未解決の要素

snapshots、proposals、RDE audits、review decisions の exact JSON schemas は未定義である。local sidecar logs と将来の SLS storage の関係も未解決である。

### 逸脱リスク

sidecar logs が full Semantic Lineage System storage と誤認される危険がある。local plugin records かつ future-compatible evidence であって、complete SLS layer ではないと document すべきである。

### 次回更新方針

次回は `.kotonoha/snapshots`、`.kotonoha/proposals`、`.kotonoha/audit`、`.kotonoha/reviews` の concrete JSON schemas を定義する。
