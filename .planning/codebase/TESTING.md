# Testing Patterns

**Analysis Date:** 2026-05-28

## Test Framework

**Runner:**
- Bun built-in test (`bun:test`) — no Jest or Vitest config present.
- Config: implicit; `package.json` `"test": "bun test"`.
- TypeScript for tests uses root `tsconfig.json` (`include`: `src`, `test`).

**Assertion library:**
- Bun `expect` (Jest-compatible matchers: `toEqual`, `toMatchObject`, `toThrow`, `toContain`, `rejects`).

**Run commands:**

```bash
bun test                              # all tests
npm test                              # alias via package.json
npm run check:types                   # tsc --noEmit (types before/at CI)
npm run lint                          # eslint src test --max-warnings=0
npm run format:check                  # prettier --check .
npm run check:repo                    # build + types + lint + format + test + pack:check + git diff --check
```

**Focused quality slices (`package.json`):**

```bash
npm run quality:architecture   # import/naming/surface/cli/mcp/conformance posture
npm run quality:storage        # D1/http + kernel invariants + evidence projections
npm run quality:claims         # active vocabulary + claim boundary
npm run quality:tier3          # cross-cutting CLI/MCP/SDK/http/adapters slice
```

Local fast slice from `QUALITY.md`:

```bash
npm run check:types
bun test
git diff --check
```

## Test File Organization

**Location:**
- All tests live under `test/` in domain subfolders — never at `test/*.test.ts` root (enforced in `test/architecture/naming-posture.test.ts`).

**Directory layout:**

```text
test/
  architecture/     # repo structure, imports, naming, claims, package surface
  protocol/         # kernel transitions, schemas, invariants, negotiation
  http/             # Hono app, D1 HTTP harness, hosted identity
  cli/              # CLI command envelopes and evidence views
  mcp/              # MCP catalog, schema contract, stdio process
  adapters/         # gateway fixtures, x402/auth-md activation probes
  runtime/          # generated-execution proposal helpers
  integration/      # end-to-end flows across HTTP + adapters
  product/          # product-surface slices (A2A, demos, acceptance)
  conformance/      # reference posture checks for adapters/x402
  sdk/              # HandshakeClient and role-scoped surface clients
  storage/          # KV/isolation cache mechanics
  adapter-sdk/      # public adapter SDK definitions
  support/          # shared fixtures and harnesses (not test cases)
```

**Naming:**
- Files: `<area>-<subject>.test.ts` or `<subject>.test.ts` (e.g. `kernel-operation-lifecycle.test.ts`, `cli-evidence.test.ts`).
- One primary `describe` per guarded boundary; multiple `it` cases per invariant.

**Support code:**
- Shared builders and harnesses live in `test/support/` — not counted as test files.
- Key support modules: `fixtures.ts`, `d1-http-harness.ts`, `fault-injecting-protocol-store.ts`, `negotiation-fixtures.ts`, `http-protocol-fixtures.ts`, flow helpers (`package-install-flow.ts`, `auth-md-flow.ts`).

## Test Structure

**Suite organization:**

```typescript
import { describe, expect, it } from "bun:test";
import { makeKernelFixture, createGreenlitContract } from "../support/fixtures";

describe("Handshake kernel invariants: operation lifecycle", () => {
  it("keeps a passed gateway check pending until reconciliation records downstream finality", async () => {
    const fixture = await createGreenlitContract();
    const result = await fixture.kernel.gatewayCheck({ /* exact binding */ });
    expect(result.gateAttempt.gateDecision).toBe("passed");
    expect(result.receipt.finalityStatus).toBe("pending");
  });
});
```

**Patterns:**
- No `beforeEach` / `afterEach` / `beforeAll` hooks in the suite — tests construct fixtures inline or via async helpers (`createGreenlitContract()`, `createD1HttpHarness()`).
- Prefer `async` tests with `await` on kernel/HTTP calls.
- Use `throw new Error("expected …")` for narrow guard clauses when narrowing nullable results after an action.
- Architecture tests walk the filesystem with Node `fs` and aggregate violations into sorted arrays compared with `expect(violations).toEqual([])`.

**Authority-boundary assertions (product/cli/mcp):**

