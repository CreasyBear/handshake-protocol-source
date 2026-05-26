# Testing Patterns

**Analysis Date:** 2026-05-26

## Test Framework

**Runner:**
- Bun test runner via `bun test`.
- Runtime/package manager version is pinned as `bun@1.3.9` in `package.json`; CI installs Bun 1.3.9 in `.github/workflows/check.yml`.
- No `bunfig.toml`, `vitest.config.*`, or `jest.config.*` file is present.

**Assertion Library:**
- Use `bun:test` for `describe`, `it`, and `expect`. Examples: `test/protocol/canonical.test.ts`, `test/http/http.test.ts`, `test/architecture/import-posture.test.ts`.
- Use Bun-specific matchers where useful: `toBeString`, `toBeFunction`, `rejects.toThrow`, `toMatchObject`, `arrayContaining`, and `it.each` appear in tests such as `test/protocol/kernel-policy-gateway.test.ts`, `test/sdk/role-clients.test.ts`, and `test/protocol/negotiation-schemas.test.ts`.

**Run Commands:**
```bash
npm run test                 # Run all Bun tests through package script
bun test                     # Run all tests directly
npm run quality:architecture # Run architecture/import/export/naming/conformance gate slice
npm run quality:claims       # Run public-claim and vocabulary boundary tests
npm run quality:storage      # Run storage, transition, model, and receipt invariant slices
npm run check:repo           # Full build, typecheck, lint, format, tests, package checks, and git diff whitespace check
```

## Test File Organization

**Location:**
- Tests live under `test/<domain>/*.test.ts`; 113 `.test.ts` files are present under `test`.
- Shared test-only helpers live under `test/support`: `test/support/fixtures.ts`, `test/support/fault-injecting-protocol-store.ts`, `test/support/d1-http-harness.ts`, `test/support/transition-budget-recorder.ts`.
- No root `test/*.test.ts` files are allowed. `test/architecture/naming-posture.test.ts` enforces this.

**Naming:**
- Use `<subject>.test.ts` names inside the relevant domain: `test/protocol/kernel-policy-gateway.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, `test/product/external-adapter-sdk-demo.test.ts`.
- Use architecture gate names for repo shape and claims: `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/claim-boundary.test.ts`.
- Use schema/registry/event names for protocol evidence slices: `test/protocol/negotiation-schemas.test.ts`, `test/protocol/negotiation-object-registry.test.ts`, `test/protocol/negotiation-events.test.ts`.

**Structure:**
```text
test/
  architecture/   # Static repo, import, naming, package, claim, CI, and authority-surface posture gates
  protocol/       # Protocol state machine, schemas, canonicalization, policy, gateway, receipt, recovery invariants
  http/           # Hono app, route/admission, hosted identity, D1-backed HTTP behavior
  runtime/        # Generated execution proposal wrappers and runtime ingress
  adapters/       # Reference gateway/adaptor behavior, x402/auth-md/package/repo/preview slices
  conformance/    # Adapter conformance and upstream x402 shape checks
  integration/    # Cross-lane flows over protocol, adapters, and D1/HTTP harnesses
  product/        # Demo/readback outputs and package consumer proofs
  sdk/            # Role-scoped SDK client behavior
  cli/            # CLI projections and local readback commands
  mcp/            # MCP schema/resource/proposal/stdio behavior
  adapter-sdk/    # Adapter authoring SDK contract tests
  storage/        # Storage cache behavior
  support/        # Fixtures, fake stores, local D1 harness, flow builders
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "bun:test";
import { NegotiationSessionSchema } from "../../src/protocol/areas/negotiation";

