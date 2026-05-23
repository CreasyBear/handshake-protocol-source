# Codebase Concerns

**Analysis Date:** 2026-05-23

## Scope

This refresh separates committed-source concerns from dirty/unpromoted `auth.md` adapter concerns.

**Committed source inspected:**
- Runtime ingress: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `test/product/agent-proof-slice.test.ts`
- MCP x402 proposal and resources: `src/mcp/x402-proposal.ts`, `src/mcp/output.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/mcp/mcp-resource-redaction.test.ts`
- CLI response surfaces: `src/cli/output.ts`, `src/cli/projection-evidence.ts`, `src/cli/support-bundle.ts`, `src/cli/local-project/index.ts`
- x402 adapters and proof lane: `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/install-proposal.ts`, `test/conformance/x402-upstream-exact-fixtures.test.ts`
- Evidence projections: `src/protocol/evidence-projections/assembly.ts`, `src/protocol/evidence-projections/projections.ts`, `src/http/handlers/evidence-read.ts`, `test/protocol/evidence-projections.test.ts`, `test/protocol/authority-certificate.test.ts`

**Dirty/unpromoted `auth.md` state inspected:**
- Untracked adapter implementation: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/index.ts`
- Untracked tests: `test/adapters/auth-md-adapter.test.ts`
- Dirty tracked references: `STRUCTURE.md`, `docs/internal/protocol-notes.md`, `src/adapters/LANE.md`, `src/experimental.ts`, `test/architecture/root-exports.test.ts`

`.planning/` is scratch. Canonical claims remain limited to `AGENTS.md`, `README.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`. Do not promote hosted verifier, provider custody, clearing-house, or public-distribution claims from these concerns.

## Priority Index

| Priority | Concern | Scope |
|----------|---------|-------|
| P1 | Runtime ingress records refusal evidence but drops refusal refs from the response posture | Committed |
| P1 | `auth.md` adapter is proposal/intake only and has no gateway runner, runtime-ingress family, or mutation receipt lane | Dirty/unpromoted |
| P1 | `auth.md` dirty fixture marks raw bypass possible while treating protected path state as not required | Dirty/unpromoted |
| P2 | Agent transaction envelope assembly uses tenant/org fan-out instead of indexed per-action projection | Committed |
| P2 | MCP x402 proposal evidence is graphless | Committed |
| P2 | Runtime ingress family routing is hardcoded to package-install and x402 suffix branches | Committed |
| P2 | x402 aggregate spend/review windows remain metadata without a spend ledger | Committed |

## Tech Debt

**Committed: Runtime ingress refusal refs are not surfaced to callers**
- Issue: `compileIntent` commits durable `Refusal` records for rejected candidates in `src/protocol/areas/intent-compilation/transitions.ts`, but `RuntimeIngressResponsePosture.refusalRefs` is always `[]` in `src/runtime/ingress/index.ts`.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/intent-compilation/transitions.ts`, `test/runtime/runtime-ingress.test.ts`
- Impact: The runtime caller gets refusal reason codes but not the durable refusal evidence reference. Reconstruction still exists in the store, but the immediate response boundary hides the evidence handle.
- Fix approach: Add refusal references to the intent-compilation record or compiler return value, copy them into each rejected runtime proposal, and assert `responsePosture.refusalRefs` in `test/runtime/runtime-ingress.test.ts`.

**Committed: MCP x402 proposal path is graphless**
- Issue: The MCP x402 proposal path creates a runtime execution and tool-call draft but sets `generatedExecutionGraphId` to `null` with posture `not_exposed_by_role_scoped_runtime_surface`.
- Files: `src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`
- Impact: MCP proposal evidence is weaker than runtime-ingress evidence for generated execution shape. It can prove a role-scoped proposal boundary, but it cannot reconstruct branch, loop, retry, or sibling-tool structure from a generated execution graph.
- Fix approach: Either keep MCP explicitly single-dispatch and graphless in docs/tests, or add a minimal graph record for MCP proposals before treating this surface as equivalent to runtime ingress.

