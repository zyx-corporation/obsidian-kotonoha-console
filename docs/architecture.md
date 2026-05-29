# obsidian-kotonoha-console Architecture

created: 2026-05-29T13:40:28+09:00
author: Tomoyuki Kano <tomyuk@zyxcorp.jp>
status: draft
version: 0.1.0

## 1. Purpose

`obsidian-kotonoha-console` is an Obsidian plugin that connects a user's Markdown-based thought workspace with Kotonoha-related generation, organization, and audit workflows.

The plugin is not intended to be an automatic rewriting tool. Its primary role is to provide a console for proposing, inspecting, auditing, and applying meaning changes to notes under explicit human approval.

The core design principle is:

> Obsidian is the workspace of thought. Kotonoha is the assistant layer for generation, organization, and connection. RDE is the audit layer for meaning change.

Therefore, the plugin must preserve the user's authorship, prevent silent overwrites, and make semantic transformation visible before any modification is applied to the vault.

## 2. Design Goals

The initial architecture is guided by the following goals.

1. Keep Obsidian-specific APIs isolated from the domain logic.
2. Treat AI outputs as proposals, not direct edits.
3. Support human approval before any note modification.
4. Preserve auditability of source text, proposal, decision, and resulting changes.
5. Allow Kotonoha integration through multiple backends such as mock, local HTTP, CLI, or future orchestrator interfaces.
6. Prepare for RDE-based semantic audit without requiring a full RDE engine in the MVP.
7. Maintain local-first portability and avoid unnecessary cloud dependency.
8. Make uncertainty explicit when generated changes rely on inferred context.

## 3. Non-Goals for MVP

The MVP must avoid overreach.

The following are intentionally out of scope for the first implementation:

- Automatic full-vault restructuring
- Silent note rewriting
- Automatic tag/link normalization across the whole vault
- Autonomous long-running agents inside Obsidian
- Mandatory dependency on Kotonoha Orchestrator
- Mandatory dependency on a remote LLM provider
- Full Semantic Lineage System integration
- Single-score-only RDE safety judgment

These can be considered in later phases after proposal, approval, and audit primitives are stable.

## 4. High-Level Architecture

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

The architecture must be modular enough that the domain model and application services can be tested without running Obsidian.

## 5. Layer Responsibilities

### 5.1 UI Layer

The UI layer provides commands, panels, and user interactions.

Primary responsibilities:

- Register commands in the Obsidian command palette.
- Display the Kotonoha Console side panel.
- Let the user choose the operation type.
- Accept free-form user instructions.
- Display generated proposals.
- Display RDE audit results.
- Provide Apply, Revise, Reject, and Copy actions.
- Surface uncertainty and drift warnings clearly.

The UI must not directly call low-level Obsidian APIs except through adapters. It must also avoid applying generated content automatically.

### 5.2 Obsidian Adapter

The Obsidian adapter isolates plugin-specific API usage.

Primary responsibilities:

- Read the active file.
- Read the selected text from the current editor.
- Extract frontmatter, tags, links, and metadata.
- Apply approved changes to the current note.
- Write local audit files under `.kotonoha/`.
- Resolve vault-relative file paths.

This layer should remain thin and replaceable.

### 5.3 Application Services

Application services coordinate use cases.

Primary responsibilities:

- Build `NoteContext` from the active note or selected range.
- Build `GenerationRequest` from user operation and note context.
- Call `KotonohaClient`.
- Store proposals.
- Trigger RDE audit.
- Apply approved proposals.
- Write audit logs.
- Maintain clear transaction boundaries.

Application services should not depend on UI components.

### 5.4 Kotonoha Client

The Kotonoha client abstracts communication with generation and orchestration backends.

Initial client implementations:

- `MockKotonohaClient`: returns deterministic mock proposals for tests and offline development.
- `HttpKotonohaClient`: sends requests to a local HTTP endpoint.
- `CliKotonohaClient`: invokes a local CLI command and parses the result.

Future implementations may include WebSocket, MCP-style, or Kotonoha Orchestrator-specific clients.

The client interface must remain stable across backend changes.

### 5.5 RDE Layer

The RDE layer evaluates the meaning change between source text and proposed text.

Primary responsibilities:

- Build structural diffs.
- Prepare audit requests.
- Parse audit responses.
- Classify semantic changes.
- Render audit results in a human-readable form.
- Write audit logs.

The MVP may start with a rule-based or mock RDE layer, but its output schema must already match the long-term RDE model.

### 5.6 Domain Model

The domain model defines stable concepts independent of UI and backend.

Core entities:

- `NoteContext`
- `GenerationRequest`
- `Proposal`
- `RdeAudit`
- `ApprovalDecision`

