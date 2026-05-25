# Execution Slices

## Slice T0-00 - Macro Package And Review Reconciliation

### ID

T0-00

### Invariant Or Risk

The plan itself can launder unresolved blockers into an executable-looking artifact. The chair must preserve source boundary, sidecar disagreement, non-proofs, and implementation gates.

### Objective

Produce a validated macro-plan package with source snapshot, sidecar reviews, evidence plan, runtime gates, protected-action gates, task records, and implementation entry.

### Source Evidence

- `.planning/macro-map/MACRO-HANDOFF.md`
- `.planning/macro-map/FACET-MAP.md`
- `.planning/codebase/*`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `gsd-macro-plan` references and validator

### Inputs

Run input, source snapshot, sidecar audit reports, macro-map package, codebase maps, canonical docs.

### Outputs

`.planning/macro-plan/*`, `TASKS.jsonl`, validation output, git checkpoint.

### Dependencies

User authorization to continue from the decision-gated macro map.

### Owner

Chair.

### Stop Conditions

- The plan claims authority, hosted operation, provider custody, native host containment, settlement, or Tier 3 readiness.
- Sidecar reports are missing and no fallback is recorded.
- Validator fails and the package is not revised.

### Proof Gates

- Validator reports the macro plan output is valid.
- Sidecar reports exist or missing reports are explicitly recorded.
- `git status --short` is inspected before committing.

### Verification Commands Or Checks

```bash
/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
git status --short
```

### Rollback Or Abandonment Criteria

Abandon the executable status if a sidecar finds a live authority or runtime blocker that cannot be turned into a concrete implementation gate.

### Agent Handoff Needs

Fresh agent reads `AGENT-HANDOFF.md`, this file, `TASKS.jsonl`, `PROTECTED-ACTION-GATES.md`, and `RUNTIME-GATES.md`.

## Slice T1-01 - Service Workflow Story

### ID

T1-01

### Invariant Or Risk

Users need a simple story, but the story cannot imply permission. If a story says the agent is "admitted" without separating clearance, this is advisory, not Handshake.

### Objective

Create `docs/internal/service-workflow-story.md` that teaches the simplified flow and maps each noun to existing protocol/evidence objects.

### Source Evidence

- `.planning/macro-map/EXPERIENCE-MAP.md`
- `.planning/macro-map/views/DESIGN.md`
- `.planning/macro-map/views/DEVEX.md`
- `docs/internal/protocol-layman.md`
- `README.md`
- `docs/internal/protocol-notes.md`

### Inputs

Noun set: Passport, ServiceWorkflowAdmission, ServiceWorkflowHandle, Action Request, Clearance, Outcome. Five non-authority IDs. Canonical protocol chain.

### Outputs

`docs/internal/service-workflow-story.md`

### Dependencies

T0-00.

### Owner

Product/docs implementer.

### Stop Conditions

- The doc says Passport, Admission, Badge, Handle, Certificate, or review creates permission.
- The doc collapses admission and clearance.
- The doc lacks refusal, proof-gap, replay, or isolation recovery states.

### Proof Gates

- Story states Passport is evidence package only.
- Story states Admission is service-side accepted/refused/stale/proof-gap mapping only.
- Story states Handle is workflow context only and requires fresh action contracts.
- Story states Clearance is exact policy plus one-use greenlight/refusal plus gateway check.
- Story states Outcome is receipt/refusal/replay refusal/proof gap/certificate evidence, not downstream success.

### Verification Commands Or Checks

```bash
npm run quality:claims
git diff --check
```

### Rollback Or Abandonment Criteria

Revert the doc slice if claim-boundary tests reject the language or if the doc needs a new authority primitive to make the story coherent.

### Agent Handoff Needs

Read `docs/internal/protocol-layman.md` and keep the new story shorter than a protocol spec but strict about non-authority.

## Slice T1-02 - Surface Contract And Non-Authority IDs

### ID

T1-02

### Invariant Or Risk

A product surface can create implied authority through fields and exports even when text says otherwise.

### Objective

Create `src/surfaces/service-workflow-admission.ts` defining `ServiceWorkflowAdmission`, `ServiceWorkflowHandle`, authority boundary fields, claim rows, and the five non-authority IDs.

### Source Evidence