**Committed: Runtime ingress action-family routing is hand-coded**
- Issue: Runtime ingress dispatch classification switches over package-install and x402 patterns directly instead of using a registered action-family table.
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`
- Impact: New protected action families require edits to central ingress conditionals, which increases the chance that raw bypass, ambiguous dispatch, or proposal posture behavior drifts by family.
- Fix approach: Introduce an internal family registry with classification, compile input building, raw-bypass reason codes, and config lookup before promoting another adapter family.

**Dirty/unpromoted `auth.md`: tracked exports depend on untracked adapter files**
- Issue: Dirty tracked files export or document `auth.md`, while the implementation and tests live in untracked files.
- Files: `src/experimental.ts`, `test/architecture/root-exports.test.ts`, `STRUCTURE.md`, `docs/internal/protocol-notes.md`, `src/adapters/LANE.md`, `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `test/adapters/auth-md-adapter.test.ts`
- Impact: The working tree can pass locally only with untracked files present. A partial commit of tracked files would point public experimental exports at missing source.
- Fix approach: Promote the adapter atomically or keep all `auth.md` references unpromoted until the implementation, tests, docs, and export surface move together.

## Known Bugs

**Committed: Runtime ingress rejected-candidate responses omit refusal evidence references**
- Symptoms: Dynamic dispatch and truncated graph paths create refusal records, but `responsePosture.refusalRefs` remains empty.
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/intent-compilation/transitions.ts`, `test/runtime/runtime-ingress.test.ts`
- Trigger: Send a runtime ingress request that produces `candidate_rejected` or `graph_truncated` posture.
- Workaround: Inspect the receipt store directly by tenant/org and object family. This is a poor caller contract because the response already exposes `proofGapRefs` and `evidenceRefs`.

**Dirty/unpromoted `auth.md`: protected path posture is under-specified in the fixture**
- Symptoms: The dirty `auth.md` fixture marks `tool.rawBypassPossible: true` while the proposed envelope uses `requiredProtectedPathState: "not_required"`.
- Files: `test/adapters/auth-md-adapter.test.ts`, `src/adapters/auth-md/action-proposal.ts`
- Trigger: Use the dirty `auth.md` action proposal fixture as the basis for future policy evaluation or gateway checks.
- Workaround: Treat the dirty adapter as proposal-only. Do not evaluate or greenlight `auth_md_protected_api_call.exact.v0` until protected path posture is explicit.

## Security Considerations

**Committed: Runtime ingress is caller-observed evidence, not interception proof**
- Risk: Runtime ingress can record dynamic dispatch, raw sibling bypass, and proposal posture only for the observed caller path. It does not prove that every sibling tool path is technically intercepted.
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `test/product/agent-proof-slice.test.ts`, `docs/internal/protocol-notes.md`, `README.md`
- Current mitigation: Tests cover raw package-install, raw x402, direct MCP x402 bypass, dynamic dispatch, ambiguous dispatch, retries, and changed-parameter retries.
- Recommendations: Keep every new family honest by requiring a raw/sibling bypass posture test and a response posture reason code before documenting it as runtime ingress support.

**Committed: MCP x402 proposal has no graph evidence**
- Risk: A role-scoped MCP proposal can be safe as proposal-only, but it does not prove generated-code structure or hidden branch behavior.
- Files: `src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`
- Current mitigation: Tests assert no policy, greenlight, gateway check, mutation, payment signature, or payment payload is produced by the MCP proposal tool.
- Recommendations: Keep MCP proposal language narrow unless graph evidence is added.

**Dirty/unpromoted `auth.md`: credential intake is not provider custody**
- Risk: `credentialMaterial` appears in adapter input before the helper returns a `RegisterGatewayCredentialRefInput`. The helper redacts evidence, but it does not store material in a provider or prove secret lifecycle controls.
- Files: `src/adapters/auth-md/profiles.ts`, `test/adapters/auth-md-adapter.test.ts`
- Current mitigation: Tests assert secret material is excluded from returned evidence and credential reference input.
- Recommendations: Keep claims to gateway credential-ref intake. Do not describe this as provider custody, hosted custody, or OAuth-server operation.

**Dirty/unpromoted `auth.md`: no gateway runner enforces proposed protected API calls**
- Risk: `auth_md_protected_api_call.exact.v0` can be proposed as an action contract, but no dirty file implements a gateway check that consumes a one-use greenlight before the API mutation.
- Files: `src/adapters/auth-md/action-proposal.ts`, `test/adapters/auth-md-adapter.test.ts`
- Current mitigation: Dirty tests assert proposal does not create greenlight, gateway check, mutation, or payment proof records.
- Recommendations: Before promotion, add a gateway-side adapter test that refuses without exact greenlight binding and records gateway/mutation/proof-gap outcomes separately.

## Performance Bottlenecks

**Committed: Agent transaction envelope assembly fans out across tenant/org object families**
- Problem: `assembleAgentTransactionEnvelope` gathers records by tenant/org and object family, then filters them in memory for a contract or transaction.
- Files: `src/protocol/evidence-projections/assembly.ts`, `src/http/handlers/evidence-read.ts`, `src/protocol/areas/authority-certificate/transitions.ts`, `test/protocol/evidence-projections.test.ts`, `test/protocol/authority-certificate.test.ts`
- Cause: The local append-only store has no indexed per-action projection table for envelope reads.
- Improvement path: Keep the current assembler for local proof, but add an indexed transaction/evidence projection before using this shape for large tenants or hosted read paths.

## Fragile Areas

**Committed: Response posture shapes can drift across HTTP, runtime ingress, MCP, and CLI**
- Files: `src/http/routes/transition-response-schemas.ts`, `src/runtime/ingress/index.ts`, `src/mcp/output.ts`, `src/cli/output.ts`, `src/surfaces/outcome.ts`
- Why fragile: Each surface now exposes a conservative outcome posture, but the fields are assembled in separate modules.
- Safe modification: Add shared tests for response invariants: non-authority proposal surfaces must keep `authorityCreated`, `gatewayCheckPerformed`, and `mutationAttempted` false; rejected candidates must expose refusal refs when records exist.
- Test coverage: CLI, MCP, runtime ingress, and HTTP have focused tests, but no single cross-surface invariant test binds all response envelopes.

**Committed: Evidence projection correctness depends on supplemental record wiring**
- Files: `src/protocol/evidence-projections/assembly.ts`, `src/protocol/evidence-projections/projections.ts`, `test/protocol/evidence-projections.test.ts`, `test/protocol/authority-certificate.test.ts`
- Why fragile: The envelope can include credential, recovery, isolation, idempotency, reconciliation, and authority-certificate records only if each new evidence family is added to the assembler and projection.
- Safe modification: When adding a protocol record family, update both the assembler and the projection tests in the same change.
- Test coverage: Current tests cover custody, recovery, isolation, idempotency, retry reconciliation, and certificate embedding.

**Dirty/unpromoted `auth.md`: proposal path accepts optional generated execution context**
- Files: `src/adapters/auth-md/action-proposal.ts`, `test/adapters/auth-md-adapter.test.ts`
- Why fragile: `runtimeExecutionId`, `generatedGraph`, and `toolCallDraftId` are optional or nullable in the dirty path, so a future promotion could propose protected API calls without generated-code provenance.
- Safe modification: Require a generated execution graph or a documented non-codemode proposal posture before exposing `auth.md` beyond experimental exports.
- Test coverage: Dirty tests assert proposal-only behavior but do not require graph or draft evidence.

## Scaling Limits

**Committed: x402 aggregate spend and review windows are metadata**
- Current capacity: Per-call x402 package-install and payment-call contracts can be proposed, greenlit, gateway-checked, and receipted in local proof tests.
- Limit: Session, day, and review-window spend limits are metadata until a spend ledger exists.
- Files: `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/install-proposal.ts`, `test/runtime/runtime-ingress.test.ts`, `test/product/agent-proof-slice.test.ts`, `docs/internal/protocol-notes.md`, `README.md`
- Scaling path: Add a ledger-backed spend window before enforcing aggregate buyer-side limits or claiming aggregate spend control.

**Committed: Runtime ingress supports two hardcoded action families**
- Current capacity: Runtime ingress covers package-install and x402 dispatch families.
- Limit: Additional families require edits to classification, config lookup, compile input construction, and bypass reason-code mapping.
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`
- Scaling path: Add an adapter-family registry before adding `auth.md` or other protected API action families to runtime ingress.

