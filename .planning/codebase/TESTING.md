# Testing Patterns

**Analysis Date:** 2026-05-23

## Test Framework

**Runner:**
- Bun test runner from `bun@1.3.9`.
- Config: no `vitest.config.*` or `jest.config.*` detected; test behavior is driven by `package.json`, `tsconfig.json`, and Bun defaults.
- Test imports use `import { describe, expect, it } from "bun:test";` across files such as `test/protocol/kernel-policy-gateway.test.ts`, `test/mcp/mcp-schema-contract.test.ts`, and `test/cli/cli-evidence.test.ts`.

**Assertion Library:**
- Bun's built-in `expect` API from `bun:test`.
- Tests use `toEqual`, `toMatchObject`, `toBe`, `toBeNull`, `toHaveLength`, `toContain`, `toStartWith`, `toMatch`, `rejects.toThrow`, `rejects.toMatchObject`, and `resolves.toMatchObject`.

**Run Commands:**
```bash
npm run test                  # Run all Bun tests
npm run check:types           # TypeScript check with no pretty output
npm run lint                  # ESLint over src and test with zero warnings
npm run format:check          # Prettier check
npm run quality:architecture  # Import, naming, export, surface, and conformance guard slice
npm run quality:storage       # D1/store/kernel/storage invariant slice
npm run quality:claims        # Vocabulary and claim-boundary slice
npm run check:repo            # Full local and CI gate
npm run demo:aps              # Generate local x402 protected-spend report
npm run demo:mcp-transcript   # Generate source-owned MCP x402 reference transcript
```

## Test File Organization

