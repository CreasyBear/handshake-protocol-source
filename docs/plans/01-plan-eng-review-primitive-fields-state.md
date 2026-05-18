# Plan Eng Review: Primitive Fields and State Interactions

Source: `/Users/joelchan/.gstack/projects/CreasyBear-Handshake/agentic-circuit-breaker-research/34-updated-primitive-shape.md`

Generated: 2026-05-17

Status: `DONE_WITH_CONCERNS`

Implementation checkpoint: v0.2 has implemented the first closed enforcement loop, including catalog-bound intent compilation, exact action contracts, deterministic policy, one-use greenlights, gateway-check attempts, pending/unknown downstream finality, surface-operation reconciliation, proof gaps, receipts with stream-offset references and tamper-evident receipt/audit-chain digests, receipt export/drop-copy packaging, lifecycle-owned breaker decisions, isolation checks with validated observed stream watermarks, D1 durable records, package-install and repo-write gateway harnesses, codemode multi-action sequencing, per-action/per-run/per-gateway-resource stream offsets and digest chains, recovery recommendations from refusal/proof-gap receipts that cannot reuse greenlights or mutate gateways, recovery-linked follow-up action contracts that validate recommendation scope, timing, later sequence number, allowed action class, and required new evidence without inheriting authority, recovery recommendation status transitions for expired and superseded recommendations, race-safe one-terminal-status enforcement for recovery recommendations under concurrent follow-up proposals, recovery terminal conflicts recorded as recovery-phase proof gaps, and recovery terminal conflict proof-gap resolution bound to the observed winning terminal transition. The compact completion audit is recorded in `docs/audits/protocol-completion-audit-v0.2.md`; the next permitted expansion is a v0.2 checkpoint and ADR before changing the control object model. Product UI or broader gateway claims still require the protocol primitive to survive that audit.

Skill used: `/plan-eng-review`

Runtime note: the formal `/plan-eng-review` workflow expects an interactive AskUserQuestion tool. This runtime did not expose a usable AskUserQuestion path in Default mode, so this review is written as a non-interactive artifact. Unresolved choices are called out explicitly instead of being silently decided.

## Invariant At Stake

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

The primitive in `34-updated-primitive-shape.md` is pointed in the right direction: action contracts, not agent configurations, are the unit of control. The weak spot is that several objects are still nouns without enough typed state to make catalog-bound intent compilation, gateway enforcement, replay prevention, isolation propagation, proof-gap handling, review binding, and audit reconstruction deterministic.

Brutal verdict: keep the primitive shape, but harden the object model before implementation and require one gateway adapter proof before calling v1 real. If these fields are not made explicit, Handshake becomes trace plus advisory policy, not gateway-checked execution control.

## Step 0 Scope Challenge

### What Already Exists

There is no application code in this repo yet. Existing usable material is:

| Existing artifact | What it solves | Reuse verdict |
|---|---|---|
| `34-updated-primitive-shape.md` | Canonical primitive synthesis and stack order | Reuse as source vocabulary, not as an implementation schema |
| `AGENTS.md` | Local agent operating posture for Handshake work | Reuse as review posture and invariant source |
| No `TODOS.md` | No deferred implementation queue exists | Create TODOs only after the first schema work lands |

### Minimum Change That Achieves The Goal

The minimum useful next implementation is not the whole 16-object stack. It is the first closed enforcement loop:

```text
Principal Intent + Tool/Action/Gateway Catalogs
  -> Intent Compilation Record
Action Contract
  -> Atomic Policy Decision
  -> One-use Greenlight or Refusal
  -> Gateway Adapter Gate Check
  -> Mutation Attempt or Gateway Refusal
  -> Receipt or Proof Gap
  -> Isolation State check before future policy/gate decisions
```

Everything else should exist only as typed references until the loop works. Catalog, gateway registry, compiler, review decision, and proof-gap references are not optional decorations; they are how vague intent and generated code avoid becoming fake precision.

### Complexity Check

If implemented directly, the 16-object stack will likely create more than 8 files and more than 2 services. That is a smell if attempted as one PR. Split it into:

1. Catalog, gateway registry, and compiler boundary.
2. Schema and canonicalization invariants.
3. Policy decision and greenlight lifecycle.
4. Gateway gate and receipt lifecycle with one real adapter harness.
5. Stream ordering and breaker isolation.

### Search Check

Search was not needed for this artifact because the user requested a review of a local primitive document, not a technology choice. For implementation, do not invent distributed log, idempotency, or signature systems before checking boring built-ins in the chosen runtime.

### Completeness Check

The complete version is not "build every market mapping." The complete version is "make one consequential action impossible to mutate without a matching one-use greenlight and receipt semantics." AI-assisted completeness should be spent on invariant tests and failure states, not market breadth.

### Distribution Check

No distributable artifact is specified yet. If the first proof is a library, CLI, MCP proxy, or gateway adapter, the build and install path must be part of the plan. Code without a gateway integration is advisory. Schemas without a gateway that refuses mutation before consequence are also advisory.

## Full Primitive Inventory From 34

| # | Primitive | Current shape in 34 | Enforcement status | Verdict |
|---:|---|---|---|---|
| 1 | Principal / Org Authority | Identifies who the agent acts for | Partially fielded | Keep, add delegation version and revocation epoch |
| 2 | Agent Identity | Identifies acting software entity | Partially fielded | Keep, add instance/run binding and isolation binding |
| 3 | Operating Envelope | General authority to attempt actions | Partially fielded | Keep, but never treat as mutation authority |
| 4 | Atomic Policy | Machine-checkable rule envelope | Conceptual, not fielded | Redesign into a typed evaluator input/output contract |
| 5 | Contract Skill | Agent-facing grammar for requesting authority | Conceptual, not fielded | Keep as ergonomics only, never authority |
| 6 | Runtime Facade | Wraps tools and emits action contracts | Responsibility list only | Harden as an interception boundary with bypass evidence |
| 7 | Action Contract | Proposed consequential commitment | Best-fielded object | Keep, add canonicalization, preconditions, schema version, non-secret summaries |
| 8 | Greenlight | Exact execution authority | Partially fielded | Keep, force one-use semantics unless explicitly proven otherwise |
| 9 | Contract Stream | Append-only event feed | Event names only | Redesign with event IDs, offsets, ordering, digest chain |
| 10 | Breaker Listener | Evaluates stream for divergence | Checks and outputs only | Redesign with observed offsets, rule version, isolation writes |
| 11 | Isolation State | Persistent control state after divergence | Scopes and states only | Redesign as first-class state with versioning and propagation |
| 12 | Gateway Policy Contract | Gateway-declared acceptance rules | Partially fielded | Keep, add version/signature/drift semantics |
| 13 | Gateway Check | Final enforcement point | Verification list only | Redesign as transactional gate attempt with consumption ledger |
| 14 | Mutation / Refusal | Gateway mutates or refuses | Examples only | Redesign into typed mutation/refusal outcomes |
| 15 | Receipt | Evidence of what happened | Partially fielded | Keep, split gateway check from downstream execution |
| 16 | Recovery | Next action after refusal/block/execution/dispute | Recovery path list only | Keep as workflow, not authority |

## Missing V1 Control Objects

The 16-object stack is a good product vocabulary, but v1 implementation needs several supporting control objects promoted from references into persisted schemas. If they stay implicit, Handshake cannot prove that the compiler stayed inside catalogs, that review was bound to the exact contract, or that missing evidence was represented honestly.

| Object | Why it is required | Failure if omitted | Verdict |
|---|---|---|---|
| `ToolCapability` | Declares what the runtime can call, including read/write classification and wrapper status | Generated code can call an unwrapped consequential tool and escape the contract boundary | Required before compiler |
| `ActionType` | Declares the narrower set of consequential action classes Handshake knows how to contract | A raw tool call becomes an ad hoc action with model-invented semantics | Required before policy |
| `GatewayRegistryEntry` | Binds gateway ID, adapter, policy contract, canonical resource namespace, and gate endpoint | A contract names a gateway that cannot enforce or cannot be reconstructed later | Required before contract issuance |
| `IntentCompilationRecord` | Records principal intent, generated code/spec refs, assumptions, candidate actions, uncertainty, and rejected overreach | The compiler overreached the principal and nobody can reconstruct why a candidate existed | Required before action contract |
| `ReviewDecision` | Binds a human or admin review to exact contract digest, policy input digest, render schema version, and expiry | This is review theatre: the user approves a summary while the underlying contract differs | Required before any review-required greenlight |
| `ProofGap` | Represents missing, expired, contradictory, or unavailable evidence as its own auditable object | Missing evidence is smoothed into receipt prose and later reads like execution proof | Required before receipt export |

