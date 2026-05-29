# Testing Patterns

**Analysis Date:** 2026-05-29

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
npm run check:types                   # tsc --noEmit
npm run lint                          # eslint src test --max-warnings=0
npm run format:check                  # prettier --check .
npm run check:repo                    # build + types + lint + format + test + pack:check + git diff --check
```

**Focused quality slices (`package.json`):**

```bash
npm run quality:architecture   # import/naming/surface/cli/mcp/conformance posture
npm run quality:storage        # D1/http + kernel invariants + evidence projections
npm run quality:claims         # active vocabulary + claim boundary
```

Local fast slice from `QUALITY.md`:

```bash
npm run check:types
bun test
git diff --check
```

**Phase 04 service-agent gating scripts** (`scripts/check-service-agent-gating-phase.mjs`):

```bash
npm run check:service-agent-gating-phase              # operator tier — 10 tests
npm run check:service-agent-gating-phase:full         # full tier — 15 tests (10 + 5)
```

| Tier | Flag | Count | Suite |
|------|------|-------|-------|
| operator | `--tier operator` | 10/10 | Operator product completion, dual enforcement, failure-class HTTP/SDK/MCP, bootstrap, golden path, proof-gap honesty, custody matrix, HTTP mutation gating |
| full | `--tier full` | 15/15 | Operator suite plus maintainer completion, integrator parity, HTTP profile canonicalization/orphan catalog, CLI agent-spine sequencer |

Operator tier files (always run):

1. `test/architecture/operator-product-completion-contract.test.ts`
2. `test/architecture/dual-enforcement-posture.test.ts`
3. `test/http/transition-error-failure-class.test.ts`
4. `test/product/service-operator-bootstrap.test.ts`
5. `test/integration/service-operator-golden-path.test.ts`
6. `test/architecture/proof-gap-honesty.test.ts`
7. `test/architecture/custody-matrix-parity.test.ts`
8. `test/architecture/http-handler-mutation-gating.test.ts`
9. `test/sdk/role-clients-failure-class.test.ts`
10. `test/mcp/mcp-failure-class-parity.test.ts`

Full-tier additions:

11. `test/architecture/maintainer-product-completion-contract.test.ts`
12. `test/architecture/integrator-parity.test.ts`
13. `test/adapters/http-profile-canonicalization.test.ts`
14. `test/adapters/http-profile-orphan-catalog.test.ts`
15. `test/cli/cli-agent-spine-sequencer.test.ts`

Verified at HEAD `aef9478` (branch `phase-05-product-coherence`): both tiers pass.

## Known Acceptable Residual Failures

When running the full `bun test` suite locally, these structural-guard tests may fail for environmental or baseline reasons without blocking phase closeout:

| Test file | Failing case(s) | Cause | Mitigation |
|-----------|-----------------|-------|------------|
| `test/architecture/naming-posture.test.ts` | `keeps workspace metadata junk out of active repo surfaces` | Local `.DS_Store` files under repo tree | Delete junk files or add to global gitignore; not a source defect |
| `test/architecture/naming-posture.test.ts` | `keeps deleted scratch documents out of the active tree` | Local `.agents/` or `skills-lock.json` present | Remove untracked scratch; `STRUCTURE.md` marks these as non-canon |
| `test/architecture/manifest-coverage.test.ts` | `maps each product surface export to a manifest surface with matching sourceRoots` | Pre-existing baseline: expects `./hosted-admission` and `./surfaces/service-workflow-admission` exports not yet in `package.json` | Track as manifest/export drift; other manifest-coverage cases pass |

**Timeout note:** `test/architecture/release-repository-projection.test.ts` spawns `scripts/project-release-repository.js` (~1.6s isolated). It can time out when run inside the full parallel suite but passes in isolation:

```bash
bun test test/architecture/release-repository-projection.test.ts
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
- Files: `<area>-<subject>.test.ts` or `<subject>.test.ts`.
- One primary `describe` per guarded boundary; multiple `it` cases per invariant.

## Architecture / Structural Guard Suites

These tests act as repo posture enforcement — not unit tests of runtime behavior. They walk the filesystem, parse manifests, and compare against frozen allowlists.

### Claim and doctrine (`test/architecture/claim-boundary.test.ts`)

- **`expectClaimMatrix`** — normalizes canonical doc text and asserts required phrases and forbidden patterns with exact phrasing.
- Required product/protocol language includes: `cleared protected-action event`, `protocol kernel`, `product surface`, `public npm availability does not create authority`, `MCP Registry discoverability remains a proof gap`, certificate-is-terminal-evidence-not-permission patterns.
- Validates root vs `./adapter-sdk` vs `./runtime` vs `./conformance` vs `./experimental` export separation (no authority symbols at root).
- Scans `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`, lane manifests, and example READMEs.

