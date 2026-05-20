# Coding Conventions

**Analysis Date:** 2026-05-20
**HEAD:** `88e6f16`
**Source priority:** Tracked docs, source, and tests are authoritative. `.planning/` is scratch and is not repo truth.
**Worktree note:** Current scan includes the present dirty/untracked Tier 1 AuthorityCertificate/kernel source and tests. Do not infer that `88e6f16` alone contains every file listed here.
**Project-local skills:** Not detected. `.codex/skills/` and `.agents/skills/` are absent.

## Naming Patterns

**Files:**
- Use kebab-case for owned protocol concepts and adapter rails: `src/protocol/areas/authority-certificate/`, `src/protocol/areas/idempotency-ledger/`, `src/adapters/x402-payment/`, `src/runtime/ingress/index.ts`.
- Every multi-file source folder needs an `index.ts` public face. This is enforced by `test/architecture/naming-posture.test.ts`.
- Protocol primitive folders live under `src/protocol/areas/*`; public protocol aggregators live under `src/protocol/public/*`; foundation helpers live under `src/protocol/foundation/*`.
- Use local area files by role: `schemas.ts`, `inputs.ts`, `types.ts`, `transitions.ts`, `guards.ts`, plus concept-specific files like `src/protocol/areas/authority-certificate/signing.ts` and `src/protocol/areas/action-attempt-lifecycle/matrix.ts`.
- Test files are grouped by behavioral lane under `test/architecture/`, `test/protocol/`, `test/runtime/`, `test/adapters/`, `test/conformance/`, `test/http/`, and `test/integration/`. Root `test/*.test.ts` files are forbidden by `test/architecture/naming-posture.test.ts`.
- Avoid bucket names in source paths. The banned segments are enforced in `test/architecture/naming-posture.test.ts`: `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service`.

**Functions:**
- Use camelCase for functions and methods: `createAuthorityCertificate`, `verifyAuthorityCertificate`, `proposeRuntimeIngressActionContracts`, `projectAgentTransactionEnvelope`, `runtimeIngressDispatchNodeId`.
- Durable write functions should make the write explicit with verbs from `QUALITY.md`: `record*`, `persist*`, `commit*`, `consume*`, `mark*`, `activate*`.
- Read and derivation functions should use concrete verbs from `QUALITY.md`: `get*`, `list*`, `derive*`, `build*`, `format*`, `resolve*`.
- Avoid vague protocol mutation verbs inside protocol modules: `handle*`, `process*`, `do*`, and `run*`. `test/architecture/naming-posture.test.ts` enforces this for `src/protocol/**`.
- Runtime and adapter public entrypoints may use `run*` when they are actual runners, such as `runPackageInstallGateway` in `src/adapters/package-install/gateway.ts`.
- Avoid overclaiming names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, and `secureApproval*`; `test/architecture/naming-posture.test.ts` scans `src/**`.

**Variables:**
- Use camelCase for local variables and object fields: `authorityCertificateId`, `terminalObjectRef`, `signingInputDigest`, `gatewayAdmissionRequired`, `requiredPriorActionContractIds`.
- Use exact protocol-id suffixes in object fields: `actionContractId`, `policyDecisionId`, `greenlightId`, `gateAttemptId`, `mutationAttemptId`, `receiptId`, `proofGapId`.
- Use uppercase only for durable constants and protocol versioning: `PROTOCOL_VERSION`, `CANONICALIZER_VERSION`, `ED25519_ALGORITHM`, `D1_HARNESS_TRANSITION_TOKEN`.
- Use explicit arrays and maps for test guards instead of regex-only magic where a concept list is finite: `protocolAreas` in `test/architecture/import-posture.test.ts`, `protocolNavigation` in `src/protocol/navigation/index.ts`, and `protocolObjectTypes` in `src/protocol/areas/object-registry/index.ts`.