**Dirty/unpromoted `auth.md`: credential lifecycle is discovery/intake only**
- Current capacity: Dirty helper code can parse protected-resource metadata and return redacted registration input for a gateway credential ref.
- Limit: No rotation, revocation, provider-backed storage, gateway execution, or receipt lane is implemented in the dirty adapter.
- Files: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `test/adapters/auth-md-adapter.test.ts`
- Scaling path: Keep `auth.md` as an adapter profile until gateway credential storage and protected API-call enforcement exist.

## Dependencies at Risk

**Committed: x402 conformance is coupled to upstream package semantics**
- Risk: The exact buyer-side proof lane depends on `@x402/core`, `@x402/evm`, and `@x402/fetch` behavior and fixture shape.
- Impact: Upstream changes can break local exact-proof fixtures or signer-custody assumptions.
- Files: `package.json`, `test/conformance/x402-upstream-exact-fixtures.test.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/install-proposal.ts`
- Migration plan: Keep conformance tests as the upgrade gate. Update fixtures and non-claim docs together when bumping x402 packages.

**Dirty/unpromoted `auth.md`: discovery depends on OAuth Protected Resource Metadata semantics**
- Risk: The dirty adapter treats OAuth Protected Resource Metadata as the discovery source of truth and `auth.md` prose as supporting evidence.
- Impact: Metadata shape drift affects contract proposal and credential-intake evidence.
- Files: `src/adapters/auth-md/profiles.ts`, `docs/internal/protocol-notes.md`, `test/adapters/auth-md-adapter.test.ts`
- Migration plan: Keep schemas narrow, fixture-backed, and experimental until the adapter has gateway enforcement.

