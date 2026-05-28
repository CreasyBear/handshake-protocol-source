# Codebase Concerns

**Analysis Date:** 2026-05-28

## Priority Authority-Boundary Risks

These four areas are the highest-risk confusion points for future implementation. Treat any surface that records, projects, or readbacks evidence as **advisory until a gateway check owns the mutation credential** and verifies the exact one-use greenlight.

### Gateway enforcement vs advisory surfaces

**What is actually enforced:** Only the gateway check path in `src/adapters/x402-payment/wallet-gateway.ts` (and analogous adapter gateways) may invoke signers after a verified one-use greenlight. Policy in `src/protocol/areas/policy-greenlight/` authorizes one attempt; storage atomicity in `src/storage/d1/index.ts` and `src/storage/memory/index.ts` binds consumption.

**What is advisory only (must not be sold as enforcement):**

| Surface class | Location | Risk if misread |
|---------------|----------|-----------------|
| Runtime ingress | `src/runtime/ingress/index.ts`, `src/runtime/LANE.md` | Proposal/refusal evidence mistaken for gateway enforcement |
| Generated graph / codemode | `src/runtime/codemode-multi-action/generated-graph-evidence.ts` | `commandRiskClassifierPosture: "advisory_no_match"` is not a gate |
| MCP x402 proposal | `src/mcp/x402-proposal.ts` | Tool output can look precise while runtime rejects the shape |
| Service workflow admission | `src/surfaces/service-workflow-admission/index.ts` | Handle/admission correlation mistaken for clearance or reusable auth |
| A2A ingress admission | `src/surfaces/a2a-negotiation-support/ingress-admission.ts` | Normalization readiness mistaken for policy/greenlight/gateway |
| Proof packets | `src/surfaces/proof-packets/` | Blocked/incomplete packets mistaken for live execution proof |
| SDK repair | `src/sdk/repair.ts` | Remediation hints mistaken for authority recovery |
| CLI doctor/quality/simulate | `src/cli/host/doctor.ts`, `src/cli/mcp/doctor.ts`, `src/cli/quality/report.ts`, `src/cli/simulate/x402-payment.ts` | Diagnostics mistaken for protected-action clearance |
| Evidence projections | `src/protocol/evidence-projections/store-reader.ts` | Readback timelines mistaken for mutation proof |

**Architecture tests that encode this split:** `test/architecture/claim-boundary.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/workflow-admission-boundary.test.ts`, `test/architecture/mcp-surface-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`.

**Safe modification:** Before any new export, CLI command, MCP tool, HTTP route, or package subpath ships, declare in `src/surfaces/boundary-manifest.ts` whether it is `setup_only`, `evidence_only`, `policy_transition_transport`, or true gateway-adjacent—and keep model/operator surfaces off authority route families.

### Generated-code bypass

**Current registered interception:** `src/runtime/ingress/registry.ts` registers only `package_install`, `x402_payment`, and `auth_md_protected_api_call`. Host profiles in `src/adapters/x402-payment/protected-tool-profile/` and bypass probes in `src/adapters/x402-payment/bypass-probes.ts` record posture for named adapters, not host-wide containment.

**Proof gaps (explicit in source and gates):**

- Host-wide containment: `src/surfaces/proof-packets/host-generated-code-containment.ts` — `scripts/check-host-generated-code-containment.mjs --expect-status blocked`
- Raw sibling routes, dynamic dispatch, truncated graphs: tested locally in `test/runtime/runtime-ingress.test.ts` and host bypass harnesses, not proven across every host path
- Codemode multi-action loops/retries: `src/runtime/codemode-multi-action/` compiles candidates; advisory classifiers do not block execution
- A2A adapter moves: `src/surfaces/a2a-negotiation-support/move-compiler.ts` compiles external protocol moves into evidence; gateway still required for the one exact protected action

**Failure mode:** Generated code calls an unwrapped consequential tool, uses stale review UI, or retries with a different contract while a prior greenlight is consumed—Handshake records refusal/proof gap only on paths that reach the wrapped dispatcher.

**Safe modification:** Add each new family through registry + family schemas + bypass probes + architecture tests together. Never infer containment from transcript summaries or activation proof packets.

### Receipt and evidence theatre

**Distinct evidence types that must not collapse:**