These models should be plain TypeScript types or classes with minimal external dependencies.

## 6. Core Data Models

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

## 7. Main Workflow

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

No proposal may modify the vault without a human approval action.

## 8. MVP Workflow

The MVP should support the following minimal workflow:

1. User opens a Markdown note.
2. User selects text or uses the full active note.
3. User opens Kotonoha Console.
4. User selects an operation such as summarize, rewrite, expand, or RDE audit.
5. User enters an instruction.
6. Plugin builds a `GenerationRequest`.
7. Mock or local Kotonoha client returns a `Proposal`.
8. Proposal is displayed in the side panel.
9. Optional RDE audit is displayed.
10. User chooses Apply, Revise, Reject, or Copy.
11. If Apply is selected, the plugin modifies the note.
12. A local audit log is written.

## 9. File and Directory Layout

Recommended source layout:

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

Recommended local vault files:

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

Initial settings:

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

Recommended defaults:

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

## 11. Audit Log Strategy

The plugin must write audit logs for proposal generation and approval decisions.

The default log mode should avoid storing full note text. Recommended default:

- source hash
- proposal hash
- short source excerpt
- short proposal excerpt
- operation type
- RDE categories
- human decision
- timestamp
- file path

Full-text logging may be useful for research and reproducibility, but it must be opt-in.

## 12. Testing Strategy

The project should prioritize testable domain and service layers.

Recommended test order:

1. `NoteContextService`
2. `GenerationRequestService`
3. `MockKotonohaClient`
4. `ProposalService`
5. `RdeAuditParser`
6. `ApprovalService`
7. `AuditLogService`
8. UI smoke tests

The MVP should not depend on a live Kotonoha server for tests.

## 13. Implementation Phases

### Phase 0: Plugin Skeleton

- Initialize Obsidian plugin structure.
- Add basic settings.
- Register command palette actions.
- Add a side panel.

### Phase 1: Note I/O

- Read active note.
- Read selection.
- Extract frontmatter, tags, and links.
- Write approved text back to the note.

### Phase 2: Kotonoha Client Abstraction

- Define `KotonohaClient`.
- Implement mock client.
- Add HTTP client.
- Add CLI client later if needed.

### Phase 3: Proposal Mode

- Display generated proposals.
- Do not apply automatically.
- Support Copy and Reject.
- Support Apply with explicit confirmation.

### Phase 4: RDE Audit

- Add RDE data model.
- Add basic structural diff.
- Add audit display.
- Parse RDE audit result from backend or mock.

### Phase 5: Human Approval Workflow

- Support approve, reject, and partial apply.
- Write decision logs.
- Preserve source and proposal hashes.
- Prepare future integration with SLS.

## 14. RDE Design Constraint

RDE must not be reduced to a single quality score.

The UI may show confidence, but the central display must remain categorical and explanatory:

- preserved elements
- transformed elements
- inferred extensions
- unresolved elements
- drift risks
- recommended decision

A proposal with high fluency but suspicious semantic drift must still be flagged.

## 15. Security and Privacy Considerations

The plugin may handle private notes. Therefore:

- Remote endpoints must be explicit.
- Local-first mode must work.
- Full-text logging must be opt-in.
- Silent transmission of vault content is prohibited.
- The user must be able to inspect which text is being sent.
- API keys, if introduced later, must be stored through Obsidian's normal plugin settings mechanism and never committed.

## 16. Future Extensions

Possible future extensions:

- Semantic Lineage System integration
- ΔM timeline visualization
- Vault-level proposal queue
- Multi-note context builder
- RDE calibration profiles
- Relation-aware context retrieval
- Git-backed audit export
- Pull-request-style review of note transformations

These should not be part of the MVP unless the basic proposal and approval workflow is stable.

## 17. RDE Self-Audit of This Architecture

### Preserved Elements

This architecture preserves the core idea that Kotonoha should not overwrite thought, but should assist meaning formation under human review.

### Authorized Transformations

The broad Kotonoha/RDE/SLS vision is transformed into an Obsidian plugin architecture with concrete layers, interfaces, and workflows.

### Inferred Extensions

The proposed source layout, settings schema, and audit directory layout are inferred implementation details. They are not final theory claims.

### Unresolved Elements

The exact Kotonoha Orchestrator protocol, RDE engine location, and SLS integration timing remain unresolved.

### Drift Risks

The plugin could drift into a convenience rewriting tool if approval and audit are weakened. It could also reduce RDE to superficial scoring if the UI overemphasizes numerical confidence.

### Next Update Policy

The next update should define actual TypeScript interfaces in `src/domain/types.ts`, followed by mock-client-driven implementation of the MVP workflow.
