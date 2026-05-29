# Coding Conventions

**Analysis Date:** 2026-05-29

Canonical repo guidance lives in `QUALITY.md`, `STRUCTURE.md`, `AGENTS.md`, and lane manifests (`src/**/LANE.md`). This document captures enforceable patterns the executor should follow when writing or changing code.

## Naming Patterns

**Files and folders:**
- Name by owned concept, not generic buckets. Banned path segments under `src/**`: `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, `service` (enforced in `test/architecture/naming-posture.test.ts`).
- The `service` ban is why CLI operator code lives at `src/cli/service-operator/` (not `src/cli/service/`). Product docs use `service-operator-*` filenames (for example `docs/internal/service-operator-golden-path.md`), not internal planning tier labels.
- Protocol primitives live under `src/protocol/areas/<concept>/` with focused filenames (`transitions.ts`, `schemas.ts`, `inputs.ts`, `index.ts`).
- Product and transport lanes mirror ownership: `src/http/`, `src/cli/`, `src/mcp/`, `src/surfaces/`, `src/adapters/<adapter>/`.
- Every first-level `src/` lane must ship `LANE.md` or `README.md` with the manifest fields listed in `QUALITY.md` / `STRUCTURE.md` (validated by `test/architecture/import-posture.test.ts`).

**Banned planning labels (repo-facing surfaces):**
- Internal planning-stage vocabulary must not appear in repo-facing paths, scripts, CI names, README, canonical docs, exported symbols, or test titles.
- Specifically forbidden in repo-facing files (see `test/architecture/naming-posture.test.ts`): `Tier 1`–`Tier 4`, `tier1`, `tier doctrine`, and similar stage labels.
- Use product/protocol nouns instead — for example `integrator-parity` (`test/architecture/integrator-parity.test.ts`, `docs/internal/integrator-parity-transitions.md`) rather than legacy tier numbering.
- Repo-facing roots scanned: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal`, `examples`, `package.json`, `.github`, `src`, `test`.

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
- Mirror source ownership in path: `test/protocol/kernel-operation-lifecycle.test.ts`, `test/product/service-operator-bootstrap.test.ts`.
- Describe blocks name the guarded boundary, not the file:

```typescript
describe("repo naming posture", () => { /* ... */ });
describe("planning scratch quarantine", () => { /* ... */ });
describe("Handshake kernel invariants: operation lifecycle", () => { /* ... */ });
```

## Module And Directory Layout

**Directory + `index.ts` posture (not loose files):**
- A source folder with more than three `.ts` files (excluding `index.ts`) must expose an `index.ts` public face.
- A source folder must not exceed seven loose `.ts` files (excluding `index.ts`).
- Area modules stay under `src/protocol/areas/*`; foundation helpers use directory modules such as `src/protocol/foundation/failure-class/index.ts` (not a loose `failure-class.ts` at the foundation root).
- Protocol area folders use `transitions.ts`, `schemas.ts`, `inputs.ts`, `guards.ts`, and `index.ts` as the standard layout.

**First-level `src/` lanes with `LANE.md` (authority boundary files):**
- `src/adapters/LANE.md`
- `src/adapter-sdk/LANE.md`
- `src/cli/LANE.md`
- `src/conformance/LANE.md`
- `src/hosted-admission/LANE.md`
- `src/http/LANE.md`
- `src/install/LANE.md`
- `src/mcp/LANE.md`
- `src/protocol/LANE.md`
- `src/runtime/LANE.md`
- `src/sdk/LANE.md`
- `src/storage/LANE.md`
- `src/surfaces/LANE.md`
- `src/x402-protected-tool/LANE.md`

Each manifest must include all fourteen required `##` sections listed in `STRUCTURE.md` (Authority owner through Scope boundary).

## `.planning/` Scratch Quarantine

**Rule:** Files under `.planning/` are scratch. They must not leak into repo-facing source paths, `package.json` scripts, CI workflow names, exported symbols, or canonical docs (`AGENTS.md` line 221; `STRUCTURE.md`).

**Enforced markers (D-62)** — must not appear in `src/`, `test/`, `docs/`, `README.md`, or `package.json` scripts (`test/architecture/planning-scratch-quarantine.test.ts`):
- `.planning/macro-plan`
- `.planning/macro/concierge`
- `concierge-demand-test-scaffold`

**Also quarantined from active canon** (naming posture):
- `Agent-Founder.md`
- `.agents` skill bundles
- `skills-lock.json`