1. **Gateway check** — verified binding to exact greenlight and contract digest (`src/protocol/areas/gateway-gate/`)
2. **Downstream execution** — observed mutation result; may be unknown/suspect (`src/protocol/areas/receipt-export/`, proof-gap paths)
3. **Readback/projection** — assembled for humans/agents (`src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/store-reader.ts`)
4. **Terminal certificate** — signed terminal evidence only; not permission (`src/protocol/areas/authority-certificate/`)
5. **Proof packet** — distribution/activation/containment readback with explicit `authorityBoundary.createsAuthority: false`

**Theatre patterns to refuse:**

- Service workflow handle or A2A agreement acceptance displayed as if it were a receipt (`readbackBoundary: "admission_readback_is_not_receipt_evidence"` in `src/surfaces/service-workflow-admission/index.ts`)
- Live x402 paid retry packet with `status: "blocked"` presented as successful payment (`src/surfaces/proof-packets/live-x402/paid-retry.ts`, `scripts/check-live-x402-paid-retry.mjs --expect-status blocked`)
- Clean-installed activation with `downstreamOutcomeStatus: "pending"` presented as end-to-end proof (`test/architecture/proof-packets.test.ts`)
- Auth.md + x402 interlock packet with `readyForCompositeExecution: false` presented as composite execution readiness (`src/adapters/auth-md-x402-interlock/packet.ts`, `scripts/check-auth-md-x402-admission-packet.mjs --expect-status packet_clear`)
- MCP doctor passing stdio config check presented as gateway-checked mutation (`test/architecture/proof-packets.test.ts` mcpDoctor block)

**Safe modification:** Every projector must keep gateway check, downstream outcome, and terminal certificate fields separable in schema and tests. Prefer `proof_gap` over smoothing missing evidence.

### Hosted admission boundaries

**What hosted admission proves (pre-hosted gates, `docs/internal/decisions.md` Hosted Admission Lock):**

- Non-authority service workflow schemas and principal-agent link lifecycle (`test/architecture/workflow-admission-boundary.test.ts`)
- Provider-neutral verifier adapters and redacted `TransitionCallerIdentity` (`src/hosted-admission/hosted-verifier-adapter.ts`, `test/http/hosted-identity-evidence.test.ts`)
- Tenant/org/project/workspace scope checks and raw-read audit fail-closed posture (`src/http/handlers/hosted-record-scope.ts`, `src/http/handlers/raw-read-audit.ts`)
- Package subpaths `./hosted-admission` and `./surfaces/service-workflow-admission` without HTTP internals (`src/hosted-admission/LANE.md`)

**What hosted admission does not prove:**

- Deployed hosted operation, live provider/customer custody, settlement/finality
- Hosted retention, search, or mutation authority
- Cross-org trust, marketplace certification, aggregate spend enforcement
- Automatic project/workspace narrowing when stored records omit those fields (`src/http/handlers/hosted-record-scope.ts`)

**Duplication boundary:** `src/http/admission/` re-exports `src/hosted-admission/` for HTTP wiring; package consumers must use `handshake-protocol-kernel/hosted-admission`, not HTTP internals (`test/product/hosted-package-consumer.test.ts`).

**Safe modification:** Extend hosted paths only with object-specific redacted projections from `src/protocol/areas/object-registry/index.ts`. Keep generic raw reads internal; require audit sink in promoted modes.

---

## Tech Debt