```typescript
expect(output).toMatchObject({
  schemaVersion: "handshake.cli.v1",
  authorityCreated: false,
  gatewayCheckPerformed: false,
  mutationAttempted: false,
  reasonCodes: [],
});
expect(JSON.stringify(output)).not.toContain("PAYMENT-SIGNATURE");
```

**Negotiation / A2A product tests:**

```typescript
expect(readback.nonClaims).toEqual(
  expect.arrayContaining([
    "policy_evaluation",
    "gateway_check",
    "mutation",
  ]),
);
await expectNoAuthorityRecords(fixture.store);
```

## Mocking

**Framework:** None — no `mock`, `spyOn`, `vi.`, or Jest mocks detected under `test/`.

**Patterns:**
- Use real in-memory protocol store (`InMemoryProtocolStore` from `src/storage/memory`) via `makeKernelFixture()` in `test/support/fixtures.ts`.
- Use `FaultInjectingProtocolStore` in `test/support/fault-injecting-protocol-store.ts` to simulate ambiguous commits and read faults without mocking the kernel API.
- HTTP integration uses `createD1HttpHarness()` (`test/support/d1-http-harness.ts`): in-memory SQLite backing a D1-shaped API, real `createApp()` from `src/http/app`, test bearer tokens — no fetch mocks.
- CLI tests invoke `runCliCommand` from `src/cli/main` with temp JSON fixture files (`mkdtemp`, `writeFile`).

**What to mock:** Avoid introducing mock libraries; inject faults through store decorators or explicit test doubles in `test/support/`.

**What NOT to mock:**
- Protocol kernel transition semantics under test.
- Schema validation (use real Zod schemas, e.g. `McpX402PaymentProposalInputSchema.safeParse` in `test/mcp/mcp-schema-contract.test.ts`).
- Canonicalization and digest functions when testing binding integrity.

## Fixtures and Factories

**Kernel fixture (`test/support/fixtures.ts`):**

```typescript
export type KernelFixture = {
  store: ProtocolStore;
  kernel: HandshakeKernel;
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
};

export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  /* registers demo catalog objects */
  return { store, kernel, tool, actionType, gateway, envelope };
}

export function futureIso(minutes = 10): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
```

**Greenlit contract helper:** `createGreenlitContract()` composes proposal → policy → greenlight for gateway-check tests.

**D1 HTTP harness:**

```typescript
export async function createD1HttpHarness(): Promise<D1HttpHarness> {
  const db = /* LocalD1Database + migration 0001_protocol_kernel.sql */;
  const app = createApp();
  return {
    db,
    fetch: (input, init) => app.request(/* path */, init, env),
    post: <T>(path, body, role?) => /* JSON + bearer role */,
    query: <T>(sql, ...bindings) => /* D1 prepare */,
    dispose: async () => { /* cleanup */ },
  };
}
```

**Negotiation/A2A:** `test/support/negotiation-fixtures.ts` exports `negotiationSession()`, `negotiationDigest`, `a2aIngressCheckpoint()` for product ingress tests.

**Location for new fixtures:** Add to `test/support/<domain>-fixtures.ts` or extend `fixtures.ts` when shared across protocol and HTTP tests. Keep demo IDs stable (`tenant_demo`, `org_demo`) for snapshot-style assertions.

## Coverage

**Requirements:** No enforced coverage threshold in repo config; correctness is gated by `npm run check:repo` and architecture tests.

**View coverage:** Not configured (no `coverage/` script in `package.json`). If adding coverage, extend Bun's coverage flags locally — do not commit secrets or env files.

**Implicit coverage targets:**
- Every first-level `src/` lane lists **Guarding tests** in its `LANE.md` (cross-checked by import-posture tests).
- Expansion of action families requires new tests naming execution shape, bypass posture, and proof-gap model (`QUALITY.md`).

## Test Types

**Unit tests (`test/protocol/`, parts of `test/adapters/`):**
- Invoke `HandshakeKernel` methods directly; assert on returned records and store counts (`fixture.store.countRecordsOfType("mutation_attempt")`).

**Architecture / policy tests (`test/architecture/`):**
- Static analysis via filesystem reads and regex scans (`naming-posture.test.ts`, `import-posture.test.ts`, `claim-boundary.test.ts`).
- Validate package exports, banned vocabulary, lane manifests, and claim matrices against `README.md`, `AGENTS.md`, `package.json`.