These are not product surface area. They are authority plumbing.

## Field-Level Review

### Global Field Rules

Every persisted control object needs these fields unless there is a specific reason not to:

```text
object_id
object_type
schema_version
tenant_id
organization_id
created_at
created_by_ref
source_event_id
canonical_digest
signature_or_attestation_ref
redaction_class
```

Every object involved in enforcement needs:

```text
policy_version_seen
gateway_policy_version_seen
isolation_snapshot_ref
freshness_window_or_expires_at
```

Every object that can be replayed, consumed, or used for mutation needs:

```text
idempotency_key
nonce_or_attempt_id
max_uses
consumed_at
consumed_by_gate_attempt_id
replay_status
```

Non-secret constraint: contracts, greenlights, stream events, and receipts must never contain raw secrets, bearer tokens, OAuth refresh tokens, API keys, private key material, raw environment variables, or unredacted customer data. Use evidence refs, redacted summaries, hashes, and typed classifications.

### 1. Principal / Org Authority

Fields in 34:

```text
principal_id
organization_id
tenant_id
role_or_authority_source
delegation_scope
auth_session_ref
revocation_status
```

Required fields: all listed fields are required.

Derived fields:

```text
principal_authority_digest
effective_delegation_scope
principal_revocation_epoch
```

Identity and binding fields to add:

```text
authority_grant_id
authority_grant_version
issuer_principal_id
subject_principal_id
organization_role_ref
tenant_boundary_ref
```

Evidence fields to add:

```text
authority_evidence_refs
auth_session_issued_at
auth_session_expires_at
```

Expiry and freshness fields to add:

```text
authority_valid_from
authority_valid_until
revocation_checked_at
revocation_epoch
```

Non-secret constraints:

- `auth_session_ref` must be a reference, not a token.
- `role_or_authority_source` must not embed SSO assertions or JWT bodies.
- `delegation_scope` must be normalized, not free text.

Finding: `revocation_status` without a monotonic revocation epoch invites stale authority. A gateway check needs to know whether its snapshot predates a revocation.

### 2. Agent Identity

Fields in 34:

```text
agent_id
agent_runtime
agent_instance_id
model_or_runtime_ref
signing_key_or_attestation_ref
trust_tier
revocation_status
```

Required fields: all listed fields are required.

Derived fields:

```text
agent_identity_digest
runtime_family
attestation_status
```

Identity and binding fields to add:

```text
run_id
session_id
runtime_adapter_id
runtime_adapter_version
agent_owner_principal_id
agent_isolation_scope_ref
```

Evidence fields to add:

```text
runtime_attestation_evidence_ref
agent_code_or_prompt_digest
tool_catalog_ref
```

Expiry and freshness fields to add:

```text
identity_asserted_at
attestation_expires_at
revocation_checked_at
```

Non-secret constraints:

- `model_or_runtime_ref` must not include raw prompt text unless separately redacted.
- `signing_key_or_attestation_ref` must never contain private key material.

Finding: `agent_instance_id` is not enough. Isolation can attach to agent, run, instance, action class, gateway, or tenant. The identity object must expose enough binding keys for policy and gate checks to query isolation deterministically.

### 3. Operating Envelope

Fields in 34:

```text
envelope_id
agent_id
principal_id
objective
allowed_action_classes
allowed_gateways
allowed_resources
rate_bounds
retry_bounds
budget_bounds
evidence_requirements
expiry
isolation_rules
policy_pack_ref
```

Required fields: all listed fields are required, except `objective` must be treated as descriptive input, not an enforceable permission by itself.

Derived fields:

```text
envelope_digest
effective_action_class_set
effective_gateway_set
effective_resource_set
effective_budget_remaining
```

Identity and binding fields to add:

```text
envelope_version
organization_id
tenant_id
authority_grant_id
policy_pack_version
```

Evidence fields to add:

```text
principal_intent_ref
approval_or_creation_evidence_ref
```

Expiry and freshness fields to add:

```text
issued_at
expires_at
revoked_at
last_policy_refresh_at
```

Non-secret constraints:

- `objective` must be redacted and summarized if it includes customer data, secrets, tickets, or repository-private content.
- `allowed_resources` must use stable resource refs, not raw credentials or URLs with embedded tokens.

Finding: the envelope can authorize attempts, not mutations. If implementation lets the gateway accept an envelope without a greenlight, this is advisory, not Handshake.

### 4. Atomic Policy

Fields in 34: no explicit object fields. 34 lists the question shape: who, behalf, action, gateway, resource, bounds, evidence, expiry, violation behavior, receipt requirement.

Required fields to define:

```text
policy_decision_id
policy_pack_ref
policy_pack_version
policy_evaluator_version
action_contract_id
envelope_id
principal_id
agent_id
gateway_id
action_class
resource_ref
params_digest
evidence_refs
isolation_snapshot_ref
decision
decision_reason
decision_code
required_receipt
created_at
expires_at
decision_signature
```

Derived fields:

```text
policy_input_digest
policy_output_digest
matched_rule_ids
effective_bounds
```

Identity and binding fields:

```text
tenant_id
organization_id
authority_grant_id
gateway_policy_ref
```

Evidence fields:

```text
policy_context_refs
evidence_evaluation_results
missing_evidence_refs
```

Expiry and freshness fields:

```text
policy_context_collected_at
decision_valid_until
isolation_snapshot_collected_at
```

Non-secret constraints:

- Policy context refs must point to redacted evidence or signed external refs.
- Decision reasons must be safe for logs and review screens.

Finding: policy is currently a concept. That is insufficient. The evaluator needs a typed input and a typed output, or replay and audit will depend on reconstructing model interpretation later. This is not auditable.

### 5. Contract Skill

Fields in 34: no explicit fields. 34 lists expression media: `SKILL.md`, tool descriptions, capability manuals, few-shot examples, refusal recovery grammar, allowed/disallowed examples.

Required fields to define:

```text
contract_skill_id
contract_skill_version
runtime_family
tool_catalog_ref
action_catalog_ref
gateway_registry_ref
instruction_digest
published_at
```

Derived fields:

```text
skill_coverage_digest
known_disallowed_action_patterns
```

Identity and binding fields:

```text
agent_runtime
runtime_adapter_id
compatible_facade_versions
```

Evidence fields:

```text
skill_source_ref
example_set_ref
refusal_recovery_grammar_ref
```

Expiry and freshness fields:

```text
valid_from
superseded_at
```

Non-secret constraints:

- The skill must not contain operational secrets.
- Few-shot examples must not include real customer data or raw gateway credentials.

Finding: this is ergonomics, not authority. If the agent follows the skill, good. If it bypasses the skill, the gateway check must still refuse. A skill without a gate is theatre.

### 6. Runtime / Capability Facade

Fields in 34: no explicit fields. 34 lists responsibilities: canonicalize action, derive gateway/action/resource, attach identity, collect evidence refs, compute params digest, emit contract, wait for decision, return greenlight/refusal, prevent raw bypass when possible.

Required fields to define:

```text
facade_call_id
runtime_adapter_id
runtime_adapter_version
run_id
agent_instance_id
tool_call_ref
raw_capability_ref
action_catalog_ref
gateway_registry_ref
canonicalizer_version
action_contract_id
decision_id
decision_status
created_at
```

Derived fields:

```text
raw_params_digest
canonical_params_digest
consequentiality_classification
```

Identity and binding fields:

```text
agent_id
principal_id
organization_id
tenant_id
envelope_id
```

Evidence fields:

```text
raw_tool_call_evidence_ref
generated_code_ref
runtime_trace_ref
bypass_detection_evidence_ref
```

Expiry and freshness fields:

```text
catalog_loaded_at
gateway_registry_loaded_at
policy_context_loaded_at
```

Non-secret constraints:

- Store raw params only through redacted refs.
- The facade must not log environment variables, access tokens, package credentials, or cloud secret values.

Finding: "prevent raw bypass when possible" is too weak as an enforcement claim. The gateway must enforce. The facade should record bypass evidence and reduce bypass probability, but it is not the trusted boundary.

### 7. Action Contract

Fields in 34:

```text
action_contract_id
envelope_id
agent_id
principal_id
organization_id
run_id
sequence_number
issued_at
expires_at
gateway_id
gateway_policy_ref
action_class
resource_ref
params_digest
purpose
expected_side_effects
evidence_refs
bounds
idempotency_key
rollback_hint
counterparty_ref
license_or_terms_ref
signature_or_attestation
```

Required fields: all listed fields should be required except optional domain-specific refs such as `counterparty_ref` and `license_or_terms_ref`.

Derived fields:

```text
action_contract_digest
canonical_params_digest
effective_bounds
consequentiality_classification
```

Identity and binding fields to add:

```text
tenant_id
agent_instance_id
runtime_adapter_id
facade_call_id
principal_authority_ref
gateway_policy_version
action_catalog_version
canonicalizer_version
```

Evidence fields to add:

```text
non_secret_params_summary
precondition_evidence_refs
state_snapshot_refs
generated_code_or_spec_ref
review_artifact_ref
```

Expiry and freshness fields to add:

```text
evidence_collected_at
precondition_valid_until
gateway_policy_checked_at
```

Non-secret constraints:

- `params_digest` alone is not inspectable enough. Pair it with a typed redacted parameter summary.
- `purpose` and `expected_side_effects` must not be model prose that can launder scope. They need constrained enums plus short human-readable text.
- `rollback_hint` is not a rollback guarantee.

Finding: the action contract is the right central object. It still needs canonicalization versioning and non-secret parameter summaries, or review and policy will evaluate a digest they cannot inspect.

### 8. Greenlight

Fields in 34:

```text
greenlight_id
action_contract_id
decision
decision_reason
policy_version
gateway_id
action_class
resource_ref
params_digest
max_uses
expires_at
isolation_snapshot_ref
required_receipt
decision_signature
```

Required fields: all listed fields are required.

Derived fields:

```text
greenlight_digest
contract_binding_digest
```

Identity and binding fields to add:

```text
tenant_id
organization_id
agent_id
principal_id
run_id
gateway_policy_ref
gateway_policy_version
canonicalizer_version
```

Evidence fields to add:

```text
policy_decision_id
policy_input_digest
matched_rule_ids
```

Expiry and freshness fields to add:

```text
issued_at
not_before
expires_at
isolation_snapshot_collected_at
gateway_policy_checked_at
```

Non-secret constraints:

- `decision_reason` must be safe to show in receipts and review UI.
- The greenlight must not carry raw gateway credentials.

Finding: `max_uses` is dangerous. Default it to exactly `1`. If any action class needs more than one use, that must become a different primitive such as a bounded batch contract with per-item receipts. Otherwise this is ambient authority wearing a badge.

### 9. Contract Stream

Fields in 34: event types only.

Required fields to define:

```text
stream_event_id
stream_id
stream_scope
offset
partition_key
event_type
event_time
producer_ref
object_refs
previous_event_digest
event_digest
signature_or_attestation_ref
```

Derived fields:

```text
per_run_sequence
per_protected_surface_resource_sequence
digest_chain_ref
```

Identity and binding fields:

```text
tenant_id
organization_id
run_id
agent_id
gateway_id
resource_ref
action_contract_id
greenlight_id
gate_attempt_id
receipt_id
```

Evidence fields:

```text
event_payload_ref
redacted_payload_summary
causation_event_id
correlation_id
```

Expiry and freshness fields:

```text
observed_at
committed_at
retention_class
```

Non-secret constraints:

- Stream payloads must be redacted by default.
- Digest chains must not hash unstable serialization.

Finding: "append-only feed" is not enough. The breaker listener needs ordering semantics and watermarks. Without them, a greenlight can race ahead of an isolation event.

### 10. Breaker Listener

Fields in 34: checks and outputs only.

Required fields to define:

```text
listener_decision_id
listener_id
listener_version
rule_pack_ref
rule_pack_version
observed_stream_id
observed_offset_start
observed_offset_end
decision
decision_reason
target_scope_type
target_scope_id
created_isolation_state_id
created_at
```

Derived fields:

```text
sequence_risk_score
matched_breaker_rule_ids
observed_window_digest
```

Identity and binding fields:

```text
tenant_id
organization_id
agent_id
run_id
gateway_id
resource_ref
action_class
```

Evidence fields:

```text
supporting_event_refs
missing_event_refs
proof_gap_refs
```

Expiry and freshness fields:

```text
decision_effective_at
decision_expires_at
watermark_at_decision
```

Non-secret constraints:

- Listener evidence must refer to stream events and redacted summaries.
- Do not embed raw generated code unless stored in a protected evidence store.

Finding: the listener must write durable isolation state, not just output recommendations. If it only tells the runtime to stop, the generated code can continue through another path.

### 11. Isolation State

Fields in 34: scopes and states only.

Required fields to define:

```text
isolation_state_id
scope_type
scope_id
state
reason_code
reason_summary
source_decision_ref
source_event_ref
created_at
effective_at
expires_at
cleared_at
cleared_by_ref
version
```

Derived fields:

```text
isolation_snapshot_ref
effective_isolation_status
scope_hierarchy_digest
```

Identity and binding fields:

```text
tenant_id
organization_id
agent_id
run_id
envelope_id
gateway_id
resource_ref
counterparty_ref
license_or_terms_ref
```

Evidence fields:

```text
breaker_decision_ref
supporting_receipt_refs
proof_gap_refs
review_decision_refs
```

Expiry and freshness fields:

```text
effective_at
expires_at
review_by
last_propagated_at
last_gate_checked_at
```

Non-secret constraints:

- Reason summaries must be safe for logs.
- Proof gap refs must not include raw secrets.

Finding: isolation must be checked by both policy evaluator and gateway check. If only policy checks it, a previously issued greenlight can still mutate after quarantine.

### 12. Gateway Policy Contract

Fields in 34:

```text
gateway_id
accepted_action_classes
parameter_schema
resource_binding_rules
required_greenlight_shape
freshness_window
idempotency_rules
replay_rules
evidence_requirements
receipt_requirements
failure_modes
compensation_hooks
```

Required fields: all listed fields are required.

Derived fields:

```text
gateway_policy_digest
accepted_contract_shape_digest
```

Identity and binding fields to add:

```text
gateway_policy_contract_id
gateway_policy_version
gateway_owner_ref
tenant_scope
organization_scope
action_catalog_version
```

Evidence fields to add:

```text
gateway_policy_signature_ref
schema_source_ref
compensation_evidence_requirements
```

Expiry and freshness fields to add:

```text
published_at
effective_from
superseded_at
freshness_window
```

Non-secret constraints:

- Parameter schemas must describe secret-bearing fields as refs or write-only inputs.
- Compensation hooks must not expose credentials or mutable callback secrets.

Finding: gateway policy drift is underspecified. The gate must know whether to enforce the policy version pinned by the greenlight, the current gateway policy, or the stricter of both.

### 13. Gateway Check

Fields in 34: verification list only.

Required fields to define:

```text
gate_attempt_id
gateway_id
gateway_policy_contract_id
gateway_policy_version
action_contract_id
greenlight_id
contract_digest_seen
greenlight_digest_seen
params_digest_seen
idempotency_key_seen
isolation_snapshot_ref
gate_decision
gate_decision_reason
created_at
```

Derived fields:

```text
binding_match_status
freshness_status
idempotency_status
receipt_capability_status
```

Identity and binding fields:

```text
tenant_id
organization_id
principal_id
agent_id
run_id
action_class
resource_ref
```

Evidence fields:

```text
gate_input_ref
greenlight_signature_verification_ref
gateway_policy_evaluation_ref
isolation_check_ref
```

Expiry and freshness fields:

```text
gate_started_at
gate_finished_at
greenlight_expires_at
isolation_checked_at
gateway_policy_checked_at
```

Non-secret constraints:

- Gate logs must not capture raw mutation credentials.
- Refusal details must be safe enough for the agent to recover without exposing gateway internals.

Finding: the gateway check is the enforcement boundary. It should be modeled as a transactional attempt, not a boolean check. If it cannot atomically consume the greenlight and emit a receipt or proof gap, replay and audit break.

### 14. Mutation / Refusal

Fields in 34: examples and refusal reasons only.

Required fields to define:

```text
mutation_attempt_id
gate_attempt_id
action_contract_id
greenlight_id
gateway_id
action_class
resource_ref
idempotency_key
outcome
outcome_reason
gateway_operation_ref
started_at
finished_at
```

Derived fields:

```text
mutation_phase
downstream_status
retryable_status
compensation_required
```

Identity and binding fields:

```text
tenant_id
organization_id
agent_id
principal_id
run_id
```

Evidence fields:

```text
gateway_response_ref
downstream_operation_ref
refusal_evidence_ref
proof_gap_ref
```

Expiry and freshness fields:

```text
attempt_started_at
attempt_finished_at
gateway_timeout_at
compensation_deadline
```

Non-secret constraints:

- Surface operation refs must not be access tokens or signed URLs unless stored in a protected evidence store.
- Downstream responses must be redacted before they enter the receipt store.

Finding: refusal before mutation, failure during mutation, and unknown downstream status are different states. Collapsing them into "refusal" or "failed" creates evidence theatre.

### 15. Receipt / Drop Copy

Fields in 34:

```text
receipt_id
action_contract_id
greenlight_id
gateway_id
decision
decision_reason
execution_status
executed_at
refusal_reason
evidence_refs
policy_version
isolation_snapshot_ref
stream_offsets
digest_chain_ref
rollback_or_compensation_status
export_format
```

Required fields: all listed fields are required, with stronger naming.

Derived fields:

```text
receipt_digest
audit_chain_digest
finality_status
```

Identity and binding fields to add:

```text
tenant_id
organization_id
principal_id
agent_id
run_id
gate_attempt_id
mutation_attempt_id
gateway_policy_version
```

Evidence fields to add:

```text
gateway_check_check_status
gateway_checked_at
greenlight_consumption_status
mutation_attempt_status
downstream_execution_status
proof_gap_status
proof_gap_reason
```

Expiry and freshness fields to add:

```text
receipt_emitted_at
evidence_retention_until
receipt_exported_at
```

Non-secret constraints:

- Receipts exported outside the system need redaction profiles.
- Evidence refs must be dereferenceable later or marked as expired evidence with a proof gap.

Finding: the current receipt fields do not cleanly distinguish gateway check from downstream execution. This is evidence theatre unless split into gate status, mutation attempt status, and downstream finality.

### 16. Recovery / Dispute / Learning Loop

Fields in 34: recovery paths only.

Required fields to define:

```text
recovery_action_id
source_receipt_id
source_refusal_or_gap_ref
recommended_path
allowed_next_action_classes
required_new_evidence
requires_human_review
created_at
status
```

Derived fields:

```text
safe_retry_available
scope_narrowing_required
policy_update_candidate
agent_instruction_update_candidate
```

Identity and binding fields:

```text
tenant_id
organization_id
principal_id
agent_id
run_id
gateway_id
resource_ref
```

Evidence fields:

```text
failure_receipt_ref
missing_evidence_refs
review_decision_ref
policy_change_ref
```

Expiry and freshness fields:

```text
recovery_expires_at
review_due_at
retry_not_before
```

Non-secret constraints:

- Recovery instructions must not expose gateway internals or secrets.
- Agent learning artifacts must be sanitized before reuse.

Finding: recovery is useful only if it produces a narrower future contract. It must not mutate isolation, policy, or gateway state without going back through the same contract path.

Implementation checkpoint: `RecoveryRecommendation` now persists the source receipt, source refusal/proof-gap ref, recommended path, allowed next action classes, required new evidence, review timing, identity bindings, missing evidence refs, source receipt/audit digests, and derived flags. The source receipt must be refused, proof-gapped, failed, unknown, or suspect. Final successful receipts are rejected. The record fixes `mustCreateNewActionContract: true`, `mayReuseGreenlight: false`, and `mayMutateProtectedSurface: false`, and emits `recovery_recommended` into the action/run/gateway-resource streams.

Implementation checkpoint: a later `ActionContract` may carry `recoveryRecommendationId`, `recoverySourceReceiptId`, and `recoveryRecommendationDigest`. Proposal refuses stale, non-open, not-yet-retryable, wrong-scope, not-later, disallowed-action-class, or missing-new-evidence recovery links. The link is evidence only: proposal still records a new action contract, and policy, greenlight, gateway check, and receipt remain separate required transitions.

Implementation checkpoint: `RecoveryRecommendationStatusTransition` records explicit movement from `open` to `expired` or `superseded`, including reason, actor ref, previous/next status, optional superseding action contract, and transition digest. Linked follow-up proposal supersedes the recommendation in the same lifecycle commit. Explicit expiration refuses before `recoveryExpiresAt`.

Implementation checkpoint: `recovery_terminal_claims` now provides race-safe one-terminal-status enforcement. The same commit that records a terminal recovery transition also inserts a terminal claim keyed by `recovery_recommendation_id`; a second concurrent follow-up or expiration receives `recovery_terminal_conflict` and does not persist an action contract or status transition.

Implementation checkpoint: recovery terminal conflicts now emit `ProofGap` records with `gapPhase: recovery`, `reasonCode: recovery_terminal_conflict`, and `finalityImpact: none`. This makes lost follow-up races reconstructable without pretending a gateway mutation, greenlight, or action contract existed.

Implementation checkpoint: recovery terminal conflict proof gaps can now resolve only after the winning `RecoveryRecommendationStatusTransition` is observed. Resolution preserves the original proof gap, sets `resolvedByRef` to the terminal transition, emits `proof_gap_resolved`, and does not retroactively persist the losing follow-up action contract, losing expiration transition, second terminal claim, greenlight, gate, or gateway mutation.

## Compiler Boundary Review

The intent compiler is currently implied by the runtime facade and action contract. That is too vague. The compiler is the boundary where vague principal intent and generated code become candidate action contracts. It emits candidates, assumptions, uncertainty, rejected overreach, and required evidence. It must not emit authority.

### ToolCapability

Required fields:

```text
tool_capability_id
tool_catalog_id
tool_catalog_version
runtime_adapter_id
tool_name
tool_namespace
capability_class
read_write_classification
consequentiality_default
wrapper_status
raw_bypass_possible
input_schema_ref
output_schema_ref
secret_bearing_fields
created_at
superseded_at
```

Finding: a tool catalog that only lists callable functions is not enough. The compiler needs to know which capabilities are read-only, consequential, wrapper-enforced, or bypass-prone. Otherwise generated code can hide consequence inside an apparently ordinary tool call.

### ActionType

Required fields:

```text
action_type_id
action_catalog_id
action_catalog_version
action_class
gateway_kind
required_contract_fields
canonical_parameter_schema_ref
resource_ref_schema_ref
required_evidence_types
allowed_bounds_schema_ref
default_receipt_requirement
default_idempotency_requirement
created_at
superseded_at
```

Finding: action type is the narrow consequential catalog, not a label the model invents. If `action_class` is free text, policy evaluation becomes model interpretation at execution time.

### GatewayRegistryEntry

Required fields:

```text
gateway_registry_entry_id
gateway_registry_version
gateway_id
gateway_kind
gateway_adapter_id
gateway_adapter_version
gate_endpoint_ref
gateway_policy_contract_id
gateway_policy_version
accepted_action_catalog_versions
resource_namespace_ref
canonicalizer_version
receipt_capability_status
isolation_check_capability_status
created_at
superseded_at
```

