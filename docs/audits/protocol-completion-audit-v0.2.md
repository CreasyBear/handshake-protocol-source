# Protocol Completion Audit v0.2

Status: Passed for v0.2 protocol kernel
Version: v0.2.1
Audience: Protocol implementers, runtime builders, gateway owners, platform engineering
Implementation status: Backed by current TypeScript modules, Hono routes, D1 tests, gateway adapters, runtime wrappers, and invariant tests
Canonical owner: Protocol owner
Last reviewed: 2026-05-18

## Invariant At Stake

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

This audit checks the current implementation against `01-plan-eng-review-primitive-fields-state.md` and `QUALITY.md`. It does not expand the object model. It asks whether the v0.2 kernel proves the first closed enforcement loop before product UI.

## Audit Verdict

Verdict: `PASS_FOR_V0.2_PROTOCOL_KERNEL`.

The current code proves the requested protocol kernel slice:

```text
catalog-bound intent compilation
  -> exact action contract
  -> deterministic policy decision
  -> one-use greenlight or refusal/review/halt/quarantine
  -> gateway check before mutation
  -> mutation/refusal/proof gap
  -> receipt, reconciliation, recovery, stream, and isolation evidence
```

This is not a claim that production gateway integrations, product UI, multi-tenant operations, pricing, onboarding, or v1 governance are complete. Those remain outside the v0.2 protocol kernel.

## Requirement Evidence