**Runtime ingress public surface is narrower than its generic name suggests:**
- Issue: `src/runtime/ingress/index.ts` exposes runtime ingress API that compiles caller-supplied execution traces into proposal-only evidence, but `src/runtime/ingress/registry.ts` registers only three families.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/ingress/families.ts`, `src/runtime/ingress/registry.ts`, `test/runtime/runtime-ingress.test.ts`
- Impact: Callers can mistake runtime ingress for broad host/tool interception. Source records/refuses observed traces; it does not prove every raw sibling host path, browser tool, shell call, network call, or MCP operation is intercepted.
- Safe modification: Add each new consequential family through registry, family schemas, action proposal code, and refusal evidence together.
- Test/proof gap: Extend `test/runtime/runtime-ingress.test.ts` for each family with ambiguous dispatch, dynamic dispatch, late-bound dispatch, raw sibling bypass, and mixed-envelope cases.

**Boundary manifest lags new CLI and package export surfaces:**
- Issue: `src/surfaces/boundary-manifest.ts` lists fixed `sourceRoots` for `cli.operator` and `cli.evidence` but omits newer command implementations: `src/cli/host/doctor.ts`, `src/cli/mcp/doctor.ts`, `src/cli/quality/report.ts`, `src/cli/state/inspect.ts`, `src/cli/simulate/x402-payment.ts`, `src/cli/demo/x402.ts`, `src/cli/quickstart/x402.ts`, `src/cli/x402/readiness.ts`. Package exports `./surfaces/service-workflow-admission` and `./surfaces/a2a-negotiation-readback` have no dedicated manifest surface IDs.
- Files: `src/surfaces/boundary-manifest.ts`, `src/cli/command-manifest.ts`, `package.json`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`
- Impact: `existingSurfaceFiles()` in surface-boundary tests skips files not listed in `sourceRoots`, so forbidden-import and credential-shape enforcement does not apply to new CLI modules. New package subpaths can ship without explicit claim-boundary rows.
- Safe modification: Add manifest entries or extend `sourceRoots` before exposing commands/exports. Prefer automated export-to-manifest coverage over hardcoded surface ID lists.
- Test/proof gap: Map `package.json` `exports` and all `cliCommandManifest` handler files to boundary-manifest coverage.

**A2A negotiation support surfaces lack boundary-manifest registration:**
- Issue: `src/surfaces/a2a-negotiation-support/` (ingress admission, normalizer, move compiler, obligation binder, adapter transcript) and `src/surfaces/a2a-negotiation-readback/` are product surfaces with product tests but not listed in `surfaceIds` or `expectedSurfaceIds` in `test/architecture/surface-boundary-posture.test.ts`.
- Files: `src/surfaces/a2a-negotiation-support/`, `src/surfaces/a2a-negotiation-readback/index.ts`, `test/product/a2a-*.test.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`
- Impact: A2A ingress/readback can drift toward authority language (agreement = permission) without the same import/output posture enforcement applied to MCP/CLI/SDK surfaces. Protocol negotiation area remains isolated (`test/architecture/negotiation-no-authority-surface.test.ts`) but surfaces layer is not in that test's downstream roots.
- Safe modification: Add manifest surface(s) with explicit non-authority flags matching `A2ANegotiationIngressAdmissionAuthorityBoundarySchema` and A2A readback `AuthorityBoundarySchema`.
- Test/proof gap: Extend architecture tests to cover `src/surfaces/a2a-negotiation-support` and package export `./surfaces/a2a-negotiation-readback`.

**Product closeout gates duplicate source projection logic in script validators:**
- Issue: `scripts/check-product-completion.mjs` manually validates proof-packet/readback shapes overlapping with `src/surfaces/proof-packets/product-completion.ts`.
- Files: `scripts/check-product-completion.mjs`, `src/surfaces/proof-packets/product-completion.ts`, `package.json`, `test/architecture/proof-packets.test.ts`, `test/architecture/product-closeout-bundle.test.ts`
- Impact: Closeout logic can drift between script and projector; blocked status can be misread as product readiness.
- Safe modification: Change projector schema, script validation, and architecture tests in the same patch.
- Test/proof gap: `package.json` `pack:check` expects `check-product-completion --expect-status incomplete` until all required proof surfaces bind.

**MCP x402 proposal schema duplicates runtime and adapter x402 shape:**
- Issue: `src/mcp/x402-proposal.ts` mirrors x402 action proposal and runtime ingress fields.
- Files: `src/mcp/x402-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/runtime/ingress/index.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/mcp/mcp-schema-contract.test.ts`
- Impact: MCP can accept shapes runtime rejects, producing proposal evidence that fails exact payment requirement binding at gateway time.
- Safe modification: Extract shared schema fragments or add parity tests compiling MCP inputs through runtime ingress and action proposal paths.

