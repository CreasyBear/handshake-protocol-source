# Testing Patterns

**Analysis Date:** 2026-05-25

## Test Framework

**Runner:**
- Bun test through `bun test`.
- Package manager/runtime declared in `package.json`: `bun@1.3.9`, Node engine `>=20`.
- Config: no separate `bunfig.toml` or Vitest/Jest config detected. Test behavior is driven by `package.json`, TypeScript settings in `tsconfig.json`, and source/test imports.

**Assertion Library:**
- `bun:test` provides `describe`, `it`, and `expect`.
- Common matchers include `toBe`, `toEqual`, `toMatchObject`, `toContain`, `toHaveLength`, `toThrow`, `rejects.toThrow`, and Bun-specific matchers such as `toBeFunction()` and `toBeString()`.

**Run Commands:**
```bash
npm run test                     # Run all Bun tests
npm run test -- test/path.test.ts # Run one focused test file
npm run quality:claims           # Claim-boundary language gate
npm run quality:architecture     # Naming, imports, exports, surface posture, conformance gate
npm run quality:storage          # Storage/kernel invariant slice
npm run check:repo               # Full repo gate
```

## Test File Organization

**Location:**
- Tests are separate from source under `test/**`.
- Test support code lives under `test/support/**`.
- Root `test/*.test.ts` files are forbidden by `test/architecture/naming-posture.test.ts`.

**Naming:**
- Test files use `*.test.ts`.
- Test names describe the boundary or failure mode, not just the implementation path. Examples: `test/architecture/claim-boundary.test.ts`, `test/protocol/kernel-policy-gateway.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`.

**Structure:**
```text
test/
  architecture/   # claim, naming, import, export, package, surface, CLI, MCP gates
  protocol/       # kernel state machine, canonicalization, policy, gateway, evidence, isolation
  runtime/        # generated-execution proposal helpers and runtime ingress
  adapters/       # reference gateway fixtures and adapter profiles
  http/           # Hono/D1 route and store behavior
  integration/    # D1/HTTP end-to-end protected action paths
  mcp/            # proposal/evidence schema and resource contracts
  cli/            # operator/evidence/local readiness command posture
  product/        # demo/readback and acceptance packet contracts
  conformance/    # adapter conformance checks
  sdk/            # role-scoped clients
  adapter-sdk/    # definition-only adapter authoring surface
  support/        # fixtures, fakes, local harnesses, invariant helpers
```

There are 98 `*.test.ts` files under `test/**`.

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "bun:test";
import { makeKernelFixture, registerFixtureObjects } from "../support/fixtures";

