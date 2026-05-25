# Macro Plan

## Invariant At Stake

Handshake must not split into product truth and protocol truth. Product
vocabulary may make service intake legible, but it must be a non-authority
projection/readback over one protected-action event spine.

The single authority spine remains:

```text
CandidateAction / ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck before mutation
-> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

Passport, Admission, Handle, Clearance, Outcome, Certificate, Badge-like labels,
review screens, CLI output, MCP resources, SDK helpers, demos, and support
bundles can only project, request, or read this spine. They cannot create a peer
lane that authorizes, reinterprets, or bypasses it.

## Source Boundary

| Source | Role | Status |
| --- | --- | --- |
| `.planning/macro-map/MACRO-HANDOFF.md` | Passport / Admission / Badge macro map | Derived planning input, decision-gated but user-authorized for correction |
| `.planning/macro-map/*` | Lens maps, concerns, decisions, tasks | Derived planning evidence |
| `.planning/codebase/*` | Repo architecture, testing, integrations, concerns | Derived evidence; source-check before canon |
| `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/*` | Current input, research, snapshot, sidecar audits, validation | Current run evidence |
| `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md` | Doctrine, orientation, quality, structure | Canon |
| `docs/internal/decisions.md`, `protocol-notes.md`, `protocol-layman.md`, `service-workflow-story.md` | Product/protocol canon and plain translation | Canon |
| `src/protocol`, `src/surfaces`, `src/runtime`, `src/cli`, `src/mcp`, `examples/service-workflow-admission`, `test/*` | Source-owned behavior and proof gates | Mechanism truth |

## Research Mechanisms

Primary-source research is recorded in
`.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/research.md`.
The imported mechanisms are:

- Stripe PaymentIntents: one lifecycle object with explicit statuses and
  idempotency, not multiple truth lanes.
- Kubernetes Admission / OPA: request-time chokepoints and rejection before
  persistence or mutation.
- Vault: custody, leases, renewal, revocation, and audit; handles do not become
  raw secret material.
- GitHub deployment environments: protection rules before execution proceeds.
- AWS IAM: default deny and explicit deny overriding convenience.
- SLSA / artifact attestations: provenance and certificates are terminal
  evidence, not future permission.
- Vercel / Cloudflare: product copy names scope and method; verification is
  repeated instead of assuming stale context remains valid.

These are mechanisms only. They do not prove Handshake hosted operation,
provider custody, marketplace trust, or host containment.

## Current Evidence

- The existing protocol kernel already owns exact contracts, policy decisions,
  one-use greenlights/refusals, gateway checks, receipts, refusals, proof gaps,
  isolation, and terminal certificates.
- The existing service workflow admission schema already hard-codes
  non-authority boundaries for admission and handle records.
- Sidecar audits found the right source shape but unsafe vocabulary pressure:
  `product surface` is overloaded, `sdk.policy` is currently named as an
  authority surface, product projection terms lack one source-owned lifecycle
  map, and runtime composition needs same-envelope/non-composition gates.
- The current run has primary-source research, source snapshot, blocked checks,
  and five sidecar audits under
  `runs/20260525T110908Z-architectural-north-star/`.

## Non-Proofs

This plan does not prove live x402 provider custody, settlement/finality,
facilitator operation, seller middleware, marketplace trust, cross-org trust,
aggregate spend enforcement, hosted operation, hosted org auth,
retention/search, broad runtime containment, or user comprehension of the
projection vocabulary.

## Selected Macro Move

Replace "dual product/protocol lanes" with this architecture:

```text
Projection vocabulary
  Passport / ServiceWorkflowAdmission / ServiceWorkflowHandle / Clearance / Outcome
    over
ProtectedActionEvent lifecycle
  exact contract -> policy/refusal -> one-use greenlight -> gateway check -> terminal evidence
    enforced by
Gateway-owned mutation adapters and protocol kernel transitions
    reconstructed through
Receipts, refusals, proof gaps, isolation, terminal certificates, and support bundles
```

The repo may keep `src/surfaces` as an implementation folder, but canonical docs
must split three concepts:

- product projection/readback surfaces: non-authority surfaces for service
  workflow, evidence, reports, demos, and copy;
- role-scoped protocol transition clients: SDK/HTTP clients that transport a
  specific protocol transition under custody and kernel/gateway authority;
- the protocol authority spine: the only place that creates policy decisions,
  one-use greenlights/refusals, gateway checks, receipts, refusals, proof gaps,
  isolation, and terminal certificates.

None of these are peer product/protocol truth lanes. Product projection
surfaces never create authority. Role-scoped transition clients do not make
product nouns authoritative; they are transport into the protocol authority
spine.

## Execution Thesis

The correction succeeds by making projection subordinate to protocol authority
in both language and mechanism:

1. Canonical docs name one protected-action event spine.
2. Source owns a service-workflow lifecycle projection map under `src/surfaces`.
3. Architecture tests require product vocabulary to remain projection/readback.
4. Runtime/protected-action tests prove mixed-family and x402/auth.md
   composition cannot blur authority contexts.
5. Review and evidence gates distinguish planning proof from execution proof.

## Ten-Star Success Criteria

- Exactly one authority spine is named and enforced in docs, source, and tests.
- Product nouns are explicitly projection/readback nouns, never authority nouns.
- Canonical docs no longer imply product/protocol peer lanes.
- `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` remain schema-level
  non-authority records.
- A source-owned service workflow lifecycle projection map ties Passport,
  Admission, Handle, Clearance, Outcome, and Certificate to existing lifecycle
  entries or explicit pre-contract evidence context.
- Passport IDs remain correlation/reconstruction fields only.
- Badge remains forbidden as a schema/protocol/export noun; if it appears, it is
  read-only state label language only.
- Case-study research is captured as mechanism rules with source URLs.
- Runtime misuse remains covered for loops, retries, stale handles, dynamic
  tools, raw sibling bypass, stale review, replay, and proof gaps.
- Mixed-family runtime blocks either share one execution envelope or fail before
  being projected as one runtime spine.
- x402/auth.md composition remains separate exact contracts or refusal; no
  composite credential-plus-payment authority artifact is created.
- Hosted/Tier 3 remains blocked unless a separate hosted workspace or fresh
  pre-hosted kernel task proves the missing gates.
- A fresh agent can resume from `AGENT-HANDOFF.md` without chat memory.

## Execution Slices

This package decomposes the correction into:

```text
N0 - Research and macro-plan reset
N1 - Canonical projection-over-spine language
N2 - ProtectedActionEvent projection mapping
N3 - Architecture guards against dual-lane drift
N4 - Runtime/protected-action regression gates
N5 - Review, validation, full repo gate, and commit closeout
```

Each slice is detailed in `EXECUTION-SLICES.md` and assigned in `TASKS.jsonl`.

## Non-Goals

- Do not add a new protocol primitive for Passport, Admission, Handle, Outcome,
  Certificate, Badge, or `ProtectedActionEvent` unless a separate source-owned
  transition proposal proves a new enforceable state.
- Do not remove `src/surfaces`; correct its meaning instead.
- Do not widen package exports, CLI/MCP authority, SDK role powers, gateway
  adapters, or hosted claims.
- Do not claim live provider custody, x402 settlement, facilitator operation,
  seller middleware, marketplace certification, cross-org trust, aggregate spend
  enforcement, native host containment, hosted org auth, or retention/search.
- Do not treat the case studies as evidence that Handshake already has their
  enforcement properties.

## Target State

Canon says:

```text
Product vocabulary is projection/readback over one protected-action event spine.
The protocol kernel remains the source-owned authority state machine.
Projection surfaces expose proposal, context, evidence, and readback only.
```

Source/tests prove:

- The service workflow schema cannot create authority.
- Canonical docs must contain projection-over-spine wording.
- Canonical docs must not describe product/protocol as peer authority lanes.
- Product vocabulary cannot appear in protocol areas or root authority exports
  as a shortcut.
- Runtime handles can assist proposal context only; each protected action still
  creates a fresh exact contract and reaches a fresh policy/gateway boundary.

## Decisions

- Keep `src/surfaces` as a source-owned implementation boundary.
- Rename the mental model from `product surface vs protocol kernel` to
  `projection/readback surface over protocol authority spine`.
- Use `ProtectedActionEvent` as a documentation/testing lifecycle concept
  source-owned through a `src/surfaces` projection map. Do not create a stored
  protocol object yet.
- Keep Passport as presentation evidence, Admission as service-side mapping,
  Handle as context/readback reference, Clearance as fresh protected-action path,
  and Outcome as terminal readback projection.
- Treat Badge as unsafe shorthand unless explicitly marked as a read-only state
  label derived from evidence.

## Risks And Proof Gaps

- The word `surface` is entrenched in code. The mitigation is explicit docs and
  tests saying surface means projection/readback implementation boundary.
- `Admission` remains overloaded with HTTP admission and service workflow
  admission. The mitigation is explicit naming and tests that block policy/gate
  implications.
- Product UX is not solved by this slice. The result is source-owned
  architecture and proof language, not a finished app front door.
- Hosted/Tier 3 pressure remains a kernel-creep risk and stays blocked.

## Blocking Concerns

These are accepted-risk items for executing this correction plan only. They are
not accepted as product truth, hosted claims, or release-complete posture. Each
P0/P1 below is either assigned to an execution slice or preserved as a proof gap
until source/tests prove the mechanism.

- P0: `product surface` remains overloaded until canonical docs split product
  projection/readback surfaces from role-scoped protocol transition clients.
- P0: `sdk.policy` and similar clients must not be named authority surfaces;
  they must be framed as custody-scoped transport into kernel transitions.
- P0: product projection terms need a source-owned lifecycle projection map or
  docs remain the only guard.
- P0: mixed-family runtime blocks must prove one execution envelope or refuse.
- P0: x402/auth.md composition must not produce one composite authority object.
- P1: full product UX is still not implemented; this run corrects architecture
  and source-owned projection semantics.

## Verification Gates

- Macro-plan validator:
  `/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan`
- Focused claim/architecture gates:
  `npm run quality:claims`
  `npm run quality:architecture`
  `npm run test -- test/architecture/claim-boundary.test.ts test/architecture/workflow-admission-boundary.test.ts`
- Runtime/product regression where touched:
  `npm run test -- test/runtime/runtime-ingress.test.ts test/product/service-workflow-admission.test.ts`
- Closeout:
  `npm run format:check`
  `npm run check:repo`

## Runtime And Protected-Action Summary

Runtime posture remains evidence-only. Codex, Claude Code, Hermes, OpenClaw,
MCP, browser, A2A, OpenAPI, auth.md, and x402 do not share one containment
model. Runtime ingress may record generated-execution evidence and propose
contracts only.

Protected-action posture remains one event at a time. Projection vocabulary may
help prepare context, but every consequential action still requires a fresh
exact contract, policy/refusal, one-use greenlight when allowed, gateway check
before mutation, and terminal receipt/refusal/replay/proof-gap/certificate
evidence. x402/auth.md composition and mixed-family dispatches are blocking
runtime gates until focused tests prove separation or refusal.

## Long-Running End Condition

The run is complete only when research, macro plan, implementation, evaluation,
sidecar/review evidence, and git commits all support one conclusion: Handshake
has one protocol authority spine, and product vocabulary is projection/readback
over that spine.

## Handoff To Phase Planning

Detailed phase work starts from `EXECUTION-SLICES.md` and `TASKS.jsonl`, not
from chat memory. The first implementation slice is canonical docs plus
claim-boundary guards. The second implementation slice source-owns the service
workflow lifecycle projection map under `src/surfaces`. Runtime P0 gates follow
before closeout. Fresh agents must read `AGENT-HANDOFF.md`,
`RUNTIME-GATES.md`, `PROTECTED-ACTION-GATES.md`, and sidecar audits before
editing.

## Smallest Next Mechanism

Install a source-owned `Product Vocabulary Is Projection Only` guard in
canonical docs and `test/architecture/claim-boundary.test.ts`, then run the
focused claim/architecture gates before touching broader examples.

## Plan Status

`READY_FOR_AGENT_EXECUTION`