**HTTP tests (`test/http/`):**
- `http.test.ts`: in-memory store + `createApp()` request/response assertions, OpenAPI security schemes, security headers.
- `d1-http.test.ts`: persistence and stream behavior through `createD1HttpHarness()`.

**CLI tests (`test/cli/`):**
- Spawn commands through `runCliCommand([...args])`; assert JSON envelope shape and redaction (no raw payment material in stringified output).

**MCP tests (`test/mcp/`):**
- Catalog cardinality (exactly one proposal tool), schema rejection of authority-shaped fields, resource URI templates.

**Integration tests (`test/integration/`):**
- Multi-hop flows: x402 D1 HTTP (`x402-d1-http.test.ts`), auth-md receipt reconstruction, package install end-to-end.

**Product tests (`test/product/`):**
- Buyer-facing slices: A2A ingress/admission/normalizer, service workflow admission, demo report shapes, hosted package consumer — always assert non-authority and non-claims.

**Conformance tests (`test/conformance/`):**
- Reference adapter posture (`protected-mutation-adapter-conformance.test.ts`, x402 conformance/fixture parity).

**Model-based invariants (`test/protocol/model-based-invariants.test.ts`):**
- Command scheduler over transition route IDs with shared `ModelContext` — exercises ordering and store counts without mocks.

## Common Patterns

**Async testing:**

```typescript
it("reconciles a pending surface operation without a second mutation attempt", async () => {
  const fixture = await createGreenlitContract();
  const gate = await fixture.kernel.gatewayCheck({ /* ... */ });
  if (!gate.mutationAttempt) throw new Error("expected mutation attempt");
  const result = await fixture.kernel.reconcileSurfaceOperation({ /* ... */ });
  expect(result.reconciliation.finalityStatus).toBe("final");
});
```

**Error testing:**

```typescript
await expect(fixture.kernel.proposeActionContract(proposalInputForCompilation(driftedCompilation)))
  .rejects.toThrow(/* HandshakeProtocolError or message fragment */);

await expect(protocolStore.commitProtocolRecords({ records: [], events: [] }))
  .rejects.toMatchObject({ /* structured error code */ });
```

**Schema contract testing:**

```typescript
expect(McpX402PaymentProposalInputSchema.safeParse(base).success).toBe(true);
expect(McpX402PaymentProposalInputSchema.safeParse({ ...base, greenlightRef: "x" }).success).toBe(false);
```

**Filesystem architecture test:**

```typescript
const violations = walk("src")
  .filter((file) => file.split("/").some((segment) => bannedSourcePathSegments.has(segment)));
expect(violations).toEqual([]);
```

**Claim matrix testing (`test/architecture/claim-boundary.test.ts`):**

```typescript
function expectClaimMatrix(entries: ClaimMatrixEntry[]) {
  for (const entry of entries) {
    for (const source of entry.sources) {
      for (const phrase of entry.required ?? []) {
        expect(normalizedSource, `${entry.label} must be stated in ${source.name}`).toContain(
          normalizeRequiredClaim(phrase),
        );
      }
    }
  }
}
```

## Where to Add Tests

| Change type | Test location | Example guard file |
|-------------|---------------|-------------------|
| Protocol transition / invariant | `test/protocol/` | `kernel-operation-lifecycle.test.ts` |
| New `src/` lane or import rule | `test/architecture/` | `import-posture.test.ts`, `naming-posture.test.ts` |
| HTTP route or admission | `test/http/` | `http.test.ts`, `d1-http.test.ts` |
| CLI command envelope | `test/cli/` | `cli-evidence.test.ts` |
| MCP tool/resource schema | `test/mcp/` | `mcp-schema-contract.test.ts` |
| Adapter gateway / bypass | `test/adapters/` | `x402-bypass-probes.test.ts` |
| End-to-end buyer flow | `test/integration/` or `test/product/` | `x402-d1-http.test.ts` |
| Public export or marketing claim | `test/architecture/` | `claim-boundary.test.ts`, `root-exports.test.ts` |
| Shared fixture / harness | `test/support/` | `fixtures.ts`, `d1-http-harness.ts` |

Run the narrowest slice that covers your change before `npm run check:repo`.

---

*Testing analysis: 2026-05-28*