describe("negotiation evidence schemas", () => {
  it("parses a strict NegotiationSession with explicit party proof posture and imported external evidence", () => {
    expect(NegotiationSessionSchema.parse(validSession())).toMatchObject({
      negotiationSessionId: "negotiation_session_demo",
      externalProtocolEvidenceRefs: [{ evidencePosture: "imported_evidence_only" }],
    });
  });
});
```
Source pattern: `test/protocol/negotiation-schemas.test.ts`.

**Patterns:**
- Use `describe` blocks around the invariant surface, not only the implementation class. Examples: `"Handshake kernel invariants: policy and gateway"` in `test/protocol/kernel-policy-gateway.test.ts`, `"protocol module import posture"` in `test/architecture/import-posture.test.ts`.
- Use test names that state the protected invariant or forbidden behavior: `test/runtime/codemode-multi-action-runtime.test.ts` checks that generated programs emit ordered contracts without policy or gateway authority.
- Assert both positive state and absence of authority side effects. Examples: `test/runtime/runtime-ingress.test.ts` checks zero policy decisions, greenlights, gateway checks, and mutation attempts after runtime proposal.
- Use exact record counts for protocol side effects when authority boundaries matter. Examples: `test/protocol/kernel-policy-gateway.test.ts`, `test/runtime/runtime-ingress.test.ts`.
- Use `try/finally` when harnesses need cleanup. Example: `test/protocol/protocol-store-atomicity-contract.test.ts` disposes memory/D1 harnesses.
- Use table tests with `it.each` for forbidden vocabularies, unsupported surfaces, and object-kind matrices. Examples: `test/protocol/negotiation-schemas.test.ts`, `test/conformance/x402-payment-conformance.test.ts`, `test/protocol/kernel-cross-scope-matrix.test.ts`.

## Mocking

**Framework:** Hand-written fakes and harnesses; no Jest/Vitest/Bun mock API usage was detected in `src` or `test`.

**Patterns:**
```typescript
class MockKvNamespace {
  readonly putCalls: Array<{ key: string; value: string; options?: KVNamespacePutOptions }> = [];
  readonly deleteCalls: string[] = [];

  async put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void> {
    this.putCalls.push(options ? { key, value, options } : { key, value });
  }

  async delete(key: string): Promise<void> {
    this.deleteCalls.push(key);
  }
}
```
Source pattern: `test/storage/kv-isolation-cache.test.ts`.

**What to Mock:**
- Mock transport with explicit fake `fetch` implementations that capture path, method, headers, and body. Example: `captureFetch` in `test/sdk/role-clients.test.ts`.
- Mock persistence faults with protocol-store wrappers rather than global monkeypatching. Example: `FaultInjectingProtocolStore` in `test/support/fault-injecting-protocol-store.ts`.
- Mock D1 locally with Bun SQLite while preserving D1-shaped methods. Example: `LocalD1Database` and `LocalD1PreparedStatement` in `test/support/d1-http-harness.ts`.
- Mock host file surfaces with fixture classes. Examples: `test/support/package-manifest-surface.ts`, `test/support/repo-write-surface.ts`.
- Mock KV bindings with narrow local classes that record calls. Example: `MockKvNamespace` in `test/storage/kv-isolation-cache.test.ts`.

**What NOT to Mock:**
- Do not mock the protocol state machine when testing policy/gateway behavior. Use `HandshakeKernel` with `InMemoryProtocolStore`, `D1ProtocolStore`, or a fault-injecting wrapper as in `test/protocol/kernel-policy-gateway.test.ts`.
- Do not mock architecture rules. Static tests read real files with `node:fs` in `test/architecture/import-posture.test.ts`, `test/architecture/naming-posture.test.ts`, and `test/architecture/negotiation-no-authority-surface.test.ts`.
- Do not mock product demos when their generated output is the contract. `test/product/external-adapter-sdk-demo.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`, and `test/product/service-workflow-admission.test.ts` run scripts with `Bun.spawn` and inspect generated artifacts.
- Do not mock MCP stdio when checking process proof. `test/mcp/mcp-stdio-process.test.ts` uses `runMcpStdioProcessProof` against the local stdio server.
- Do not mock gateway checks away in adapter mutation tests. `test/adapters/x402-wallet-gateway.test.ts` asserts signer invocation only after a verified gateway check.

## Fixtures and Factories

**Test Data:**
```typescript
export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const createdAt = nowIso();

  const tool = { toolCapabilityId: "tool_package_install", readWriteClassification: "consequential" };
  const actionType = { actionTypeId: "atype_package_install", actionClass: "package.install" };
  const gateway = { gatewayRegistryEntryId: "gateway_registry_package", gatewayId: "gateway_package_manager" };
  const envelope = { envelopeId: "env_demo", allowedActionClasses: ["package.install"] };

  return { store, kernel, tool, actionType, gateway, envelope };
}
```
Condensed source pattern: `test/support/fixtures.ts`.

**Location:**
- Core protocol fixtures: `test/support/fixtures.ts`.
- Gateway/posture invariant helpers: `test/support/kernel-invariant-helpers.ts`.
- Store fault injection: `test/support/fault-injecting-protocol-store.ts`.
- Transition performance budgets: `test/support/transition-budget-recorder.ts`.
- HTTP/D1 harness: `test/support/d1-http-harness.ts`.
- HTTP protocol fixtures: `test/support/http-protocol-fixtures.ts`.
- Runtime flow fixtures: `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, `test/support/codemode-multi-action-flow.ts`, `test/support/auth-md-flow.ts`.
- Negotiation fixtures are local to their test files for now: `test/protocol/negotiation-schemas.test.ts`, `test/protocol/negotiation-object-registry.test.ts`, `test/protocol/negotiation-events.test.ts`.

