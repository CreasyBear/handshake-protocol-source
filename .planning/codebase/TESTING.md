# Testing Patterns

**Analysis Date:** 2026-05-24

## Test Framework

**Runner:**
- Bun test runner from `bun:test`.
- Version basis: `package.json` declares `packageManager: "bun@1.3.9"` and `.github/workflows/check.yml` installs Bun `1.3.9`.
- Config: Not detected. There is no `bunfig.toml`, `jest.config.*`, or `vitest.config.*`; scripts in `package.json` are the test contract.

**Assertion Library:**
- Bun `expect` from `bun:test`, with matchers such as `toEqual`, `toMatchObject`, `toContain`, `toBeNull`, `toHaveLength`, `toThrow`, and async `.rejects.toThrow`.

**Run Commands:**
```bash
npm run test                 # Run all Bun tests
npm run check:types          # TypeScript strict no-emit check
npm run lint                 # ESLint over src and test with zero warnings
npm run format:check         # Prettier check
npm run pack:check           # Declaration/bundle build, package dry-run, and published entrypoint smoke check
npm run check:repo           # Full local and CI gate
npm run quality:architecture # Architecture/import/surface/conformance slice
npm run quality:claims       # Claim-boundary and active-vocabulary slice
npm run quality:storage      # D1/storage/protocol invariant slice
```

`package.json` defines `check:repo` as:

```bash
npm run check:types && npm run lint && npm run format:check && npm run test && npm run pack:check && git diff --check
```

CI runs the same gate in `.github/workflows/check.yml`.

## Test File Organization

