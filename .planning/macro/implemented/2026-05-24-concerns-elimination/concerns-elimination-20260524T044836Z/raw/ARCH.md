# ARCH Perspective

## Invariant at stake

Tier 2 proposal and evidence surfaces must not default, omit, or relabel protected-action posture in a way that lets unsupported, live, ambiguous, or bypass-shaped x402 attempts become exact `x402_payment.exact` candidates. Tier 1 protocol meaning stays stable: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState` do not move out of `src/protocol`.

## Architecture implications

1. Runtime x402 posture propagation is the first architecture defect to close.

   Current data flow is:

   ```text
   RuntimeIngressObservedDispatchSchema
   -> x402PaymentAttemptForDispatch()
   -> X402PaymentAttemptSchema
   -> buildX402PaymentCompileIntentInput()
   -> IntentCompilationRecord.candidate.parameters
   -> ActionContract.paramsDigest
   -> X402WalletGateway observed parameters
   ```

   `src/runtime/ingress/index.ts` accepts `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`, but `x402PaymentAttemptForDispatch()` drops them. `X402PaymentAttemptSchema` then defaults to `no_body` and `local_reference_sandbox`, which can turn an observed live, external, omitted, or unsupported posture into a cleaner proposal than the runtime actually observed. This is compiler overreach by omission.

   Source mechanism: forward the posture fields into the adapter attempt, include posture and provider-environment material in x402 idempotency/canonical parameter material, and add runtime tests proving `unsupported`, `omitted`, `external_sandbox`, `live`, and `unknown` refuse before `ActionContract` proposal where the direct adapter would refuse.

2. MCP x402 posture parity must be closed without turning MCP into an adapter.

   `src/mcp/x402-proposal.ts` currently carries `intendedRequestBodyDigest` and selected headers, but not `intendedRequestBodyPosture`, `providerEnvironmentPosture`, or `providerEnvironmentRef`. Its `x402Parameters()` and `deriveMcpX402IdempotencyKey()` therefore cannot bind the same posture boundary as `src/adapters/x402-payment/action-proposal.ts`.

   MCP must remain proposal/evidence only. The `src/mcp/LANE.md` and `test/architecture/mcp-surface-posture.test.ts` forbid adapter imports, gateway imports, signer material, and authority-shaped code. Do not fix parity by importing wallet gateway or adapter execution code into MCP.

   Source mechanism: add strict MCP input fields and MCP-local pre-contract posture refusal logic, then test black-box parity against the direct adapter refusal outcomes. Forward accepted posture into tool-call drafts, candidate parameters, non-secret summaries, and the MCP idempotency digest. Output must still report `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, and `mutationAttempted: false`.

3. The x402 sandbox needs a typed evidence boundary, not friendlier language.

   `src/adapters/x402-payment/sandbox-http.ts` is a local/reference 402 challenge and signed-retry fixture. Its retry is downstream observation after gateway-created signature evidence. It is not seller middleware, facilitator operation, settlement finality, signer custody, or authority.

   Source mechanism: make the local sandbox evidence boundary explicit in code and projections. The signed retry should carry or project a local/reference evidence role such as post-gate signed retry observation, a local provider-environment posture, and non-settlement finality. `authorityCreated: false` is necessary but not sufficient; product and projection tests must make it impossible to read the sandbox retry as facilitator settlement or provider custody.

4. Runtime ingress family hardcoding should be refactored after the posture hotfix, not before it.

   `src/runtime/ingress/index.ts` is doing orchestration, schemas, family detection, graph-node classification, config selection, compile-input construction, signing-secret selection, and grammar-version selection for package install, x402 payment, and auth.md protected API calls. That increases cross-family drift risk, but the nearest defect is the x402 field drop.

   Source mechanism after the hotfix: introduce a runtime family adapter registry under `src/runtime/ingress/` that owns per-family conversion while the main ingress file owns only block orchestration. The adapter shape should be boring and narrow:

   ```text
   familyId
   dispatchKinds
   requireConfig(config)
   buildCompileIntentInput(...)
   dispatchSpecificRefusalReasonCodes(...)
   signingSecretForDispatch(...)
   supportedGrammarVersion
   ```

   Keep the registry inside `src/runtime`; do not move family proposal semantics into `src/protocol`, and do not let runtime issue policy, greenlights, gateway checks, receipts, or mutations.

