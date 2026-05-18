# Plan Eng Review Extension: Agent Requirements

Status: Historical planning extension; superseded for live implementation status by `../protocol-completion-audit-v0.2.md`
Version: v0.2.0  
Audience: Agent-runtime builders, receiver endpoint owners, platform engineering, security engineering, protocol implementers  
Implementation status: Historical agent-requirements input; current runtime wrappers, receiver adapters, and codemode proof are documented in `../runtime-integration.md`, `../receiver-integration.md`, and `../protocol-completion-audit-v0.2.md`
Canonical owner: Product owner  
Extends: [`01-plan-eng-review-primitive-fields-state.md`](./01-plan-eng-review-primitive-fields-state.md)  
Last reviewed: 2026-05-17

## Invariant At Stake

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

`01-plan-eng-review-primitive-fields-state.md` defines the primitive fields and state interactions. This extension adds the missing agent requirement layer around those primitives: what an issuer agent/runtime must expose, what a receiver endpoint or receiver agent must enforce, and how generated orchestration becomes contract candidates without becoming authority.

This is not a replacement for the primitive review. It is the agent-facing protocol obligation that sits around it.

## Sequencing Constraint

`01-plan-eng-review-primitive-fields-state.md` must land first.

This extension must not drive implementation until the primitive objects and state transitions are real enough to bind against:

- `ToolCapability`;
- `ActionType`;
- `ReceiverRegistryEntry`;
- `IntentCompilationRecord`;
- `ActionContract`;
- `PolicyDecision`;
- `Greenlight`;
- `ReceiverGateAttempt`;
- `MutationAttempt`;
- `Receipt`;
- `ProofGap`;
- `IsolationState`;
- `ContractStreamEvent`.

The v0.1 failure was letting product surfaces, compatibility paths, and category language outrun the primitive. `02` exists to prevent the same mistake at the agent-runtime layer.

## Gap Statement

v0.1 under-articulated the agent requirement.

It treated agents too much like ordinary API clients or plugin users. That is not enough. Agents compile vague intent into tool calls, generated scripts, MCP operations, browser actions, scheduled jobs, repo writes, package installs, cloud mutations, and receiver-to-receiver workflows.

Generated orchestration may be useful. It is not authority.

Runtime hooks may block local dispatch. They are not receiver enforcement.

Rendered plans may help a human understand intent. They are not permission.

Agent identity may help policy decide. It is not mutation authority.

## v0.1 Lessons Carried Forward

The old repo contained real pieces of Handshake, but it did not keep the control primitive small enough. This extension carries forward these product/engineering lessons:

1. Runtime literacy is not runtime enforcement. A read-only skill can teach an agent what to do, but it cannot stop generated code from mutating through tools, MCP, terminal, cron, browser actions, or package managers.
2. Receiver middleware alone proves only the downstream half. It does not prove that generated agent orchestration cannot bypass the contract boundary before reaching the receiver.
3. A scoped decision object that can float without an exact action contract becomes ambient authority wearing a badge.
4. Verify-only compatibility paths are not Handshake. If a receiver can mutate after token verification without checking the exact contract and one-use greenlight, the path is advisory.
5. Demo surfaces drift unless the refusal cases are first-class. Missing, replayed, mismatched, isolated, and receiver-policy-drifted greenlights must refuse before mutation in the first proof.
6. Category language is dangerous before proof. "Agentic economy" and "authority layer" are downstream narrative, not implementation permission.

These lessons do not expand `02` into a full runtime platform. They narrow `02` to one agent-runtime proof after `01` exists.

## Research Carry-Forward

The agentic circuit-breaker research archive is input, not canonical product truth. Its useful contribution is the narrowing it eventually reached:

```text
agent operating envelope = background scope
action contract = proposed consequential commitment
greenlight = one-use receiver-bound execution authority
receiver gate = enforcement boundary before mutation
receipt/proof gap = reconstructable evidence
isolation state = halt condition for pending and future consequence
```

The archive must not pull v0.2 back into "agent smart contracts," broad "circuit breaker" positioning, payment rails, marketplaces, settlement, agent governance, or market-access product surfaces. Those are future-category inputs only.

