# Coding Conventions

**Analysis Date:** 2026-05-28

Canonical repo guidance lives in `QUALITY.md`, `STRUCTURE.md`, and lane manifests (`src/**/LANE.md`). This document captures enforceable patterns the executor should follow when writing or changing code.

## Naming Patterns

**Files and folders:**
- Name by owned concept, not generic buckets. Banned path segments: `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, `service` (enforced in `test/architecture/naming-posture.test.ts`).
- Protocol primitives live under `src/protocol/areas/<concept>/` with focused filenames (`transitions.ts`, `schemas.ts`, `inputs.ts`, `index.ts`).
- Product and transport lanes mirror ownership: `src/http/`, `src/cli/`, `src/mcp/`, `src/surfaces/`, `src/adapters/<adapter>/`.
- Every first-level `src/` lane must ship `LANE.md` or `README.md` with the manifest fields listed in `QUALITY.md`.

**Functions (protocol modules):**
- Durable writes: `record*`, `persist*`, `commit*`, `consume*`, `mark*`, `activate*`.

```typescript
// src/protocol/areas/negotiation/transitions.ts
export async function recordNegotiationSession(/* ... */) { /* ... */ }
export async function recordA2AIngressCheckpoint(/* ... */) { /* ... */ }
```

- Reads and derivations: `get*`, `list*`, `derive*`, `build*`, `format*`, `resolve*`.
- Avoid vague mutation names in protocol code: `handle*`, `process*`, `do*`, `run*` (runtime public runner entrypoints may use `run*` when they are explicit runners, e.g. `runX402WalletGateway` in `src/adapters/x402-payment/wallet-gateway.ts`).
- Avoid overclaiming names: `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, `secureApproval*`.

**Types and protocol objects:**
- Use exact protocol nouns: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, `IsolationState`.
- Export result types beside transition functions:

```typescript
// src/protocol/areas/operation-lifecycle/transitions.ts
export type SurfaceOperationReconciliationResult = {
  reconciliation: SurfaceOperationReconciliation;
  resolvedProofGaps: ProofGap[];
  createdProofGap: ProofGap | null;
};
```

**Variables:**
- Prefer descriptive protocol IDs (`actionContractId`, `greenlightId`, `mutationAttemptId`) over abbreviations.
- Prefix intentionally unused bindings with `_` to satisfy ESLint (`argsIgnorePattern`, `varsIgnorePattern` in `eslint.config.js`).

**Tests:**
- Mirror source ownership in path: `test/protocol/kernel-operation-lifecycle.test.ts`, `test/product/a2a-ingress-admission.test.ts`.
- Describe blocks name the guarded boundary, not the file:

```typescript
describe("repo naming posture", () => { /* ... */ });
describe("A2A production ingress admission", () => { /* ... */ });
describe("Handshake kernel invariants: operation lifecycle", () => { /* ... */ });
```

## Code Style

**Formatting (Prettier — `.prettierrc.json`):**
- `printWidth`: 120
- `semi`: true
- `singleQuote`: false (double quotes)
- `trailingComma`: `"all"`

Run `npm run format:check` in CI; `npm run format` to fix locally.

**TypeScript (`tsconfig.json`):**
- Target ES2022, module ESNext, `moduleResolution`: `"Bundler"`.
- Strict mode with `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true`.
- Types from `@cloudflare/workers-types` and `bun-types`.
- Build declarations via `tsconfig.build.json` (`rootDir`: `src`, `emitDeclarationOnly`).

**Linting (`eslint.config.js`):**
- Scope: `src/**/*.ts`, `test/**/*.ts`; ignores `dist/`, `coverage/`, `node_modules/`, `docs/internal/archive/**`.
- Extends `typescript-eslint` recommended.
- Key rules:
  - `@typescript-eslint/consistent-type-imports`: `"prefer": "type-imports"`, `"fixStyle": "separate-type-imports"`.
  - `@typescript-eslint/no-unused-vars` with `^_` ignore patterns.
  - `no-console`: error except `console.warn` and `console.error`.

Run `npm run lint` (`--max-warnings=0`). Zero warnings is required for closeout.

## Import Organization

**Order (observed pattern):**
1. Test/runtime imports (`bun:test`, Node built-ins).
2. Value imports from `src/` (kernel, adapters, surfaces).
3. Separate `import type { ... }` lines for types only.

Example from `test/http/http.test.ts`:

```typescript
import { describe, expect, it } from "bun:test";
import { createApp } from "../../src/http/app";
import type { CallerAuthTokens, TransitionCallerRole } from "../../src/http/admission/caller-auth";
import { HandshakeKernel } from "../../src/protocol/kernel";
import {
  type ContractEvidenceProjection,
  PROTOCOL_VERSION,
  type ProofGap,
} from "../../src/protocol/public/schemas";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { createGreenlitContract, makeKernelFixture } from "../support/fixtures";
```