**Large orchestration and projector files concentrate authority-sensitive logic:**
- Issue: High line counts in proof packet projectors, runtime ingress, x402 proposal, protocol transitions, and evidence projections.
- Files: `src/protocol/evidence-projections/projections.ts`, `src/surfaces/proof-packets/product-completion.ts`, `src/mcp/x402-proposal.ts`, `src/surfaces/proof-packets/host-generated-code-containment.ts`, `src/runtime/ingress/index.ts`, `test/architecture/proof-packets.test.ts`
- Impact: Authority language blur—reviewers can miss paths upgrading proposal/readback into implied greenlight, gateway check, or receipt.
- Safe modification: Split by owned protocol concept per `STRUCTURE.md` folder rules.

---

## Known Bugs

**No confirmed source-level runtime defect detected in this mapping pass:**
- Symptoms: Several hard blocks and incomplete gates are expected outcomes, not bugs.
- Files: `package.json`, `scripts/check-product-completion.mjs`, `scripts/check-host-generated-code-containment.mjs`, `scripts/check-live-x402-paid-retry.mjs`, `src/surfaces/product-launch-gate-resolution.ts`
- Trigger: `pack:check` expects incomplete product completion, blocked host containment, blocked live paid retry, and blocked distribution launch gate (`test/architecture/product-launch-gate-resolution.test.ts`).
- Workaround: Treat blocked readbacks as proof gaps, not successful live execution or terminal authority.
- Safe modification: Convert blockers only by adding source-owned positive evidence and tightening gates—not by weakening expected status.

**Raw record read scope depends on payload fields for project/workspace narrowing:**
- Symptoms: `src/http/handlers/hosted-record-scope.ts` narrows project/workspace access only when stored record payload contains `projectId` or `workspaceId`.
- Files: `src/http/handlers/internal-record-read.ts`, `src/http/handlers/hosted-record-scope.ts`, `src/http/handlers/raw-read-audit.ts`, `src/protocol/areas/object-registry/index.ts`, `test/http/http.test.ts`
- Trigger: Hosted raw read against `audit_read` object with tenant/org scope but no project/workspace fields may be visible at tenant/org scope.
- Safe modification: Prefer object-specific redacted projections; require each `audit_read` type to declare mandatory scope fields.
- Test/proof gap: Matrix over `protocolObjectRegistry` `audit_read` types for hosted scope with and without project/workspace fields.

---

## Security Considerations

**Host-generated-code containment is a blocked proof surface, not a host-wide guarantee:**
- Risk: Treating profile transcript or summary as host-wide containment lets generated code escape the contract boundary.
- Files: `src/surfaces/proof-packets/host-generated-code-containment.ts`, `scripts/build-host-generated-code-containment-transcript.mjs`, `scripts/check-host-generated-code-containment.mjs`
- Current mitigation: Proof packet records gaps for missing live host activation, transcript digest, exact contract binding, dispatch interception, raw sibling refusal, dynamic dispatch refusal, truncated graph refusal.
- Recommendations: Keep `--expect-status blocked` until live adapter transcript evidence exists.

**Credential custody and redaction are typed hygiene, not provider-grade secret lifecycle proof:**
- Risk: `CredentialSafeStringSchema` rejects known secret patterns; unknown provider formats can evade fixed classifiers.
- Files: `src/protocol/areas/credential-custody/schemas.ts`, `src/adapters/auth-md-x402-interlock/packet.ts`, `test/protocol/credential-custody.test.ts`
- Current mitigation: Schemas require `secretMaterialIncluded: false`, gateway credential refs, redacted resolution evidence.
- Recommendations: Provider-specific custody adapters and fuzz corpora before live custody claims.

**Generic hosted raw reads are audit-sensitive and must not become customer search:**
- Risk: `src/http/handlers/internal-record-read.ts` can return raw protocol records when posture permits.
- Files: `src/http/handlers/internal-record-read.ts`, `src/http/handlers/raw-read-audit.ts`, `src/http/admission/index.ts`, `src/hosted-admission/hosted-admission-config.ts`
- Current mitigation: Route absent from normal OpenAPI; fails closed without raw-read audit sink in hosted preview/production modes; 404 posture for missing/unauthorized records.
- Recommendations: Build narrowly scoped redacted projection endpoints for service-facing readback.