Three mechanisms carry forward into `02`:

1. Generated execution block bounds. Codemode-style generated scripts may need parent bounds covering allowed tools, receivers, resources, side-effect classes, retry limits, stop conditions, freshness, and evidence expectations. These bounds are compilation context, not authority. Every consequential mutation inside the block still requires its own action contract unless represented as an explicit bounded batch contract.
2. Contract-stream isolation. Receiver gates and policy decisions must observe current isolation state. A listener can detect divergence and update isolation, but the receiver gate must enforce it before mutation.
3. Receiver refusal tests. The first proof must show refusal for missing greenlight, replayed greenlight, mismatched contract digest, isolated subject/resource, receiver policy drift, and unavailable receipt/proof-gap evidence.

This is the narrow version of the research. Anything broader belongs outside v0.2 until the first receiver-gated loop works.

## Agent Requirement Thesis

Agents may propose and orchestrate. Receivers enforce. Handshake is the contract exchange between them.

The issuer side must reduce an agent-originated action attempt into catalog-bound contract candidates. The receiver side must publish what it will honor and enforce the exact greenlight before mutation. Handshake clears, refuses, records, and reconstructs the chain between those sides.

The protocol center remains the same primitive loop from the architecture review:

```text
agent-originated action attempt
  -> ToolCapability / ActionType / ReceiverRegistryEntry lookup
  -> IntentCompilationRecord
  -> ActionContract
  -> PolicyDecision
  -> one-use Greenlight or refusal/review/halt/quarantine
  -> ReceiverGateAttempt
  -> MutationAttempt or receiver refusal
  -> Receipt or ProofGap
  -> IsolationState check before future decisions and gates
```

## Architecture Alignment

| Agent product requirement | Primitive object from the architecture review | Protocol obligation |
|---|---|---|
| Runtime declares callable capabilities | `ToolCapability` | Classify read-only, ambiguous, consequential, wrapper status, and bypass risk. |
| Runtime and receiver agree on consequential categories | `ActionType` | Prevent model-invented action classes from becoming contracts. |
| Receiver publishes enforceable endpoint and accepted shape | `ReceiverRegistryEntry`, `ReceiverPolicyContract` | Bind receiver ID, gate endpoint, policy version, resource namespace, drift behavior, and evidence expectations. |
| Generated orchestration is inspected before consequence | `IntentCompilationRecord` | Record candidates, rejected overreach, assumptions, uncertainty markers, generated code/spec refs, and catalog versions. |
| Generated execution block bounds constrain codemode context | `IntentCompilationRecord`, `ActionContract`, `PolicyDecision`, `ContractStreamEvent` | Record allowed tools, receivers, resources, retry bounds, stop conditions, expiry, and evidence expectations as context; never treat block bounds as mutation authority. |
| Exact proposed consequence is normalized | `ActionContract` | Bind receiver, resource, parameters digest, non-secret summary, side effects, bounds, canonicalizer version, and idempotency key. |
| Policy clears or refuses the exact contract | `PolicyDecision` | Decide against the contract, envelope, receiver policy, and current isolation state. |
| Execution authority is one-use and receiver-bound | `Greenlight` | Bind one decision to one exact receiver-gated attempt; default `max_uses` is exactly `1`. |
| Receiver checks before mutation | `ReceiverGateAttempt` | Verify exact binding, freshness, isolation, receiver policy drift, idempotency, and greenlight consumption before consequence. |
| Receiver outcome is separated by phase | `MutationAttempt`, `Receipt`, `ProofGap` | Distinguish gate check, mutation attempt, downstream finality, refusal, and missing evidence. |
| Divergence blocks future consequence | `IsolationState`, `ContractStreamEvent` | Isolation must be checked at both policy decision time and receiver gate time. |
| Human review, when required, is exact | `ReviewDecision` | Bind reviewer decision to contract digest, policy input digest, receiver policy version, render schema version, expiry, and attestation. |

## Issuer-Side Agent Requirements