## Missing Critical Features

**Committed: Refusal refs are missing from runtime ingress response posture**
- Problem: Refusal evidence exists but is not returned as a first-class response reference.
- Blocks: Runtime callers cannot directly attach the refusal record to reconstruction or recovery workflows.

**Committed: Spend ledger is missing for aggregate x402 limits**
- Problem: Aggregate spend windows are declared as metadata, not enforced state.
- Blocks: Any claim that session/day/review spend limits are enforced.

**Committed: Generic runtime ingress family registry is missing**
- Problem: Runtime ingress families are centralized conditionals instead of registered adapters.
- Blocks: Low-risk expansion to new action families such as `auth.md`.

**Dirty/unpromoted `auth.md`: gateway check and mutation receipt path are missing**
- Problem: The dirty adapter stops at discovery, credential-ref intake, and proposal.
- Blocks: Any claim that `auth.md` protected API calls are enforced by Handshake.

**Dirty/unpromoted `auth.md`: runtime ingress binding is missing**
- Problem: No dirty file wires `auth_md_protected_api_call.exact.v0` into runtime ingress dispatch, raw bypass posture, or generated graph evidence.
- Blocks: Treating `auth.md` as part of the runtime-ingress proof lane.

## Test Coverage Gaps

**Committed: Runtime ingress refusal references are not asserted**
- What's not tested: Rejected runtime ingress responses should expose `responsePosture.refusalRefs` when refusal records are committed.
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`
- Risk: Refusal evidence remains durable but undiscoverable from the response boundary.
- Priority: High

**Committed: Cross-surface response posture invariants are not centralized**
- What's not tested: HTTP, runtime ingress, MCP, and CLI response envelopes should share core no-authority/no-mutation flags for proposal-only surfaces.
- Files: `src/http/routes/transition-response-schemas.ts`, `src/runtime/ingress/index.ts`, `src/mcp/output.ts`, `src/cli/output.ts`, `src/surfaces/outcome.ts`
- Risk: One surface can drift into evidence theatre by implying authority or execution where only proposal occurred.
- Priority: Medium

**Committed: MCP proposal graphlessness is documented by posture but not pressure-tested against multi-step generated plans**
- What's not tested: MCP x402 proposal behavior for generated multi-call, branch, or retry graph inputs.
- Files: `src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`
- Risk: The MCP path may be mistaken for runtime-ingress graph coverage.
- Priority: Medium

**Dirty/unpromoted `auth.md`: no policy/gateway/evidence projection tests**
- What's not tested: Policy evaluation, one-use greenlight binding, gateway check refusal, mutation receipt, proof gap recording, redacted evidence projection, and authority-certificate inclusion for `auth_md_protected_api_call.exact.v0`.
- Files: `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/profiles.ts`, `test/adapters/auth-md-adapter.test.ts`
- Risk: Proposal-only helper code could be promoted as if it enforces protected API calls.
- Priority: High

**Dirty/unpromoted `auth.md`: no runtime-ingress bypass tests**
- What's not tested: Raw Authorization header calls, direct client calls, dynamic endpoint construction, and sibling HTTP client bypass under runtime ingress.
- Files: `src/adapters/auth-md/action-proposal.ts`, `test/adapters/auth-md-adapter.test.ts`, `src/runtime/ingress/index.ts`
- Risk: The adapter could look contract-shaped while generated code still escapes the contract boundary.
- Priority: High

## Resolved or Stale Concerns From Prior Map

These prior concerns are not active in the inspected source and should not be carried forward as current defects:

- Agent transaction envelopes now include credential resolution, recovery, isolation, idempotency, reconciliation, and authority-certificate evidence in `src/protocol/evidence-projections/assembly.ts`, `src/protocol/evidence-projections/projections.ts`, `test/protocol/evidence-projections.test.ts`, and `test/protocol/authority-certificate.test.ts`.
- Authority certificates now embed assembled custody, recovery, isolation, and idempotency evidence through `src/protocol/areas/authority-certificate/transitions.ts` and `test/protocol/authority-certificate.test.ts`.
- Policy refusal responses now expose refusal and retry posture through `src/protocol/areas/policy-greenlight/transitions.ts`, `src/http/routes/transition-response-schemas.ts`, and `src/protocol/areas/policy-greenlight/policy-record/index.ts`.
- MCP x402 error mapping now preserves `protocol_recorded`, `ambiguous`, and `not_started` commit states in `src/mcp/x402-proposal.ts` and `test/mcp/mcp-x402-proposal.test.ts`.
- Retry telemetry no longer uses the misleading `paid_retry_attempted` label in the inspected evidence projections and tests at `src/protocol/evidence-projections/projections.ts` and `test/protocol/evidence-projections.test.ts`.
- CLI output now uses a standard conservative envelope in `src/cli/output.ts`, `src/cli/projection-evidence.ts`, `src/cli/support-bundle.ts`, and `src/cli/local-project/index.ts`.
- Runtime ingress now returns an explicit response posture in `src/runtime/ingress/index.ts`; the remaining bug is refusal-ref omission, not absence of a wrapper.

---

*Concerns audit: 2026-05-23*