**Path style:**
- Use relative paths from the importing file (`../../src/...`, `../support/...`). No path aliases in `tsconfig.json`.
- Import protocol meaning through public faces (`src/protocol/public/schemas`, `src/protocol/public/inputs`) from transport, SDK, and product code — not through deep `src/protocol/areas/*` internals (guarded by `test/architecture/import-posture.test.ts`).

**Barrel files:**
- Folders with more than three `.ts` files (excluding `index.ts`) must expose an `index.ts` public face.
- Curated package exports live in `src/index.ts` and `package.json` `exports`; do not re-export internal kernel/store objects at root.

## Error Handling

**Protocol errors:**
- Throw `HandshakeProtocolError` from `src/protocol/foundation/errors` for invariant violations.
- Parse inputs with Zod schemas at transition boundaries (`ReconcileSurfaceOperationInputSchema.parse` pattern in `src/protocol/areas/operation-lifecycle/transitions.ts`).

**HTTP/SDK:**
- Map protocol errors to typed HTTP envelopes via `src/http/errors/` (see `HandshakeProtocolError` usage in `test/http/http.test.ts`).
- SDK clients surface structured rejections; tests use `rejects.toMatchObject` / `rejects.toThrow`:

```typescript
await expect(errorClient.getGeneratedGraphEvidenceProjection("geg_missing")).rejects.toMatchObject({
  /* structured client error */
});
await expect(fixture.kernel.proposeActionContract(followUpInput)).rejects.toThrow(/* ... */);
```

**Fail closed:**
- Missing custody, schema invalidity, and isolation blocks must refuse — never silently succeed. Product surfaces assert non-authority flags on outputs (`authorityCreated: false`, `gatewayCheckPerformed: false`, etc.).

## Logging

**Framework:** No unstructured logging in `src/` — ESLint blocks `console.log` / `console.info` / `console.debug`.

**Allowed:** `console.warn` and `console.error` only where explicitly needed (typically CLI or scripts outside the linted kernel tree).

**Evidence over logs:** Prefer recorded `ProofGap`, `Refusal`, and receipt timeline evidence over log lines for reconstructability.

## Comments

**When to comment:**
- Lane manifests (`LANE.md`) carry design intent, import posture, and guarding tests — prefer updating the manifest over inline essays.
- Inline comments only for non-obvious invariant rationale (e.g., why telemetry must not create authority).

**JSDoc/TSDoc:**
- Sparse; types and schema names are the primary documentation.
- Export types for transition results and public SDK shapes; avoid duplicating schema field lists in comments.

## Function Design

**Size:**
- Transition functions orchestrate guard → plan → commit; keep helper types (`SurfaceOperationReconciliationContext`, `SurfaceOperationEvidencePlan`) file-local when they clarify commit phases.

**Parameters:**
- Pass explicit IDs and digests; avoid passing loose `Record<string, unknown>` at protocol boundaries.
- Use `satisfies` for fixture constants that must conform to auth or schema types:

```typescript
const TEST_CALLER_AUTH_TOKENS = {
  control_plane: "test_control_plane_token",
  /* ... */
} as const satisfies CallerAuthTokens;
```

**Return values:**
- Transition functions return structured result objects with both primary record and side effects (`resolvedProofGaps`, `createdProofGap`).
- CLI/MCP commands return envelope objects with authority boundary fields and `reasonCodes` (see `test/cli/cli-evidence.test.ts`).

## Module Design

**Exports:**
- Each lane's `index.ts` re-exports the public surface declared in its `LANE.md`.
- Package subpaths (`./sdk/role-clients`, `./hosted-admission`, `./surfaces/a2a-negotiation-readback`) match `package.json` exports — do not add root exports without updating `test/architecture/root-exports.test.ts` and `test/architecture/claim-boundary.test.ts`.

**Lane manifests:**
- Required sections (validated by `test/architecture/import-posture.test.ts`): Authority owner, Current proof claim, Use cases, Constraints and assumptions, Core components, Failure and scale posture, Future package target, Allowed imports, Forbidden imports, Guarding tests, Public surface, Extraction trigger, Scope boundary.

**Forbidden patterns:**
- Generic bucket directories under `src/`.
- Repo-facing internal planning labels in scripts, README, CI names, or test titles.
- Compatibility shims listed as removed in `test/architecture/import-posture.test.ts` (e.g. `src/protocol/policy.ts`).

## Authority Boundary Assertions (Product Code)

Non-authority surfaces must not imply permission. When adding CLI, MCP, or readback output, include and test:

```typescript
expect(output).toMatchObject({
  authorityCreated: false,
  greenlightCreated: false,
  gatewayCheckPerformed: false,
  mutationAttempted: false,
  rawInternalRecordIncluded: false,
  credentialMaterialIncluded: false,
});
```

Negotiation and A2A evidence tests additionally require `authorityCreated: false`, `gatewayCheckPerformed: false`, and `mutationAttempted: false` on recorded transitions.

---

*Convention analysis: 2026-05-28*