Finding: a gateway ID without a registry entry is just a string. The contract must bind to a gateway that can enforce the gate, consume greenlights, check isolation, and emit receipts or proof gaps.

### IntentCompilationRecord

Required fields:

```text
intent_compilation_id
principal_intent_ref
principal_id
agent_id
run_id
runtime_adapter_id
operating_envelope_id
tool_catalog_ref
action_catalog_ref
gateway_registry_ref
generated_code_or_spec_refs
declared_assumptions
uncertainty_markers
candidate_action_contract_refs
rejected_candidate_refs
overreach_reason_codes
required_evidence_refs
compiler_version
created_at
```

Finding: the compiler can overreach the principal. It must record why each candidate exists, what assumptions were used, and what possible actions were rejected. The action contract is not enough to reconstruct the compilation boundary six months later.

### ReviewDecision

Required fields:

```text
review_decision_id
review_artifact_ref
review_render_schema_version
reviewer_principal_id
action_contract_id
action_contract_digest
policy_input_digest
gateway_policy_version
decision
decision_reason_code
decision_expires_at
created_at
signature_or_attestation_ref
```

Finding: review must bind to the exact contract and policy input. If the UI renders a summary while the decision signs something else, this is review theatre.

### ProofGap

Required fields:

```text
proof_gap_id
gap_phase
expected_evidence_type
missing_or_invalid_evidence_ref
affected_object_refs
gate_attempt_id
mutation_attempt_id
receipt_id
reason_code
finality_impact
recovery_requirement
created_at
resolved_at
resolved_by_ref
```

Finding: proof gap is not a receipt footnote. It is the object that prevents missing evidence from being smoothed into fake certainty.

## State Interaction Review

### Interaction Matrix

| Object | Creates | Observes | Blocks | Consumes | Receipts |
|---|---|---|---|---|---|
| ToolCapability | Tool catalog entry | Runtime adapter, tool schemas, wrapper status | Consequential calls through unknown or unwrapped capability | None | tool_catalog_published event |
| ActionType | Action catalog entry | Gateway kinds, parameter schema, evidence requirements | Model-invented action classes | None | action_catalog_published event |
| GatewayRegistryEntry | Gateway binding | Gateway adapter, gate endpoint, policy contract, resource namespace | Contracts for gateways that cannot enforce | None | gateway_registered event |
| IntentCompilationRecord | Candidate action contracts or rejected candidates | Principal intent, generated code/specs, catalogs, envelope | Compiler overreach, unknown gateways/actions, missing evidence | Principal intent and runtime proposal | intent_compiled event |
| Principal / Org Authority | Authority grant, operating envelope | Principal session, org role, revocation | Attempts outside delegation | None directly | Authority evidence refs |
| Agent Identity | Runtime/run identity assertion | Runtime attestation, revocation, isolation | Attempts by revoked or isolated agent | None directly | Identity evidence refs |
| Operating Envelope | Attempt boundary | Principal authority, agent identity, policy pack | Attempts outside allowed class/gateway/resource/budget/retry bounds | Principal authority grant | Envelope creation/revocation events |
| Atomic Policy | Policy decision, greenlight/refusal/review/halt/quarantine | Action contract, envelope, isolation, gateway policy, evidence | Greenlight when exact contract violates policy | Action contract proposal | Policy decision event |
| Contract Skill | Agent request grammar and examples | Tool/action catalog, gateway registry | Nothing by itself | None | Skill version/digest only |
| Runtime Facade | Action contract, facade call event | Tool call, generated code/spec, identity, envelope, catalog | Raw tool path when integrated | Agent tool request | Facade event and action_proposed event |
| Action Contract | Proposed consequential commitment | Envelope, facade call, evidence, gateway policy | Nothing by itself | Principal/agent/envelope refs | action_proposed event |
| Greenlight | Exact execution authority | Policy decision and action contract | Gateway mutation when absent, stale, mismatched, replayed, or isolated | Action contract | action_greenlit event |
| Contract Stream | Ordered event log | All proposal, decision, gate, mutation, receipt, isolation events | Nothing directly, but feeds breaker | Events from producers | Digest chain and offsets |
| Breaker Listener | Isolation state, halt/review/rollback decisions | Contract stream windows | Future decisions and gates through isolation state | Stream offsets | breaker_tripped and isolation events |
| Isolation State | Persistent deny/review/rate/halt state | Breaker decisions, admin decisions, receipts, proof gaps | Policy decisions and gateway checks | Breaker/admin/recovery decisions | isolation_changed event |
| Gateway Policy Contract | Accepted contract/gate shape | Gateway capabilities, schemas, failure modes | Contracts the gateway refuses to honor | None directly | gateway_policy_published event |
| Gateway Check | Gate attempt, greenlight consumption, gateway refusal, mutation attempt | Action contract, greenlight, gateway policy, isolation, idempotency ledger | Mutation before consequence if any check fails | One exact greenlight | gateway_checked event |
| Mutation / Refusal | Gateway outcome | Gate decision and downstream gateway result | Nothing after mutation; can trigger isolation/recovery | Gate attempt and greenlight consumption | action_executed, gateway_refused, action_failed, proof_gap events |
| Receipt | Durable audit packet | Contract, greenlight, gate, mutation/refusal, stream offsets | Nothing directly | Gate and mutation/refusal outcomes | receipt_exported/drop copy |
| ReviewDecision | Bound review outcome | Exact contract digest, policy input digest, review artifact, reviewer authority | Greenlight from stale or mismatched review | Review request | review_decision_recorded event |
| ProofGap | Missing-evidence object | Expected evidence, affected phase/object, gateway/gate/mutation status | Treating missing evidence as success | Failed evidence expectation | proof_gap_recorded/resolved event |
| Recovery | Narrowed next contract request or human review | Receipt, refusal, proof gap, isolation | Unsafe retry if recovery path requires review | Receipt/refusal/proof gap | recovery_recommended event |

### Primary State Flow

```text
principal intent + authority
      |
      v
operating envelope
      |
      v
tool/action/gateway catalogs
      |
      v
intent compiler -- records --> intent compilation record
      |
      v
runtime facade -- emits --> action contract -- appends --> contract stream
      |                              |
      |                              v
      |                         atomic policy
      |                              |
      |                 +------------+-------------+
      |                 |                          |
      v                 v                          v
facade returns     greenlight                 refusal/review/halt
decision                |
                        v
                  gateway check
                        |
        +---------------+----------------+
        |                                |
        v                                v
gateway refusal                 mutation attempt
        |                                |
        +---------------+----------------+
                        |
                        v
                    receipt
                        |
                        v
             recovery / dispute / learning
```

### Isolation Interdict Flow

```text
contract stream event window
          |
          v
breaker listener
          |
          v
isolation state updated
          |
          +----------------------+
          |                      |
          v                      v
atomic policy refuses      gateway check refuses
future greenlights         old or in-flight greenlights
```

If isolation only reaches policy, already-issued greenlights can still mutate. If isolation only reaches the runtime, bypassed generated code can still mutate through a gateway. Isolation must be checked at both policy decision time and gate time.

## Invalid Transitions

