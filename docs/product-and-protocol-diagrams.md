# Product And Protocol Diagrams

Status: Draft canonical visual model
Version: v0.2.1
Audience: Product, protocol implementers, runtime builders, gateway owners, platform engineering, security engineering
Implementation status: Drawn against the current v0.2 protocol kernel, runtime wrappers, gateway adapters, D1 records, and completion audit
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Invariant At Stake

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

These diagrams are not product promises. They are visual checks on the protocol boundary. If a path reaches gateway mutation without an exact action contract, policy decision, one-use greenlight, gateway check, and receipt or proof gap, that path is not Handshake.

## Product Loop

This is the customer-facing loop. It shows why Handshake exists without pretending the runtime or UI is the authority boundary.

```mermaid
flowchart LR
  principal["Principal gives vague intent"]
  runtime["Agent runtime compiles intent into generated orchestration"]
  surface["Handshake CLI/MCP protected action surface"]
  candidate["Handshake extracts exact action candidate"]
  policy["Atomic policy evaluates exact contract"]
  gate["Gateway gate checks exact one-use greenlight"]
  consequence["Gateway mutation attempted"]
  evidence["Receipt, refusal, or proof gap recorded"]
  recovery["Recovery, isolation, or next narrowed contract"]

  principal --> runtime --> surface --> candidate --> policy
  policy -->|"greenlight"| gate
  policy -->|"refuse, review, halt, quarantine"| evidence
  gate -->|"pass"| consequence --> evidence
  gate -->|"refuse before mutation"| evidence
  evidence --> recovery
  recovery -->|"fresh proposal only"| candidate
```

Product reading:

- The operating envelope permits attempts, not mutation.
- The agent proposes. It does not authorize.
- CLI/MCP is the reusable product surface for protected proposals, setup, inspection, and conformance.
- Policy clears the exact contract, not a plan summary.
- The gateway check enforces before consequence.
- Evidence can be a success receipt, refusal, pending downstream status, or proof gap.

## Authority Boundary

This is the boundary that cannot move left into the runtime or review UI.

```mermaid
flowchart TB
  subgraph issuer["Issuer side: useful but not authority"]
    intent["Vague principal intent"]
    code["Generated code, MCP calls, browser actions, scheduled jobs, tool sequences"]
    hook["Handshake CLI/MCP protected proposal surface"]
    compilation["IntentCompilationRecord with assumptions, uncertainty, overreach"]
    contract["ActionContract proposal"]
  end

  subgraph kernel["Handshake kernel: contract clearing"]
    canonical["Canonicalize exact gateway-bound contract"]
    decision["PolicyDecision"]
    greenlight["Greenlight maxUses = 1"]
    isolation["Current IsolationState"]
    stream["ContractStreamEvent chain"]
  end

  subgraph gateway["Gateway side: enforcement before consequence"]
    gate["GatewayCheckAttempt"]
    ledger["Greenlight consumption ledger"]
    mutation["MutationAttempt"]
    receipt["Receipt or ProofGap"]
  end

  intent --> code --> hook --> compilation --> contract --> canonical --> decision
  isolation --> decision
  decision -->|"greenlight"| greenlight --> gate
  decision -->|"refuse, review, halt, quarantine"| receipt
  isolation --> gate
  gate --> ledger
  ledger -->|"consumed once"| mutation --> receipt
  gate -->|"mismatch, replay, drift, isolation"| receipt
  decision --> stream
  gate --> stream
  mutation --> stream
  receipt --> stream
```

Forbidden reading:

- A runtime hook is not gateway enforcement.
- The CLI/MCP surface is not gateway enforcement.
- A generated plan is not an action contract.
- A review screen is not authority unless bound to the exact contract and policy digest.
- A greenlight cannot authorize more than one gateway-checked attempt.

## Protocol Object Graph

This is the durable object graph the current v0.2 kernel persists or derives from durable ledgers.

```mermaid
flowchart TD
  tool["ToolCapability"]
  actionType["ActionType"]
  gatewayEntry["GatewayRegistryEntry"]
  envelope["OperatingEnvelope"]
  compilation["IntentCompilationRecord"]
  contract["ActionContract"]
  policy["PolicyDecision"]
  review["ReviewDecision"]
  issuance["greenlight_issuances row"]
  greenlight["Greenlight"]
  gate["GatewayCheckAttempt"]
  consumption["greenlight_consumptions row"]
  mutation["MutationAttempt"]
  reconciliation["SurfaceOperationReconciliation"]
  proofGap["ProofGap"]
  receipt["Receipt"]
  export["ReceiptExport"]
  recovery["RecoveryRecommendation"]
  recoveryTransition["RecoveryRecommendationStatusTransition"]
  recoveryClaim["recovery_terminal_claims row"]
  breaker["BreakerDecision"]
  isolation["IsolationState"]
  event["ContractStreamEvent"]

  tool --> compilation
  actionType --> compilation
  gatewayEntry --> compilation
  envelope --> compilation
  compilation --> contract
  gatewayEntry --> contract
  envelope --> contract
  contract --> policy
  isolation --> policy
  policy -->|"review_required"| review --> policy
  policy -->|"claim action contract"| issuance -->|"greenlight"| greenlight
  greenlight --> gate
  contract --> gate
  gatewayEntry --> gate
  isolation --> gate
  gate -->|"pass"| consumption --> mutation
  gate -->|"refuse or proof gap"| receipt
  mutation --> receipt
  mutation --> reconciliation --> receipt
  proofGap --> receipt
  receipt --> export
  receipt --> recovery
  recovery --> recoveryTransition --> recoveryClaim
  recovery -->|"fresh follow-up proposal only"| contract
  event --> breaker --> isolation
  compilation --> event
  contract --> event
  policy --> event
  gate --> event
  mutation --> event
  proofGap --> event
  receipt --> event
  recovery --> event
```