- `.planning/macro-map/MECHANISM-MAP.md`
- `.planning/macro-map/views/ENG.md`
- `.planning/macro-map/views/AUTHORITY.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `src/surfaces/outcome.ts`
- `src/surfaces/boundary-manifest.ts`

### Inputs

Existing surface non-authority field conventions, Zod schema style, strict TypeScript settings.

### Outputs

- `src/surfaces/service-workflow-admission.ts`
- possibly `src/surfaces/index.ts` export if package posture allows, guarded by tests

### Dependencies

T1-01.

### Owner

Surface/schema implementer.

### Stop Conditions

- The file imports protocol internals that create policy, greenlight, gateway, receipt, certificate, store, or adapter authority.
- The schema carries raw token, key, `PaymentPayload`, `PAYMENT-SIGNATURE`, signer, credential material, receipt export, or certificate material.
- The schema can widen resources, actions, spend, gateway, or policy bounds.

### Proof Gates

- `createsAuthority: false`
- `createsPolicyDecision: false`
- `createsGreenlight: false`
- `performsGatewayCheck: false`
- `permitsMutation: false`
- `exportsReceipt: false`
- `mintsTerminalCertificate: false`
- `freshActionContractRequired: true`
- IDs defined: `passportPackageDigest`, `passportPresentationId`, `admissionId`, `serviceWorkflowHandleId`, `serviceWorkflowHandleDigest`

### Verification Commands Or Checks

```bash
npm run quality:architecture
npm run check:types
```

### Rollback Or Abandonment Criteria

Abandon source surface if a distinct enforceable protocol transition is truly required; return to macro planning before adding protocol state.

### Agent Handoff Needs

Study existing `src/surfaces/outcome.ts` and `src/surfaces/boundary-manifest.ts`; follow their non-authority style.

## Slice T1-03 - Naming, Claim, And Surface Boundary Guards

### ID

T1-03

### Invariant Or Risk

Friendly nouns can drift into protocol areas, runtime dispatch, gateway execution, root exports, or public claims.

### Objective

Add architecture and claim-boundary tests for Passport, Admission, Badge, `ServiceWorkflowAdmission`, and `ServiceWorkflowHandle`.

### Source Evidence

- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `test/architecture/naming-posture.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/surface-boundary-posture.test.ts`
- `test/architecture/root-exports.test.ts`

### Inputs

Existing architecture tests and package export posture.

### Outputs

- `test/architecture/workflow-admission-boundary.test.ts` or extensions to existing architecture tests
- claim-boundary vocabulary updates where needed

### Dependencies

T1-02.

### Owner

Architecture-test implementer.

### Stop Conditions

- Tests rely only on prose while source exports can still imply authority.
- Tests allow `Badge` as API/schema/protocol noun.
- Tests allow handle fields to satisfy policy, gateway, signer, mutation, receipt, or certificate material.

### Proof Gates

- Surface object stays out of `src/protocol/areas/*`.
- Surface object stays out of gateway adapter execution paths.
- Root exports remain curated.
- Forbidden raw credential/payment/material fields are rejected.
- Non-authority booleans are required.

### Verification Commands Or Checks

```bash
npm run quality:claims
npm run quality:architecture
```

### Rollback Or Abandonment Criteria

If guards become too string-scanny to prove boundary, add schema-level tests and import-boundary checks before continuing.

### Agent Handoff Needs

Do not weaken existing architecture tests to admit the new surface.

## Slice T1-04 - Canonical Docs Convergence

### ID

T1-04

### Invariant Or Risk

Docs can diverge: README may teach x402 mechanics while internal docs teach Passport/Admission, producing two product models.

### Objective

Converge canonical docs on the simplified flow while preserving the current product kernel and proof ledger.

### Source Evidence

- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/service-workflow-story.md`

### Inputs

Completed story and surface schema.

### Outputs

Tightly scoped documentation patches, not a broad rewrite.

### Dependencies

T1-01, T1-02, T1-03.

### Owner

Docs implementer.

### Stop Conditions

- Docs imply public package availability, MCP Registry, certificate, passport, or handle creates authority.
- Docs claim Tier 3 hosted operation or external provider custody.
- Docs remove proof gaps to sound simpler.

### Proof Gates

- `quality:claims` passes.
- Docs mention the simplified flow and exact protected-action chain together.
- Tier 3 remains blocked by explicit source gate.

### Verification Commands Or Checks

```bash
npm run quality:claims
npm run format:check
```

### Rollback Or Abandonment Criteria

Revert doc convergence if it creates a second inconsistent product story.

### Agent Handoff Needs

Patch canonical docs only after source schema and tests exist.

## Slice T2-01 - SDK / CLI / MCP Surface Alignment

### ID

T2-01

### Invariant Or Risk

Developer surfaces can make admission feel executable if they expose a handle before explaining clearance.

### Objective

Align SDK role-client guidance, CLI readback language, and MCP metadata/resource descriptions with the simplified product model without adding execution authority.

### Source Evidence

- `README.md`
- `src/cli/command-manifest.ts`
- `src/mcp/catalog.ts`
- `src/mcp/resources.ts`
- `src/sdk/surface-clients/index.ts`
- `.planning/codebase/STACK.md`
- `.planning/codebase/CONVENTIONS.md`

### Inputs

Tier 1 schema and docs.

### Outputs

Surface language updates, readback helper shapes, or docs-only references depending on source fit.

### Dependencies

T1-04.

### Owner

Surface integration implementer.

### Stop Conditions

- CLI gains mutation-shaped commands for admission.
- MCP tool exposure expands beyond proposal/evidence.
- SDK clients infer authority from admission readback.

### Proof Gates

- CLI command posture remains evidence/readiness/readback only.
- MCP remains proposal/evidence only.
- SDK role clients remain role-scoped and do not accept handle as permission.

### Verification Commands Or Checks

```bash
npm run quality:architecture
npm run test -- test/architecture/cli-command-posture.test.ts test/architecture/mcp-surface-posture.test.ts test/sdk/role-clients.test.ts
```

### Rollback Or Abandonment Criteria

If alignment needs new public exports, pause for export posture review before continuing.

### Agent Handoff Needs

Keep changes sparse; do not redesign CLI/MCP.

## Slice T2-02 - Local Service Workflow Example

### ID

T2-02

### Invariant Or Risk

A demo can accidentally become a product claim if it hides proof gaps or implies live provider execution.

### Objective

Create a local example that emits JSON and Markdown showing Passport presentation, service admission, workflow handle, fresh x402 action request, and separated readback states.

### Source Evidence

- `examples/self-hosted-activation/`
- `examples/x402-protected-spend/`
- `examples/external-adapter-sdk/`
- `test/product/*`
- `.planning/macro-map/EXPERIENCE-MAP.md`
- `.planning/macro-map/PROTECTED-ACTION-MAP.md`

### Inputs

Tier 1 schema and tests.

### Outputs

- `examples/service-workflow-admission/`
- product test for example output
- generated output contract in JSON and Markdown

### Dependencies

T2-01.

### Owner

Example implementer.

### Stop Conditions

- Example claims live provider custody, hosted operation, settlement, broad x402 compatibility, or host containment.
- Example skips fresh `ActionContract`.
- Example treats handle readback as receipt evidence.

### Proof Gates

- Output includes false authority flags.
- Output distinguishes admission evidence from protected-action receipt/refusal/proof-gap.
- Product test asserts the example’s non-claims.

### Verification Commands Or Checks

```bash
npm run demo:service-workflow-admission
npm run test -- test/product/service-workflow-admission.test.ts
```

### Rollback Or Abandonment Criteria

Defer the example if it requires a new live external rail to look convincing.

### Agent Handoff Needs

Use existing examples as style references; emit stable Prettier-friendly JSON and Markdown.

## Slice T2-03 - Runtime And Generated-Agent Misuse Tests

### ID

T2-03

### Invariant Or Risk

Generated agents will reuse a handle in loops, retries, dynamic tool calls, stale review flows, browser/network paths, or raw sibling calls unless negative cases make that impossible to miss.

### Objective

Add runtime/product tests proving handle/admission cannot authorize protected actions and must recraft fresh action requests after drift, refusal, replay, proof gap, or isolation.

### Source Evidence

- `.planning/macro-map/AGENT-RUNTIME-MAP.md`
- `.planning/macro-map/views/AGENT.md`
- `.planning/macro-map/views/RUNTIME.md`
- `src/runtime/ingress/index.ts`
- `src/runtime/ingress/schemas.ts`
- `test/runtime/runtime-ingress.test.ts`

### Inputs

Tier 1 schema, local example, runtime ingress tests.

### Outputs

Focused negative tests and updated evidence plan.

### Dependencies

T2-02.

### Owner

Runtime test implementer.

### Stop Conditions

- Tests require native host containment to pass.
- Tests treat runtime ingress as enforcement.
- Tests rely on a rendered review screen as permission.

### Proof Gates

- Loops and retries require fresh action contracts.
- Dynamic tool construction is refused or proof-gapped.
- Raw sibling bypass posture is visible.
- Stale rendered review cannot authorize changed parameters.

### Verification Commands Or Checks

```bash
npm run test -- test/runtime/runtime-ingress.test.ts
npm run quality:architecture
```

### Rollback Or Abandonment Criteria

If runtime tests expose a source bug in current ingress posture, stop implementation and fix the source bug before continuing product polish.

### Agent Handoff Needs

Do not claim browser, A2A, OpenAPI, Hermes, OpenClaw, Claude Code, or generic MCP containment from local tests.

## Slice T2-04 - x402 / auth.md Protected-Action Fixture Gate

### ID

T2-04

### Invariant Or Risk

The first fixture that connects service workflow admission to a protected action can imply that admission cleared spend.

### Objective

Connect one admitted workflow context to one fresh buyer-side `x402_payment.exact` action request. Record auth.md as provenance/proof-gap only; do not compose auth.md credential authority with x402 spend authority in this fixture.

### Source Evidence

- `src/adapters/x402-payment/*`
- `src/adapters/auth-md/*`
- `examples/x402-protected-spend/`
- `test/adapters/x402-wallet-gateway.test.ts`
- `test/integration/x402-d1-http.test.ts`
- `.planning/macro-map/PROTECTED-ACTION-MAP.md`

### Inputs

Tier 1/Tier 2 admission example and runtime misuse tests.

### Outputs

Fixture or product test proving fresh contract, policy, gateway check, replay refusal, and proof-gap separation.

### Dependencies

T2-03.

### Owner

Protected-action fixture implementer.

### Stop Conditions

- `PaymentPayload` or `PAYMENT-SIGNATURE` enters passport/admission/handle.
- Signer invocation occurs before verified gateway evidence.
- Fixture claims live provider custody, settlement, facilitator operation, seller middleware, or aggregate spend.

### Proof Gates

- Fresh `ActionContract` is created for the protected action.
- Policy and gateway evidence remain separate.
- Replay refusal and downstream proof gap are recorded distinctly.
- Handle is context only.

### Verification Commands Or Checks

```bash
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts
npm run quality:claims
```

### Rollback Or Abandonment Criteria

Defer auth.md composite behavior unless credential holder, gateway holder, refusal boundary, and raw credential redaction are source-proven.

### Agent Handoff Needs

Treat x402/auth.md as evidence rails until exact clearance; do not merge them into a composite authority artifact.

## Slice T2-05 - Tier 3 Lock And Release Gate

### ID

T2-05

### Invariant Or Risk

Hosted Tier 3 pressure can pull unfinished product simplification into hosted claims and package creep.

### Objective

Add a release/admission gate stating Tier 3 cannot consume or extend the simplified surface until Tier 1 and Tier 2 gates are verified or proof-gapped.

### Source Evidence

- `docs/internal/decisions.md`
- `.planning/macro-map/MACRO-HANDOFF.md`
- Memory-derived prior Tier 3 boundary guidance
- `README.md`

### Inputs

Completed Tier 1/Tier 2 gates.

### Outputs

Decision entry or internal gate doc update, plus final repo gate evidence.

### Dependencies

T2-04.

### Owner

Release gate owner.

### Stop Conditions

- Tier 3 hosted operation starts from unverified local surface behavior.
- Protocol kernel exports expand for hosted needs without separate Tier 1/Tier 2 proof.
- Product language claims clearing-house, marketplace, certification, settlement, or cross-org trust.

### Proof Gates

- `npm run check:repo` passes.
- Tier 3 proof gaps are explicit.
- Any required hosted workspace boundary is recorded separately.

### Verification Commands Or Checks

```bash
npm run check:repo
git status --short
```

### Rollback Or Abandonment Criteria

If Tier 3 needs a kernel change, split it back into Tier 1/Tier 2 before hosted work continues.

### Agent Handoff Needs

Do not implement hosted operation in this checkout as part of simplification unless the user explicitly opens a separate Tier 3 workspace.