| Invalid transition | Required system behavior | Receipt or event |
|---|---|---|
| Greenlight without action contract | Refuse to create decision; emit policy engine error and proof gap if proposal cannot be reconstructed | `policy_decision_failed` or `proof_gap` |
| Mutation without gateway check | Gateway must refuse before mutation; if mutation occurred, quarantine gateway/action class and record bypass | `gateway_bypass_detected`, `breaker_tripped`, `proof_gap` |
| Receipt without gate | Mark receipt invalid; do not count as execution proof | `receipt_invalid`, `proof_gap` |
| Isolated agent receiving greenlight | Policy evaluator must refuse; if greenlight already exists, gateway check must refuse | `action_refused` or `gateway_refused(agent_isolated)` |
| Replayed greenlight | Gate must reject after first consumption or duplicated idempotency ledger hit | `gateway_refused(already_consumed)` |
| Params mismatch | Gate must compare canonical contract digest and observed params digest; refuse before mutation | `gateway_refused(params_mismatch)` |
| Stale evidence | Policy must refuse or require review; gate must refuse if required freshness is part of gateway policy | `review_required(stale_evidence)` or `gateway_refused(stale_evidence)` |
| Gateway mismatch | Gate must refuse if greenlight gateway does not match actual gateway | `gateway_refused(gateway_mismatch)` |
| Resource mismatch | Gate must refuse if resource ref differs after canonicalization | `gateway_refused(resource_mismatch)` |
| Policy version missing | Policy decision must fail closed unless the policy pack is explicitly pinned and reconstructable | `policy_decision_failed` |
| Gateway policy drift unresolved | Gate must enforce the stricter rule or fail closed until drift semantics are explicit | `gateway_refused(gateway_policy_drift)` |
| Receipt store unavailable | Gate should refuse before mutation unless a transactional outbox can durably record a pending receipt | `gateway_refused(receipt_unavailable)` or `proof_gap` |
| Contract stream append failure | Do not issue greenlight if proposal/decision cannot be appended | `policy_decision_failed(stream_unavailable)` |
| Generated code bypasses facade | Gateway gate must still require greenlight; listener should record bypass attempt if observable | `gateway_refused(missing_greenlight)` |
| Unknown tool capability | Compiler must refuse to emit a consequential contract and record uncertainty | `intent_compilation_failed(unknown_tool_capability)` |
| Unknown action type | Compiler must refuse or require review; policy must fail closed if it reaches evaluation | `contract_rejected(unknown_action_type)` |
| Unknown gateway registry entry | Contract must be invalid because no gateway can enforce the gate | `contract_rejected(unknown_gateway)` |
| Review decision digest mismatch | Policy must ignore the review decision and refuse or re-render exact review | `review_invalid(contract_digest_mismatch)` |
| Proof gap hidden inside receipt prose | Receipt must be marked incomplete and a first-class proof gap must be emitted | `receipt_incomplete`, `proof_gap` |

## Open Engineering Risks

### 1. Stream Ordering

Risk: the contract stream currently lists event types but not ordering guarantees. Breaker decisions depend on sequence-level behavior: duplicate action, retry budget, velocity spike, scope creep, stale context. Without partition keys, offsets, watermarks, and digest chains, a listener can miss that an isolation event should have blocked a later greenlight.

Recommendation: define stream ordering in v1 as:

```text
global append offset for audit
per-run sequence for agent behavior
per-gateway-resource sequence for mutation ordering
digest chain per stream partition
listener watermark included in every isolation decision
```

### 2. Idempotency

Risk: 34 includes `idempotency_key`, but idempotency is not assigned to an owner. The facade can generate one, policy can check it, but the gateway check must enforce it. Otherwise retrying generated code can cause repeated mutations with a safe-looking repeated contract.

Recommendation: gateway check owns the idempotency ledger. The greenlight is one-use. The mutation attempt can be retried only through the same idempotency key and only if the gateway reports a retry-safe status.

### 3. Isolation Propagation

Risk: the primitive says isolation state prevents continued divergence, but it does not specify propagation timing. A breaker can trip after a greenlight is issued but before mutation. The gateway check must check current isolation, not only the policy-time snapshot.

Recommendation: every gate attempt must fetch or verify a fresh isolation snapshot. If the isolation store is unavailable, fail closed for consequential action classes.

### 4. Gateway Policy Drift

Risk: gateway policy can change between action contract creation, policy evaluation, and gate execution. If the greenlight binds to an old policy but the gateway now rejects that shape, the system can either fail mysteriously or mutate under stale gateway assumptions.

Recommendation: greenlight records `gateway_policy_version`. Gate compares current gateway policy with pinned version and applies explicit drift semantics:

```text
same_version -> continue
newer_stricter_version -> enforce stricter rule
newer_incompatible_version -> refuse with gateway_policy_drift
gateway_policy_unknown -> refuse closed
```

### 5. Receipt / Execution Distinction

Risk: the receipt fields combine decision and execution status. That blurs four different facts:

```text
policy evaluated contract
gateway check checked greenlight
gateway attempted mutation
downstream system completed, refused, failed, or became unknown
```

Recommendation: receipt must carry separate statuses:

```text
policy_decision_status
gateway_check_status
greenlight_consumption_status
mutation_attempt_status
downstream_execution_status
proof_gap_status
```

If downstream status is unknown, say unknown. Missing evidence is a proof gap, not a success.

### 6. Catalog-Bound Compilation

Risk: the review currently references tool catalogs, action catalogs, and gateway registries, but the implementation tail can still start at `ActionContract`. That lets generated code and model interpretation define what the action means.

Recommendation: require `IntentCompilationRecord` before `ActionContract`. It must bind to `ToolCapability`, `ActionType`, and `GatewayRegistryEntry` versions, and it must record rejected candidates and uncertainty markers.

### 7. Review Binding

Risk: `review_required` can become a vague human approval if the review artifact is not structurally bound to the exact contract digest and policy input digest.

Recommendation: introduce `ReviewDecision`. It must include render schema version, reviewer principal, action contract digest, policy input digest, gateway policy version, decision expiry, and signature or attestation.

### 8. One-Use Greenlight Versus Retry Reconciliation

Risk: generated code retries after timeouts. If the greenlight is consumed before downstream finality is known, a legitimate retry can look like replay. If the greenlight is not consumed until final success, concurrent attempts can double mutate.

Recommendation: consume the greenlight atomically at the gate. Allow only same-operation reconciliation under the same `mutation_attempt_id` and idempotency key when the gateway reports a retry-safe unknown or pending status. A new mutation attempt requires a new contract or greenlight.

## Architecture Review Findings

### [P0] (confidence: 9/10) Catalog-Bound Compiler Boundary Is Missing From V1

Invariant violated: vague intent is not an operating envelope, and generated code is not an action contract. The review references catalogs and gateway registries, but the smallest-next-mechanism list starts after the compiler boundary.

Failure mode: the compiler overreaches the principal by turning "make CI pass" into package installs, deploy changes, and repo writes without recording rejected candidates, uncertainty, or catalog bindings.

Recommendation: define `ToolCapability`, `ActionType`, `GatewayRegistryEntry`, and `IntentCompilationRecord` before `ActionContract`.

### [P0] (confidence: 9/10) Schema-Only V1 Is Advisory Without A Gateway Adapter

Invariant violated: the gateway check is the enforcement point before consequence. Schemas and policy decisions do not enforce anything until a gateway refuses mutation without an exact one-use greenlight.

Failure mode: the system can produce beautiful contracts and receipts while the real package manager, deploy surface, or repo write path remains callable outside the gate.

Recommendation: v1 must include one gateway adapter harness that proves `missing_greenlight`, `replayed_greenlight`, `params_mismatch`, and `current_isolation` all refuse before mutation.

### [P0] (confidence: 9/10) Atomic Policy Is Not A Typed Object Yet

Invariant violated: exact contracts need machine-checkable policy decisions. 34 describes atomic policy as a question set and source list, but not as a versioned input/output schema.

Failure mode: two evaluators can produce different greenlights from the same action contract because policy context, rule versions, and isolation snapshots are implicit.

Recommendation: define `PolicyDecision` as a persisted object before coding the gateway check.

### [P0] (confidence: 9/10) Contract Stream Has Event Names But No Ordering Contract

Invariant violated: divergent behavior must be reconstructable. The breaker listener cannot reason about retries, velocity, or conflicting sequences without offsets and watermarks.

Failure mode: an action is greenlit at offset 101 while an isolation event at offset 100 has not propagated to the evaluator. The agent mutates after quarantine.

Recommendation: define stream partitions, offsets, causation IDs, and digest chains in v1.

### [P0] (confidence: 9/10) Gateway Check Is A Verification List, Not A Transaction

Invariant violated: gateway check is the enforcement point before consequence. A checklist does not define atomic greenlight consumption, idempotency, receipt emission, or refusal semantics.

Failure mode: two concurrent gate attempts consume the same greenlight, or one mutates while receipt storage is unavailable.

Recommendation: model `GatewayCheckAttempt` as a transactional object with greenlight consumption and receipt/proof-gap behavior.

### [P1] (confidence: 8/10) Isolation State Lacks Propagation Semantics