Protocol reading:

- Catalog objects bind the compiler before a contract exists.
- `ActionContract` is a proposed commitment, not execution authority.
- `Greenlight` is exact, gateway-bound, and one-use; issuance is claimed once per action contract before the record is committed.
- `ProofGap` is a first-class object, not receipt prose or mutation authority.
- Recovery creates a narrowed future proposal path. It does not reuse a greenlight or mutate a gateway.

## Gateway-Gated Mutation Sequence

This is the normal successful path with the exact enforcement point shown.

```mermaid
sequenceDiagram
  participant Principal
  participant Runtime as Agent Runtime
  participant Kernel as Handshake Kernel
  participant Policy as Policy Evaluator
  participant Gateway as Gateway Check
  participant Surface as Consequence Surface
  participant Store as Receipt Store

  Principal->>Runtime: Vague intent
  Runtime->>Kernel: compileIntent(candidate, catalogs, envelope)
  Kernel-->>Runtime: IntentCompilationRecord
  Runtime->>Kernel: proposeActionContract(exact gateway, resource, params)
  Kernel-->>Runtime: ActionContract digest
  Runtime->>Policy: evaluate exact contract
  Policy->>Store: record PolicyDecision
  Policy-->>Runtime: Greenlight or refusal
  Runtime->>Gateway: actionContractId + greenlightId + observed parameters
  Gateway->>Kernel: gatewayCheck(...)
  Kernel->>Kernel: verify binding, freshness, drift, isolation, replay
  Kernel->>Store: consume greenlight and record GatewayCheckAttempt
  Kernel-->>Gateway: VerifiedGatewayCheck
  Gateway->>Surface: mutate only after verified gate
  Gateway->>Kernel: reconcile surface operation evidence
  Kernel->>Store: record MutationAttempt, Receipt, stream events
  Store-->>Principal: reconstructable receipt timeline
```

If the gateway mutates before `VerifiedGatewayCheck`, this is advisory, not Handshake.

## Refusal And Proof-Gap Paths

These paths must stay visible in the product. They are not edge-case errors; they are protocol outcomes.

```mermaid
stateDiagram-v2
  [*] --> AgentAttemptObserved
  AgentAttemptObserved --> IntentCompilation

  IntentCompilation --> CompilationRefused: unknown catalog, ambiguous consequence, unwrapped bypass, overreach
  IntentCompilation --> ActionContractProposed: clean catalog-bound candidate

  ActionContractProposed --> PolicyDecision
  PolicyDecision --> Refused: outside envelope or stale contract
  PolicyDecision --> ReviewRequired: review-only isolation or policy rule
  PolicyDecision --> Halted: halt isolation
  PolicyDecision --> Quarantined: quarantine isolation
  PolicyDecision --> Greenlit: exact greenlight

  Greenlit --> GatewayCheckPending
  GatewayCheckPending --> GatewayRefused: missing, replayed, mismatched, drifted, isolated
  GatewayCheckPending --> ProofGapRecorded: required evidence unavailable or downstream unknown
  GatewayCheckPending --> MutationAttempted: check passed

  MutationAttempted --> ReceiptFinal: downstream succeeded
  MutationAttempted --> ReceiptPending: downstream pending
  MutationAttempted --> ProofGapRecorded: downstream unknown or contradictory

  CompilationRefused --> ReceiptOrCompilerEvidence
  Refused --> ReceiptOrCompilerEvidence
  ReviewRequired --> ReviewDecision
  ReviewDecision --> PolicyDecision: exact digest-bound approval
  GatewayRefused --> ReceiptOrCompilerEvidence
  ProofGapRecorded --> RecoveryRecommendation
  ReceiptPending --> RecoveryRecommendation
  ReceiptFinal --> [*]

  RecoveryRecommendation --> ActionContractProposed: fresh narrowed contract only
```

## Runtime Conformance Direction For 02

This diagram is where `02-plan-eng-review-agent-requirements.md` should go next: a conformance model for generated orchestration, not a second authority model.

```mermaid
flowchart TD
  observed["RuntimeAttemptObservation"]
  classify["Classify against ToolCapability"]
  readOnly["read_only passthrough evidence"]
  ambiguous["ambiguous refusal or review"]
  bypass["unwrapped_bypass refusal plus bypass evidence"]
  consequential["consequential candidate"]
  bounds["ExecutionBlockBounds"]
  contract["ActionContract proposal"]
  policy["PolicyDecision"]
  gateway["GatewayCheckAttempt"]

  observed --> classify
  classify -->|"read_only"| readOnly
  classify -->|"ambiguous"| ambiguous
  classify -->|"unwrapped_bypass"| bypass
  classify -->|"consequential"| consequential
  bounds --> consequential
  consequential --> contract --> policy --> gateway

  readOnly -.->|"no authority created"| observed
  ambiguous -.->|"no clean contract"| observed
  bypass -.->|"no control claim"| observed
```

02 should add issuer-side conformance evidence, not weaken gateway-side enforcement.

## Brutal Verdict

Keep these diagrams narrow. The product diagram is allowed to be simple, but the protocol diagrams must remain unforgiving: every consequential mutation path either reaches gateway-checked authority or records refusal, proof gap, bypass evidence, or isolation.

Smallest next mechanism: turn the runtime conformance direction into concrete `ExecutionBlockBounds` and `RuntimeAttemptObservation` schemas before adding another runtime integration.