The issuer side is the agent runtime, host, MCP client, codemode runner, plugin, or orchestration environment where an agent first attempts to cause consequence.

An issuer integration must:

- publish a `ToolCapability` catalog with read-only, ambiguous, consequential, wrapped, and bypass-prone classifications;
- bind each consequential tool path to an explicit `ActionType`;
- pin the `ReceiverRegistryEntry` and receiver policy version used during compilation;
- compute deterministic argument digests over canonicalized parameters;
- emit an `IntentCompilationRecord` before any `ActionContract`;
- record generated code or spec references without storing raw secrets;
- record generated execution block bounds when codemode, scheduled, browser, or batch orchestration can cause multiple consequential attempts;
- record uncertainty markers when tool, receiver, resource, or parameter meaning is unclear;
- record rejected overreach when the agent tries to expand vague intent beyond the envelope;
- fail closed for consequential dispatch when the action cannot be classified or contracted;
- return structured refusal/retry information to the agent loop;
- record issuer evidence as evidence contribution, not as receiver execution proof.

The issuer side may stop a local tool call. That is useful. It is still not the enforcement boundary for receiver-owned consequence.

## First Runtime Proof Target

After `01` lands, the first proof target is OpenClaw. Hermes is second.

OpenClaw comes first because its TypeScript plugin model, typed lifecycle hooks, and documented `before_tool_call` blocking semantics make the issuer-side proof smaller and more falsifiable. Hermes remains essential because it tests cross-language/runtime portability, but its veto semantics need verification before it becomes the reference proof.

The first runtime proof is not "support OpenClaw" as a broad integration. It is one protected MCP-style write action:

```text
OpenClaw generated tool call
  -> before_tool_call observes exact tool + args
  -> issuer adapter classifies capability
  -> IntentCompilationRecord records candidate and uncertainty
  -> ActionContract binds receiver/action/resource/params digest
  -> PolicyDecision greenlights or refuses
  -> OpenClaw blocks or allows retry with exact greenlight reference
  -> receiver gate checks before mutation
  -> Receipt or ProofGap reconstructs the chain
```

The proof target should use a fake but consequential receiver such as `crm.update_customer`, `github.create_issue`, or `repo.write_file`. The receiver must refuse missing, replayed, mismatched, isolated, and receiver-policy-drifted greenlights before mutation.

The proof must also emit a contract-stream event for every policy decision, greenlight, receiver refusal, mutation attempt, receipt, proof gap, and isolation transition needed to reconstruct the run. If stream ordering cannot show whether isolation predated a receiver gate, the proof is incomplete.

Hermes becomes the second proof when the same contract exchange can be expressed through its hook model without weakening the issuer/receiver boundary.

## Receiver-Side Agent Requirements

The receiver side is the endpoint, service, receiver agent, MCP server, deployment surface, package manager adapter, repo writer, cloud mutation API, database operation layer, or other system that owns the consequence.

A receiver integration must publish:

- receiver ID and receiver owner;
- receiver kind and adapter version;
- gate endpoint reference;
- accepted action classes;
- accepted contract shape;
- parameter schema and secret-bearing field rules;
- resource namespace and canonicalization rules;
- receiver policy contract ID and version;
- policy drift behavior;
- freshness window;
- idempotency behavior and replay rules;
- evidence expectations;
- receipt requirements;
- proof-gap behavior;
- isolation-check capability;
- refusal reason codes that are sanitized enough for agent recovery.

Before mutation, the receiver gate must verify:

- greenlight exists, is unexpired, and has not been consumed;
- greenlight binds to the same action contract digest;
- receiver ID, action class, resource reference, and parameter digest match;
- receiver policy version is same-version or explicitly compatible stricter;
- current isolation state does not block the action;
- idempotency key has not already produced a conflicting mutation;
- receipt or transactional outbox capability is available;
- receiver gate evidence can be appended with ordering sufficient to reconstruct races against isolation changes.

If any check fails, the receiver must refuse before mutation.

## Generated Orchestration Requirements