**Location:**
- Tests live under `test/<lane>/`, mirroring source ownership described in `STRUCTURE.md`.
- `test/architecture/` owns repo shape, imports, naming, exports, package surface, claim boundaries, CLI posture, MCP posture, and surface boundary posture.
- `test/protocol/` owns protocol primitives, transition state, policy/gateway invariants, evidence projections, storage contracts, refusal/proof-gap/certificate behavior, and model-based invariants.
- `test/runtime/` owns generated-execution and runtime proposal helpers, including package install, codemode multi-action, x402 runtime ingress, and auth.md candidate compilation.
- `test/adapters/` owns reference gateway fixtures, x402 wallet/probe/install/proposal behavior, repo-write/package-install/preview-deploy gateways, and auth.md redaction/gateway/revocation/bypass behavior.
- `test/conformance/` owns reference conformance checks: `test/conformance/protected-mutation-adapter-conformance.test.ts`, `test/conformance/x402-payment-conformance.test.ts`, and `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- `test/mcp/` owns MCP schema, resource redaction, x402 proposal bridge, reference transcript, and local stdio process proof.
- `test/http/` and `test/integration/` own Hono/D1 protocol paths and end-to-end protected-action paths.
- `test/product/` owns buyer-readable demo report boundaries for local activation and protected-spend outputs.
- `test/support/` holds fixtures and harnesses. It is not a loose test root.

**Naming:**
- Test files use `*.test.ts`, such as `test/architecture/claim-boundary.test.ts`, `test/runtime/runtime-ingress.test.ts`, and `test/mcp/mcp-resource-redaction.test.ts`.
- Root `test/*.test.ts` files are forbidden by `test/architecture/naming-posture.test.ts`.

**Structure:**
```text
test/
  architecture/
  protocol/
  runtime/
  adapters/
  conformance/
  mcp/
  http/
  integration/
  product/
  cli/
  sdk/
  support/
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "bun:test";

describe("runtime ingress adapter", () => {
  it("observes supported dispatch and proposes a contract without policy or gateway authority", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposeRuntimeIngressActionContracts(fixture.kernel, config, input);

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
    expect(await recordCount(fixture.store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);
  });
});
```

This pattern appears in `test/runtime/runtime-ingress.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, and adapter tests such as `test/adapters/x402-wallet-gateway.test.ts`.

**Patterns:**
- Tests assert both positive state and forbidden authority. Example: `test/runtime/runtime-ingress.test.ts` expects action contracts for supported wrapped dispatch and zero `policy_decision`, `greenlight`, `gateway_check_attempt`, `mutation_attempt`, `receipt`, and `authority_certificate` records.
- Tests prefer exact reason codes and discriminated outcomes. Examples: `params_mismatch`, `already_consumed`, `protected_path_probe_failed`, `generated_execution_graph_not_contractable`, and `x402_amount_exceeds_call_bound` in `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-bypass-probes.test.ts`, and `test/runtime/runtime-ingress.test.ts`.
- Tests use explicit record counts through store helpers to prove authority boundaries. Examples: `recordCount()` in `test/runtime/runtime-ingress.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, and `test/http/d1-http.test.ts`.
- Tests check serialized output for absence of secret or authority fields using `JSON.stringify(...).not.toContain(...)`. Examples: `test/mcp/mcp-resource-redaction.test.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/adapters/auth-md-serialization-redaction.test.ts`, and `test/protocol/evidence-projections.test.ts`.
- Tests use helper fixtures to build installed kernel state before exercising transitions. Examples: `createGreenlitContract()` and `makeKernelFixture()` in `test/support/fixtures.ts`, auth.md fixtures in `test/support/auth-md-flow.ts`, and x402 install fixtures inside `test/adapters/x402-wallet-gateway.test.ts`.

## Mocking

**Framework:** Hand-written fakes and in-memory fixtures.

**Patterns:**
```typescript
function fakeEvidenceClient(calls: string[]): McpEvidenceResourceClient {
  return {
    async getContractEvidenceProjection(actionContractId: string) {
      calls.push(`contract:${actionContractId}`);
      return { projection: "contract", actionContractId };
    },
  };
}
```

`test/mcp/mcp-resource-redaction.test.ts` uses the above style to verify routing into read-only projections.

```typescript
function fakeSigningSurface(downstreamPaymentStatus: "succeeded" | "unknown") {
  let signatures = 0;
  const commands: X402PaymentSignatureCommand[] = [];
  return {
    signatureCount: () => signatures,
    signedCommands: () => commands,
    async signPayment(command: X402PaymentSignatureCommand) {
      signatures += 1;
      commands.push(command);
      return { evidenceRef: `evidence:x402-payment-signature:${command.verifiedGate.gateAttemptId}` };
    },
  };
}
```

`test/adapters/x402-wallet-gateway.test.ts` uses this style to prove signing happens only after `VerifiedGatewayCheck`.

**What to Mock:**
- Mock external surfaces at the mutation boundary: package manifest surfaces in `test/support/package-install-flow.ts`, repo-write surfaces in `test/support/repo-write-flow.ts`, preview deploy surfaces in `test/conformance/protected-mutation-adapter-conformance.test.ts`, auth.md downstream API surfaces in `test/adapters/auth-md-serialization-redaction.test.ts`, and x402 signing surfaces in `test/adapters/x402-wallet-gateway.test.ts`.
- Mock SDK/transport clients for role-surface behavior, such as fake runtime clients in `test/mcp/mcp-x402-proposal.test.ts` and fake evidence clients in `test/mcp/mcp-resource-redaction.test.ts`.
- Use `InMemoryProtocolStore` from `src/storage/memory/index.ts` for protocol transition tests unless D1 semantics are the subject.

**What NOT to Mock:**
- Do not mock the protocol kernel when testing state-machine invariants. Tests such as `test/protocol/kernel-policy-gateway.test.ts`, `test/protocol/model-based-invariants.test.ts`, and `test/protocol/evidence-projections.test.ts` use real `HandshakeKernel`.
- Do not mock gateway checks in adapter mutation tests. Use real `gatewayCheck()` and then require `verifiedGatewayCheckFromResult()` in adapter code.
- Do not mock source import/export posture. Architecture tests read actual files and package exports in `test/architecture/import-posture.test.ts`, `test/architecture/root-exports.test.ts`, and `test/architecture/package-surface.test.ts`.
- Do not mock local MCP stdio proof when the process boundary is under test. `test/mcp/mcp-stdio-process.test.ts` runs the local MCP server through official client/server SDK transport.

## Fixtures and Factories

**Test Data:**
```typescript
const digest = `sha256:${"a".repeat(64)}` as const;

function validInstallInput(): X402InstallProposalInput {
  const createdAt = nowIso();
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: "https://api.example.com/mcp/premium-context",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      maxAtomicAmount: "2500",
      paymentRequirementsDigest: digest,
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    spendBounds: {
      maxAtomicAmountPerCall: "2500",
      expiresAt: futureIso(),
    },
  };
}
```

This literal-fixture style appears in `test/adapters/x402-install-proposal.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-bypass-probes.test.ts`, and `test/conformance/x402-upstream-exact-fixtures.test.ts`.

**Location:**
- Shared kernel fixtures: `test/support/fixtures.ts`.
- Flow-specific fixtures: `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, `test/support/codemode-multi-action-flow.ts`, and `test/support/auth-md-flow.ts`.
- HTTP/D1 harness: `test/support/d1-http-harness.ts` and `test/support/http-protocol-fixtures.ts`.
- Invariant helpers: `test/support/kernel-invariant-helpers.ts`.
- Local surface fixtures: `test/support/package-manifest-surface.ts` and `test/support/repo-write-surface.ts`.

## Coverage

**Requirements:** None enforced by tooling. `package.json` has no coverage script and there is no coverage threshold config.

**View Coverage:**
```bash
Not detected
```

Quality is enforced by explicit invariant tests, focused gates, TypeScript strictness, ESLint, Prettier, package dry-run checks, and `git diff --check`.

## Test Types

**Unit Tests:**
- Protocol primitive/unit tests live in `test/protocol/`, such as `test/protocol/canonical.test.ts`, `test/protocol/refusal-format.test.ts`, `test/protocol/object-registry.test.ts`, `test/protocol/reason-code-registry.test.ts`, and `test/protocol/representation-contract.test.ts`.
- Runtime unit tests live in `test/runtime/`, such as `test/runtime/package-install-runtime.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, and `test/runtime/auth-md-candidate-compilation.test.ts`.
- Adapter unit tests live in `test/adapters/`, such as `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, and `test/adapters/auth-md-gateway.test.ts`.

**Integration Tests:**
- D1 and HTTP integration lives in `test/http/d1-http.test.ts`, `test/http/http.test.ts`, and `test/integration/x402-d1-http.test.ts`.
- Protected action end-to-end paths live in `test/integration/package-install-end-to-end.test.ts`, `test/integration/repo-write-d1-http.test.ts`, `test/integration/auth-md-protected-call.test.ts`, and `test/integration/auth-md-receipt-reconstruction.test.ts`.
- Product/demo report tests live in `test/product/self-hosted-activation.test.ts`, `test/product/agent-proof-slice.test.ts`, and `test/product/x402-protected-spend-demo-report.test.ts`.

**E2E Tests:**
- Browser E2E is not used.
- Local process proof exists for MCP stdio in `test/mcp/mcp-stdio-process.test.ts`; it exercises `src/mcp/stdio/entry.ts` through `@modelcontextprotocol/client` and `@modelcontextprotocol/server` without creating authority.

**Architecture Tests:**
- `test/architecture/import-posture.test.ts`: lane imports, protocol area boundaries, public schema/input aggregators, x402 signer import custody, vault/secret API exclusion, object-registry shape, removed shims.
- `test/architecture/naming-posture.test.ts`: workspace junk, root test placement, banned bucket names, loose-file thresholds, `index.ts` public faces, planning-stage labels, stale docs paths, overclaiming names, vague protocol mutation verbs, adapter rail leakage, CI binding.
- `test/architecture/root-exports.test.ts`: curated root exports, explicit `./runtime`, `./conformance`, `./experimental`, and `./sdk/role-clients` surfaces.
- `test/architecture/package-surface.test.ts`: publishable package boundary, exported subpaths, CLI/MCP bins, MCP registry metadata, packable files, and `pack:check` binding.
- `test/architecture/surface-boundary-posture.test.ts`: role/client/CLI/MCP surface boundary manifest, non-authority flags, forbidden route families, credential/output exclusions, import roots.
- `test/architecture/cli-command-posture.test.ts`: CLI command IDs, no mutation-shaped command names, no authority route families, no raw records, and required non-authority JSON fields.
- `test/architecture/mcp-surface-posture.test.ts`: MCP active posture, off-root exports, forbidden imports, and no credential/authority text.
- `test/architecture/claim-boundary.test.ts` and `test/architecture/self-hosted-activation-claim-boundary.test.ts`: local/reference vs hosted/provider claim language.

**Claim-Boundary Tests:**
- `test/architecture/claim-boundary.test.ts` is the main guard for local runtime ingress, x402, adapters, and MCP claims in `README.md`, `examples/x402-protected-spend/README.md`, and lane manifests.
- `test/architecture/active-vocabulary.test.ts` scans active roots for stale vocabulary.
- `test/architecture/self-hosted-activation-claim-boundary.test.ts` ensures the self-hosted activation packet does not claim broad MCP/browser/shell/network/package-manager protection, hosted operation, provider custody proof, cross-org trust, spend-window ledger enforcement, WorkOS/auth.md attestation, or clearing-house readiness.

**x402 Focused Tests:**
- `test/conformance/x402-upstream-exact-fixtures.test.ts` pins official upstream source/package basis, smokes official SDK parsing, decodes `PAYMENT-REQUIRED` into proposal evidence only, refuses missing selected index, refuses unsupported surfaces, and forbids leaking `PaymentPayload`/`PAYMENT-SIGNATURE`.
- `test/conformance/x402-payment-conformance.test.ts` verifies signer custody and bypass probe posture, unsupported first-wedge classification, and evidence taxonomy that does not create authority or settlement finality.
- `test/adapters/x402-install-proposal.test.ts` compiles local/reference x402 install records and refuses exposed signer authority, wildcard bounds, and per-call overrun.
- `test/adapters/x402-payment-action-proposal.test.ts` turns observed or upstream official x402 terms into exact contracts without issuing authority, binds selected requirements/request material, and keeps session/day/review windows as metadata.
- `test/adapters/x402-wallet-gateway.test.ts` creates fixture or official `PaymentPayload`/signature evidence only after a verified gateway check, refuses parameter drift/replay before signing, redacts credential material, and records proof gaps for missing downstream response.
- `test/adapters/x402-bypass-probes.test.ts` records signer side channels, direct MCP payment, token passthrough, wrapper drift, and failure-open posture as bypass evidence; conformance fixtures cannot manufacture gateway-checked posture.
- `test/runtime/runtime-ingress.test.ts` covers wrapped, dynamic, ambiguous, raw sibling, direct MCP, retry, changed-parameter retry, and truncated x402 dispatch paths without issuing authority.
- `test/integration/x402-d1-http.test.ts` exercises the D1/HTTP protected x402 path.
- `test/product/x402-protected-spend-demo-report.test.ts` keeps the demo report inside local/reference evidence claims.

**MCP Redaction and Proposal Tests:**
- `test/mcp/mcp-resource-redaction.test.ts` routes resource URIs through read-only evidence projections, keeps metadata/challenge/certificate resources reference-only, and rejects non-source-owned resource URI families.
- `test/mcp/mcp-schema-contract.test.ts` exposes read resources plus exactly one x402 proposal tool, rejects authority-shaped fields, and requires structured non-authority outcomes.
- `test/mcp/mcp-x402-proposal.test.ts` bridges MCP proposal input to runtime evidence/draft/compilation/contract calls only; it refuses stale metadata, not-ready install, offline gateway, overrun amounts, oversized fields, bypass-shaped inputs, replay/idempotency failures, and ambiguous commit states as structured non-authority outcomes.
- `test/mcp/mcp-reference-transcript.test.ts` pins transcript cases for metadata, valid proposal, evidence readback, stale metadata, tools-list change, install-not-ready, gateway-offline, amount/params mismatch, replay refusal, raw sibling input, and proof-gap uncertainty.
- `test/mcp/mcp-stdio-process.test.ts` exercises the local MCP stdio server through the official SDK and verifies no `PAYMENT-SIGNATURE`, `PaymentPayload`, private key, or authority mutation evidence leaks.

**Adapter Conformance Tests:**
- `test/conformance/protected-mutation-adapter-conformance.test.ts` proves an unsafe adapter fails when it mutates without `VerifiedGatewayCheck`, and applies the same no-mutation conformance to package-install, repo-write, and preview-deploy adapters.
- `src/conformance/index.ts` defines `ProtectedMutationAdapterProbe` and `checkProtectedMutationAdapterConformance()` by comparing mutation counts before and after `attemptWithoutVerifiedGatewayCheck()`.
- `test/architecture/import-posture.test.ts` keeps `checkProtectedMutationAdapterConformance()` on `./conformance`, not the root export.

## Common Patterns

**Async Testing:**
```typescript
await expect(
  proposeRuntimeIngressActionContracts(kernel, config, oversizedInput),
).rejects.toThrow();
```

Use async rejection assertions when schema or transition guards must fail before records are written. Examples: `test/runtime/runtime-ingress.test.ts`, `test/conformance/x402-upstream-exact-fixtures.test.ts`, and `test/mcp/mcp-stdio-process.test.ts`.

**Error Testing:**
```typescript
const result = await runPackageInstallGateway({
  protocol: fixture.kernel,
  surface,
  actionContractId,
  greenlightId,
  observedParameters: changedParameters,
});

expect(result.outcome).toBe("gateway_check_refused");
expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
expect(surface.mutationCount).toBe(0);
```

Use this pattern for gateway refusal and no-mutation assertions in `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/conformance/protected-mutation-adapter-conformance.test.ts`.

**Record Count Testing:**
```typescript
expect(await recordCount(store, "action_contract")).toBe(1);
expect(await recordCount(store, "policy_decision")).toBe(0);
expect(await recordCount(store, "greenlight")).toBe(0);
expect(await recordCount(store, "gateway_check_attempt")).toBe(0);
expect(await recordCount(store, "mutation_attempt")).toBe(0);
```

Use record counts to prove exact authority boundaries, especially in `test/runtime/runtime-ingress.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, and `test/http/d1-http.test.ts`.

**Redaction Testing:**
```typescript
const serialized = JSON.stringify(result);
expect(serialized).not.toContain("PAYMENT-SIGNATURE");
expect(serialized).not.toContain("PaymentPayload");
expect(serialized).not.toContain("privateKey");
expect(serialized).not.toContain("rawCredentialMaterial");
```

Use serialized absence checks for MCP, x402, auth.md, and evidence projection surfaces. See `test/mcp/mcp-resource-redaction.test.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/adapters/auth-md-serialization-redaction.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/protocol/evidence-projections.test.ts`.

**Local/Reference Claim Testing:**
```typescript
const readme = readFileSync("README.md", "utf8");
expect(readme).toContain("not broad x402 compatibility");
expect(readme).toContain("not live provider custody");
expect(readme).not.toMatch(/provider custody claim|hosted dashboard/i);
```

Use claim tests when docs, examples, lane manifests, CLI output, MCP output, or package surfaces could imply hosted/provider enforcement. Primary files: `test/architecture/claim-boundary.test.ts`, `test/architecture/self-hosted-activation-claim-boundary.test.ts`, `test/architecture/cli-command-posture.test.ts`, and `test/architecture/mcp-surface-posture.test.ts`.

---

*Testing analysis: 2026-05-24*