describe("runtime ingress adapter", () => {
  it("observes supported dispatch and proposes a contract without policy or gateway authority", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(/* ... */);

    expect(result.responsePosture).toMatchObject({
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
  });
});
```

**Patterns:**
- Build a fixture, register source-owned catalog/envelope/gateway objects, exercise one transition, then assert both returned posture and durable record counts.
- Use `makeKernelFixture()`, `registerFixtureObjects()`, `createGreenlitContract()`, `recordSafeBypassProbes()`, and `proposalInputForCompilation()` from `test/support/fixtures.ts` for kernel tests.
- Use local harnesses for integration boundaries: `createD1HttpHarness()` in `test/support/d1-http-harness.ts`, `createPackageManifestSurface()` in `test/support/package-install-flow.ts`, and `createRepoWriteSurface()` in `test/support/repo-write-flow.ts`.
- Assert negative space directly: no policy decision, no greenlight, no gateway check, no mutation attempt, no signer use, no raw credential material, no receipt export, no hosted/broad claims.

## Mocking

**Framework:** No dedicated mocking library is used.

**Patterns:**
```typescript
const store = new FaultInjectingProtocolStore(new InMemoryProtocolStore());
store.hideListRecordsByTypeOnce("greenlight");

const duplicate = await fixture.kernel.evaluatePolicy({
  actionContractId: fixture.contract.actionContractId,
  envelopeId: fixture.envelope.envelopeId,
});

expect(duplicate.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
```

**What to Mock:**
- Use fakes at system boundaries, not inside the protocol state machine.
- Storage faults are modeled by `FaultInjectingProtocolStore` in `test/support/fault-injecting-protocol-store.ts`.
- D1 is modeled by a local Bun SQLite-backed `LocalD1Database` inside `test/support/d1-http-harness.ts`.
- Filesystem mutation surfaces are modeled by test surfaces such as `FilePackageManifestSurface` in `test/support/package-manifest-surface.ts` and repo-write helpers in `test/support/repo-write-surface.ts`.
- x402 signer behavior is modeled with tracked signing surfaces in `test/adapters/x402-wallet-gateway.test.ts`, while official signer imports stay constrained to `src/adapters/x402-payment/wallet-gateway.ts`.

**What NOT to Mock:**
- Do not mock `HandshakeKernel` transitions when asserting protocol authority behavior. Use the real kernel with `InMemoryProtocolStore`, `D1ProtocolStore`, or `FaultInjectingProtocolStore`.
- Do not mock away gateway checks in adapter tests. Conformance tests in `test/conformance/protected-mutation-adapter-conformance.test.ts` must prove adapters do not mutate without `VerifiedGatewayCheck`.
- Do not mock public surface manifests or package exports. Architecture tests import actual `src/**`, `package.json`, and `server.json`.

## Fixtures and Factories

**Test Data:**
```typescript
export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const createdAt = nowIso();

  const tool: ToolCapability = { /* wrapped consequential tool */ };
  const actionType: ActionType = { /* package.install action type */ };
  const gateway: GatewayRegistryEntry = { /* customer gateway adapter */ };
  const envelope: OperatingEnvelope = { /* allowed action/resource bounds */ };

  return { store, kernel, tool, actionType, gateway, envelope };
}
```

**Location:**
- `test/support/fixtures.ts`: kernel fixtures, catalog registration, safe bypass probes, greenlit contracts.
- `test/support/kernel-invariant-helpers.ts`: kernel posture and out-of-band drift helpers.
- `test/support/d1-http-harness.ts`: Hono/D1 harness with role tokens and local SQLite D1 implementation.
- `test/support/fault-injecting-protocol-store.ts`: fault injection for commit conflicts, ambiguous commits, stale reads, hidden records, and posture drift.
- `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, `test/support/auth-md-flow.ts`: adapter-specific flow builders.
- `test/support/codemode-multi-action-flow.ts`: generated-program/multi-action support.

## Coverage

**Requirements:** Not enforced by a configured coverage threshold or package script.

**View Coverage:**
```bash
bun test --coverage              # Available Bun coverage command, not wired into package scripts
```

Coverage discipline is behavioral rather than percentage-based. New protocol work should add invariant tests for authority creation, refusal, replay, proof gap, projection redaction, isolation, and gateway-side enforcement.

## Test Types

**Unit Tests:**
- Protocol and schema behavior: `test/protocol/canonical.test.ts`, `test/protocol/refusal-format.test.ts`, `test/protocol/reason-code-registry.test.ts`, `test/protocol/object-registry.test.ts`.
- Surface shape and package boundaries: `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/mcp-surface-posture.test.ts`.

**Integration Tests:**
- HTTP and D1-backed protocol paths: `test/http/d1-http.test.ts`, `test/integration/x402-d1-http.test.ts`, `test/integration/repo-write-d1-http.test.ts`.
- End-to-end adapter workflows: `test/integration/package-install-end-to-end.test.ts`, `test/integration/auth-md-protected-call.test.ts`, `test/integration/auth-md-receipt-reconstruction.test.ts`.

**E2E Tests:**
- No browser E2E framework is used.
- Product/demo contract tests act as source-owned acceptance checks: `test/product/self-hosted-activation.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`, `test/product/external-adapter-sdk-demo.test.ts`, `test/product/x402-protected-tool-acceptance.test.ts`.

## Common Patterns

**Async Testing:**
```typescript
await expect(
  proposeRuntimeIngressActionContracts(fixture.kernel, {}, input),
).rejects.toThrow("Runtime ingress package-install dispatch requires packageInstall config.");
```

Use async tests for kernel transitions, HTTP/D1 paths, filesystem surfaces, MCP process proof, CLI commands, and adapter gateways.

**Error Testing:**
```typescript
await expect(
  fixture.kernel.putCatalogObject({ objectType: "greenlight", payload: fixture.greenlight }),
).rejects.toThrow("Direct writes are not allowed");
```