Agent-generated orchestration includes codemode scripts, MCP tool sequences, generated JSON plans, browser-side tool calls, scheduled jobs, terminal commands, package operations, repo writes, cloud API calls, and receiver-to-receiver action chains.

Every consequential branch, loop, retry, generated script, and MCP write must become a separate contract candidate unless represented as an explicit bounded batch contract.

Generated execution block bounds may be used to describe the frame around a generated program:

- allowed tool capability IDs;
- allowed action classes;
- allowed receiver IDs and resource namespaces;
- disallowed side-effect classes;
- retry and loop limits;
- branch conditions that can create consequential candidates;
- freshness and expiry;
- required evidence and proof-gap behavior;
- stop conditions after refusal, proof gap, or isolation.

These bounds do not authorize mutation. They only define what the issuer compiler may inspect and what policy may consider before individual action contracts are proposed.

Generated orchestration must be classified as one of:

- `read_only`: no consequential mutation path observed;
- `ambiguous`: consequence depends on parameters, receiver state, hidden tool behavior, or generated code path;
- `consequential`: mutation path observed or declared;
- `unwrapped_bypass`: consequential path can avoid the issuer adapter or receiver gate.

The compiler must refuse or require review for `ambiguous` actions. It must not emit a contract for `unwrapped_bypass` as if the action is controlled.

Specific generated-code requirements:

- loops must not reuse one greenlight across multiple mutations;
- retries may reconcile the same receiver operation only when bound to the same `mutation_attempt_id` and idempotency key;
- branches must emit separate candidates for each consequential path that can execute;
- dynamic tool-name construction must be refused unless it resolves to pinned `ToolCapability` entries before dispatch;
- generated UI or JSON plans must bind to exact contract digests if they influence review;
- scheduled jobs must carry run identity and freshness evidence;
- browser-side tools must be treated as bypass-prone unless their receiver gate is observable and enforceable;
- package installs, repo writes, cloud mutations, and database operations are consequential by default.

## State-Machine Additions

The primitive review state machine remains canonical. Agent-originated action attempts enter it through the compiler boundary:

```text
[agent_attempt_observed]
      |
      v
[execution_block_bounds_recorded]
      |
      v
[capability_classifying]
      |
      +-- read_only ---------------------> [runtime_passthrough_recorded]
      +-- unknown capability ------------> [compilation_refused]
      +-- ambiguous consequence ---------> [compilation_refused or review_required]
      +-- unwrapped bypass --------------> [compilation_refused and bypass_evidence_recorded]
      |
      v
[intent_compiling]
      |
      +-- overreach beyond envelope ------> [compilation_refused]
      +-- unknown receiver/action --------> [compilation_refused]
      |
      v
[candidate_contract]
      |
      v
[action_proposed]
      |
      v
[policy_evaluating]
      |
      +-- refused/review/halt/quarantine -> [issuer_receives_structured_decision]
      |
      v
[greenlit]
      |
      v
[contract_stream_event_appended]
      |
      v
[receiver_gate_checking]
      |
      +-- missing/mismatched/replayed ----> [receiver_refused_before_mutation]
      +-- current isolation --------------> [receiver_refused_before_mutation]
      +-- receiver policy drift ----------> [receiver_refused_before_mutation]
      |
      v
[greenlight_consumed]
      |
      v
[mutation_attempted]
      |
      v
[receipt_or_proof_gap_emitted]
```

Forbidden direct edges:

```text
agent_identity -> mutation_attempted
runtime_hook -> mutation_attempted
generated_code -> greenlight
execution_block_bounds -> mutation_attempted
rendered_plan -> greenlight
plugin_check -> receiver_execution_proof
issuer_receipt -> downstream_success
operating_envelope -> receiver_gate_passed
```

## ADR-021 Adoption

ADR-021 remains useful as issuer-side adapter research. It is not the protocol center.