Companion: `test/architecture/active-vocabulary.test.ts` (run via `quality:claims`).

### Package and export surface

| File | Guards |
|------|--------|
| `test/architecture/package-surface.test.ts` | `package.json` exports, bins, MCP name, no `./surfaces` barrel, publishable posture |
| `test/architecture/root-exports.test.ts` | Frozen sorted export list from `src/index.ts` |
| `test/architecture/manifest-coverage.test.ts` | Maps `package.json` exports and CLI handler files to `src/surfaces/boundary-manifest.ts` `sourceRoots` |
| `test/architecture/hosted-admission-reexport-only.test.ts` | Hosted admission subpath curation |

### Naming and planning quarantine

| File | Guards |
|------|--------|
| `test/architecture/naming-posture.test.ts` | Banned bucket segments, loose-file limits, `index.ts` public faces, Tier/stage label ban, `.DS_Store` junk, deleted scratch paths, overclaiming/vague protocol verbs, CI pinned to `npm run check:repo` |
| `test/architecture/planning-scratch-quarantine.test.ts` | D-62: macro-plan/concierge markers must not appear in scripts, README, `src/`, `test/`, `docs/` |
| `test/architecture/canonical-doc-forbidden-copy.test.ts` | Forbidden legacy doc paths in canon |

### Import and lane posture

| File | Guards |
|------|--------|
| `test/architecture/import-posture.test.ts` | LANE.md field completeness, transport off protocol internals, removed compatibility shims |
| `test/architecture/surface-boundary-posture.test.ts` | `boundary-manifest.ts` completeness, non-authority flags, forbidden authority routes |
| `test/architecture/cli-command-posture.test.ts` | CLI manifest alignment |
| `test/architecture/cli-non-authority-copy.test.ts` | CLI must not claim authority (D-60) |
| `test/architecture/mcp-surface-posture.test.ts` | MCP catalog posture |
| `test/architecture/negotiation-no-authority-surface.test.ts` | Negotiation area isolation from gateway/policy imports |

### Authority boundary and bypass

| File | Guards |
|------|--------|
| `test/adapters/x402-bypass-probes.test.ts` | Hostile bypass probe executors; policy greenlight only after gateway-owned probes pass |
| `test/architecture/http-handler-mutation-gating.test.ts` | HTTP handlers cannot mutate without gating |
| `test/architecture/dual-enforcement-posture.test.ts` | Service golden path dual-enforcement language |
| `test/architecture/workflow-admission-boundary.test.ts` | Service workflow admission boundary |
| `test/architecture/x402-gateway-credential-custody.test.ts` | Gateway credential custody invariants |
| `test/architecture/gateway-invariant-*.test.ts` | Signer custody, params mismatch, replay |

### FailureClass taxonomy and parity

| File | Guards |
|------|--------|
| `test/protocol/failure-class-taxonomy.test.ts` | Reason-code → `FailureClass` mapping via `src/protocol/foundation/failure-class/index.ts` |
| `test/http/transition-error-failure-class.test.ts` | HTTP envelope `failureClass` alignment |
| `test/sdk/role-clients-failure-class.test.ts` | SDK client failureClass parity |
| `test/mcp/mcp-failure-class-parity.test.ts` | MCP binding reason codes vs HTTP classifier |

### Integrator parity and product completion

| File | Guards |
|------|--------|
| `test/architecture/integrator-parity.test.ts` | `integratorParityTransitionIds` tagged in navigation; HTTP route role/path parity |
| `test/architecture/operator-product-completion-contract.test.ts` | Golden path docs, runbooks, examples, required tests wired |
| `test/architecture/maintainer-product-completion-contract.test.ts` | Maintainer-tier test/doc closure |
| `test/architecture/product-completion-parity.test.ts` | Product completion gate parity |
| `test/architecture/proof-gap-honesty.test.ts` | Proof gaps not smoothed over in canon |

### Release and distribution

| File | Guards |
|------|--------|
| `test/architecture/release-repository-projection.test.ts` | Release artifact projection (may timeout in full suite) |
| `test/architecture/package-release-proof.test.ts` | Release proof records |
| `test/architecture/npm-maintainer-posture.test.ts` | npm maintainer posture |
| `test/architecture/release-admin-gate.test.ts` | Release admin gate |

Run the architecture slice:

```bash
npm run quality:architecture
```

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
- No global `beforeEach` / `afterEach` hooks in most suites — tests construct fixtures inline or via async helpers.
- Architecture tests walk the filesystem with Node `fs` and aggregate violations into sorted arrays compared with `expect(violations).toEqual([])`.

