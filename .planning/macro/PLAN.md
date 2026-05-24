# Plan

## Goal

Invariant at stake: no x402 proposal surface may create a cleaner contract than the protected path actually observed, and no evidence surface may imply authority, custody, settlement, hosted operation, broad interception, or aggregate spend enforcement that the gateway does not enforce.

Eliminate the current codebase concerns by strengthening source mechanisms, regression tests, and closeout gates. The plan preserves the Tier 1 kernel as stable protocol meaning, strengthens Tier 2 surfaces around it, keeps runtime/MCP/CLI proposal or evidence only, and keeps x402 as the exact buyer-side first wedge unless future work is explicitly cut.

## Non-Goals

- Do not redesign Tier 1 protocol primitives, state machines, canonicalization, or receipt meaning.
- Do not move policy decisions, greenlights, gateway checks, mutation attempts, receipts, receipt export, signer custody, or authority certificate minting into runtime, MCP, CLI, demos, or review output.
- Do not implement an aggregate spend reservation ledger in this macro.
- Do not claim provider/customer custody, live provider operation, hosted verifier, JWKS/revocation, marketplace, certification, or clearing-house readiness.
- Do not claim seller middleware, facilitator operation, settlement finality, signed offers, signed receipts, `upto`, batch settlement, lifecycle hooks, or MCP auto-pay.
- Do not claim broad host interception across browser, shell, package manager, cloud API, network, database, repo, sibling MCP, or unwrapped tools.
- Do not treat `.planning/` as canon or close concerns through documentation-only edits.
- Do not claim npm or MCP Registry publication; package validation stops at source-owned build, pack, and entrypoint smoke gates.

## Source Boundary

Canonical repo truth remains `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`. `.planning/` is scratch and may guide implementation only when reconciled against source and tests.

This plan was synthesized from:

- `.planning/macro/runs/concerns-elimination-20260524T044836Z/input.md`
- raw STRATEGY, ARCH, EXECUTION, RISK, and ADOPTION perspective outputs for the same run
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/plan-contract.md`
- `.planning/codebase/CONCERNS.md`
- narrow source checks of the named runtime, MCP, x402 adapter, sandbox, projection, lane, package, and test files

The dirty worktree listed in the input packet is current state, not validated closure and not something this plan assumes should be reverted.

## Current State

The nearest proven bug is runtime x402 posture loss. `RuntimeIngressObservedDispatchSchema` accepts `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`, but `x402PaymentAttemptForDispatch()` forwards only `intendedRequestBodyDigest` and `selectedHeadersDigest`. `X402PaymentAttemptSchema` then defaults missing posture to `no_body` and `local_reference_sandbox`, which can turn observed unsupported, omitted, external, live, or unknown posture into a contractable local-reference attempt.

The MCP x402 proposal schema currently lacks `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`. `x402Parameters()` and `deriveMcpX402IdempotencyKey()` therefore cannot bind the same request/body/provider boundary as the direct adapter path. MCP is still proposal/evidence only, but its proposal shape can teach weaker semantics.

The x402 sandbox is a local/reference fixture. It can emit official-shaped payment-required evidence and observe one signed retry after gateway-created signature evidence. Existing fields such as `authorityCreated: false` are necessary but not enough to prevent seller middleware, facilitator settlement, or payment-finality overread.

Runtime ingress is still a monolithic cross-family module. That is a real maintainability risk, but refactoring it before the posture bug is fixed can preserve the bug behind a cleaner abstraction.

Spend session/day/review controls are metadata only. Signer custody is local/reference or fixture-gateway evidence only. Runtime/MCP bypass evidence is scoped observed evidence only. Evidence projections and D1 reads are good local diagnostic proof, not hosted evidence-scale proof. Package surfaces are publishable only after build/pack gates.

## Target State

Runtime x402 dispatches either bind exact observed body/provider posture into the resulting candidate parameters and idempotency material or refuse before any action contract is proposed. Refusals preserve runtime/graph evidence where possible, but create no authority-bearing records.

MCP x402 proposals require explicit request-body and provider-environment posture. Accepted MCP proposals bind the posture fields into parameters, non-secret summaries, tool-call drafts, compile-intent candidate material, and idempotency derivation. Unsupported, omitted, external, live, or unknown posture returns structured non-authority refusal or schema failure before runtime-client contract proposal.

Sandbox challenge and signed-retry evidence carries an explicit local/reference downstream-fixture boundary. Signed retry evidence is post-gate observation only, with no seller middleware, facilitator operation, settlement finality, provider custody, or authority claim.

Runtime family proposal code sits behind a source-owned family registry after the hotfix, so new families cannot silently drop refusal-critical fields. The registry remains proposal-only and cannot import or issue policy, greenlight, gateway, mutation, receipt, storage, signer, or certificate authority.

Future surfaces are guarded by source-owned conformance, claim, package, and architecture tests. Ledger, live custody, hosted verifier, host-wide interception, seller/facilitator operation, registry publication, and broader x402 compatibility stay explicit cuts until separate phases implement them fully.

## Assumptions

- No user-owned decision blocks implementation of runtime posture propagation, MCP posture parity, sandbox evidence boundaries, registry hardening, and cut-line guards.
- The current dirty files are live worktree state to validate, not a baseline to revert.
- Existing Tier 1 primitives and reason-code registry can represent these refusals without introducing new kernel concepts.
- MCP schema strictness can require explicit posture fields; omitted posture is not silently normalized to safe local posture.
- Aggregate spend controls remain metadata until a real reservation ledger is designed and implemented.
- Provider/customer custody, hosted verifier, and host-wide interception cannot be validated from current source and must remain future cuts.

## Decisions

- Fix the runtime posture propagation defect first, before runtime registry extraction.
- Reuse direct adapter x402 refusal semantics for runtime and MCP parity; do not fork a weaker MCP-specific contract model.
- Require explicit MCP request-body and provider-environment posture fields. Missing posture is schema-invalid or structured pre-contract refusal, never silent local-reference defaulting.
- Add posture fields to x402 idempotency material so equivalent-looking contracts cannot hide different body/provider posture.
- Treat the local x402 sandbox as downstream local/reference fixture evidence only.
- Extract runtime ingress family adapters only after the posture hotfix is covered by tests.
- Keep spend windows, custody, hosted verifier, host interception, facilitator/seller middleware, and publication as cut/future items with guards, not partial implementation inside this macro.

## Phases

Phase 1: Runtime x402 posture propagation and refusal boundary.

Implement failing tests first in `test/runtime/runtime-ingress.test.ts` and `test/adapters/x402-payment-action-proposal.test.ts`. Patch `src/runtime/ingress/index.ts` so `x402PaymentAttemptForDispatch()` forwards `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`. Patch `src/adapters/x402-payment/action-proposal.ts` so direct x402 idempotency material includes request-body posture, provider-environment posture, and provider-environment ref. If runtime currently throws before recording refusal, add a narrow source-owned preflight/refusal helper so unsupported posture becomes `one_or_more_dispatches_refused` without an action contract.

Acceptance:

- Unsupported/omitted body posture and external/live/unknown provider posture refuse before action-contract proposal.
- Digest-bound local-reference posture binds posture, body digest, provider posture/ref, selected headers digest, and official evidence fields into candidate parameters.
- Refused runtime cases create no policy decision, greenlight, gateway check, mutation attempt, receipt, receipt export, or authority certificate.

Phase 2: MCP x402 posture parity while staying proposal/evidence only.

Patch `src/mcp/x402-proposal.ts` to require `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and nullable `providerEnvironmentRef`. Add MCP-local pre-contract refusal or schema failure for omitted, unsupported, external, live, and unknown posture before runtime-client proposal calls. Bind accepted posture fields into `x402Parameters()`, tool-call draft parameters, non-secret summaries, compile-intent candidate parameters, and `deriveMcpX402IdempotencyKey()`. Update MCP schema fixtures, reference transcript, stdio process smoke, and `scripts/check-published-entrypoints.mjs`.

Acceptance:

- MCP cannot propose a weaker x402 contract than the direct adapter/runtime path.
- MCP outputs retain `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, `mutationAttempted: false`, `receiptExportCreated: false`, and `authorityCertificateMinted: false`.
- MCP imports remain inside the lane boundary and do not pull adapter, wallet, signer, storage, policy, gateway, receipt, all-role SDK, or certificate authority code.

Phase 3: Local sandbox evidence boundary.

Patch `src/adapters/x402-payment/sandbox-http.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/protocol/evidence-projections/projections.ts`, and the x402 demo/report tests so challenge and signed-retry outputs carry an explicit evidence boundary: local/reference fixture scope, post-gate signed retry observation, not settlement finality, not seller middleware, not facilitator operation, not provider custody, and not authority. Keep signed retry recording gated on gateway-created signature evidence, local-reference provider posture, and non-ambiguous body posture.

Acceptance:

- Sandbox challenge and retry evidence cannot be serialized as settlement, seller middleware, facilitator operation, provider custody, or authority.
- Replay, missing signature evidence, wrong signature header, non-reference provider posture, and ambiguous body posture do not increment signed retry counts.
- Demo reports keep `x402_paid_http_call.exact` as buyer-readable proof-object language only, not an action catalog entry.

Phase 4: Runtime ingress registry/refactor hardening.

After Phase 1 passes, extract runtime family conversion into a source-owned registry under `src/runtime/ingress/` while preserving `proposeRuntimeIngressActionContracts()` behavior. The registry should own per-family dispatch coverage, config requirements, compile-input construction, preflight refusal reason codes, signing secret selection, grammar version, and raw-bypass reason codes. It must not own authority.

Acceptance:

- Package install, auth.md protected API call, and x402 runtime cases pass unchanged through the registry.
- Every supported dispatch kind maps to exactly one family adapter.
- Missing family config fails closed.
- Architecture tests forbid registry imports of policy, greenlight, gateway, storage implementation, mutation, receipt, signer, or certificate authority code.

Phase 5: x402 cut-line guards for spend, custody, host bypass, and future surfaces.

Patch conformance, install proposal, bypass probe, demo, and claim tests so unsupported x402 surfaces remain explicit source-owned cuts. Keep session/day/review bounds under `spendWindowEnforcementStatus: "not_enforced_local_metadata"`. Distinguish fixture gateway custody from provider/customer custody. Keep runtime/MCP bypass posture scoped and non-host-wide.

Acceptance:

- `upto`, batch settlement, lifecycle hooks, MCP auto-pay, signed offers, signed receipts, seller middleware, facilitator operation, aggregate spend ledger, live custody, hosted verifier, host-wide interception, and registry publication are classified as unsupported/future unless separate source mechanisms exist.
- Spend-window metadata never enters action-contract bounds as enforced aggregate control.
- Claims tests fail on broader x402 compatibility, custody, hosted, settlement, host-wide interception, or aggregate-spend enforcement language.

Phase 6: Evidence projection scale and redaction mechanisms.

Patch `src/protocol/store/port.ts`, memory/D1 storage, `migrations/0001_protocol_kernel.sql`, `src/protocol/evidence-projections/assembly.ts`, and `src/protocol/evidence-projections/projections.ts` only to the extent needed for source-owned scale/redaction concerns. Add contract/action/run-scoped store reads and batched stream-event range reads before any hosted evidence-scale claim. Strengthen projection redaction toward typed allowlists and deny-by-default handling for credential-shaped provider refs.

Acceptance:

- Projection assembly no longer depends on broad tenant/org scans for contract-scoped envelopes once hosted-scale language is allowed.
- D1 and memory store contracts remain equivalent.
- Provider-format fuzz tests prove raw signer refs, `PaymentPayload`, `PAYMENT-SIGNATURE`, bearer tokens, vault paths, secret refs, facilitator secrets, and auth.md credential material do not project.

Phase 7: Package, `.planning`, demo, and closeout gates.

Update package smoke fixtures and architecture guards after source behavior stabilizes. Keep `.planning/` out of package files, exports, scripts, CI names, README command sections, and canonical docs except as scratch-boundary language. Regenerate demo outputs only after source and tests pass. Run package and full-repo gates before calling concerns closed.

Acceptance:

- `npm run pack:check` proves build output, package files, and published entrypoint smoke match the final source schema.
- `npm run quality:claims` and `npm run quality:architecture` fail on claim broadening or lane-boundary drift.
- `npm run check:repo` passes on the worktree intended for closeout.

## Task Graph

```text
macro-001 -> macro-002 -> macro-003 -> macro-004
macro-004 -> macro-005 -> macro-006 -> macro-007
macro-004 -> macro-008 -> macro-009 -> macro-010
macro-004 -> macro-011 -> macro-012 -> macro-013
macro-004 -> macro-014 -> macro-015
macro-010 -> macro-016 -> macro-017
macro-007 -> macro-018
macro-015 -> macro-019
macro-013 -> macro-019
macro-017 -> macro-019
macro-018 -> macro-019
```

Critical path: runtime posture failing tests, runtime propagation/refusal, direct idempotency binding, focused runtime gate, MCP schema/parity, MCP smoke/package fixture update, package/planning drift gate, full closeout.

Parallel work after Phase 1 stabilizes: sandbox evidence boundary, x402 future-surface cut-line guards, evidence redaction/scale tests, and runtime registry test scaffolding.

## Risks And Mitigations

- P0: Runtime defaulting can create a weaker contract than observed. Mitigation: forward posture fields and refuse unsupported/live/unknown before action contract; gate with runtime and adapter tests.
- P0: MCP can teach weaker x402 semantics. Mitigation: strict posture schema, MCP preflight refusal, idempotency binding, stdio/package smoke updates, and MCP lane architecture tests.
- P0: Sandbox evidence can be overread as settlement or facilitator operation. Mitigation: explicit typed local/reference evidence boundary, projection labels, product tests, and claim gates.
- P0: Signer custody can leak into runtime/MCP/CLI or become a live custody claim. Mitigation: forbidden import/export tests, redaction tests, fixture-vs-live custody labels, and future custody cut.
- P1: Registry refactor can preserve the same posture bug. Mitigation: sequence refactor after focused runtime gate and require per-family parity tests.
- P1: Spend-window metadata can become fake aggregate enforcement. Mitigation: keep metadata label visible and fail claims until a real ledger exists.
- P1: Projection redaction can miss provider credential formats. Mitigation: typed allowlist direction plus fuzz fixtures.
- P1: Package artifacts can drift from dirty source. Mitigation: `pack:check` and published entrypoint smoke are closeout gates.
- P2: `.planning` scratch can become canon. Mitigation: package/architecture/claim guards and source-boundary language.

## Validation Gates

Focused runtime posture gate:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/adapters/x402-payment-action-proposal.test.ts
npm run check:types
```