| Requirement | Status | Current evidence |
|---|---:|---|
| TypeScript-first, schema-first protocol objects | Pass | `src/protocol/schemas.ts`, `src/protocol/inputs.ts`, `src/protocol/kernel.ts`, `npm run typecheck -- --pretty false` |
| Hono HTTP protocol surface | Pass | `src/http/app.ts`, `src/http/openapi.ts`, `test/http.test.ts`, `test/d1-http.test.ts` |
| Cloudflare Workers reference runtime | Pass | `src/worker.ts`, `wrangler.toml`, `@cloudflare/workers-types`, Worker binding tests through Hono request harness |
| D1 durable protocol records | Pass | `migrations/0001_protocol_kernel.sql`, `src/storage/d1.ts`, `test/d1-http.test.ts` |
| KV where appropriate | Pass | `src/storage/kv.ts` is limited to isolation cache semantics; D1 remains authority |
| Zod runtime validation | Pass | `src/protocol/schemas.ts`, `src/protocol/inputs.ts`, route parsing in `src/http/app.ts` |
| OpenAPI metadata | Pass | `GET /openapi.json`, `src/http/openapi.ts`, `test/http.test.ts` |
| Signed/canonical JSON contracts | Pass | `src/protocol/canonical.ts`, `src/protocol/action-contract/`, `test/canonical.test.ts` |
| Minimal explicit SDK | Pass | `src/sdk/client.ts`, D1 tests using `HandshakeClient` |
| Reference TypeScript runtime wrappers | Pass | `src/runtime/package-install/tool-wrapper.ts`, `src/runtime/repo-write/tool-wrapper.ts`, `src/runtime/codemode-multi-action/wrapper.ts` |
| Gateway adapter proof | Pass | `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, gateway and D1 adapter tests |
| Product UI not built first | Pass | No app/product UI package exists; docs keep product surfaces out of v0.2 kernel |

## Plan Obligations

The plan's current audit obligations are proven by current tests and modules after the authority-hardening pass: proof-gap gates no longer yield adapter mutation authority, greenlight issuance is claimed durably per action contract, and D1 protocol record identity is type-scoped.

| Plan obligation | Status | Evidence |
|---|---:|---|
| no action contract without pinned tool/action/gateway catalog bindings | Pass | `src/protocol/intent-compilation/`, `src/protocol/action-contract/`, `test/kernel.test.ts` catalog and gateway mismatch cases, `test/package-install-runtime.test.ts` unknown catalog refusal |
| no compiler overreach hidden as an exact contract | Pass | `IntentCompilationRecord` uncertainty and rejected overreach fields, `test/kernel.test.ts` unwrapped consequential tool refusal, `test/codemode-multi-action-runtime.test.ts` candidate refusal |
| no mutation without gateway check | Pass | passed-only `VerifiedGatewayCheck`, `test/package-install-gateway.test.ts`, `test/repo-write-gateway.test.ts`, `test/repo-write-d1-http.test.ts`, `test/package-install-end-to-end.test.ts` |
| no gateway check without exact one-use greenlight | Pass | `src/protocol/gateway-gate/`, `greenlight_consumptions`, replay tests in `test/kernel.test.ts`, `test/package-install-gateway.test.ts` |
| no greenlight without action contract | Pass | `src/protocol/policy-greenlight/`, `greenlight_issuances`, direct lifecycle write guard in `src/protocol/transitions.ts`, `test/kernel.test.ts` |
| no greenlight or gate pass while isolated | Pass | `src/protocol/policy-greenlight/`, `src/protocol/gateway-gate/`, isolation and breaker tests in `test/kernel.test.ts` and `test/d1-http.test.ts` |
| no human review without exact contract and policy digest binding | Pass | `src/protocol/review-binding/`, review-required path in `src/protocol/policy-greenlight/`, `test/kernel.test.ts` |
| no receipt that blurs gate check and downstream execution | Pass | `Receipt` split statuses, `src/protocol/gateway-gate/`, pending/unknown reconciliation tests |
| no missing evidence without a first-class proof gap | Pass | `ProofGap` schema, downstream unknown tests, recovery terminal conflict tests, reconciliation resolution tests |
| no recovery path that reuses a greenlight or mutates a gateway | Pass | `RecoveryRecommendation` authority flags, recovery-linked proposal tests, D1 recovery tests |
| no terminal recovery race without a proof gap or resolution evidence | Pass | `recovery_terminal_claims`, `src/protocol/recovery/`, kernel/Hono/D1 tests |

## State Model Evidence

The v0.2 state model is explicit enough for the first closed loop:

- Catalog records are durable setup objects: `ToolCapability`, `ActionType`, `GatewayRegistryEntry`, `OperatingEnvelope`.
- Lifecycle records are not directly writable by callers: `IntentCompilationRecord`, `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`, `MutationAttempt`, `Receipt`, `ProofGap`, `RecoveryRecommendation`, `RecoveryRecommendationStatusTransition`, `IsolationState`, `BreakerDecision`.
- One-greenlight-per-contract issuance is enforced through `greenlight_issuances`.
- One-use gateway-check consumption is enforced through `greenlight_consumptions`.
- One-terminal recovery status is enforced through `recovery_terminal_claims`.
- Replayable reconstruction is enforced through digest-linked `ContractStreamEvent` partitions.
- Missing, unknown, stale, or conflicting evidence is represented as `ProofGap`, not receipt prose or mutation authority.

## Runtime And Gateway Evidence

The runtime seam has two concrete action shapes and one generated-program wrapper:

- package install runtime proposal;
- repository write runtime proposal with content digest binding;
- codemode multi-action proposal with sequence dependencies.

The gateway seam has two concrete adapters:

- package manifest mutation after `VerifiedGatewayCheck`;
- repository file write after content digest verification and gateway check.

This satisfies the architecture skill's real-seam test: the gateway seam has more than one adapter, and the runtime seam has more than one action shape.

## Verification Commands

The completion gate for this audit is:

```bash
npm run typecheck -- --pretty false
npm run build -- --pretty false
bun test
rg -n "z\\.unknown\\(\\)|mutationAttempt: unknown|proofGap: unknown|payload: any|metadata: any|approval|permission|executeWithoutGate|assumeSuccess|allowAll|skipVerification|trustedAgent|probably executed|best effort receipt" src test
```

Expected result: typecheck/build/test pass; the authority-pattern scan returns no matches.

## Non-Claims

Handshake v0.2 still does not claim:

- production-grade preview deploy, CI, cloud, or database gateways;
- universal runtime interception;
- product dashboard completion;
- human review UX completion;
- agent auth or identity governance;
- deployment to a live Cloudflare account;
- v1 market breadth.

Those require new plans or ADRs before implementation.

## Brutal Verdict

Keep. The v0.2 kernel now proves the primitive without product theatre.

Further object-model expansion should require an ADR or a new plan. The next practical wave should package the kernel for integration or choose one production gateway adapter, but that is outside this completion audit.

Protocol next mechanism: cut a v0.2 protocol-kernel checkpoint, then require an ADR before changing the control object model. This is separate from the CLI/MCP product-surface shipment and its first gateway adapter.