**Location:**
- Tests are separate from source under `test/`, not colocated beside `src/`.
- Current test files are grouped by authority and surface lane: `test/protocol/`, `test/architecture/`, `test/http/`, `test/runtime/`, `test/adapters/`, `test/mcp/`, `test/cli/`, `test/sdk/`, `test/conformance/`, `test/product/`, and `test/integration/`.
- Shared test-only support lives in `test/support/`, including `test/support/fixtures.ts`, `test/support/d1-http-harness.ts`, `test/support/fault-injecting-protocol-store.ts`, `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, and `test/support/preview-deploy-flow.ts`.

**Naming:**
- Use `*.test.ts` suffix for executable tests.
- Name test files by the invariant or surface guarded: `test/architecture/import-posture.test.ts`, `test/architecture/mcp-surface-posture.test.ts`, `test/protocol/credential-custody.test.ts`, `test/runtime/runtime-ingress.test.ts`, and `test/integration/x402-d1-http.test.ts`.
- Do not add root-level `test/*.test.ts`; `test/architecture/naming-posture.test.ts` enforces this.

**Structure:**
```text
test/
  architecture/      repo shape, naming, exports, vocabulary, surfaces
  protocol/          protocol primitives and state-machine invariants
  conformance/       reference conformance and x402 first-wedge parity checks
  http/              Hono/Worker transport and D1-over-HTTP behavior
  runtime/           generated-execution proposal helpers
  mcp/               model-facing proposal/evidence surface contracts
  cli/               local evidence/manifest command contracts
  sdk/               role-scoped client boundaries
  adapters/          reference gateway fixtures
  integration/       end-to-end protected action paths
  product/           proof-slice and demo-report behavior
  support/           fixtures, harnesses, and local mutation surfaces
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "bun:test";
import { createGreenlitContract } from "../support/fixtures";

describe("Handshake kernel invariants: policy and gateway", () => {
  it("records refusal instead of issuing a second greenlight for the same action contract", async () => {
    const fixture = await createGreenlitContract();

    const duplicate = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });

    expect(duplicate.decision.decision).toBe("refuse");
    expect(duplicate.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
    expect(duplicate.greenlight).toBeNull();
  });
});
```

**Patterns:**
- Keep setup local to each `it()` instead of global hooks. The tree uses explicit per-test fixture construction in `test/support/fixtures.ts`, `test/support/d1-http-harness.ts`, and test-local helper functions.
- Assert exact protocol states and reason codes, not only success booleans. Examples: `idempotency_duplicate_authority` in `test/protocol/kernel-policy-gateway.test.ts`, `params_mismatch` in `test/adapters/x402-wallet-gateway.test.ts`, and `mcp_input_schema_invalid` in `src/mcp/x402-proposal.ts` tests.
- Assert absence of authority and credential material on proposal/evidence surfaces. Examples: non-authority flags in `test/mcp/mcp-schema-contract.test.ts`, CLI flags in `test/cli/cli-evidence.test.ts`, and surface manifest checks in `test/architecture/surface-boundary-posture.test.ts`.
- For D1/HTTP tests, create a harness per test and dispose it in `finally`; see `test/integration/x402-d1-http.test.ts` and `test/http/d1-http.test.ts`.
- Use table loops for matrix behavior where the test's purpose is coverage over variants, as in `test/mcp/mcp-x402-proposal.test.ts`, `test/protocol/kernel-cross-scope-matrix.test.ts`, and `test/conformance/x402-payment-conformance.test.ts`.
- Use source-owned reference transcript tests when a user/model-facing workflow needs many hostile or not-ready rows without claiming a live host. `test/mcp/mcp-reference-transcript.test.ts` validates the generated transcript rows, source bindings, CLI readbacks, hostile matrix, and non-authority posture.

## Mocking

**Framework:** Hand-written fakes and harnesses; no Jest/Vitest mocking framework.

**Patterns:**
```typescript
function fakeRuntimeClient(calls: Array<{ name: string; input: unknown }>): McpRuntimeProposalClient {
  return {
    async createRuntimeExecution(input) {
      calls.push({ name: "createRuntimeExecution", input });
      return { runtimeExecutionId: "rex_mcp_x402" } as never;
    },
    async proposeActionContract(input) {
      calls.push({ name: "proposeActionContract", input });
      return { actionContractId: "act_mcp_x402" } as never;
    },
  } as McpRuntimeProposalClient;
}
```

**What to Mock:**
- Mock SDK fetch boundaries with captured calls, as `captureFetch()` does in `test/sdk/role-clients.test.ts`.
- Mock runtime proposal clients when testing MCP orchestration order and non-authority posture, as `fakeRuntimeClient()` does in `test/mcp/mcp-x402-proposal.test.ts`.
- Mock protected mutation surfaces with counters and captured commands, as x402 fake signing surfaces do in `test/adapters/x402-wallet-gateway.test.ts`.
- Use `FaultInjectingProtocolStore` from `test/support/fault-injecting-protocol-store.ts` for stale reads, ambiguous commits, and conflict behavior.
- Use `LocalD1Database` in `test/support/d1-http-harness.ts` to exercise the Worker/D1 path without a remote Cloudflare dependency.

**What NOT to Mock:**
- Do not mock protocol kernel transitions when the invariant under test is authority sequencing; use `HandshakeKernel` with `InMemoryProtocolStore` from `src/storage/memory` or `D1ProtocolStore` from `src/storage/d1`.
- Do not mock Zod schemas when testing public contracts; parse real schemas such as `McpX402PaymentProposalInputSchema` in `test/mcp/mcp-schema-contract.test.ts`.
- Do not mock the official x402 parsing surface when checking upstream parity; `test/conformance/x402-upstream-exact-fixtures.test.ts` imports `@x402/core/schemas`, `@x402/evm/exact/client`, and `@x402/fetch`.
- Do not mock architecture guard behavior; architecture tests read the real tree with `node:fs` and dynamic imports from `src/**`.

## Fixtures and Factories

**Test Data:**
```typescript
export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const createdAt = nowIso();

  return { store, kernel, tool, actionType, gateway, envelope };
}
```

**Location:**
- Kernel catalog fixtures and greenlit-contract helpers live in `test/support/fixtures.ts`.
- D1/HTTP app harness lives in `test/support/d1-http-harness.ts`.
- Package, repo-write, preview-deploy, and codemode runtime flow helpers live in `test/support/package-install-flow.ts`, `test/support/repo-write-flow.ts`, `test/support/preview-deploy-flow.ts`, and `test/support/codemode-multi-action-flow.ts`.
- Local file-system mutation surfaces live in `test/support/repo-write-surface.ts` and test-local helpers such as `writeJson()` in `test/cli/cli-evidence.test.ts`.
- Official x402 fixture shapes are declared inside x402-specific tests such as `test/adapters/x402-wallet-gateway.test.ts`, `test/integration/x402-d1-http.test.ts`, and `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- Source-owned demo transcript fixtures live in `src/mcp/reference-transcript.ts` and are rendered by `examples/mcp-reference-transcript/run.ts`; tests should import the source builder rather than asserting on stale generated output files.

## Coverage

**Requirements:** Not enforced by a coverage threshold.

**View Coverage:**
```bash
# Not detected in package.json
```

**Current enforcement substitute:**
- `npm run check:repo` in `package.json` runs typecheck, lint, Prettier check, all Bun tests, package-surface check, and `git diff --check`.
- `.github/workflows/check.yml` runs `bun install --frozen-lockfile` and `npm run check:repo`.
- Architecture tests act as structural coverage for imports, naming, root exports, package surface, CLI/MCP posture, active vocabulary, and claim boundaries.

## Active Tier 2 SDK/CLI/MCP Coverage

**Current posture tests:**
- Shared surface posture is guarded by `test/architecture/surface-boundary-posture.test.ts`, which reads `src/surfaces/boundary-manifest.ts`, checks active/deferred surface ids, forbids authority route families on model/operator surfaces, requires non-authority output flags, and scans existing source roots for forbidden imports, credentials, and output fields.
- SDK role boundaries are guarded by `test/sdk/role-clients.test.ts`. It uses `// @ts-expect-error` checks to reject role maps and fallback tokens on `RuntimeClientOptions` and `EvidenceClientOptions`, captures fetch calls to prove single-role authorization headers, and asserts that role clients do not expose `evaluatePolicy`, `gatewayCheck`, `createReceiptExport`, or certificate minting methods.
- CLI posture is guarded by `test/cli/cli-evidence.test.ts`, `test/cli/cli-local-project.test.ts`, `test/cli/cli-x402-install-probes.test.ts`, `test/cli/cli-support-bundle.test.ts`, and `test/architecture/cli-command-posture.test.ts`. These tests keep the active command set to schema/init/doctor, APS and redacted evidence wrappers, local certificate verification, redacted support bundle assembly, local x402 install/probe/install-health posture, and x402 conformance; require all CLI JSON to carry non-authority fields; and scan `src/cli/*` for all-role clients, process startup, gateway runners, raw records, and mutation-shaped command names.
- MCP schema/resource/proposal/transcript posture is guarded by `test/mcp/mcp-schema-contract.test.ts`, `test/mcp/mcp-resource-redaction.test.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/mcp/mcp-reference-transcript.test.ts`, and `test/architecture/mcp-surface-posture.test.ts`. These tests enforce one proposal tool, read-only resources, strict unknown-field rejection, shared `SurfaceOutcome` output, read-only projection routing, non-authority flags, no root export, no direct policy/gateway/signer/storage imports, and source-bound transcript rows.
- `npm run quality:architecture` includes the Tier 2 structural slice: `test/architecture/import-posture.test.ts`, `test/architecture/naming-posture.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, `test/architecture/mcp-surface-posture.test.ts`, and `test/conformance/protected-mutation-adapter-conformance.test.ts`.

**Current coverage gaps:**
- SDK role-client tests use a captured fetch fake in `test/sdk/role-clients.test.ts`; they also smoke the `handshake-protocol-kernel/sdk/role-clients` package subpath. There is no HTTP/D1 integration test proving `RuntimeClient` and `EvidenceClient` against the real app routes.
- CLI tests cover APS report rendering, invalid certificate verification, schema output, structured usage errors, conformance classification, local credential placeholder/profile storage, doctor readiness, local x402 install/probe commands, pre-contract install health, redacted contract views, receipt timelines, and file-backed support bundles. They do not yet cover valid/tampered certificate fixtures, package bin/pack checks, live control-plane install registration, live provider/gateway probes, or process-start contracts.
- MCP proposal tests use a fake `McpRuntimeProposalClient` in `test/mcp/mcp-x402-proposal.test.ts`; `test/mcp/mcp-reference-transcript.test.ts` adds a source-owned transcript harness, but there is still no external MCP server/host transcript, no end-to-end HTTP-backed proposal bridge, and no real protocol replay/idempotency recovery path through MCP.
- MCP proposal tests cover `toolsListChanged` freshness, strict oversized-field rejection, bypass-shaped input rejection, stable derived idempotency keys, sequenced retry keys, and replay/idempotency mapping through structured non-authority outcomes.
- MCP resource tests prove URI parsing and evidence-client routing, but metadata, challenge, and certificate resources in `src/mcp/resources.ts` are still reference-only payloads rather than source-owned projection reads.
- Architecture tests prevent authority drift by static scanning, but they do not prove runtime containment of sibling browser, shell, package-manager, cloud, or repo-write tools. Any claim that MCP or CLI controls those channels remains outside current evidence.
- CLI readiness can hide operator frustration because `doctor` remains `not_ready` even after a local x402 probe passes; this is correct while `trustedReadiness` is false, but tests should preserve the exact reason-code path so future UI/help text can explain the next mechanism instead of reporting generic failure.
- Model/developer frustration can hide behind fake clients: SDK and MCP unit tests prove surface method shape and headers, not a real network-backed activation path. Any quickstart or support workflow needs an HTTP/D1 route test before treating the surface as adoptable.

## Demo Script Tests

**x402 protected-spend demo:**
- `test/product/x402-protected-spend-demo-report.test.ts` runs `examples/x402-protected-spend/run.ts`, checks the generated JSON/markdown output, verifies `RuntimeClient` and `EvidenceClient` usage, and rejects `HandshakeClient` / direct runtime-ingress shortcuts in the demo source.
- The test asserts local/reference non-claims including no hosted operation, no broad x402 compatibility, no aggregate spend ledger, and local pinned trust only.

**MCP reference transcript demo:**
- `test/mcp/mcp-reference-transcript.test.ts` validates `buildMcpX402ReferenceTranscript()` and `buildMcpX402ReferenceTranscriptMarkdown()` from `src/mcp/reference-transcript.ts`.
- The transcript covers metadata read, valid proposal, evidence readback, stale metadata, tools-list change, install not ready, gateway offline, amount mismatch, parameter drift, replay refusal, raw sibling-shaped input, and downstream proof gap.
- The demo command `npm run demo:mcp-transcript` writes `examples/mcp-reference-transcript/output/latest.json` and `examples/mcp-reference-transcript/output/latest.md`; generated files are ignored and should not become canonical source.

## Test Types

**Unit Tests:**
- Protocol primitive and state tests live under `test/protocol/`, including `test/protocol/kernel-policy-gateway.test.ts`, `test/protocol/kernel-idempotency-ledger.test.ts`, `test/protocol/credential-custody.test.ts`, `test/protocol/operation-lifecycle.test.ts`, and `test/protocol/authority-certificate.test.ts`.
- Adapter unit tests live under `test/adapters/`, including `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, and `test/adapters/preview-deploy-gateway.test.ts`.
- Surface unit tests live under `test/mcp/`, `test/cli/`, and `test/sdk/`.

**Integration Tests:**
- HTTP and D1 behavior is covered by `test/http/http.test.ts`, `test/http/d1-http.test.ts`, `test/integration/package-install-end-to-end.test.ts`, `test/integration/repo-write-d1-http.test.ts`, and `test/integration/x402-d1-http.test.ts`.
- Integration tests should assert event order, stream digests, durable record counts, redaction posture, replay refusal, proof gaps, and finality boundaries.

**Architecture/Quality Tests:**
- Repo shape, lane manifests, import posture, naming, root exports, package exports, CLI posture, MCP posture, and surface boundaries live under `test/architecture/`.
- These tests are part of the product quality bar because they prevent authority drift, surface overclaiming, and scratch-doc canon leakage.

**Conformance Tests:**
- Protected mutation adapter conformance lives in `test/conformance/protected-mutation-adapter-conformance.test.ts`.
- x402 install and upstream exact parity live in `test/conformance/x402-payment-conformance.test.ts` and `test/conformance/x402-upstream-exact-fixtures.test.ts`.

**E2E Tests:**
- No browser E2E framework is used.
- The closest end-to-end paths are local protocol/HTTP/D1 flows in `test/integration/x402-d1-http.test.ts`, `test/integration/repo-write-d1-http.test.ts`, and `test/integration/package-install-end-to-end.test.ts`.
- Tier 2 SDK/CLI/MCP surfaces do not have a true host/process E2E test. The current transcript and CLI demos are source-owned harnesses, not process custody, external MCP host, package bin, browser, shell, cloud, or provider-gateway tests.

## Common Patterns

**Async Testing:**
```typescript
const harness = await createD1HttpHarness();
try {
  const { actionContract, client, greenlight } = await createX402Contract(harness);
  const gatewayResult = await runX402WalletGateway({
    protocol: client,
    surface,
    actionContractId: actionContract.actionContractId,
    greenlightId: greenlight.greenlightId,
    observedParameters: actionContract.parameters as X402PaymentParameters,
  });

  expect(gatewayResult.outcome).toBe("payment_signature_reconciled");
} finally {
  await harness.dispose();
}
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

**Redaction Testing:**
```typescript
expect(JSON.stringify(result.signatureEvidence)).not.toContain("PAYMENT-SIGNATURE");
expect(JSON.stringify(result.signatureEvidence)).not.toContain("privateKey");
expect(JSON.stringify(result.signatureEvidence)).not.toContain(`0x${"a".repeat(130)}`);
```

**Type Boundary Testing:**
```typescript
// @ts-expect-error runtime client must not accept role maps.
const invalidRuntimeRoleMap: RuntimeClientOptions = { roleCredential: "runtime-token", transitionTokens: {} };
```

**Architecture Guard Testing:**
```typescript
const violations: string[] = [];
for (const file of walkTs("src/mcp")) {
  const text = readFileSync(file, "utf8");
  if (text.includes("gatewayCheck(")) violations.push(file);
}
expect(violations.sort()).toEqual([]);
```

**Reference Transcript Testing:**
```typescript
const pack = await buildMcpX402ReferenceTranscript();

for (const row of pack.rows) {
  expect(row.sourceBindings.length).toBeGreaterThan(0);
  expect(row.nonAuthorityPosture).toMatchObject({
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  });
}
```

---

*Testing analysis: 2026-05-23*