Prefer stable reason codes and posture fields over brittle message-only assertions. Message assertions are acceptable for explicit boundary text already covered by reason-code tests.

**Refusal and proof-gap testing:**
```typescript
expect(result.outcome).toBe("gateway_check_refused");
expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
expect(result.gatewayCheck.mutationAttempt).toBeNull();
expect(surface.signatureCount()).toBe(0);
```

Use this shape when a generated action, observed parameter drift, stale posture, missing evidence, or replay must fail before signer use or mutation.

## Claim-Boundary Gates

`npm run quality:claims` runs:

```bash
npm run test -- test/architecture/active-vocabulary.test.ts test/architecture/claim-boundary.test.ts
```

Use this gate when simplifying product or kernel language in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`, or `examples/x402-protected-spend/README.md`.

The gate enforces:
- `cleared protected-action event`, `protocol kernel`, and `product surface` vocabulary.
- Category language: `protected actions for automated decision making`.
- Certificate boundary: terminal evidence, not permission.
- Distribution boundary: public npm and MCP Registry discoverability do not create authority.
- Production proof ledger and expansion admission language in `docs/internal/decisions.md`.
- Non-claims for hosted operation, provider custody, settlement/finality, broad x402 compatibility, aggregate spend, host-wide containment, and marketplace/certification.

## Architecture and Naming Gates

`npm run quality:architecture` runs:

```bash
npm run test -- test/architecture/import-posture.test.ts test/architecture/naming-posture.test.ts test/architecture/package-surface.test.ts test/architecture/root-exports.test.ts test/architecture/surface-boundary-posture.test.ts test/architecture/cli-command-posture.test.ts test/architecture/mcp-surface-posture.test.ts test/conformance/protected-mutation-adapter-conformance.test.ts
```

Use this gate for source moves, package export changes, CLI/MCP/SDK surface changes, adapter conformance changes, and naming simplification.

The gate enforces:
- No workspace junk or scratch canon in active repo surfaces.
- No bucket source path names.
- No internal planning-stage labels in repo-facing surfaces.
- No vague protocol mutation names or overclaiming function names.
- Public source lanes have `LANE.md` ownership manifests.
- Protocol, HTTP, runtime, storage, SDK, MCP, adapters, and surfaces keep their import boundaries.
- Surface outputs carry non-authority posture and forbid credential/raw record/payment material leakage.
- Package files exclude `src`, `test`, `examples`, scripts, `.planning`, `.agents`, and internal docs.
- Adapter conformance proves no mutation can occur without `VerifiedGatewayCheck`.

## Projection-Vs-Authority Tests

Use these tests when changing readback, projection, CLI, MCP, SDK role clients, or support bundles:

- `test/architecture/surface-boundary-posture.test.ts`: each surface has `authorityPosture`, route families, forbidden credentials, forbidden outputs, non-authority flags, and claim-boundary labels.
- `test/architecture/cli-command-posture.test.ts`: CLI commands stay evidence/local-readiness/conformance oriented and reject mutation-shaped command names.
- `test/architecture/mcp-surface-posture.test.ts`: MCP stays proposal/evidence only and cannot name executable authority or credential material.
- `test/protocol/evidence-projections.test.ts`: projections expose redacted evidence without creating authority.
- `test/protocol/representation-contract.test.ts`: Metadata, Challenge, Request, and EvidenceProjection shapes stay non-authority.
- `test/sdk/role-clients.test.ts`: role-scoped clients do not acquire all-role authority.

## Protocol Simplification Gate

When simplifying confusing kernel language, test the simplification against three slices:

```bash
npm run quality:claims
npm run quality:architecture
npm run test -- test/protocol/kernel-compilation-contract.test.ts test/protocol/kernel-policy-gateway.test.ts test/protocol/evidence-projections.test.ts test/runtime/runtime-ingress.test.ts
```

This is the minimum focused slice for language changes that touch proposal, evidence, action contracts, policy, gateway checks, and readback. Add adapter-specific tests such as `test/adapters/x402-wallet-gateway.test.ts` or `test/integration/x402-d1-http.test.ts` when the wording change affects x402 signer custody, per-call spend, PaymentPayload evidence, replay refusal, or downstream proof gaps.

---

*Testing analysis: 2026-05-25*