5. Spend-window metadata must either stay metadata or become a real reservation ledger.

   `X402SpendBoundsSchema` has session/day/review fields, but the only enforced x402 bound is `maxAtomicAmountPerCall`. This must not be patched with a runtime-side sum or demo assertion. Aggregate spend enforcement would require a real source-owned reservation ledger with tenant/org/principal/agent/action/resource/window keys, reservation states, conflict semantics, recovery evidence, D1/memory implementations, and gateway/policy re-checks.

   For this concern-elimination plan, keep aggregate spend out of the first slice unless a full ledger phase is explicitly chosen. Strengthen the current boundary with source tests that keep `spendWindowEnforcementStatus: "not_enforced_local_metadata"` visible in install proposals, runtime/demo outputs, claim gates, and product reports.

6. Signer custody and provider custody must remain separated.

   `src/adapters/x402-payment/wallet-gateway.ts` proves the official SDK signer is invoked only after `VerifiedGatewayCheck`, and install/conformance code can require gateway-held or fixture-gateway-held signer posture. That is still local/reference custody, not provider/customer custody or vault lifecycle proof.

   Source mechanism: keep custody status on install/conformance records, forbid raw signer, `PaymentPayload`, and `PAYMENT-SIGNATURE` through CLI/MCP/runtime projections, and require future provider custody to enter through `GatewayCredentialRef` and post-gate `CredentialResolutionEvidence`, not through x402 demo code.

7. Host and bypass posture is evidence, not broad interception.

   Runtime ingress can refuse observed raw sibling dispatches and MCP can avoid direct payment authority. That does not prove broad browser, shell, package-manager, cloud, repo, or host interception. Do not promote synthetic bypass evidence into host-wide protection.

   Source mechanism: keep bypass posture in conformance and runtime graph evidence; add host-specific probe phases only when there is a concrete host harness. Until then, runtime/MCP outputs must keep saying proposal/evidence only.

8. Evidence projection scale is a store-port boundary.

   `assembleAgentTransactionEnvelope()` currently scans many object types by tenant/org and filters in memory for one contract. That is acceptable for local foundation, but not for hosted audit/search claims.

   Source mechanism: add contract/action/run-scoped read methods to `ProtocolStore` and implement them in memory and D1 before any hosted evidence-scale claim. Candidate reads include policy decision by contract, latest greenlight by contract, gateway checks by contract, mutation attempts by contract, receipt by action contract, proof gaps by affected contract, refusals by contract, reconciliations by contract, credential-resolution evidence by contract, authority certificates by terminal contract, and recovery records by source contract. D1 needs compatible indexes or side tables; do not solve this in HTTP handlers.

9. Redaction must move toward typed allowlists for live providers.

   `redactedProjectionRefs()` currently denies many credential-shaped strings by pattern. That is useful but not enough for unknown provider credential formats. Before hosted/provider claims, projection code needs typed evidence-ref allowlists per provider/action family or deny-by-default handling for credential namespaces. Continue to expose opaque refs and digests, not raw material.

10. Package and planning drift are architecture gates.

    `package.json`, `scripts/check-package-surface.mjs`, and `scripts/check-published-entrypoints.mjs` already make package shape source-owned. Keep `.planning/` excluded from package files and keep `.planning` labels out of source paths, scripts, exports, CI names, and canonical docs. If scratch planning maps stay tracked, add guard tests around what can be promoted to canon rather than treating `.planning/codebase/*` as authority.

## Boundaries that must not move