**Surface boundary manifest can lag newly exported or routed product surfaces:**
- Risk: Hand-maintained `src/surfaces/boundary-manifest.ts` may not cover new exports, CLI routes, A2A surfaces, or hosted flows.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/claim-boundary.test.ts`
- Current mitigation: Architecture tests assert known surface IDs, forbidden route families, import boundaries, claim-boundary labels.
- Recommendations: Every new export/route/command requires manifest update before merge.

**SDK repair explanations are local projections, not recovery authority:**
- Risk: `src/sdk/repair.ts` `explainHandshakeError()` could be misused to justify retry without a fresh action contract.
- Files: `src/sdk/repair.ts`, `src/protocol/foundation/reason-code-remediation/index.ts`
- Current mitigation: Hard-coded `authorityCreatedByRepair: false`, `requiresNewContract` from remediations, `repairBoundary: "local_reason_code_projection"`.
- Recommendations: Keep repair out of gateway/signing paths; CLI forbids mutation-shaped command terms including "repair" and "gateway check" in names (`test/architecture/cli-command-posture.test.ts`).

---

## Performance Bottlenecks

**D1 conflict classification relies on post-error reads and constraint-triggered failures:**
- Problem: `src/storage/d1/index.ts` classifies batch conflicts by follow-up reads; `src/storage/d1/statements.ts` uses intentional NOT NULL violations for digest mismatch.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Improvement path: Add fault-injection tests for ambiguous D1/network errors so callers record proof gaps instead of assuming success.
- Test/proof gap: No coverage for ambiguous D1 transport failure or error message drift.

**Large proof/readback tests are slow to review and easy to under-run selectively:**
- Problem: `test/architecture/proof-packets.test.ts`, `test/http/http.test.ts`, `test/runtime/runtime-ingress.test.ts` carry many independent authority assertions.
- Improvement path: Split by primitive only if `npm run check:repo` and `npm run quality:architecture` still execute all cases.

---

## Fragile Areas

**Live x402 paid retry readback exists while wallet gateway execution remains local/reference only:**
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/surfaces/proof-packets/live-x402/paid-retry.ts`, `scripts/check-live-x402-paid-retry.mjs`
- Why fragile: `assertSandboxProviderEnvironment()` requires `providerEnvironmentPosture === "local_reference_sandbox"`. Live paid retry packet is readback scaffolding, not signer execution.
- Safe modification: Separate customer-gateway live adapter with custody proof, post-gateway signer invocation, one-use greenlight consumption, live retry response, terminal readback.
- Test coverage: Wallet gateway tests cover local/reference; funded customer-gateway live retry fixture missing.

