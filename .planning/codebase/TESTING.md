# Testing Patterns

**Analysis Date:** 2026-05-21

## Test Framework

**Runner:**
- Bun test, via `bun test` and `npm run test`.
- Bun version: `1.3.9`, declared in `package.json` and installed in `.github/workflows/check.yml`.
- Config: Not detected. Tests rely on Bun's default test discovery for `*.test.ts`.

**Assertion Library:**
- Bun's built-in `describe`, `it`, `expect`, and `it.each` from `bun:test`.
- Typed negative assertions use `await expect(...).rejects.toThrow(...)` and `await expect(...).rejects.toMatchObject(...)`.

**Run Commands:**
```bash
npm run test                  # Run all Bun tests
npm run check:repo            # Full repo gate: types, lint, format, tests, pack check, diff whitespace
npm run quality:architecture  # Architecture, export, import, naming, and conformance guard slice
npm run quality:storage       # HTTP/D1 and storage-heavy protocol invariant slice
npm run quality:claims        # Public vocabulary and claim-boundary slice
```

## Test File Organization

**Location:**
- Tests live under typed subdirectories in `test/`.
- Root `test/*.test.ts` files are forbidden by `test/architecture/naming-posture.test.ts`.
- Test support helpers live under `test/support`.

**Naming:**
- Test files use `*.test.ts`.
- Protocol invariant tests use explicit kernel or concept names: `test/protocol/kernel-policy-gateway.test.ts`, `test/protocol/kernel-receipt-recovery.test.ts`, `test/protocol/model-based-invariants.test.ts`.
- Architecture guard tests name the boundary they protect: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/claim-boundary.test.ts`, `test/architecture/naming-posture.test.ts`.

**Structure:**
```text
test/
  architecture/   # import posture, naming posture, package surface, root exports, vocabulary, claim boundaries
  protocol/       # protocol primitives, kernel transitions, state machines, receipts, recovery, reason-code registries
  http/           # Hono app, HTTP admission, SDK behavior, D1-backed HTTP behavior
  runtime/        # runtime ingress and generated-execution proposal helpers
  adapters/       # reference gateway fixtures and hostile adapter paths
  integration/    # D1/HTTP/reference gateway end-to-end flows
  conformance/    # conformance helper contracts
  product/        # product-level proof spine regression
  support/        # fixtures, fake stores, temporary surfaces, D1 harnesses
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "bun:test";
import { createGreenlitContract } from "../support/fixtures";

describe("Handshake kernel invariants: policy and gateway", () => {
  it("passes the gateway check once and refuses replay", async () => {
    const fixture = await createGreenlitContract();

    const first = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(first.gateAttempt.gateDecision).toBe("passed");
  });
});
```

**Patterns:**
- Build a fixture with `makeKernelFixture()` or `createGreenlitContract()` from `test/support/fixtures.ts`.
- Register durable catalog/envelope objects with `registerFixtureObjects()` before compiling contractable candidates.
- Assert authority boundaries by record counts, not just returned values: `countRecordsOfType("greenlight")`, `countRecordsOfType("mutation_attempt")`, and `listRecordsByType("refusal")`.
- Assert exact reason codes, retryability, commit state, and refusal/proof-gap refs.
- Use table-driven tests for cross-scope and backend matrix checks, such as `it.each` in `test/protocol/kernel-cross-scope-matrix.test.ts` and the store factory loop in `test/protocol/protocol-store-atomicity-contract.test.ts`.
- Use model-style ordered command sequences when the invariant spans multiple transitions, as in `test/protocol/model-based-invariants.test.ts`.

## Mocking

**Framework:** No mocking library is used.

**Patterns:**
```typescript
const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore())
  .injectGatewayCommitResultOnce("already_consumed", {
    when: (commit) => Boolean(commit.consumption),
  });
```

```typescript
const fetchImpl = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
  calls.push({ path: new URL(String(input)).pathname, headers: new Headers(init?.headers) });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

**What to Mock:**
- Storage faults through `test/support/fault-injecting-protocol-store.ts` for stale reads, commit races, stream conflicts, ambiguous commits, and protected-path posture drift.
- Resource budgets through `test/support/transition-budget-recorder.ts`.
- HTTP fetches for SDK assertions in `test/http/http.test.ts`.
- Provider or filesystem surfaces through local fakes such as `test/support/package-manifest-surface.ts`, `test/support/repo-write-surface.ts`, and fake signing surfaces in `test/product/agent-proof-slice.test.ts`.
- D1 behavior through `test/support/d1-http-harness.ts` where storage parity matters.

**What NOT to Mock:**
- Do not mock the protocol kernel for protocol invariant tests. Use `HandshakeKernel` against `InMemoryProtocolStore`, `D1ProtocolStore`, or explicit fault-injecting wrappers.
- Do not mock policy decisions, greenlights, gateway checks, receipts, refusals, proof gaps, or idempotency ledger state when testing authority behavior.
- Do not treat SDK or HTTP success as proof of mutation. Tests must assert protocol records or gateway adapter outcomes.