When `.planning/codebase/*` informs work, tracked source, canonical docs, and passing tests win on factual disagreements (`STRUCTURE.md`).

## Surfaces Must Not Create Authority

Product surfaces (CLI, MCP, SDK readbacks, `src/surfaces/*`) expose proposal, evidence, and readback only. They must not create policy decisions, greenlights, gateway checks, mutation attempts, or certificates.

**Manifest contract:** `src/surfaces/boundary-manifest.ts` defines `surfaceNonAuthorityFlags` and per-surface `requiredNonAuthorityFlags`. Every model-facing and operator-facing surface must require all flags to be `false`:

```typescript
export const surfaceNonAuthorityFlags = [
  "authorityCreated",
  "credentialMaterialIncluded",
  "gatewayCheckPerformed",
  "greenlightCreated",
  "mutationAttempted",
  "mutationCommandIncluded",
  "rawInternalRecordIncluded",
  "receiptExportCreated",
  "authorityCertificateMinted",
] as const;
```

**Guarding tests:**
- `test/architecture/surface-boundary-posture.test.ts` — manifest completeness, forbidden authority route families, required non-authority flags, forbidden credential/output shapes.
- `test/architecture/negotiation-no-authority-surface.test.ts` — negotiation area does not import protected-action control areas; only `record*` transitions exported.
- `test/architecture/cli-non-authority-copy.test.ts` — CLI copy must not imply authority (D-60).
- `test/architecture/claim-boundary.test.ts` — canonical docs must state projection/readback "without creating authority".

**Product test assertion pattern:**

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

Role-scoped SDK policy/gateway clients are policy transition transport — not product authority surfaces (`surface-boundary-posture.test.ts` distinguishes `sdk.policy`).

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

**Path style:**
- Use relative paths from the importing file (`../../src/...`, `../support/...`). No path aliases in `tsconfig.json`.
- Import protocol meaning through public faces (`src/protocol/public/schemas`, `src/protocol/public/inputs`) from transport, SDK, and product code — not through deep `src/protocol/areas/*` internals (guarded by `test/architecture/import-posture.test.ts`).

**Barrel files:**
- Folders with more than three `.ts` files (excluding `index.ts`) must expose an `index.ts` public face.
- Curated package exports live in `src/index.ts` and `package.json` `exports`; do not re-export internal kernel/store objects at root (`test/architecture/root-exports.test.ts`).

## Error Handling

**Protocol errors:**
- Throw `HandshakeProtocolError` from `src/protocol/foundation/errors` for invariant violations.
- Classify transport-facing failures through `src/protocol/foundation/failure-class/index.ts` (`FailureClassSchema`: `auth`, `hosted_admission`, `protected_action_refusal`, `proof_gap`, `replay_refusal`, `stale_admission`, `internal`).
- Parse inputs with Zod schemas at transition boundaries.

**HTTP/SDK:**
- Map protocol errors to typed HTTP envelopes via `src/http/errors/transition-error-envelope.ts`.
- SDK clients surface structured rejections; tests use `rejects.toMatchObject` / `rejects.toThrow`.

**Fail closed:**
- Missing custody, schema invalidity, and isolation blocks must refuse — never silently succeed.

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

## Function Design

**Size:**
- Transition functions orchestrate guard → plan → commit; keep helper types file-local when they clarify commit phases.

**Parameters:**
- Pass explicit IDs and digests; avoid passing loose `Record<string, unknown>` at protocol boundaries.
- Use `satisfies` for fixture constants that must conform to auth or schema types.

**Return values:**
- Transition functions return structured result objects with both primary record and side effects (`resolvedProofGaps`, `createdProofGap`).
- CLI/MCP commands return envelope objects with authority boundary fields and `reasonCodes`.

## Module Design

**Exports:**
- Each lane's `index.ts` re-exports the public surface declared in its `LANE.md`.
- Package subpaths match `package.json` `exports` — do not add root exports without updating `test/architecture/root-exports.test.ts` and `test/architecture/claim-boundary.test.ts`.

**Forbidden patterns:**
- Generic bucket directories under `src/`.
- Internal planning labels in repo-facing scripts, README, CI names, or test titles.
- Compatibility shims listed as removed in `test/architecture/import-posture.test.ts` (e.g. `src/protocol/policy.ts`).

---

*Convention analysis: 2026-05-29*
