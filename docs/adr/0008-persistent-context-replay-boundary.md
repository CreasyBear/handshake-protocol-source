# ADR 0008: Persistent Context And Replay Boundary

Status: Accepted
Date: 2026-05-19
Owner: Product and protocol owner
Implementation owner: future persistent-context and replay/eval plan
Depends on: [`0001-kernel-evidence-boundaries.md`](./0001-kernel-evidence-boundaries.md), [`0004-pre-contract-refusal-evidence-boundary.md`](./0004-pre-contract-refusal-evidence-boundary.md)
Informed by: [`../reference/agentic-repo-source-study-2026-05-19.md`](../reference/agentic-repo-source-study-2026-05-19.md)
Blocks: self-improving-agent, persistent-memory, eval, replay, and simulation claims

## Invariant At Stake

Persistent context is not policy authority, and replay is not production proof.

Modern agents increasingly store user preferences, learned facts, skills,
instructions, summaries, traces, eval results, replay runs, checkpoints, and
debug annotations. These records are useful. They are also dangerous if they can
silently change future delegation scope or if a simulated run can be mistaken for
gateway-checked production evidence.

## Decision

Handshake will classify persistent agent context and replay/eval evidence as
provenance by default.

Memory, skills, instructions, learned preferences, user profiles, trace
summaries, eval results, and replay outputs may inform compilation only when
their provenance is visible. They cannot change policy, delegation, envelope,
gateway authority, or contract binding unless a future ADR and policy allowlist
make that specific field a versioned policy input.

Replay, eval, dry-run, simulation, and local-debug receipts are non-production
evidence unless the run passed through the same production gateway check with the
same contract, policy, greenlight, and gateway evidence class.

## Primitive

Future implementation plans must define evidence equivalent to:

```text
PersistentAgentContextRecord
  contextId
  contextKind
  source
  createdBy
  reviewedBy?
  subjectScopeRef
  provenanceDigest
  contentDigest
  policyInputAllowed
  policyInputVersion?
  expiresAt?
  revokedAt?
```

```text
ReplayEvidenceRecord
  replayId
  sourceRunRef
  replayEnvironment
  replayMode
  productionGatewayEvidenceRef?
  simulatedGatewayEvidenceRef?
  resultDigest
  evidenceClass
  nonInterchangeabilityReason
```

## Boundary Rules

1. Persistent context is provenance by default.
2. Persistent context cannot silently change `OperatingEnvelope`,
   `AuthorityGrant`, policy pack, gateway registry, or credential posture.
3. Agent-generated facts must carry their source and review state before they
   are presented as relevant context.
4. Skills and instructions may guide generation. They do not authorize mutation.
5. Memory that affects a protected action must be cited as policy context only
   through a versioned allowlist.
6. Replay/eval/simulation evidence must carry an environment class and evidence
   class that prevents it from satisfying production gateway proof.
7. A replay run that calls production systems without a protected gateway is a
   bypass-risk run, not proof.

## Non-Claims

- This ADR does not implement memory.
- This ADR does not choose mem0, Hermes memory, LangGraph memory, or any memory
  provider.
- This ADR does not create a public trace/replay API.
- This ADR does not make eval success a product safety claim.
- This ADR does not make replay receipts interchangeable with production
  receipts.
- This ADR does not let self-improvement mutate policy or delegation.

## Rejected Alternatives

### Treat Memory As Just More Context

Rejected. Context that can change future protected actions has authority impact.
If memory can rewrite the apparent scope of delegation, memory becomes hidden
policy.

### Let Replay Produce Normal Receipts

Rejected. A replay can show what would happen under a test setup. It cannot prove
what a production gateway checked unless it carries real production gateway
evidence.

### Store Agent-Generated Facts With Equal Authority To Principal Input

Rejected. Agent-generated facts may be useful, but they are not principal
delegation. They require provenance, review posture, and explicit policy-input
allowlisting.

## Proof Plan

The future plan must prove:

1. Memory can be attached as provenance to compilation evidence.
2. Unallowlisted memory cannot enter policy input.
3. A skill or instruction can guide candidate generation but cannot alter the
   action contract authority boundary.
4. Replay receipts are labeled non-production by default.
5. A simulated gateway result cannot satisfy production `GatewayCheckAttempt`
   evidence.

Smallest next mechanism: add a fixture where memory suggests broad scope, but
policy sees only the original envelope and the compiler records memory as
provenance.
