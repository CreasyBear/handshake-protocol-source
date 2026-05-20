# Testing Patterns

**Analysis Date:** 2026-05-20

## Test Framework

**Runner:**
- Bun `1.3.9`, configured by `package.json` and installed in CI through `.github/workflows/check.yml`.
- Tests import `describe`, `expect`, and `it` from `bun:test` across `test/**/*.test.ts`.
- Config: no separate Bun test config detected; `package.json` scripts are the command contract.

**Assertion Library:**
- Bun's built-in assertion API from `bun:test`.
- Assertions use `toBe`, `toEqual`, `toMatchObject`, `toHaveLength`, `toContain`, `toThrow`, and `rejects.toThrow` across `test/protocol/**`, `test/http/**`, `test/adapters/**`, and `test/integration/**`.

**Run Commands:**
```bash
npm run check:repo              # Full local and CI gate: types, lint, format, Bun tests, pack check, diff whitespace
npm run test                    # All Bun tests
npm run check:types             # TypeScript no-emit gate with stable CI output
npm run lint                    # ESLint over src and test with zero warnings
npm run format:check            # Prettier check
npm run pack:check              # Declaration build plus package dry-run surface check
npm run quality:architecture    # Import, naming, package surface, root exports, adapter conformance
npm run quality:claims          # Active vocabulary guard
npm run quality:storage         # D1, kernel, model, lifecycle, projection, and atomicity slices
```

## Test File Organization

**Location:**
- Tests are under `test/architecture`, `test/protocol`, `test/http`, `test/runtime`, `test/adapters`, `test/conformance`, `test/integration`, and `test/support`.
- Root `test/*.test.ts` files are forbidden by `test/architecture/naming-posture.test.ts`.
- Test helpers live in `test/support/*` and are imported by feature tests instead of hidden global setup.

**Naming:**
- Use `*.test.ts` for executable tests, as in `test/protocol/kernel-policy-gateway.test.ts` and `test/adapters/package-install-gateway.test.ts`.
- Use lane names and protected-action names in test filenames. Examples include `test/runtime/codemode-multi-action-runtime.test.ts`, `test/integration/repo-write-d1-http.test.ts`, and `test/adapters/x402-wallet-gateway.test.ts`.

**Structure:**
```text
test/
  architecture/      repo shape, naming, imports, package surface, active vocabulary, root exports
  protocol/          kernel transitions, state matrices, storage atomicity, projections, reason codes
  http/              Hono route behavior, caller custody, OpenAPI parity, D1-backed behavior
  runtime/           generated-execution proposal helpers and refusal boundaries
  adapters/          reference gateway fixture behavior and bypass probes
  conformance/       external-facing reference posture checks
  integration/       full local protected-action paths through runtime, policy, gateway, and storage
  support/           fixtures, local D1 harness, fault injection, protected-surface test surfaces
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "bun:test";

describe("package install runtime wrapper", () => {
  it("turns a generated package-install tool call into an intent compilation and exact action contract", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
      principalIntentRef: "intent:install hono",
      generatedCodeOrSpecRef: "code:package-install-tool-call",
      package: "hono",
      versionRange: "^4.12.19",
    });

    expect(result.outcome).toBe("action_contract_proposed");
    if (result.outcome !== "action_contract_proposed") throw new Error("expected action contract");
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(0);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });
});
```

**Patterns:**
- Arrange with explicit fixtures from `test/support/fixtures.ts`, `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, and `test/support/codemode-multi-action-flow.ts`.
- Act through the real lane surface under test. Runtime tests call `src/runtime/*/action-proposal.ts`; protocol tests call `src/protocol/kernel.ts`; adapter tests call `src/adapters/*/gateway.ts`; HTTP tests call `src/http/app.ts` or `src/sdk/client.ts`.
- Assert both domain outcome and authority side effects. Examples include record counts in `test/runtime/package-install-runtime.test.ts`, event chains in `test/integration/package-install-end-to-end.test.ts`, and no-mutation assertions in `test/adapters/package-install-gateway.test.ts`.
- Use explicit narrowing errors after discriminated outcome checks. Examples live in `test/runtime/package-install-runtime.test.ts` and `test/integration/repo-write-d1-http.test.ts`.

## Mocking

**Framework:** Hand-rolled fixtures and fake surfaces; no Jest/Vitest-style mock framework detected.

**Patterns:**
```typescript
const surface: PackageInstallMutationSurface = {
  async applyPackageInstall() {
    mutationCount += 1;
    throw Object.assign(new Error("registry unavailable"), {
      downstreamRetryability: "retryable",
      providerRequestRef: "provider-request:package-install:failed",
      evidenceRefs: ["evidence:provider:package-install:failed"],
    });
  },
};
```

**What to Mock:**
- Protected external surfaces, using fixture surfaces such as `createPackageManifestSurface` in `test/support/package-install-flow.ts`, `createRepoWriteSurface` in `test/support/repo-write-flow.ts`, and preview deploy surfaces in `test/support/preview-deploy-flow.ts`.
- Store anomalies, using `test/support/fault-injecting-protocol-store.ts` for stale reads, hidden records, and stream conflicts.
- D1 locally, using the Bun SQLite-backed `LocalD1Database` in `test/support/d1-http-harness.ts`.
- Provider failures as typed thrown errors on fixture surfaces, as in `test/adapters/package-install-gateway.test.ts`.

**What NOT to Mock:**
- Do not mock the protocol kernel when the invariant under test is policy, gateway, idempotency, receipt, proof-gap, isolation, or recovery behavior. Use `src/protocol/kernel.ts` through `test/support/fixtures.ts`.
- Do not mock package export boundaries. `test/architecture/root-exports.test.ts` imports `../../src`, `../../src/conformance`, and `../../src/experimental` directly.
- Do not mock the package surface. `scripts/check-package-surface.mjs` uses `npm pack --dry-run --json`, and `test/architecture/package-surface.test.ts` checks `package.json`.

## Fixtures and Factories

**Test Data:**
```typescript
export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const createdAt = nowIso();

  const tool: ToolCapability = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    toolCapabilityId: "tool_package_install",
    toolName: "bun add",
    readWriteClassification: "consequential",
    wrapperStatus: "wrapped",
    rawBypassPossible: true,
  };

  return { store, kernel, tool, actionType, gateway, envelope };
}
```

**Location:**
- `test/support/fixtures.ts`: kernel, catalog, envelope, candidate, proof-gap, and helper factory patterns.
- `test/support/d1-http-harness.ts`: local D1/Hono harness for HTTP and D1 persistence tests.
- `test/support/fault-injecting-protocol-store.ts`: stale-read and conflict injection.
- `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, and `test/support/codemode-multi-action-flow.ts`: protected-action-specific fixture objects and runtime config.

