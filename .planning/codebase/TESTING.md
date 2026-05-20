# Testing Patterns

**Analysis Date:** 2026-05-20
**HEAD:** `88e6f16`
**Source priority:** Tracked docs, source, and tests are authoritative. `.planning/` is scratch and is not repo truth.
**Worktree note:** Current scan includes the present dirty/untracked Tier 1 AuthorityCertificate/kernel source and tests. The observed tree has 46 `*.test.ts` files under `test/`.
**Recent gate evidence:** User reports `npm run check:repo` recently passed after the Tier 1 AuthorityCertificate/kernel work. This mapper did not rerun the full gate.

## Test Framework

**Runner:**
- Bun test runner, via Bun `1.3.9` declared in `package.json`.
- Config: Not detected. There is no `vitest.config.*`, `jest.config.*`, or Bun test config file in the current scan.
- Test files import from `bun:test`: `describe`, `expect`, and `it`.

**Assertion Library:**
- Bun `expect` from `bun:test`.
- Common assertions include `toEqual`, `toMatchObject`, `toBe`, `toBeNull`, `toHaveLength`, `toContain`, `toThrow`, `rejects.toThrow`, and `rejects.toMatchObject`.

**Run Commands:**
```bash
npm run test                         # Run all Bun tests
npm run test -- test/protocol/authority-certificate.test.ts
npm run test -- test/architecture/import-posture.test.ts
npm run quality:architecture         # Architecture, exports, package surface, conformance guard slice
npm run quality:claims               # Active vocabulary and claim-boundary guard slice
npm run quality:storage              # HTTP/D1, kernel, transition, model, lifecycle, certificate slice
npm run check:types                  # TypeScript no-emit gate
npm run lint                         # ESLint over src and test with zero warnings
npm run format:check                 # Prettier check
npm run pack:check                   # Declaration build plus package dry-run surface check
npm run check:repo                   # Full gate: types, lint, format, tests, pack check, git diff --check
```

**Watch mode:**
```bash
# No dedicated package script is declared.
```

**Coverage:**
```bash
# No dedicated coverage package script is declared.
```

## Test File Organization

**Location:**
- Tests live under `test/` and are separated by authority lane and blast radius.
- Architecture guards: `test/architecture/*`.
- Protocol invariant tests: `test/protocol/*`.
- Runtime proposal tests: `test/runtime/*`.
- Reference adapter tests: `test/adapters/*`.
- Conformance tests: `test/conformance/*`.
- HTTP transport tests: `test/http/*`.
- D1/end-to-end protected path tests: `test/integration/*`.
- Fixtures and harnesses: `test/support/*`.

**Naming:**
- Test files use `*.test.ts`.
- Suite names state the invariant, not the implementation detail. Examples: `Handshake kernel invariants: policy and gateway` in `test/protocol/kernel-policy-gateway.test.ts`, `AuthorityCertificate foundation` in `test/protocol/authority-certificate.test.ts`, and `runtime ingress adapter` in `test/runtime/runtime-ingress.test.ts`.
- Root `test/*.test.ts` files are forbidden by `test/architecture/naming-posture.test.ts`.

**Structure:**
```text
test/
  architecture/      repo shape, naming, exports, vocabulary, package surface
  protocol/          kernel, primitive, state-machine, evidence, certificate, store invariants
  runtime/           generated-execution proposal helpers and runtime ingress
  adapters/          reference gateway fixture behavior and x402 proof rail
  conformance/       no-mutation-without-verified-gate and x402 install posture
  http/              Hono transport, admission, SDK, evidence reads, D1-backed semantics
  integration/       D1/HTTP protected action paths
  support/           fixtures, local D1 harness, fault injection, file surfaces
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "bun:test";
import { makeKernelFixture, registerFixtureObjects } from "../support/fixtures";

describe("runtime ingress adapter", () => {
  it("observes supported dispatch and proposes a contract without policy or gateway authority", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(fixture.kernel, config, block);

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(await recordCount(fixture.store, "policy_decision")).toBe(0);
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
    expect(await recordCount(fixture.store, "gateway_check_attempt")).toBe(0);
  });
});
```

**Patterns:**
- Arrange with fixture builders from `test/support/fixtures.ts`, `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, or `test/support/d1-http-harness.ts`.
- Act through the same public transition surface production code uses: `HandshakeKernel`, HTTP routes, SDK client, runtime proposal helpers, or adapter gateway runners.
- Assert both the positive artifact and the absent authority. Many tests check that `policy_decision`, `greenlight`, `gateway_check_attempt`, `mutation_attempt`, or `receipt` records remain at zero when the path is evidence-only or refused.
- For protected mutations, assert no external mutation happens on mismatch, replay, proof gap, missing verified gate, or drift. See `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, and `test/adapters/x402-wallet-gateway.test.ts`.
- Use test names as invariant statements. Avoid generic "works" tests.

## Mocking

**Framework:** No module-mocking framework detected.