| ADR-021 element | v0.2 adoption | Required language adjustment |
|---|---|---|
| Official before/after tool hooks | Keep | Hooks produce issuer evidence and contract candidates; they do not enforce receiver-owned consequence. |
| Explicit allowlist with declared action category | Keep and rename | Map to `ToolCapability` plus `ActionType`; do not infer action class from model prose. |
| Deterministic args hash | Keep | Map to canonical parameter digest and canonicalizer version. |
| Fail-closed on Handshake unavailability | Keep | Required for consequential dispatch at issuer side. |
| Pending/retry error shape | Keep | Must preserve one-use greenlight semantics and same-operation reconciliation rules. |
| Runtime inspect stub | Keep | Maps to issuer-visible catalog inspection, not authority inspection. |
| Post-call receipt emission | Keep with boundary | Issuer evidence contribution only; receiver receipt remains canonical for consequence. |
| `scoped approval` | Rename | Use `PolicyDecision` plus one-use `Greenlight` where applicable. |
| `approval_id` | Rename | Use policy decision reference or greenlight ID. |
| `intentCategory` | Rename | Use `ActionType.action_class` or receiver policy category. |
| `passport` | Defer or narrow | Identity evidence only; never mutation authority. |
| Plugin-only control claim | Reject | If the receiver does not enforce, the system is advisory, not Handshake. |

## Non-Claims

Handshake v0.2 does not claim:

- agent auth as the product category;
- plugin-only enforcement for receiver-owned consequence;
- dashboard-first control;
- rendered-plan authority;
- runtime trace as execution proof;
- human review of a summary as exact contract binding;
- identity evidence as mutation authority;
- generated code as an action contract;
- operating envelope as receiver permission;
- receipt as downstream business success.

## Acceptance Criteria

This extension is accepted when:

- it links to `01-plan-eng-review-primitive-fields-state.md`;
- it does not redefine primitive schemas independently of that review;
- it states that `01` must land before `02` implementation starts;
- it names both sides of the protocol: issuer agent/runtime and receiver endpoint/agent;
- it requires `IntentCompilationRecord` before `ActionContract`;
- it requires receiver policy contract publication before receiver-gated mutation;
- it covers loops, retries, branches, dynamic tool construction, MCP writes, browser tools, scheduled jobs, package installs, repo writes, cloud mutations, and unwrapped bypass;
- it states that generated execution block bounds are compilation context, not mutation authority;
- it identifies OpenClaw as the first post-`01` runtime proof target and Hermes as the second;
- it preserves one-use greenlight semantics;
- it preserves proof gaps as first-class evidence objects;
- it makes issuer evidence and receiver receipts distinct;
- it requires refusal tests for missing, replayed, mismatched, isolated, and receiver-policy-drifted greenlights.

## Kill Criteria

This extension is wrong if:

- it causes implementation to start before `01` has landed;
- implementers read it as runtime middleware being enough;
- receiver owners cannot tell what they must publish and enforce;
- agent-runtime builders cannot tell what they must classify and record;
- generated orchestration can reuse one greenlight across multiple mutations;
- generated execution block bounds are treated as authority to mutate;
- ambiguous generated-code consequence can become a clean contract;
- the product surface can show a rendered plan that is not bound to the exact contract digest;
- missing receiver evidence can be hidden inside receipt prose;
- the first MCP write proof can mutate without receiver-side gate enforcement;
- stream ordering cannot reconstruct whether isolation happened before or after receiver gate evaluation.

## Smallest Next Mechanism

After `01` lands, build one OpenClaw MCP-style consequential write proof with both halves present:

```text
issuer adapter:
  ToolCapability
  ActionType
  IntentCompilationRecord
  deterministic params digest
  before_tool_call block/allow decision
  after_tool_call issuer evidence contribution
  generated execution block bounds when applicable

receiver endpoint:
  ReceiverRegistryEntry
  ReceiverPolicyContract
  ReceiverGateAttempt
  idempotency ledger
  Receipt or ProofGap

stream/isolation:
  ContractStreamEvent
  current IsolationState check at policy time
  current IsolationState check at receiver gate time
  ordered refusal/mutation/receipt/proof-gap evidence
```

The proof is not complete until a missing, mismatched, replayed, isolated, or receiver-policy-drifted greenlight refuses before mutation.