**One-use greenlight and exact gateway check binding depend on storage atomicity:**
- Files: `src/storage/d1/index.ts`, `src/storage/memory/index.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Why fragile: Duplicate consume, idempotency mismatch, or receipt-index conflict corrupts reconstruction.
- Safe modification: Keep memory and D1 behaviorally aligned through shared atomicity tests. KV is cache-only for isolation/envelope snapshots.

**Product launch gates encode blocked external claims in source:**
- Files: `src/surfaces/product-launch-gate-resolution.ts`, `test/architecture/product-launch-gate-resolution.test.ts`, `docs/internal/decisions.md`
- Why fragile: Distribution gate blocked on npm version/export mismatch and MCP Registry 404; live external x402 gate blocked on missing funded customer-gateway signer and live signed retry. Narrative docs can outpace these resolved blockers.
- Safe modification: Update `productLaunchGateResolutions` evidence when external state changes; do not weaken `nonClaims` arrays.

**Package/public distribution state is a proof packet, not authority:**
- Files: `src/surfaces/proof-packets/product-completion.ts`, `docs/internal/decisions.md`, `package.json`
- Why fragile: Public npm availability and MCP Registry discoverability confused with execution authority.
- Safe modification: Keep distribution proof separate from policy, greenlight, gateway check, mutation, receipt, terminal certificate.

**A2A negotiated x402 room is local/reference readback only:**
- Files: `examples/a2a-negotiated-x402-room/`, `src/surfaces/a2a-negotiation-readback/index.ts`, `test/product/a2a-negotiated-x402-room.test.ts`
- Why fragile: Agreement evidence binds one obligation to one exact contract, but agreement acceptance does not substitute for gateway check (`gatewayCheckRemainsFinalEnforcementPoint: true` in readback schema).
- Safe modification: Keep non-claims for marketplace, escrow, settlement, cross-org trust, native host containment explicit in readback output.

---

## Scaling Limits

**Runtime family scaling is registry-heavy and must stay explicit:**
- Current capacity: Three registered runtime ingress families in `src/runtime/ingress/registry.ts`.
- Limit: New protected-action types increase duplicated schemas, refusal reasons, classifiers, and tests unless common scaffolding is extracted without weakening exact contracts.
- Scaling path: Shared family scaffolding only after two or more families need identical dispatch/bypass/refusal patterns.
- Files: `src/runtime/ingress/registry.ts`, `src/runtime/ingress/families.ts`, `test/runtime/runtime-ingress.test.ts`

**Hosted operation remains outside the current kernel claim:**
- Current capacity: Hosted admission modules, identity evidence, raw-read controls exist as source and tests.
- Limit: Hosted provider custody, settlement, marketplace, cross-org trust, aggregate spend, retention/search not closed.
- Scaling path: Separate hosted workspace with fresh proof gates per `docs/internal/decisions.md` Hosted Admission Lock.
- Files: `src/hosted-admission/`, `src/http/admission/`, `docs/internal/decisions.md`

**Protocol object registry grows faster than hosted read models:**
- Current capacity: `src/protocol/areas/object-registry/index.ts` classifies internal-only, audit read, public read, externalizable.
- Limit: New protocol objects reconstructable internally without safe hosted projection.
- Scaling path: Every new object type declares storage posture, hosted read posture, redaction, receipt/proof-gap relationship.

---

## Dependencies at Risk

**Cloudflare D1 and KV semantics are authority-adjacent:**
- Risk: D1 batch/constraint semantics are durable protocol-store contract; KV must not become authoritative for greenlights or gateway checks.
- Files: `src/storage/d1/index.ts`, `src/storage/kv/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/storage/kv-isolation-cache.test.ts`

**x402 SDK/payment requirement behavior is pinned to exact local/reference posture:**
- Risk: SDK drift while source only claims local/reference buyer-side proof; live settlement/finality overclaim if SDK output treated as terminal execution proof.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/surfaces/proof-packets/live-x402/`

**MCP Registry and public npm are distribution dependencies, not control-plane authority:**
- Risk: Registry acceptance and npm latest version change outside kernel; must not wire into policy/greenlight decisions.
- Files: `src/surfaces/proof-packets/product-completion.ts`, `src/surfaces/product-launch-gate-resolution.ts`, `scripts/check-product-completion.mjs`

---

## Missing Critical Features

**Customer-gateway live x402 paid retry proof:**
- Problem: Local/reference x402 proof exists; live buyer-side paid retry requires customer custody, one-use greenlight consumption, verified gateway check, post-gateway signer, payment material digests, live retry response, terminal readback.
- Blocks: Live paid execution claims, customer gateway custody claims, product completion.
- Files: `src/surfaces/proof-packets/live-x402/paid-retry.ts`, `scripts/check-live-x402-paid-retry.mjs`, `src/adapters/x402-payment/wallet-gateway.ts`

**Provider-grade credential custody lifecycle:**
- Problem: Redacted credential references modeled; provider vault integration, signer lease/rotation/revocation not proven.
- Blocks: Hosted provider custody, live customer gateway operation.
- Files: `src/protocol/areas/credential-custody/`, `src/adapters/auth-md/profiles.ts`

**Host-wide generated-code containment:**
- Problem: Containment proof covers named runtime adapter evidence, not every mutation-capable host path.
- Blocks: Claims that generated code cannot bypass Handshake across whole host runtime, IDE, shell, browser, CI, MCP environment.
- Files: `src/surfaces/proof-packets/host-generated-code-containment.ts`, `scripts/check-host-generated-code-containment.mjs`

**Hosted service readback model:**
- Problem: Hosted admission and raw-read controls exist; customer-safe hosted readback/search/retention incomplete.
- Blocks: Hosted operation, customer support workflows, org audit search.
- Files: `src/hosted-admission/`, `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/index.ts`

**Current-surface distribution proof:**
- Problem: npm latest missing current local exports (`./hosted-admission`, `./surfaces/service-workflow-admission`); MCP Registry submission not accepted.
- Blocks: Product completion and public distribution claims per `productLaunchGateResolutionFor("distribution_bar")`.
- Files: `src/surfaces/product-launch-gate-resolution.ts`, `scripts/check-product-completion.mjs`, `package.json`

