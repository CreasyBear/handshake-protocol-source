# Testing Patterns

**Analysis Date:** 2026-05-19

## Test Framework

**Runner:**
- Bun `1.3.9`
- Config: no separate Bun/Vitest/Jest config detected; commands are defined in `package.json`.
- Test API: `describe`, `it`, and `expect` from `bun:test`.

**Assertion Library:**
- Bun test assertions via `expect` from `bun:test`.
- Zod parsing is used inside tests and fixtures when validating protocol payload shapes.

**Run Commands:**
```bash
npm run test                  # Run all Bun tests
bun test                      # Direct test runner used by npm run test
npm run check:types           # TypeScript no-emit gate with stable CI output
npm run lint                  # ESLint over src and test with zero warnings
npm run format:check          # Prettier check over the repo
npm run check:repo            # Full local/CI gate
npm run quality:architecture  # Import, naming, exports, package surface, adapter conformance slice
npm run quality:storage       # D1, kernel, transition matrix, and model invariant slice
npm run quality:claims        # Active vocabulary guard
git diff --check              # Whitespace gate included in check:repo
```

## Test File Organization

**Location:**
- Tests live in the separate `test/` tree.
- Domain folders mirror repo authority lanes: `test/protocol`, `test/http`, `test/runtime`, `test/adapters`, `test/conformance`, `test/integration`, `test/architecture`, and `test/support`.
- Root `test/*.test.ts` files are forbidden by `test/architecture/naming-posture.test.ts`.

**Naming:**
- Test files use `*.test.ts`: `test/protocol/kernel-policy-gateway.test.ts`, `test/http/http.test.ts`, `test/runtime/package-install-runtime.test.ts`.
- Support files do not use the `.test.ts` suffix and live under `test/support`.
- Test names should state the invariant or boundary, not just the function name: `passes the gateway check once and refuses replay`, `returns ambiguous commit state without turning a committed record into authority`.

**Structure:**
```text
test/
  architecture/      repo shape, naming, exports, vocabulary, package surface
  protocol/          primitive transitions, invariants, recovery, receipts, model tests
  http/              Hono and D1-backed transport behavior
  runtime/           generated-execution proposal helpers
  adapters/          reference gateway fixtures
  conformance/       protected mutation adapter conformance
  integration/       end-to-end protected action paths
  support/           fixtures, harnesses, fake stores, mutation surfaces
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
    expect(first.mutationAttempt?.outcome).toBe("submitted");
  });
});
```

**Patterns:**
- Arrange with factory helpers from `test/support/fixtures.ts`, then execute one transition or protected flow.
- Assert on protocol objects, stream events, durable record counts, and exact refusal/proof-gap reason codes.
- Use `throw new Error("expected ...")` in tests to narrow nullable or discriminated state before continuing.
- Use `try/finally` for harness cleanup, especially D1-backed tests in `test/http/d1-http.test.ts` and integration tests.
- Use architecture tests as executable conventions; they scan source files and expect an empty violations list.

## Mocking

**Framework:** hand-built fakes and fixtures

**Patterns:**
```typescript
const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore())
  .injectAmbiguousProtocolCommitOnce();

await expect(store.commitProtocolRecords({ records: [], events: [] })).rejects.toMatchObject({
  code: "ambiguous_commit",
  metadata: { retryability: "ambiguous", commitState: "unknown" },
});
```

**What to Mock:**
- Use `InMemoryProtocolStore` from `src/storage/memory` for inspectable protocol-state tests.
- Use `FaultInjectingProtocolStore` in `test/support/fault-injecting-protocol-store.ts` for missing reads, stale reads, stream conflicts, and ambiguous commit behavior.
- Use fixture mutation surfaces such as `FilePackageManifestSurface` and `FileRepoWriteSurface` under `test/support` to assert mutation counts and safe-path behavior.
- Use custom `fetchImpl` functions for SDK request/header/error tests in `test/http/http.test.ts`.
- Use `LocalD1Database` in `test/support/d1-http-harness.ts` to exercise the D1 store against Bun SQLite and the canonical migration in `migrations/0001_protocol_kernel.sql`.

**What NOT to Mock:**
- Do not mock protocol invariants when testing authority transitions; use `HandshakeKernel` with real stores.
- Do not mock gateway checks when testing reference adapters; adapters must receive or derive a real `VerifiedGatewayCheck`.
- Do not mock package exports or import posture; architecture tests read actual files and dynamic imports.
- Do not treat SDK responses, runtime evidence, or review artifacts as authority in tests unless a real policy and gateway path is present.

## Fixtures and Factories

**Test Data:**
```typescript
export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const createdAt = nowIso();
  const tool = { schemaVersion: PROTOCOL_VERSION, toolCapabilityId: "tool_package_install" };
  return { store, kernel, tool, actionType, gateway, envelope };
}
```