**Types:**
- Use PascalCase for exported types and classes: `HandshakeKernel`, `AuthorityCertificate`, `GatewayCheckResult`, `RuntimeIngressResult`, `ProtocolStore`.
- Zod schema exports end in `Schema` and mirror the protocol noun: `AuthorityCertificateSchema`, `GatewayCheckInputSchema`, `RuntimeIngressDispatchBlockSchema`.
- Input schema exports use the transition noun plus `InputSchema`: `CreateAuthorityCertificateInputSchema`, `EvaluatePolicyInputSchema`, `GatewayCheckInputSchema`.
- Prefer `z.input<typeof Schema>` for accepted caller input and `z.infer<typeof Schema>` or `z.output<typeof Schema>` for parsed/internal values. Examples: `AuthorityCertificateSignerInput` and `ParsedAuthorityCertificateSignerInput` in `src/protocol/areas/authority-certificate/inputs.ts`.
- Public stable protocol objects keep exact names from `QUALITY.md`: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc.json`.
- Key settings: `printWidth: 120`, `semi: true`, `singleQuote: false`, `trailingComma: "all"`.
- Full formatting gate: `npm run format:check`.
- Final whitespace gate: `git diff --check` as part of `npm run check:repo`.

**Linting:**
- Use ESLint from `eslint.config.js` with `typescript-eslint` recommended rules.
- Lint scope is `src` and `test`: `npm run lint`.
- Lint must pass with zero warnings because `package.json` sets `eslint src test --max-warnings=0`.
- `@typescript-eslint/consistent-type-imports` is an error. Use separate `import type` lines for type-only imports.
- `@typescript-eslint/no-unused-vars` is an error, with `_`-prefixed args/caught errors/vars allowed for intentional unused values.
- `no-console` is an error except for `console.warn` and `console.error`; package scripts like `scripts/check-package-surface.mjs` may write explicit process output.

**TypeScript:**
- `tsconfig.json` uses strict TypeScript with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `forceConsistentCasingInFileNames`.
- Runtime target is `ES2022`; module mode is `ESNext` with `moduleResolution: "Bundler"`.
- Source and tests are both typechecked by `npm run check:types`.
- Declaration build uses `tsconfig.build.json`, emits declarations only, and includes `src`.

## Import Organization

**Order:**
1. Runtime/library imports first: `zod`, `bun:test`, `node:*`, `bun:sqlite`, Hono/Worker types.
2. Source value imports from local ownership boundaries.
3. Type-only imports in explicit `import type` statements.
4. Test fixture imports from `test/support/*` after source imports.

**Path Aliases:**
- Not detected. Use relative imports such as `../../src/protocol/kernel` and `../support/fixtures`.
- Public package-facing imports should use curated surfaces: `src/index.ts`, `src/runtime/index.ts`, `src/conformance/index.ts`, and `src/experimental.ts`.

**Boundary Rules:**
- Protocol modules must not import storage adapters. Guarded by `test/architecture/import-posture.test.ts`.
- HTTP and SDK code must not import protocol area internals below area `index.ts` files. Guarded by `test/architecture/import-posture.test.ts`.
- The kernel imports protocol area public indexes, not deep internal area files. Guarded by `test/architecture/import-posture.test.ts`.
- Area-to-area imports use public area indexes. Schema/input/type files may import another area's `schemas.ts` only for schema composition when allowed by `test/architecture/import-posture.test.ts`.
- `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts` are pure `export * from ...` aggregators; no local logic is allowed.
- `src/index.ts` is curated. Do not export `HandshakeKernel`, stores, recorder internals, or experimental gateway runners from the package root. Guarded by `test/architecture/root-exports.test.ts`.
- `src/runtime/index.ts` is an observer/compiler surface. It must not export `GatewayCheck`, `Greenlight`, `Mutation`, `PolicyDecision`, or `Receipt` authority. Guarded by `test/architecture/root-exports.test.ts` and `test/architecture/claim-boundary.test.ts`.

## Error Handling

**Patterns:**
- Use `HandshakeProtocolError` from `src/protocol/foundation/errors.ts` for protocol invariant failures with stable error codes and HTTP status.
- Represent denied authority as durable protocol objects where applicable. Refusals are first-class records in `src/protocol/areas/refusal/` and tested by `test/protocol/refusal-format.test.ts`.
- Record missing or uncertain downstream evidence as proof gaps, not success. This is exercised by `test/protocol/kernel-operation-lifecycle.test.ts`, `test/protocol/evidence-projections.test.ts`, and `test/integration/x402-d1-http.test.ts`.
- Public verification helpers that consume external artifacts should return structured failures rather than throw on ordinary invalid input. `verifyAuthorityCertificate` in `src/protocol/areas/authority-certificate/verify.ts` returns `{ valid, failures, envelope, signingInputDigest }`.
- Adapter runners must return refusal/proof-gap outcomes and avoid mutation on mismatches, missing verified gates, replay, or downstream uncertainty. See `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, and `test/adapters/x402-wallet-gateway.test.ts`.
- HTTP transition failures are mapped to typed envelopes via `src/http/errors/transition-error-envelope.ts` and tested in `test/http/http.test.ts`.

## Logging

**Framework:** Console only where explicitly allowed.

**Patterns:**
- Do not use logs as protocol evidence. Evidence belongs in protocol records, stream events, receipts, refusals, proof gaps, evidence projections, or AuthorityCertificates.
- `eslint.config.js` forbids `console.log`; only `console.warn` and `console.error` are allowed.
- Scripts may emit direct process output for command-line gates. `scripts/check-package-surface.mjs` prints the package dry-run result after enforcing required/forbidden package files.

## Comments

**When to Comment:**
- Prefer typed schemas, transition names, test names, and lane manifests over explanatory comments.
- Add comments only when they protect a non-obvious invariant or save a future reader from reconstructing a complex state-machine edge.
- Keep architectural commentary in tracked docs and lane manifests: `QUALITY.md`, `STRUCTURE.md`, `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, and `src/*/LANE.md`.

**JSDoc/TSDoc:**
- Not used as the primary convention. Public meaning is carried through exported types/schemas, README/quality/structure docs, lane manifests, and invariant tests.

## Function Design

**Size:** Keep functions scoped to one transition, projection, schema, adapter action, or guard. Split storage mechanics, transition behavior, and projection code into owned files instead of broad helper modules.

**Parameters:** Parse untrusted inputs at boundaries with Zod strict schemas. Examples: `CreateAuthorityCertificateInputSchema` in `src/protocol/areas/authority-certificate/inputs.ts` and `RuntimeIngressDispatchBlockSchema` in `src/runtime/ingress/index.ts`.

**Return Values:** Return typed protocol records or explicit discriminated outcomes. Examples: `RuntimeIngressResult` in `src/runtime/ingress/index.ts`, `GatewayCheckResult` in `src/protocol/areas/gateway-gate/index.ts`, and `VerifyAuthorityCertificateResult` in `src/protocol/areas/authority-certificate/verify.ts`.

**Authority Discipline:**
- Runtime helpers may observe and propose; they must not issue policy decisions, greenlights, gateway checks, receipts, mutation attempts, or provider enforcement. This is stated in `src/runtime/LANE.md` and guarded by `test/architecture/claim-boundary.test.ts`.
- Install compilers may produce installable records or refusal reasons; they must not issue authority, signatures, or downstream success claims. This is stated in `src/install/LANE.md`.
- Adapters are consequence holders and mutate only after `VerifiedGatewayCheck`. This is stated in `src/adapters/LANE.md` and enforced by `test/conformance/protected-mutation-adapter-conformance.test.ts`.

## Module Design

**Exports:** Use curated public faces.
- Package root: `src/index.ts`.
- Runtime subpath: `src/runtime/index.ts`.
- Conformance subpath: `src/conformance/index.ts`.
- Experimental reference gateway surface: `src/experimental.ts`.
- Protocol public schemas/inputs: `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts`.

**Barrel Files:** Use `index.ts` as ownership faces, not dumping grounds.
- Area indexes export local schemas, inputs, transitions, and guards as needed. Example: `src/protocol/areas/authority-certificate/index.ts`.
- Public aggregators are export-only. `test/architecture/import-posture.test.ts` fails if `src/protocol/public/schemas.ts` or `src/protocol/public/inputs.ts` gains local logic.
- Root exports are explicitly enumerated in `test/architecture/root-exports.test.ts`.

**Lane Manifests:** Every first-level `src/*` lane must keep a `LANE.md` or `README.md` with the fields required by `QUALITY.md` and enforced by `test/architecture/import-posture.test.ts`.

## Architecture Guards

**Repo Gates:**
- `npm run check:repo` is the full local and CI gate in `package.json`.
- CI is `.github/workflows/check.yml`, installs Bun `1.3.9`, runs `bun install --frozen-lockfile`, then `npm run check:repo`.
- The user reports the full repo gate recently passed via `npm run check:repo`; this mapping did not rerun the full gate.

**Guard Suites:**
- `test/architecture/naming-posture.test.ts`: workspace junk, root test files, bucket paths, loose-file thresholds, public faces, planning-stage labels, deleted docs, overclaiming names, vague protocol verbs, adapter rail leakage, and CI command binding.
- `test/architecture/import-posture.test.ts`: lane manifests, layer imports, D1/store statement separation, protocol public aggregators, area index posture, object-registry scope, and removed compatibility shims.
- `test/architecture/root-exports.test.ts`: curated root exports, explicit experimental surface, explicit conformance surface, and runtime ingress as non-authority observer/compiler surface.
- `test/architecture/package-surface.test.ts`: private source package posture, `exports`, packable files, and `pack:check` inclusion in `check:repo`.
- `test/architecture/claim-boundary.test.ts`: public entrypoint authority separation and current README/LANE claim boundary around x402, package install, runtime ingress, hosted operation, and AuthorityCertificate trust.
- `test/architecture/active-vocabulary.test.ts`: stale receiver vocabulary exclusion from active docs, commands, migrations, and code.

---

*Convention analysis: 2026-05-20*