## Fixtures and Factories

**Test Data:**
```typescript
const fixture = makeKernelFixture();
await registerFixtureObjects(fixture);
const compilation = await fixture.kernel.compileIntent({
  tenantId: "tenant_demo",
  organizationId: "org_demo",
  principalIntentRef: "intent:install hono",
  candidate: makePackageInstallCandidate(fixture),
});
const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
```

**Location:**
- Core protocol fixtures: `test/support/fixtures.ts`.
- Kernel invariant helpers: `test/support/kernel-invariant-helpers.ts`.
- Fault injection: `test/support/fault-injecting-protocol-store.ts`.
- Transition budget recording: `test/support/transition-budget-recorder.ts`.
- HTTP/D1 harness: `test/support/d1-http-harness.ts`.
- Runtime and protected-surface flows: `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, and `test/support/codemode-multi-action-flow.ts`.

## Coverage

**Requirements:** No numeric coverage target is enforced.

**View Coverage:**
```bash
Not detected
```

Coverage posture is enforced through invariant and boundary slices rather than a percentage gate:
- `test/architecture/*` protects export, import, naming, package, vocabulary, and claim boundaries.
- `test/protocol/*` protects primitive state transitions, reason-code registration, idempotency, receipt/recovery, model-based invariants, and storage atomicity.
- `test/product/agent-proof-slice.test.ts` is the product-level APS proof regression.
- `scripts/check-package-surface.mjs` and `test/architecture/package-surface.test.ts` keep `.planning/` and test-only material out of normal package surfaces.

## Test Types

**Unit Tests:**
- Protocol matrix and schema behavior: `test/protocol/canonical.test.ts`, `test/protocol/operation-lifecycle.test.ts`, `test/protocol/object-registry.test.ts`, `test/protocol/reason-code-registry.test.ts`.
- Adapter-level fixtures: `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`.
- Runtime proposal helpers: `test/runtime/runtime-ingress.test.ts`, `test/runtime/package-install-runtime.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`.

**Integration Tests:**
- HTTP and SDK behavior: `test/http/http.test.ts`.
- D1-backed HTTP parity: `test/http/d1-http.test.ts`.
- End-to-end protected paths: `test/integration/package-install-end-to-end.test.ts`, `test/integration/repo-write-d1-http.test.ts`, `test/integration/x402-d1-http.test.ts`.
- Product proof spine: `test/product/agent-proof-slice.test.ts`.

**E2E Tests:**
- Browser E2E is not used.
- The closest equivalent is local protocol/HTTP/D1/reference-gateway execution through `test/integration/*` and `test/product/agent-proof-slice.test.ts`.

## Common Patterns

**Async Testing:**
```typescript
await expect(
  fixture.kernel.proposeActionContract({
    intentCompilationId: compilation.intentCompilationId,
    candidateActionId: compilation.candidateAction.candidateActionId,
    candidateDigest: "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  }),
).rejects.toThrow("candidateDigest must match");
```

**Error Testing:**
```typescript
expect(response.status).toBe(401);
expect(await response.json()).toMatchObject({
  error: {
    code: "caller_auth_required",
    retryability: "terminal",
    commitState: "not_started",
  },
});
```

**Invariant Testing:**
```typescript
expect(policy.greenlight).toBeNull();
expect(policy.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
```

**Architecture Guard Testing:**
- `test/architecture/import-posture.test.ts` scans imports and folder manifests with `node:fs`.
- `test/architecture/root-exports.test.ts` dynamically imports `../../src`, `../../src/runtime`, `../../src/conformance`, and `../../src/experimental` to lock public surfaces.
- `test/architecture/naming-posture.test.ts` scans active repo surfaces and excludes `.planning`, `dist`, `coverage`, and `.git` during walk.
- `test/architecture/claim-boundary.test.ts` prevents runtime/conformance/experimental capabilities from leaking into root claims.

**Product Regression Testing:**
- `test/product/agent-proof-slice.test.ts` composes runtime ingress, gateway-backed adapter execution, HTTP/SDK evidence reads, redaction checks, hostile branches, proof gaps, replay refusal, and AuthorityCertificate verification.
- Keep this test as a product-level proof regression for agent proof spine behavior. Do not demote it to a narrow adapter unit when changing x402, package-install, runtime ingress, or agent transaction envelope behavior.

**Reason-Code Testing:**
- Add stable new protocol reason codes to `src/protocol/foundation/reason-codes.ts`.
- Add stable new HTTP error codes to `src/http/errors/codes.ts`.
- `test/protocol/reason-code-registry.test.ts` verifies uniqueness, operational metadata, and source-emitted code registration.

---

*Testing analysis: 2026-05-21*