**Claim matrix helper (`test/architecture/claim-boundary.test.ts`):**

```typescript
function expectClaimMatrix(entries: ClaimMatrixEntry[]) {
  for (const entry of entries) {
    for (const source of entry.sources) {
      const normalizedSource = normalizeRequiredClaim(source.text);
      for (const phrase of entry.required ?? []) {
        expect(normalizedSource, `${entry.label} must be stated in ${source.name}`).toContain(
          normalizeRequiredClaim(phrase),
        );
      }
    }
  }
}
```

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

## Mocking

**Framework:** None — no `mock`, `spyOn`, `vi.`, or Jest mocks detected under `test/`.

**Patterns:**
- Use real in-memory protocol store (`InMemoryProtocolStore` from `src/storage/memory`) via `makeKernelFixture()` in `test/support/fixtures.ts`.
- Use `FaultInjectingProtocolStore` in `test/support/fault-injecting-protocol-store.ts` for fault injection.
- HTTP integration uses `createD1HttpHarness()` in `test/support/d1-http-harness.ts`.
- CLI tests invoke `runCliCommand` from `src/cli/main.ts` with temp JSON fixture files.

**What NOT to mock:** Protocol kernel transition semantics, Zod schema validation, canonicalization/digest functions under test.

## Fixtures and Factories

**Kernel fixture (`test/support/fixtures.ts`):** `makeKernelFixture()`, `createGreenlitContract()`, `futureIso()`.

**D1 HTTP harness (`test/support/d1-http-harness.ts`):** `createD1HttpHarness()` with in-memory SQLite + real `createApp()`.

**Negotiation/A2A:** `test/support/negotiation-fixtures.ts`.

**Location for new fixtures:** `test/support/<domain>-fixtures.ts` or extend `fixtures.ts`.

## Coverage

**Requirements:** No enforced coverage threshold; correctness is gated by `npm run check:repo` and architecture tests.

**Implicit coverage targets:**
- Every first-level `src/` lane lists **Guarding tests** in its `LANE.md`.
- Expansion of action families requires new tests naming execution shape, bypass posture, and proof-gap model (`QUALITY.md`).

## Test Types

**Unit tests (`test/protocol/`, parts of `test/adapters/`):** Direct `HandshakeKernel` invocation; store count assertions.

**Architecture / policy tests (`test/architecture/`):** Filesystem scans, manifest parity, claim matrices.

**HTTP tests (`test/http/`):** `http.test.ts`, `d1-http.test.ts`, OpenAPI contract.

**CLI tests (`test/cli/`):** `runCliCommand` envelope shape and redaction.

**MCP tests (`test/mcp/`):** Catalog cardinality, schema rejection of authority-shaped fields.

**Integration tests (`test/integration/`):** `x402-d1-http.test.ts`, `service-operator-golden-path.test.ts`, auth-md reconstruction.

**Product tests (`test/product/`):** A2A ingress, service workflow admission, demo reports — always assert non-authority.

**Conformance tests (`test/conformance/`):** Reference adapter posture.

**Model-based invariants (`test/protocol/model-based-invariants.test.ts`):** Command scheduler over transition route IDs.

## Where to Add Tests

| Change type | Test location | Example guard file |
|-------------|---------------|-------------------|
| Protocol transition / invariant | `test/protocol/` | `kernel-operation-lifecycle.test.ts` |
| New `src/` lane or import rule | `test/architecture/` | `import-posture.test.ts`, `naming-posture.test.ts` |
| HTTP route or admission | `test/http/` | `http.test.ts`, `transition-error-failure-class.test.ts` |
| CLI command envelope | `test/cli/` | `cli-evidence.test.ts`, `cli-non-authority-copy.test.ts` |
| MCP tool/resource schema | `test/mcp/` | `mcp-schema-contract.test.ts`, `mcp-failure-class-parity.test.ts` |
| Adapter gateway / bypass | `test/adapters/` | `x402-bypass-probes.test.ts` |
| FailureClass mapping | `test/protocol/` + transport | `failure-class-taxonomy.test.ts` |
| End-to-end buyer flow | `test/integration/` or `test/product/` | `service-operator-golden-path.test.ts` |
| Public export or marketing claim | `test/architecture/` | `claim-boundary.test.ts`, `root-exports.test.ts` |
| Planning scratch promotion | `test/architecture/` | `planning-scratch-quarantine.test.ts` |
| Shared fixture / harness | `test/support/` | `fixtures.ts`, `d1-http-harness.ts` |

Run the narrowest slice that covers your change before `npm run check:repo`.

---

*Testing analysis: 2026-05-29*