## Coverage

**Requirements:** No numeric coverage threshold is enforced in `package.json`.

**View Coverage:**
```bash
bun test
```

Use focused gates instead of percentage coverage when validating changes. `package.json` defines `quality:architecture`, `quality:storage`, and `quality:claims`; CI runs the broader `check:repo` gate in `.github/workflows/check.yml`.

## Test Types

**Architecture Guards:**
- `test/architecture/import-posture.test.ts` enforces lane manifests, import direction, public indexes, protocol/public aggregator constraints, route metadata separation, storage boundaries, and removed compatibility shims.
- `test/architecture/naming-posture.test.ts` enforces no workspace junk, no root test files, no bucket path names, loose-file limits, public faces, no internal planning labels in active surfaces, no overclaiming names, and CI binding to `npm run check:repo`.
- `test/architecture/root-exports.test.ts` enforces the root export set and keeps conformance and experimental fixtures on explicit subpaths.
- `test/architecture/package-surface.test.ts` checks `package.json` privacy, exports, packable files, and `pack:check` binding.
- `test/architecture/active-vocabulary.test.ts` keeps stale boundary vocabulary out of active docs, commands, migrations, source, and tests.

**Unit Tests:**
- Protocol unit tests in `test/protocol/*` target individual transitions, matrices, projections, reason-code registries, idempotency, recovery, and storage contracts.
- Runtime unit tests in `test/runtime/*` verify generated-execution proposal helpers produce candidates/contracts or refusals without policy or gateway authority.
- Adapter unit tests in `test/adapters/*` verify no mutation before `VerifiedGatewayCheck`, observed-parameter binding, replay refusal, and downstream failure evidence.

**Integration Tests:**
- `test/integration/package-install-end-to-end.test.ts` covers generated orchestration -> action contract -> policy greenlight -> gateway check -> mutation -> receipt/reconciliation using memory storage.
- `test/integration/repo-write-d1-http.test.ts` covers repo write through `HandshakeClient`, Hono/D1, content-digest-bound gateway checks, and refusal on content drift.
- `test/integration/x402-d1-http.test.ts` covers the local payment signature path through D1/HTTP, hostile bypass/custody posture, replay refusal, and proof gaps. This is local fixture proof, not provider-side enforcement.

**E2E Tests:**
- Browser or hosted E2E tests are not used. The highest-scope tests are local integration tests under `test/integration/*` and D1-backed HTTP tests under `test/http/d1-http.test.ts`.

## Common Patterns

**Async Testing:**
```typescript
await expect(
  fixture.kernel.evaluatePolicy({
    actionContractId: "act_missing_model",
    envelopeId: context.fixture.envelope.envelopeId,
  }),
).rejects.toThrow("action_contract act_missing_model was not found");
```

**Error Testing:**
```typescript
expect(result.outcome).toBe("gateway_check_refused");
expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
expect(surface.mutationCount).toBe(0);
```

**Event Chain Testing:**
```typescript
expect(events.map((event) => event.eventType)).toEqual([
  "action_proposed",
  "policy_decision_recorded",
  "action_greenlit",
  "idempotency_ledger_recorded",
  "gateway_checked",
  "mutation_attempted",
  "protected_surface_operation_claimed",
  "receipt_emitted",
  "surface_operation_reconciled",
  "protected_surface_operation_released",
]);
for (let index = 1; index < events.length; index += 1) {
  expect(events[index]?.previousEventDigest).toBe(events[index - 1]?.eventDigest);
}
```

**Model/Invariants:**
- `test/protocol/model-based-invariants.test.ts` defines command sequences and asserts that every mutation attempt has an action contract, policy decision, greenlight, and gateway check, and that no greenlight authorizes multiple mutation attempts.
- `test/protocol/protocol-store-atomicity-contract.test.ts` runs the same atomicity contract over memory and D1 stores.

## Verification Strategy

**Before changing source or tests:**
- Run the narrow lane test for the touched path, such as `npm run test -- test/runtime/package-install-runtime.test.ts` or `npm run test -- test/adapters/package-install-gateway.test.ts`.
- Run the relevant focused quality gate from `package.json`: `quality:architecture`, `quality:storage`, or `quality:claims`.

**Before closeout:**
- Run `npm run check:repo` from `package.json`. This is also the CI command in `.github/workflows/check.yml`.
- If package exports or public surfaces changed, inspect `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`, `src/index.ts`, `src/conformance/index.ts`, `src/experimental.ts`, and `scripts/check-package-surface.mjs`.
- If source-owned navigation or reason codes changed, run `npm run test -- test/protocol/protocol-navigation.test.ts test/protocol/reason-code-registry.test.ts`.

---

*Testing analysis: 2026-05-20*