## Coverage

**Requirements:** No line or branch coverage threshold is configured. No coverage script appears in `package.json`, and no coverage config file was detected.

**View Coverage:**
```bash
bun test --coverage # Available Bun capability, not a repo-defined gate
```

**Gate Coverage:** Invariant coverage is enforced by focused scripts in `package.json`: `quality:architecture`, `quality:claims`, and `quality:storage`. The full closeout gate is `npm run check:repo`.

## Test Types

**Unit Tests:**
- Protocol primitive and pure helper tests live under `test/protocol`: `test/protocol/canonical.test.ts`, `test/protocol/reason-code-registry.test.ts`, `test/protocol/refusal-format.test.ts`.
- Protocol schema tests validate Zod contract shape and negative authority-shaped fields: `test/protocol/negotiation-schemas.test.ts`, `test/protocol/object-registry.test.ts`, `test/protocol/representation-contract.test.ts`.
- Surface client tests live under `test/sdk`: `test/sdk/role-clients.test.ts`.
- Adapter unit tests live under `test/adapters`: `test/adapters/package-install-gateway.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`.

**Integration Tests:**
- D1/HTTP-backed flows live under `test/http` and `test/integration`: `test/http/d1-http.test.ts`, `test/integration/x402-d1-http.test.ts`, `test/integration/package-install-end-to-end.test.ts`.
- Store parity and atomicity are tested across memory and D1 via `test/protocol/protocol-store-atomicity-contract.test.ts`.
- Runtime-generated multi-action behavior is tested through kernel + fixtures in `test/runtime/codemode-multi-action-runtime.test.ts`.

**E2E Tests:**
- Product/demo smoke tests execute scripts or package-facing flows: `test/product/external-adapter-sdk-demo.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`, `test/product/hosted-package-consumer.test.ts`, `test/product/service-workflow-admission.test.ts`.
- MCP process proof uses the local stdio server path in `test/mcp/mcp-stdio-process.test.ts`.
- CLI readback and local project behavior live under `test/cli`: `test/cli/cli-evidence.test.ts`, `test/cli/cli-local-project.test.ts`, `test/cli/cli-x402-install-probes.test.ts`.

**Architecture Tests:**
- Repo shape and naming posture are first-class tests: `test/architecture/naming-posture.test.ts`.
- Import and lane boundaries are tested in `test/architecture/import-posture.test.ts`.
- Package exports and packable files are tested in `test/architecture/package-surface.test.ts` and `test/architecture/root-exports.test.ts`.
- Public claim language is tested in `test/architecture/claim-boundary.test.ts` and `test/architecture/active-vocabulary.test.ts`.
- Negotiation remains schema-only and non-authority through `test/architecture/negotiation-no-authority-surface.test.ts`.

**Conformance Tests:**
- Adapter no-mutation and gateway posture conformance live in `test/conformance/protected-mutation-adapter-conformance.test.ts`.
- x402 upstream exact fixture and first-wedge conformance live in `test/conformance/x402-upstream-exact-fixtures.test.ts` and `test/conformance/x402-payment-conformance.test.ts`.