Invariant violated: isolated agents must not keep receiving greenlights or mutating through stale greenlights.

Failure mode: breaker trips, policy refuses new actions, but an old greenlight still passes at the gateway because the gate only checks the policy-time isolation snapshot.

Recommendation: require fresh isolation checks at both policy evaluation and gateway check.

### [P1] (confidence: 8/10) Gateway Policy Drift Is Not Resolved

Invariant violated: exact gateway binding requires knowing which gateway policy was accepted.

Failure mode: the greenlight authorizes a contract under gateway policy v3; gateway has moved to v4 and accepts a different parameter shape or freshness window.

Recommendation: pin gateway policy version in the contract and greenlight, then define drift behavior at the gate.

### [P1] (confidence: 8/10) Receipt Collapses Gate Proof And Execution Proof

Invariant violated: greenlight is not execution proof, and receipt is not downstream business success.

Failure mode: audit later reads `execution_status=success` without knowing whether the gateway check checked the greenlight or whether downstream merely accepted an async job.

Recommendation: split receipt statuses by phase.

### [P1] (confidence: 8/10) Proof Gap Is A Status, Not A First-Class Object

Invariant violated: missing evidence must be recorded as a proof gap, not smoothed over. The review mentions proof gaps but leaves them as receipt fields and events.

Failure mode: an auditor later sees `execution_status=success` plus a vague evidence note, but cannot query which evidence was missing, which phase was affected, or whether finality is suspect.

Recommendation: define `ProofGap` as a persisted object referenced by receipts, gate attempts, mutation attempts, breaker decisions, and recovery actions.

### [P1] (confidence: 8/10) Human Review Is Not Bound To Exact Contract

Invariant violated: a rendered plan is not permission. Review is only meaningful if the decision binds to the exact contract and policy input.

Failure mode: the user approves a safe-looking summary after the generated code or contract changes underneath it. This is review theatre.

Recommendation: define `ReviewDecision` with action contract digest, policy input digest, gateway policy version, render schema version, reviewer principal, decision expiry, and signature.

### [P1] (confidence: 8/10) Retry Semantics Conflict With One-Use Greenlights

Invariant violated: a greenlight authorizes only one exact gateway-checked mutation attempt. The review says the greenlight is one-use but also says mutation can be retried with the same idempotency key.

Failure mode: after a downstream timeout, generated code retries. The gate either rejects a legitimate status reconciliation as replay, or it permits a second mutation under the same greenlight.

Recommendation: distinguish greenlight consumption, mutation attempt identity, and same-operation reconciliation. New mutation attempt means new authority; same surface operation lookup can reuse the idempotency key without re-authorizing consequence.

## Code Quality Review Findings

No code exists yet. The quality risk is schema ambiguity, not implementation mess.

Required code-quality posture for the first implementation:

- Use explicit state enums, not booleans like `approved` or `success`.
- Use deterministic canonicalization functions with golden tests.
- Keep model-generated prose out of enforcement fields.
- Represent refusal and proof gap as first-class outcomes.
- Represent review decisions as exact digest-bound objects, not UI approvals.
- Keep tool/action/gateway catalogs versioned and referenced by every compiler output.
- Do not share mutable DTOs between policy, gate, and receipt phases unless their phase-specific invariants are encoded in the type.

## Test Review

There is no test framework in this repo yet. The first implementation should create invariant tests before demo flows.

### Invariant Coverage Diagram

```text
CONTROL PATHS                                      REQUIRED TESTS

Catalog-bound intent compilation
  |-- unknown tool capability                       [GAP] compiler refuses or records uncertainty
  |-- generated code uses unwrapped write tool      [GAP] bypass evidence recorded; gateway still refuses
  |-- vague intent expands outside envelope         [GAP] compiler rejects overreach
  |-- missing gateway registry entry               [GAP] no action contract emitted

Action contract canonicalization
  |-- same semantic params, different order         [GAP] digest stable
  |-- secret-bearing params                         [GAP] raw secret rejected/redacted
  |-- missing gateway policy ref                   [GAP] contract invalid

Policy decision
  |-- valid contract                                [GAP] greenlight created
  |-- contract outside envelope                     [GAP] refusal
  |-- isolated agent                                [GAP] refusal
  |-- stale evidence                                [GAP] review/refusal
  |-- missing policy version                        [GAP] fail closed

Review decision
  |-- reviewer approves exact contract digest       [GAP] review decision usable by policy
  |-- rendered artifact and contract mismatch       [GAP] review decision invalid

Gateway gate
  |-- valid one-use greenlight                      [GAP] consume then mutate
  |-- replayed greenlight                           [GAP] refuse already_consumed
  |-- params mismatch                               [GAP] refuse params_mismatch
  |-- gateway mismatch                             [GAP] refuse gateway_mismatch
  |-- isolated after greenlight                     [GAP] refuse agent_isolated
  |-- receipt store unavailable                     [GAP] refuse or durable proof gap
  |-- retry after downstream unknown                [GAP] same-operation reconciliation only

Receipt
  |-- gateway refused before mutation              [GAP] gate status distinct from execution
  |-- downstream accepted async job                 [GAP] execution pending is not success
  |-- downstream unknown after timeout              [GAP] proof gap recorded
  |-- missing evidence ref expires                  [GAP] receipt links to proof gap

Proof gap
  |-- expected evidence missing                     [GAP] first-class ProofGap emitted
  |-- proof gap resolved later                      [GAP] resolution preserves original gap

Breaker listener
  |-- retry budget exceeded                         [GAP] isolation state created
  |-- velocity spike                                [GAP] action class or run halted
  |-- out-of-order stream event                     [GAP] listener uses watermark
```

Coverage: 0/30 paths tested because no implementation exists.

### Critical Test Requirements

1. `greenlight_without_action_contract_is_impossible`
2. `gateway_refuses_mutation_without_greenlight`
3. `gateway_refuses_greenlight_replay`
4. `gateway_refuses_params_digest_mismatch`
5. `policy_refuses_isolated_agent`
6. `gate_refuses_agent_isolated_after_greenlight`
7. `receipt_distinguishes_gate_refusal_from_downstream_failure`
8. `stale_evidence_requires_review_or_refusal`
9. `gateway_policy_drift_refuses_or_applies_stricter_policy`
10. `stream_offsets_reconstruct_causality_for_breaker_decision`
11. `compiler_refuses_unknown_tool_capability`
12. `compiler_rejects_principal_scope_overreach`
13. `review_decision_must_bind_exact_contract_digest`
14. `proof_gap_is_first_class_when_expected_evidence_missing`
15. `retry_after_unknown_status_reconciles_same_operation_only`

### Failure Modes

| Codepath | Production failure | Test? | Error handling required | User/operator outcome |
|---|---|---:|---|---|
| Contract canonicalization | Non-deterministic digest across runtimes | Missing | Reject if canonicalizer version unknown | Operator sees contract invalid, not silent mismatch |
| Policy evaluation | Policy context store unavailable | Missing | Fail closed for consequential actions | Agent gets structured refusal/retry path |
| Greenlight issuance | Isolation changes during decision | Missing | Include snapshot and gate re-check | Old greenlight cannot bypass quarantine |
| Gateway gate | Concurrent replay of same greenlight | Missing | Atomic consumption ledger | One mutation max, second refusal |
| Gateway mutation | Downstream timeout after submit | Missing | Mark execution unknown/proof gap | Operator knows state is suspect |
| Receipt emission | Receipt store unavailable | Missing | Refuse before mutation or transactional outbox | No mutation without audit trail |
| Breaker listener | Out-of-order stream delivery | Missing | Watermarks and replayable offsets | Listener decision is reconstructable |
| Intent compilation | Generated code proposes action outside catalog | Missing | Refuse candidate and record overreach | Agent gets structured narrowing path |
| Review rendering | Review artifact digest differs from contract digest | Missing | Invalidate review decision | Operator re-reviews exact contract |
| Proof gap tracking | Missing evidence hidden inside receipt prose | Missing | Emit first-class ProofGap | Audit sees suspect finality |
| Retry reconciliation | Same greenlight used for second mutation attempt | Missing | Allow only same-operation lookup, not new mutation | Retry cannot become ambient authority |