**Auth.md + x402 composite execution (expansion candidate, not current product):**
- Problem: Interlock packet clears provenance readback with `readyForCompositeExecution: false`; expansion gate requires exact contract, policy, one-use greenlight, gateway check before composite claims.
- Blocks: Composite auth.md + x402 execution marketing until separate proof gate passes.
- Files: `src/adapters/auth-md-x402-interlock/packet.ts`, `test/architecture/auth-md-x402-interlock-packet.test.ts`, `src/surfaces/product-launch-gate-resolution.ts`

---

## Test Coverage Gaps

**Runtime ingress host-interception coverage:**
- What's not tested: Live host interception across shell, browser, MCP, package manager, cloud API, dynamic generated-code dispatch outside registered families.
- Files: `src/runtime/ingress/`, `src/surfaces/proof-packets/host-generated-code-containment.ts`, `test/runtime/runtime-ingress.test.ts`
- Risk: Runtime evidence mistaken for gateway enforcement or host-wide containment.
- Priority: High

**Boundary manifest coverage for exports, CLI handlers, and A2A surfaces:**
- What's not tested: Automatic mapping of `package.json` exports, all CLI handler files, and `src/surfaces/a2a-negotiation-support/` to boundary-manifest posture.
- Files: `src/surfaces/boundary-manifest.ts`, `src/cli/command-manifest.ts`, `package.json`, `test/architecture/surface-boundary-posture.test.ts`
- Risk: New surfaces ship without explicit proposal/evidence/readback versus authority posture.
- Priority: High

**Credential and payment material redaction fuzzing:**
- What's not tested: Unknown credential names, encoded secret variants, provider-specific payment material, transcript redaction corpus.
- Files: `src/protocol/areas/credential-custody/schemas.ts`, `src/adapters/auth-md-x402-interlock/packet.ts`, `test/protocol/credential-custody.test.ts`
- Risk: Raw material enters evidence/readback while schemas pass known-pattern tests.
- Priority: High

**D1 ambiguous failure and migration drift:**
- What's not tested: Ambiguous D1 transport failure, changed SQLite/D1 error messages, partial outage during authority-sensitive writes.
- Files: `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Risk: Storage errors misclassified; greenlight/gateway/receipt state unreconstructable.
- Priority: High

**Hosted raw-read object matrix:**
- What's not tested: Every `audit_read` object type under hosted identity, purpose, expiry, tenant/org, project/workspace, hidden-object, audit-sink conditions.
- Files: `src/protocol/areas/object-registry/index.ts`, `src/http/handlers/internal-record-read.ts`, `src/http/handlers/hosted-record-scope.ts`
- Risk: Hosted raw reads leak broader tenant/org records or internal protocol evidence.
- Priority: High

**MCP x402 schema parity:**
- What's not tested: MCP x402 proposal parity against runtime ingress and x402 action proposal across valid inputs, refusal inputs, binding mismatches.
- Files: `src/mcp/x402-proposal.ts`, `src/runtime/ingress/index.ts`, `src/adapters/x402-payment/action-proposal.ts`
- Risk: MCP diverges from exact action-contract canonicalization.
- Priority: Medium

**A2A surface authority posture architecture tests:**
- What's not tested: Architecture-level import/output posture for `src/surfaces/a2a-negotiation-support/` and exported `./surfaces/a2a-negotiation-readback` (product tests exist in `test/product/a2a-*.test.ts` only).
- Files: `src/surfaces/a2a-negotiation-support/`, `src/surfaces/a2a-negotiation-readback/index.ts`, `test/architecture/negotiation-no-authority-surface.test.ts`
- Risk: A2A ingress/readback treated as negotiation authority or agreement-as-permission.
- Priority: Medium

**Evidence projection store reader batching:**
- What's not tested: `RECEIPT_TIMELINE_EVENT_BATCH_SIZE = 100` boundary behavior for large receipt timelines in `src/protocol/evidence-projections/store-reader.ts`.
- Risk: Incomplete timeline readback presented as full reconstruction evidence.
- Priority: Low

---

*Concerns audit: 2026-05-28*