Focused MCP posture gate:

```bash
npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts test/architecture/mcp-surface-posture.test.ts
npm run check:types
```

Sandbox and x402 boundary gate:

```bash
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts test/conformance/x402-payment-conformance.test.ts test/conformance/x402-upstream-exact-fixtures.test.ts test/product/x402-protected-spend-demo-report.test.ts test/architecture/claim-boundary.test.ts
npm run demo:aps
```

Runtime registry gate:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/runtime/package-install-runtime.test.ts test/protocol/generated-execution-graph.test.ts
npm run quality:architecture
```

Evidence projection/storage gate:

```bash
npm run test -- test/protocol/evidence-projections.test.ts test/http/d1-http.test.ts test/protocol/protocol-store-atomicity-contract.test.ts
npm run quality:storage
```

Claim, package, and full closeout gate:

```bash
npm run demo:mcp-transcript
npm run quality:claims
npm run quality:architecture
npm run pack:check
npm run check:repo
```

## Cut Lines

- Ledger: session/day/review spend control remains metadata until a D1-backed reservation ledger with conflict, recovery, and receipt semantics exists.
- Custody: local signer and fixture gateway proof do not prove provider custody, customer custody, vault rotation, revocation, resolver failure, or hosted signer operation.
- Hosted verifier: local terminal certificate verification does not prove hosted verifier, JWKS, revocation, cross-org trust, marketplace, certification, or clearing-house operation.
- Host interception: runtime/MCP bypass evidence does not prove browser, shell, package-manager, cloud API, network, database, repo, or sibling tool interception.
- x402 breadth: `x402_payment.exact` remains buyer-side exact per-call payment signature evidence; no `upto`, batch, lifecycle, seller, facilitator, settlement, signed offer, signed receipt, or MCP auto-pay support.
- Publication: package readiness is build/pack/entrypoint smoke only; real npm/MCP Registry publication requires external owner credentials.
- `.planning`: planning artifacts can guide work but cannot become package surface, exported names, public command names, CI names, canonical docs, or claim authority.

## Rollback / Stop Conditions

- Stop if runtime or MCP unsupported, omitted, external, live, or unknown posture reaches `action_contract_proposed`.
- Stop if runtime or MCP creates policy decision, greenlight, gateway check, mutation attempt, receipt, receipt export, signer evidence, or authority certificate.
- Stop if sandbox evidence serializes as seller middleware, facilitator operation, settlement finality, provider custody, or authority.
- Stop if `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, bearer tokens, vault paths, provider secrets, or raw signer refs leak into MCP, CLI, demo, package smoke, or projection output.
- Stop if aggregate session/day/review spend language appears as enforced without a real reservation ledger.
- Stop if registry extraction changes package/auth.md/x402 runtime behavior outside the intended family boundary.
- Stop if source changes weaken Tier 1 protocol/kernel semantics or move authority into runtime, MCP, CLI, demos, or review output.
- Stop if package smoke does not exercise the final MCP schema after posture fields are added.
- Stop if `.planning/` appears in package files or becomes repo-facing canon.

## Smallest Next Action

Add the failing runtime regression in `test/runtime/runtime-ingress.test.ts`: a wrapped x402 dispatch with `intendedRequestBodyPosture: "unsupported"`, `providerEnvironmentPosture: "live"`, and a live provider ref must return `one_or_more_dispatches_refused`, include `x402_request_body_posture_unsupported` and `x402_provider_environment_not_sandboxed`, and create no action contract or authority-bearing records. Then patch `x402PaymentAttemptForDispatch()` to forward posture fields and update x402 idempotency material.