**Patterns:**
```typescript
const base = makeKernelFixture();
const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore());
const fixture = await createGreenlitContract({ ...base, store, kernel: new HandshakeKernel(store) });

store.hideListRecordsByTypeOnce("greenlight");

const duplicate = await fixture.kernel.evaluatePolicy({
  actionContractId: fixture.contract.actionContractId,
  envelopeId: fixture.envelope.envelopeId,
});

expect(duplicate.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
```

**What to Mock:**
- Use `InMemoryProtocolStore` from `src/storage/memory/index.ts` for fast protocol tests.
- Use `FaultInjectingProtocolStore` from `test/support/fault-injecting-protocol-store.ts` for stale reads, stream conflicts, ambiguous commits, missing records, and current-posture drift.
- Use `createD1HttpHarness` from `test/support/d1-http-harness.ts` for D1-backed HTTP semantics with `bun:sqlite` as the local D1 substitute.
- Use filesystem fixture surfaces from `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, and `test/support/preview-deploy-flow.ts` for mutation counters and local artifacts.
- Use local key fixtures and subprocess verification in `test/protocol/authority-certificate.test.ts` when testing portable AuthorityCertificate verification.

**What NOT to Mock:**
- Do not mock the policy/gateway boundary when testing authority. Exercise `HandshakeKernel.evaluatePolicy` and `HandshakeKernel.gatewayCheck` directly.
- Do not mock evidence projections when testing read-only diagnostic posture. Use `src/protocol/evidence-projections/*` through public projection functions.
- Do not mock adapter mutation behavior in conformance tests; measure real fixture mutation counts through the adapter runner.
- Do not treat runtime proposal helpers as authority. Tests must confirm runtime helpers create evidence/contract proposals only, not greenlights or gateway checks.

## Fixtures and Factories

**Test Data:**
```typescript
const fixture = makeKernelFixture();
await registerFixtureObjects(fixture);

const compilation = await fixture.kernel.compileIntent({
  tenantId: "tenant_demo",
  organizationId: "org_demo",
  principalIntentRef: "intent:install hono",
  principalId: "principal_demo",
  agentId: "agent_demo",
  runId: "run_demo",
  runtimeAdapterId: "runtime_codex",
  operatingEnvelopeId: "env_demo",
  toolCatalogRef: "tool_catalog_demo@v1",
  actionCatalogRef: "action_catalog_demo@v1",
  gatewayRegistryRef: "gateway_registry@v1",
  candidate: makePackageInstallCandidate(fixture),
});
```

**Location:**
- Core protocol fixture objects: `test/support/fixtures.ts`.
- Gateway posture helpers: `test/support/kernel-invariant-helpers.ts`.
- Fault injection: `test/support/fault-injecting-protocol-store.ts`.
- D1/HTTP harness: `test/support/d1-http-harness.ts`.
- HTTP body fixtures: `test/support/http-protocol-fixtures.ts`.
- Package install fixtures: `test/support/package-install-flow.ts` and `test/support/package-manifest-surface.ts`.
- Repo write fixtures: `test/support/repo-write-flow.ts` and `test/support/repo-write-surface.ts`.
- Preview deploy fixtures: `test/support/preview-deploy-flow.ts`.
- Codemode multi-action fixtures: `test/support/codemode-multi-action-flow.ts`.

## Coverage

**Requirements:** No numeric coverage target is enforced.

**View Coverage:**
```bash
# Not declared in package.json.
```

**Practical Coverage Bar:**
- New protocol primitive work needs schema/input tests, transition/invariant tests, navigation/matrix guard coverage when public transitions change, root export coverage when public surface changes, and evidence/refusal/proof-gap assertions when authority can be denied.
- New architecture or naming posture must update `QUALITY.md` or `STRUCTURE.md` if it changes the contract, then guard with `test/architecture/*`.
- New public exports must update `src/index.ts`, `package.json` subpath exports if needed, `test/architecture/root-exports.test.ts`, and `test/architecture/package-surface.test.ts`.
- New protected action adapters need adapter tests plus conformance coverage in `test/conformance/*`.
- New storage behavior needs memory and D1 coverage where authority-bearing writes depend on atomicity.

## Test Types

**Unit Tests:**
- Canonicalization and signatures: `test/protocol/canonical.test.ts`, `test/protocol/authority-certificate.test.ts`.
- Schema/registry/navigation guards: `test/protocol/object-registry.test.ts`, `test/protocol/protocol-navigation.test.ts`, `test/protocol/transition-matrix.test.ts`.
- Evidence projections: `test/protocol/evidence-projections.test.ts`.

**Protocol Invariant Tests:**
- Compilation and contracts: `test/protocol/kernel-compilation-contract.test.ts`.
- Policy and gateway: `test/protocol/kernel-policy-gateway.test.ts`.
- Conflict and isolation: `test/protocol/kernel-conflict-isolation.test.ts`.
- Operation lifecycle: `test/protocol/kernel-operation-lifecycle.test.ts`.
- Receipt and recovery: `test/protocol/kernel-receipt-recovery.test.ts`.
- Idempotency ledger: `test/protocol/kernel-idempotency-ledger.test.ts`.
- Cross-scope authority matrix: `test/protocol/kernel-cross-scope-matrix.test.ts`.
- Model-based foundation invariants: `test/protocol/model-based-invariants.test.ts`.
- Store atomicity contract across memory and D1-backed stores: `test/protocol/protocol-store-atomicity-contract.test.ts`.

**Architecture Tests:**
- Repo naming posture: `test/architecture/naming-posture.test.ts`.
- Import posture and lane manifests: `test/architecture/import-posture.test.ts`.
- Curated exports: `test/architecture/root-exports.test.ts`.
- Package surface: `test/architecture/package-surface.test.ts`.
- Claim boundary: `test/architecture/claim-boundary.test.ts`.
- Active vocabulary: `test/architecture/active-vocabulary.test.ts`.

**Runtime Tests:**
- Runtime ingress: `test/runtime/runtime-ingress.test.ts`.
- Package install proposal helpers: `test/runtime/package-install-runtime.test.ts`.
- Codemode multi-action wrapper evidence: `test/runtime/codemode-multi-action-runtime.test.ts`.

**Adapter Tests:**
- Package install gateway: `test/adapters/package-install-gateway.test.ts`.
- Repo write gateway: `test/adapters/repo-write-gateway.test.ts`.
- Preview deploy gateway: `test/adapters/preview-deploy-gateway.test.ts`.
- x402 install proposal, action proposal, wallet gateway, and bypass probes: `test/adapters/x402-install-proposal.test.ts`, `test/adapters/x402-payment-action-proposal.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-bypass-probes.test.ts`.

**Integration Tests:**
- Package install end-to-end reference path: `test/integration/package-install-end-to-end.test.ts`.
- Repo write D1/HTTP path: `test/integration/repo-write-d1-http.test.ts`.
- x402 D1/HTTP wallet gateway path: `test/integration/x402-d1-http.test.ts`.
- Hono protocol surface and SDK behavior: `test/http/http.test.ts`.
- D1-backed protocol surface: `test/http/d1-http.test.ts`.

**E2E Tests:**
- Browser/UI E2E is not used in this repo. This is a TypeScript protocol kernel with local HTTP/D1 integration tests.

## Common Patterns

**Async Testing:**
```typescript
it("passes the gateway check once and refuses replay", async () => {
  const fixture = await createGreenlitContract();

  const first = await fixture.kernel.gatewayCheck({
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: fixture.contract.parameters,
  });
  const replay = await fixture.kernel.gatewayCheck({
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: fixture.contract.parameters,
  });

  expect(first.gateAttempt.gateDecision).toBe("passed");
  expect(replay.gateAttempt.gateDecision).toBe("refused");
  expect(replay.mutationAttempt).toBeNull();
});
```

**Error Testing:**
```typescript
await expect(
  fixture.kernel.proposeActionContract({
    intentCompilationId: compilation.intentCompilationId,
    candidateActionId: compilation.candidateAction.candidateActionId,
    candidateDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  }),
).rejects.toThrow("candidateDigest must match");
```

**No-Mutation Testing:**
```typescript
const before = surface.mutationCount;
const result = await runPackageInstallGateway({
  protocol: fixture.kernel,
  surface,
  actionContractId,
  greenlightId,
  observedParameters: mismatchedParameters,
});

expect(result.outcome).toBe("gateway_check_refused");
expect(surface.mutationCount).toBe(before);
```

**Evidence/Authority Testing:**
- Runtime evidence must not mint authority: `test/runtime/runtime-ingress.test.ts` checks zero `policy_decision`, `greenlight`, `gateway_check_attempt`, and `mutation_attempt` records after runtime proposal.
- AuthorityCertificate is terminal evidence, not execution authority: `test/protocol/authority-certificate.test.ts` covers receipt, durable refusal, proof gap, replay refusal, offline verification, tampering, missing gateway signer, wrong pinned keys, and HMAC rejection.
- Evidence projections are diagnostic and read-only: `test/protocol/evidence-projections.test.ts` and `test/http/http.test.ts` assert projections do not create records or turn clearing refs/proof gaps into authority.
- Generated execution graph uncertainty becomes refusal, not best-effort authority: `test/protocol/generated-execution-graph.test.ts` and `test/runtime/runtime-ingress.test.ts`.

## Verification Commands

**Before closing authority/kernel work:**
```bash
npm run check:types
npm run lint
npm run format:check
npm run test
npm run pack:check
git diff --check
```

**Preferred full closeout:**
```bash
npm run check:repo
```

**Focused authority and evidence slices:**
```bash
npm run test -- test/protocol/authority-certificate.test.ts
npm run test -- test/protocol/kernel-policy-gateway.test.ts test/protocol/kernel-idempotency-ledger.test.ts
npm run test -- test/protocol/evidence-projections.test.ts test/protocol/action-attempt-lifecycle.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts
npm run test -- test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts
npm run quality:architecture
npm run quality:claims
npm run quality:storage
```

---

*Testing analysis: 2026-05-20*