- `src/protocol/areas/*` owns Tier 1 primitive meaning. Do not move x402 request posture, MCP schema convenience, sandbox labels, or runtime family dispatch into protocol primitives unless a real new protocol primitive is being introduced.
- `src/runtime/` may record runtime execution, generated graph evidence, tool-call drafts, intent compilations, action contracts, and refusals. It must not issue policy decisions, greenlights, gateway checks, receipts, authority certificates, or mutation attempts.
- `src/mcp/` may expose proposal/evidence transport only. It must not import adapters, wallet/signing code, storage, protocol kernel internals, gateway transitions, all-role SDK clients, or credential custody surfaces.
- `src/adapters/x402-payment/` owns local/reference x402 upstream evidence, install proposal, conformance, sandbox, and wallet gateway fixtures. It does not define protocol semantics and must not claim live provider custody, seller middleware, facilitator operation, settlement finality, or aggregate spend enforcement.
- `src/protocol/evidence-projections/` owns redacted diagnostic projections. HTTP, SDK, CLI, and MCP may route projections but must not become raw reconstruction or authority surfaces.
- `src/storage/*` owns persistence mechanics. KV remains cache posture only. D1/memory must preserve the same protocol-store contract.
- Canon remains `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*`. `.planning/` is scratch.

## Files/modules likely touched

Nearest source fixes:

- `src/runtime/ingress/index.ts`: forward x402 posture fields; add or prepare family adapter extraction.
- `test/runtime/runtime-ingress.test.ts`: x402 posture propagation/refusal tests; no-authority record-count assertions.
- `src/mcp/x402-proposal.ts`: add request-body and provider-environment posture fields, pre-contract refusal, parameter forwarding, idempotency binding.
- `test/mcp/mcp-schema-contract.test.ts`: schema fixture and catalog metadata update.
- `test/mcp/mcp-x402-proposal.test.ts`: live/unknown/external/omitted/unsupported posture refusal and idempotency/parity tests.
- `scripts/check-published-entrypoints.mjs`: reference MCP proposal input must include new posture fields if schema requires them.

Sandbox/evidence boundary:

- `src/adapters/x402-payment/sandbox-http.ts`: explicit local/reference evidence role and retry boundary.
- `src/adapters/x402-payment/wallet-gateway.ts`: ensure retry/sandbox evidence remains post-gate and non-settlement in returned evidence refs.
- `src/protocol/evidence-projections/projections.ts`: classify signed retry as local/reference evidence and settlement-finality-negative.
- `src/adapters/x402-payment/conformance.ts`: classify any new x402 evidence label without authority or settlement finality.
- `test/adapters/x402-wallet-gateway.test.ts`, `test/protocol/evidence-projections.test.ts`, `test/conformance/x402-payment-conformance.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`: boundary assertions.

Runtime family boundary:

- `src/runtime/ingress/index.ts`
- possible new files under `src/runtime/ingress/`, for example `registry.ts`, `families/x402-payment.ts`, `families/package-install.ts`, and `families/auth-md-protected-api-call.ts`
- `test/runtime/runtime-ingress.test.ts`
- `test/runtime/auth-md-candidate-compilation.test.ts`
- `test/architecture/import-posture.test.ts` and `test/architecture/naming-posture.test.ts` if folder shape changes

Spend/custody/bypass claim guards:

- `src/adapters/x402-payment/install-proposal.ts`
- `src/adapters/x402-payment/conformance.ts`
- `src/adapters/x402-payment/bypass-probes.ts`
- `examples/x402-protected-spend/run.ts`
- `examples/x402-protected-spend/README.md`
- `test/adapters/x402-install-proposal.test.ts`
- `test/adapters/x402-bypass-probes.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/self-hosted-activation-claim-boundary.test.ts`

Projection scale/redaction if included in the executable plan:

- `src/protocol/store/port.ts`
- `src/storage/d1/index.ts`
- `src/storage/memory/index.ts`
- `migrations/0001_protocol_kernel.sql`
- `src/protocol/evidence-projections/assembly.ts`
- `src/protocol/evidence-projections/projections.ts`
- `test/protocol/evidence-projections.test.ts`
- `test/protocol/protocol-store-atomicity-contract.test.ts`
- `test/http/d1-http.test.ts`

Package/planning gates:

- `package.json`
- `scripts/check-package-surface.mjs`
- `scripts/check-published-entrypoints.mjs`
- `test/architecture/package-surface.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/active-vocabulary.test.ts`