**Location:**
- Core protocol fixtures: `test/support/fixtures.ts`.
- Kernel invariant helpers: `test/support/kernel-invariant-helpers.ts`.
- HTTP/D1 harness: `test/support/d1-http-harness.ts`.
- Package install flow helpers: `test/support/package-install-flow.ts` and `test/support/package-manifest-surface.ts`.
- Repo write flow helpers: `test/support/repo-write-flow.ts` and `test/support/repo-write-surface.ts`.
- Codemode multi-action helpers: `test/support/codemode-multi-action-flow.ts`.
- Transition performance budget helper: `test/support/transition-budget-recorder.ts`.

## Coverage

**Requirements:** None enforced by a coverage tool

**View Coverage:**
```bash
# No coverage command is defined in package.json.
```

Coverage posture is invariant-oriented rather than percentage-oriented:
- `test/architecture/*` guards repo shape, import posture, naming, vocabulary, exports, and package surface.
- `test/protocol/model-based-invariants.test.ts` runs scenario command sequences and asserts store invariants after each command.
- `test/protocol/transition-budget-recorder.test.ts` guards read/write/record/event/partition budgets for authority-bearing transitions.
- `test/conformance/protected-mutation-adapter-conformance.test.ts` proves reference adapters do not mutate without a `VerifiedGatewayCheck`.

## Test Types

**Unit Tests:**
- Protocol primitive tests in `test/protocol/*` target transition behavior, canonicalization, refusal format, recovery, receipts, isolation, gateway replay, and model invariants.
- Runtime helper tests in `test/runtime/*` assert generated execution proposal behavior without granting authority.
- Adapter tests in `test/adapters/*` assert no mutation before verified gate and exact-parameter matching.

**Integration Tests:**
- HTTP and D1 tests in `test/http/d1-http.test.ts` run the Hono app against the local D1 harness and migration schema.
- End-to-end protected action tests in `test/integration/package-install-end-to-end.test.ts` and `test/integration/repo-write-d1-http.test.ts` exercise runtime proposal, policy, gateway check, mutation, reconciliation, and receipt behavior.

**E2E Tests:**
- Browser or UI E2E tests are not used.
- The closest full-flow coverage is the local protocol/Hono/D1 integration path in `test/http/d1-http.test.ts` and `test/integration/*`.

**Architecture Tests:**
- `test/architecture/import-posture.test.ts` enforces lane manifests, import boundaries, public area indexes, storage separation, and removed compatibility shims.
- `test/architecture/naming-posture.test.ts` enforces no root tests, no bucket directories, loose-file thresholds, internal planning label exclusion, overclaiming-name bans, and CI binding to `npm run check:repo`.
- `test/architecture/active-vocabulary.test.ts` rejects stale boundary vocabulary in active repo surfaces.
- `test/architecture/root-exports.test.ts` locks the curated root, conformance, and experimental export surfaces.
- `test/architecture/package-surface.test.ts` locks private package posture, packed files, and package-surface scripts.

## Common Patterns

**Async Testing:**
```typescript
const fixture = await createGreenlitContract();
const policy = await fixture.kernel.evaluatePolicy({
  actionContractId: fixture.contract.actionContractId,
  envelopeId: fixture.envelope.envelopeId,
});

if (!policy.greenlight) throw new Error("expected greenlight");
```

**Error Testing:**
```typescript
await expect(
  fixture.kernel.evaluatePolicy({
    actionContractId: fixture.contract.actionContractId,
    envelopeId: "env_other",
  }),
).rejects.toThrow("Policy may evaluate only the envelope pinned by the action contract");
```

**HTTP Error Testing:**
```typescript
const response = await app.request("/v0.2/gateway-check-attempts", {
  method: "POST",
  headers: jsonHeaders("gateway_custody"),
  body: JSON.stringify({ invalid: true }),
});

expect(response.status).toBe(400);
expect(await response.json()).toMatchObject({
  error: { code: "invalid_request", commitState: "not_started" },
});
```

**State and Stream Testing:**
- Assert event order and offsets for action, run, and protected-surface-resource partitions in `test/http/d1-http.test.ts` and `test/protocol/kernel-policy-gateway.test.ts`.
- Assert one-use greenlight behavior by checking replay refusals, `consumedByGateAttemptId`, and mutation counts.
- Assert proof gaps and recovery do not mint new mutation authority in `test/protocol/model-based-invariants.test.ts`.

**Gate Policy:**
- CI in `.github/workflows/check.yml` installs with `bun install --frozen-lockfile` and runs `npm run check:repo`.
- `npm run check:repo` is the full closeout gate: `check:types`, `lint`, `format:check`, `test`, `pack:check`, and `git diff --check`.
- `QUALITY.md` requires TypeScript, lint, formatting, tests, and whitespace to pass before structural cleanup is done.

---

*Testing analysis: 2026-05-19*
