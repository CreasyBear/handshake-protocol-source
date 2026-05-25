# Macro Plan

## Invariant At Stake

Tier 1 and Tier 2 product simplification may hide protocol complexity from users, but it must not hide authority. A user can see a clean flow, an agent can carry a workflow handle, and a service can accept standing evidence, but no Passport, Admission, Badge, Handle, Certificate, review screen, or ID can become identity, permission, reusable auth, policy approval, gateway acceptance, signer permission, receipt export, terminal certification, or mutation authority.

The protected-action invariant remains exact:

```text
standing evidence
-> service-side admission/readback
-> bounded workflow context
-> fresh protected-action request
-> exact ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck before mutation
-> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

## Source Boundary

| Source | Role | Status |
| --- | --- | --- |
| `.planning/macro-map/MACRO-HANDOFF.md` | Handoff from Passport / Admission / Badge macro map | Decision-gated, now user-authorized for full planning |
| `.planning/macro-map/MACRO-MAP.md` | Selected macro move and non-proofs | Derived planning evidence |
| `.planning/macro-map/FACET-MAP.md`, `views/*.md` | CEO, ENG, DESIGN, DEVEX, AGENT, RUNTIME, AUTHORITY pressure | Independent lens evidence |
| `.planning/macro-map/MECHANISM-MAP.md`, `EXECUTION-MAP.md`, `EXPERIENCE-MAP.md`, `AGENT-RUNTIME-MAP.md`, `PROTECTED-ACTION-MAP.md` | Mechanism, sequencing, experience, runtime, and authority maps | Required plan inputs |
| `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`, `INTEGRATIONS.md`, `STACK.md` | Placement, testing, conventions, proof gaps, integrations, and package posture | Derived evidence; source-check during implementation |
| `README.md`, `QUALITY.md`, `STRUCTURE.md` | Package posture, quality language, source ownership | Canon |
| `docs/internal/decisions.md`, `docs/internal/protocol-notes.md` | Product kernel, proof ledger, expansion admission, current protocol notes | Canon |
| `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md` | Definition, architecture, and plain-language translation | Canon |
| `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/*` | Input packet, source snapshot, blocked checks, sidecar audits, validation | Current run evidence |

## Current Evidence

The current kernel already has the protected-action authority spine: exact contracts, policy decisions, one-use greenlights/refusals, gateway checks, receipts, refusals, proof gaps, isolation, and terminal certificates. Canonical docs make product surfaces non-authority by definition. Runtime ingress is proposal-only. MCP is proposal/evidence-only. CLI and SDK surfaces are role-scoped but do not infer authority from evidence reads. Gateway adapters mutate only after verified gateway evidence.

The macro map converges on the same architectural conclusion: do not add a Passport protocol primitive; do not make Admission a policy decision; do not make Badge reusable auth. The right product simplification is a surface/readback layer that translates standing evidence into service workflow admission, then forces every protected action into fresh clearance.

The codebase map points to `src/surfaces` as the first implementation home. It also names the verification lanes: claim-boundary tests, naming-posture tests, surface-boundary posture tests, protocol compilation/policy/gateway tests, runtime-ingress tests, and product/demo tests when examples change.

## Non-Proofs

This plan does not prove live x402 provider custody, settlement finality, seller middleware, facilitator operation, broad x402 compatibility, hosted operation, external registry lookup, marketplace trust, cross-org passport trust, native host containment, browser-side control, aggregate spend enforcement, provider-grade auth.md credential lifecycle, or Tier 3 hosted product readiness.

It also does not prove that users will interpret Badge correctly. The plan resolves that by using `ServiceWorkflowHandle` as the source/API noun and treating Badge as optional narrative copy only. User-facing simplicity must come from state separation and explicit non-authority fields, not from a magical noun.

## Selected Macro Move

Build a two-tier simplification program:

```text
Tier 1: Source-owned non-authority surface contract
  -> service workflow story
  -> ServiceWorkflowAdmission / ServiceWorkflowHandle schema
  -> non-authority ID fields
  -> architecture and claim-boundary guards
  -> docs and plain-language convergence

Tier 2: Activation and readback convergence
  -> SDK/CLI/MCP/example surfaces use the same model
  -> generated-agent and runtime misuse gates
  -> local fixture connects admitted workflow context to one fresh x402 exact action request
  -> receipt/refusal/proof-gap readback remains event-specific
  -> Tier 3 remains blocked until proof gates pass or proof gaps are explicit
```

The five non-authority ID fields are part of the surface contract only:

```text
passportPackageDigest
passportPresentationId
admissionId
serviceWorkflowHandleId
serviceWorkflowHandleDigest
```

Each field must carry `createsAuthority: false` at the surface-object level and must not satisfy policy, gateway, signer, mutation, receipt, or certificate requirements.

## Plan Status

`READY_FOR_AGENT_EXECUTION`

The executable claim is narrow: a bounded agent can start the first implementation slice from `AGENT-HANDOFF.md` without chat-only context. This status does not mean all Tier 1/Tier 2 work is implemented, and it does not mean Tier 3 can start. Former decision-gated concerns are resolved into implementation gates: the user accepted a full plan plus implementation sequence, while non-authority, runtime, protected-action, evidence, and review checks remain required stop conditions.

## Execution Thesis

The simplification succeeds by changing the user’s first model, not by changing the authority spine.

The user should see:

```text
Show Passport -> Service Admission -> Workflow Handle -> Request Clearance -> Read Outcome
```

The implementation must still preserve:

```text
Evidence refs -> CandidateAction -> ActionContract -> PolicyDecision -> one-use Greenlight/Refusal -> GatewayCheck -> Receipt/Refusal/ProofGap
```

Tier 1 creates the non-authority model and proves it cannot create authority. Tier 2 connects that model to activation, runtime, and example surfaces so developers do not meet raw protocol internals first. Tier 3 stays locked until the local/source-owned simplification path is coherent.

## Non-Goals

- Do not add `Passport`, `Admission`, `Badge`, or `ServiceWorkflowHandle` as protocol primitives.
- Do not widen `OperatingEnvelope.allowedResources` from a passport or handle.
- Do not let a handle become a bearer token, greenlight, gateway pass, credential ref, signer input, payment payload, receipt, certificate, or mutation command.
- Do not claim hosted operation, provider custody, settlement, marketplace trust, cross-org trust, native host containment, aggregate spend enforcement, live provider verification, or Tier 3 readiness.
- Do not turn `.planning/` artifacts into repo-facing source names, package scripts, public exports, or canonical docs.
- Do not build a full x402/auth.md live demo before surface non-authority gates exist.

## Target State

Tier 1 target state:

- `docs/internal/service-workflow-story.md` explains Passport, Service Admission, Workflow Handle, Action Request, Clearance, and Outcome in plain language.
- `src/surfaces/service-workflow-admission.ts` defines `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` as non-authority product-surface records.
- Tests prove the new surface cannot create or satisfy policy, greenlight, gateway check, mutation, receipt, certificate, signer use, payment material, raw credentials, or resource widening.
- Canonical docs use the simplified flow without overclaiming.

Tier 2 target state:

- README first-use, protocol-layman docs, SDK role-client guidance, CLI/MCP descriptions, and examples converge on the same simplified flow.
- A local example emits JSON and Markdown for service workflow admission and a fresh x402 action request path.
- Runtime and generated-agent negative cases cover loops, retries, branches, dynamic tool construction, stale review, changed observed parameters, raw sibling bypass, replay, proof gaps, and isolation.
- Product tests prove admission/readback and protected-action outcome evidence remain separate.

## Decisions

- Accept `Passport` as a docs/story input noun only.
- Accept `ServiceWorkflowAdmission` as the source/API surface output noun.
- Accept `ServiceWorkflowHandle` as the carried workflow context noun.
- Treat `Badge` as optional narrative shorthand only; do not make it a schema, protocol, export, or route noun.
- Split non-authority IDs into `passportPackageDigest`, `passportPresentationId`, `admissionId`, `serviceWorkflowHandleId`, and `serviceWorkflowHandleDigest`.
- Keep the first implementation in docs, `src/surfaces`, architecture tests, and product tests before any x402/auth.md fixture expansion.
- Keep Tier 3 blocked until Tier 1/Tier 2 gates are verified or explicitly recorded as proof gaps.

## Blocking Concerns

The plan carries strict implementation gates:

- Non-authority flags are mandatory on admission and handle objects.
- The handle must not be accepted as policy, gateway, signer, mutation, receipt, or certificate evidence.
- Multi-host runtime posture must stay host-specific and proof-gap aware.
- Source placement must remain outside protocol areas unless a future source-owned transition proves a new enforceable state.
- Product docs must include exact fields, failure states, and proof gates; metaphor-only docs are insufficient.
- Protected-event terminalization remains the economic unit; passport validation is adoption plumbing, not the bought authority claim.

## Runtime And Protected-Action Summary

Runtime posture:

| Target | Evidence | Posture |
| --- | --- | --- |
| Codex | Existing local profile/readiness and MCP proposal evidence | Strongest local profile; no host-wide containment claim |
| Claude Code | Managed/profile parity artifacts in current x402 protected-tool lane | Profile evidence only |
| Hermes | Tool-packet/profile artifact | Profile evidence only |
| OpenClaw | Tool-packet/profile artifact | Profile evidence only |
| MCP | Local proposal/evidence server and read-only resources | Proposal/readback only |
| x402 | One buyer-side exact per-call local proof lane | Protected-action family; no live provider/settlement claim |
| auth.md | Provenance and credential-custody evidence profile | Evidence and future protected API call family |
| Browser, A2A, OpenAPI | Operation, route, and side-channel evidence contexts | Proof-gap surfaces until gateway-owned path exists |

Protected-action posture: the first Tier 2 fixture may connect an admitted workflow handle to one `x402_payment.exact` action request, but only after the handle is proven non-authority. The handle may help populate context and evidence refs. It cannot skip candidate action, exact contract, policy, one-use greenlight/refusal, gateway check, or terminal readback.

## Verification Gates

- Execute `npm run quality:claims` after canonical docs or public language changes.
- Execute `npm run quality:architecture` after source surfaces, naming, exports, CLI, MCP, SDK, or adapter posture changes.
- Execute the focused protocol simplification slice when proposal/evidence/readback paths change: `npm run test -- test/protocol/kernel-compilation-contract.test.ts test/protocol/kernel-policy-gateway.test.ts test/protocol/evidence-projections.test.ts test/runtime/runtime-ingress.test.ts`.
- Execute product/demo tests after adding the service workflow example.
- Execute `npm run format:check` and `npm run check:repo` before claiming implementation closeout.
- Validate this macro-plan package with `/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan`.

## Risks And Proof Gaps

Primary risk: the friendly product layer becomes authority-shaped. The mitigation is schema-level non-authority flags, architecture gates, product tests, runtime negative cases, and refusal/proof-gap readback.

Secondary risk: Tier 2 tries to prove too much too early. The mitigation is a local/source-owned fixture first, explicit non-claims, and no live-provider or hosted claim until a separate evidence packet proves it.

Long-run risk: Tier 3 pressure causes kernel/package creep. The mitigation is a hard gate: Tier 3 may consume the simplified Tier 1/Tier 2 surface only after source gates pass; if Tier 3 needs kernel changes, those return as separate Tier 1/Tier 2 work.

## Handoff To Phase Planning

Detailed phase planning should start from `EXECUTION-SLICES.md`, not from chat memory. Slice T1-01 is the first implementation step: create the internal story doc and source-owned surface contract skeleton in a way that is immediately testable. Slice T1-02 and T1-03 add the strict schema and guard tests. Tier 2 slices begin only after Tier 1 gates pass.

Fresh agents must read `AGENT-HANDOFF.md`, `PROTECTED-ACTION-GATES.md`, `RUNTIME-GATES.md`, and `TASKS.jsonl` before editing source. They must source-open named files before implementation and preserve user-owned dirty state.

## Smallest Next Mechanism

Implement the Tier 1 surface spine:

```text
docs/internal/service-workflow-story.md
src/surfaces/service-workflow-admission.ts
test/architecture/workflow-admission-boundary.test.ts
```

The story and schema must define the five non-authority IDs, require fresh action contracts for protected events, and prove the surface cannot create authority.