## Compatibility/migration risks

- MCP schema changes can break existing callers and packaged smoke fixtures. Prefer a metadata digest/catalog version bump and a backwards-compatible normalization path only when omission truly means legacy `no_body` plus `local_reference_sandbox`; explicit `omitted`, `unsupported`, `external_sandbox`, `live`, or `unknown` must refuse before contract proposal.
- Adding posture fields to idempotency material changes deterministic IDs for new proposals. Do not rewrite old receipts or claim historical equivalence. If needed, version the idempotency material label while keeping prior evidence reconstructable.
- Runtime family extraction can silently change graph-node classification, sequence dependencies, raw sibling refusal, or signing-secret selection. It should happen after the direct posture fix and be guarded by current runtime/auth-md/package-install tests.
- D1 scoped-read migration must be additive. Existing records remain in `protocol_records`; new indexes or side tables must not change canonical record digests.
- Projection redaction tightening can hide refs that current product tests expect. Update tests around roles, not raw strings: credential material stays hidden; opaque refs and digests stay visible where they are safe.
- `dist/` artifacts will drift until `npm run build` or `npm run pack:check` runs. Do not treat checked-in bundles as current proof after source changes.
- Dirty worktree files named in the input packet are current state, not something to revert. The plan must validate them or build on them.

## Architecture validation gates

Focused posture gates:

```bash
npm run test -- test/adapters/x402-payment-action-proposal.test.ts test/runtime/runtime-ingress.test.ts
npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts
```

Sandbox and x402 boundary gates:

```bash
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/conformance/x402-payment-conformance.test.ts test/conformance/x402-upstream-exact-fixtures.test.ts test/product/x402-protected-spend-demo-report.test.ts
npm run demo:aps
```

Runtime family/refactor gates:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/runtime/package-install-runtime.test.ts test/protocol/generated-execution-graph.test.ts
npm run quality:architecture
```

Projection/storage gates if store-port work is included:

```bash
npm run test -- test/protocol/evidence-projections.test.ts test/protocol/protocol-store-atomicity-contract.test.ts test/http/d1-http.test.ts
npm run quality:storage
```

Claim, package, and repo gates:

```bash
npm run quality:claims
npm run pack:check
npm run check:repo
```

Required assertions inside the focused tests:

- Runtime and MCP refused posture cases create no `policy_decision`, `greenlight`, `gateway_check_attempt`, `mutation_attempt`, `receipt`, or `authority_certificate` records.
- Runtime and MCP accepted local/reference cases bind `intendedRequestBodyPosture`, `intendedRequestBodyDigest`, `providerEnvironmentPosture`, `providerEnvironmentRef`, and selected headers into candidate parameters and params/idempotency material.
- Sandbox signed retry evidence is projected as local/reference downstream observation, not settlement finality, facilitator operation, seller middleware, provider custody, or authority.
- Spend session/day/review fields remain `not_enforced_local_metadata` unless a real reservation ledger is implemented.
- MCP and CLI package entrypoints still emit non-authority flags and leak neither `PaymentPayload` nor `PAYMENT-SIGNATURE`.

## Blocked checks

- Not run in this ARCH pass: all tests, demos, package checks, and `check:repo`. This role is assigned a planning output only and file edits outside this raw output are forbidden.
- Not inspected by instruction: sibling raw outputs, normalized outputs, and `.planning/macro/PLAN.md`.
- Live provider/customer custody validation is blocked by absent provider/vault gateway integration and must remain a future cut, not a current x402 claim.
- Broad host/browser/shell/package-manager/cloud/repo interception validation is blocked by absent host-specific harnesses and must remain a future cut.
- Actual npm publication and MCP Registry publication are blocked by external owner credentials; `pack:check` can prove package shape only.

## Smallest next mechanism to build

Forward x402 request-body and provider-environment posture through `x402PaymentAttemptForDispatch()`, bind it into x402 candidate/idempotency material, and add runtime refusal tests proving live/unknown/external/unsupported posture cannot produce an `ActionContract`.