Critical gap count: 11. All are expected because implementation has not started.

## Performance Review

No runtime performance issue exists yet. The relevant performance risks are control-plane correctness under load:

| Risk | Why it matters | Recommendation |
|---|---|---|
| Hot isolation lookups | Every policy decision and gate attempt needs isolation status | Use indexed scope keys and cache only with explicit freshness |
| Stream listener lag | Late breaker decisions allow more greenlights before isolation | Track listener lag and fail closed for high-risk action classes if stale |
| Idempotency ledger contention | Popular gateway/resource pairs can serialize on one key space | Partition by gateway/resource/action class |
| Receipt write latency | Gate cannot mutate if receipt path is unavailable unless outbox exists | Use transactional outbox or refuse before mutation |
| Canonicalization cost | Large params/evidence sets can make digesting slow | Hash stable refs, not raw large payloads |
| Catalog lookup freshness | Compiler can emit contracts against stale tool/action/gateway definitions | Pin catalog versions in compilation records and fail closed on unknown versions |
| Proof-gap resolution churn | Repeated evidence polling can create noisy receipt updates | Keep immutable gap creation plus explicit resolution records |

## Recommended V1 State Machine

```text
[intent_received]
      |
      v
[intent_compiling]
      |
      +-- unknown tool/action/gateway -> [compilation_refused]
      +-- scope overreach -------------> [compilation_refused or review_required]
      |
      v
[candidate_contract]
      |
      v
[action_proposed] -- invalid schema --> [contract_rejected]
      |
      v
[policy_evaluating]
      |
      +-- outside envelope ----------> [action_refused]
      +-- stale/missing evidence ----> [review_required]
      +-- review digest mismatch ----> [action_refused]
      +-- isolation matched ---------> [action_refused]
      +-- policy violation ----------> [action_refused]
      |
      v
[greenlit]
      |
      v
[gate_checking]
      |
      +-- greenlight missing --------> [gateway_refused]
      +-- greenlight consumed -------> [gateway_refused]
      +-- params mismatch -----------> [gateway_refused]
      +-- current isolation ---------> [gateway_refused]
      +-- gateway policy drift -----> [gateway_refused]
      +-- receipt unavailable -------> [gateway_refused or proof_gap]
      +-- retry after unknown -------> [same_operation_reconciliation]
      |
      v
[greenlight_consumed]
      |
      v
[mutation_attempted]
      |
      +-- downstream success --------> [executed]
      +-- downstream refusal --------> [downstream_refused]
      +-- downstream timeout --------> [execution_unknown]
      |
      v
[receipt_emitted]
      |
      v
[recovery_available]
```

Forbidden direct edges:

```text
action_proposed -> mutation_attempted
greenlit -> executed
operating_envelope -> mutation_attempted
contract_skill -> greenlit
review_artifact -> greenlit
receipt_emitted -> executed
proof_gap -> executed
```

## NOT In Scope

| Deferred work | Rationale |
|---|---|
| Open A2A market | Broadens counterparties before gateway-checked mutation works |
| Licensing marketplace | Adds legal/commercial complexity before the core action contract is proven |
| Full policy compiler | Atomic policy can start as typed deterministic rules |
| Enterprise dashboard | Review UI is secondary to exact binding and receipts |
| Connector library | Build one gateway adapter first, not a broad connector library |
| Multi-party dispute system | Receipts and proof gaps must exist before disputes mean anything |
| General browser-side enforcement | Start with one gateway that can enforce at the gate |
| Multi-use greenlights | Too close to ambient authority for v1 |

## Worktree Parallelization Strategy

This work should be sequential until the core schemas are stable. Parallel implementation before the fields settle will create merge conflicts and semantic drift.

| Step | Modules touched | Depends on |
|---|---|---|
| Catalog and compiler boundary | catalogs/, compiler/, gateways/ | None |
| Schema and canonicalization | contracts/, policy/, receipts/, proof-gaps/ | Catalog and compiler boundary |
| Policy decision and greenlight lifecycle | policy/, greenlights/, stream/ | Schema and canonicalization |
| Gateway gate, adapter harness, and idempotency ledger | gateway-check/, gateways/, greenlights/, receipts/ | Policy decision and greenlight lifecycle |
| Stream and breaker isolation | stream/, isolation/, policy/, gateway-check/ | Schema and canonicalization |
| Receipt and proof-gap export | receipts/, proof-gaps/, gateway-check/, stream/ | Gateway gate and stream event shape |

Execution order:

```text
Lane A: Catalog and compiler boundary
  -> Lane B: Schema and canonicalization
  -> Lane C: Policy decision and greenlight lifecycle
  -> Lane D: Gateway gate, adapter harness, and idempotency ledger
  -> Lane E: Stream and breaker isolation + Receipt/proof-gap export
```

Potential later parallelization after schemas freeze:

```text
Lane 1: Breaker listener and isolation store
Lane 2: Receipt export and proof-gap rendering
Lane 3: Additional gateway adapter test harnesses
```

Conflict flags: lanes 1 and 2 both depend on stream event shape. Do not start them until event IDs, offsets, and digest chain are stable.

## Unresolved Decisions

These need an explicit product/engineering decision before implementation:

1. Are greenlights always one-use in v1? Recommendation: yes.
2. Does gateway policy drift fail closed or apply stricter policy? Recommendation: stricter if mechanically comparable, otherwise fail closed.
3. Can mutation proceed if receipt storage is unavailable? Recommendation: no, unless a transactional outbox is already durable.
4. Which isolation scopes are mandatory for v1? Recommendation: agent, run, envelope, action_class, gateway, resource, tenant.
5. Is `params_digest` enough for review? Recommendation: no, require non-secret typed parameter summary.
6. Which gateway adapter proves v1? Recommendation: pick one engineering-agent gateway with real refusal-before-mutation behavior, such as package install or preview deploy.
7. Are review decisions valid without exact digest binding? Recommendation: no.
8. Is proof gap a receipt field or first-class object? Recommendation: first-class object.
9. How do retries work after unknown downstream status? Recommendation: same-operation reconciliation only; new mutation attempt requires new authority.
10. Can the compiler emit contracts without pinned tool/action/gateway catalogs? Recommendation: no.

## Completion Summary

- Step 0: Scope Challenge - scope narrowed to the first closed enforcement loop plus catalog-bound compilation.
- Architecture Review: 11 issues found.
- Code Quality Review: no code issues, but schema ambiguity flagged.
- Test Review: diagram produced, 30 gaps identified.
- Performance Review: 7 control-plane risks found.
- NOT in scope: written.
- What already exists: written.
- TODOS.md updates: 0 items written because this artifact is the review output, not the work queue.
- Failure modes: 11 critical gaps flagged.
- Outside voice: skipped; user requested a specific file deliverable and no interactive gate was available.
- Parallelization: sequential first; 3 later lanes after schema and first gateway harness freeze.
- Lake Score: complete invariant coverage recommended over demo breadth.

## Smallest Next Mechanism To Build

The compact protocol completion audit is recorded in `docs/audits/protocol-completion-audit-v0.2.md`. It verifies current code and tests prove:

```text
no action contract without pinned tool/action/gateway catalog bindings
no compiler overreach hidden as an exact contract
no mutation without gateway check
no gateway check without exact one-use greenlight
no greenlight without action contract
no greenlight or gate pass while isolated
no human review without exact contract and policy digest binding
no receipt that blurs gate check and downstream execution
no missing evidence without a first-class proof gap
no recovery path that reuses a greenlight or mutates a gateway
no terminal recovery race without a proof gap or resolution evidence
```

Post-review authority hardening is now part of this checkpoint: proof-gap gates cannot derive `VerifiedGatewayCheck`, reference adapters return without mutation on non-passed gates, reconciliation can create a post-mutation proof gap for unknown downstream finality, D1 record identity is `(object_type, object_id)`, and greenlight issuance is durably claimed per action contract before a greenlight record is committed.

Protocol next mechanism: cut a v0.2 protocol-kernel checkpoint, then require an ADR before changing the control object model.