**Negotiation Evidence Tests:**
- Commit `4946237` added schema-only negotiation evidence coverage. `test/protocol/negotiation-schemas.test.ts` validates strict evidence schemas for sessions, offers, decisions, linked agreements, obligation bindings, status transitions, and imported external protocol refs.
- `test/protocol/negotiation-object-registry.test.ts` verifies negotiation object types are registered as `transition_evidence` with `audit_read` posture and payload-owned object IDs.
- `test/protocol/negotiation-events.test.ts` accepts only recorded-only negotiation stream events and rejects authority-shaped names such as `negotiation_authorized`, `agreement_executed`, and `agreement_certified`.
- `test/architecture/negotiation-no-authority-surface.test.ts` blocks negotiation imports into protected-action control areas, rejects `src/protocol/areas/negotiation/transitions.ts`, keeps negotiation out of `src/index.ts`, and prevents CLI/MCP/HTTP/SDK/adapters/storage/runtime surfaces from importing it.

Focused command for this slice:
```bash
npm run test -- test/protocol/negotiation-schemas.test.ts test/protocol/negotiation-object-registry.test.ts test/protocol/negotiation-events.test.ts test/architecture/negotiation-no-authority-surface.test.ts
```

## Common Patterns

**Async Testing:**
```typescript
const fixture = await createGreenlitContract();
const duplicate = await fixture.kernel.evaluatePolicy({
  actionContractId: fixture.contract.actionContractId,
  envelopeId: fixture.envelope.envelopeId,
});

expect(duplicate.decision.decision).toBe("refuse");
expect(duplicate.greenlight).toBeNull();
```
Source pattern: `test/protocol/kernel-policy-gateway.test.ts`.

**Error Testing:**
```typescript
await expect(
  fixture.kernel.putCatalogObject({ objectType: "greenlight", payload: fixture.greenlight }),
).rejects.toThrow("Direct writes are not allowed");
```
Source pattern: `test/protocol/kernel-policy-gateway.test.ts`.

**Compile-Time Negative Testing:**
```typescript
const invalidGatewayRoleMap: GatewayClientOptions = {
  roleCredential: "gateway-token",
  // @ts-expect-error gateway client must not accept role maps.
  transitionTokens: {},
};
void invalidGatewayRoleMap;
```
Source pattern: `test/sdk/role-clients.test.ts`.

**Redaction Testing:**
```typescript
expect(JSON.stringify(output)).not.toContain("PaymentPayload");
expect(JSON.stringify(output)).not.toContain("PAYMENT-SIGNATURE");
expect(JSON.stringify(output)).not.toContain("privateKey");
```
Source patterns: `test/cli/cli-evidence.test.ts`, `test/mcp/mcp-stdio-process.test.ts`, `test/protocol/credential-custody.test.ts`.

**Static Source Tests:**
```typescript
const violations = walk("src")
  .map((file) => normalize(file))
  .filter((file) => file.endsWith(".ts"))
  .filter((file) => file.split("/").some((segment) => bannedSourcePathSegments.has(segment)));

expect(violations).toEqual([]);
```
Source pattern: `test/architecture/naming-posture.test.ts`.

**Authority-Surface Negative Tests:**
```typescript
expect(existsSync(join(negotiationRoot, "transitions.ts"))).toBe(false);
expect(readFileSync("src/index.ts", "utf8")).not.toContain("Negotiation");
expect(violations).toEqual([]);
```
Source pattern: `test/architecture/negotiation-no-authority-surface.test.ts`.

**Store Parity Tests:**
```typescript
for (const factory of storeFactories) {
  describe(`ProtocolStore atomicity contract (${factory.name})`, () => {
    it("does not partially commit protocol records when greenlight issuance conflicts", async () => {
      const { store, dispose } = await factory.create();
      try {
        // assertions against the real ProtocolStore contract
      } finally {
        await dispose();
      }
    });
  });
}
```
Source pattern: `test/protocol/protocol-store-atomicity-contract.test.ts`.

---

*Testing analysis: 2026-05-26*
