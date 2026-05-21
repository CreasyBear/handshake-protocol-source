# Coding Conventions

**Analysis Date:** 2026-05-21

## Naming Patterns

**Files:**
- Use concept-owned, kebab-case folders for protocol areas and protected surfaces: `src/protocol/areas/action-contract`, `src/protocol/areas/gateway-gate`, `src/runtime/package-install`, `src/adapters/preview-deploy`.
- Use stable lane file names inside protocol areas: `schemas.ts`, `inputs.ts`, `guards.ts`, `transitions.ts`, `index.ts`, and `types.ts`, as in `src/protocol/areas/action-contract/schemas.ts` and `src/protocol/areas/policy-greenlight/transitions.ts`.
- Give every multi-file source folder an `index.ts` public face. This is enforced by `test/architecture/naming-posture.test.ts`.
- Do not introduce generic bucket directories under `src/**`. The banned path segments are `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service`, enforced in `test/architecture/naming-posture.test.ts`.
- Do not add root-level `test/*.test.ts`; tests live under typed test lanes such as `test/protocol`, `test/http`, `test/adapters`, `test/runtime`, `test/integration`, `test/conformance`, `test/product`, and `test/architecture`.

**Functions:**
- Use `camelCase` for functions and methods: `compileIntent`, `proposeActionContract`, `evaluatePolicy`, `gatewayCheck`, `createReceiptExport` in `src/protocol/kernel.ts`.
- Durable write functions should make the write explicit with `record*`, `persist*`, `commit*`, `consume*`, `mark*`, or `activate*`, following `QUALITY.md`.
- Read and derivation functions should use explicit read/derive verbs: `get*`, `list*`, `derive*`, `build*`, `format*`, and `resolve*`, following `QUALITY.md` and examples like `buildAuthorityCertificateSigningInput` in `src/index.ts`.
- Avoid vague protocol mutation names such as `handle*`, `process*`, `do*`, and `run*` inside `src/protocol/**`. `test/architecture/naming-posture.test.ts` enforces this. Runtime and adapter public entrypoints may use `run*`, such as `runPackageInstallGateway` under `src/adapters/package-install/gateway.ts`.

**Variables:**
- Use `camelCase` locals and explicit domain nouns: `actionContractId`, `greenlightId`, `gatewayRegistryEntryId`, `protectedPathPostureId`, `transitionRequestContext`.
- Use uppercase constants only for true constants such as `PROTOCOL_VERSION` in `src/protocol/public/schemas.ts` and `HANDSHAKE_PROTOCOL_VERSION_HEADER` in `src/http/admission/request-context.ts`.
- Prefer typed literal maps and arrays with `as const satisfies`, as in `src/protocol/foundation/reason-codes.ts`, `src/http/errors/codes.ts`, `test/support/fixtures.ts`, and `test/http/http.test.ts`.

**Types:**
- Use `PascalCase` for exported domain types: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheckResult`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.
- Use `PascalCaseSchema` for Zod schemas: `ActionContractSchema` in `src/protocol/areas/action-contract/schemas.ts`, `TransitionErrorEnvelopeSchema` in `src/http/errors/transition-error-envelope.ts`, and `ReasonCodeSchema` in `src/protocol/foundation/schema-core.ts`.
- Export Zod-derived types with `z.infer` or `z.input`, as in `src/protocol/areas/action-contract/schemas.ts` and `src/protocol/areas/protected-path-posture/inputs.ts`.

## Code Style

**Formatting:**
- Tool: Prettier.
- Config: `.prettierrc.json`.
- Key settings: `printWidth: 120`, semicolons enabled, double quotes, and trailing commas.
- Full formatting verification is part of `npm run check:repo` through `npm run format:check` in `package.json`.

**Linting:**
- Tool: ESLint with `typescript-eslint` recommended config in `eslint.config.js`.
- Lint scope: `src/**/*.ts` and `test/**/*.ts`.
- Type-only imports must use `import type`; `@typescript-eslint/consistent-type-imports` is an error.
- Unused variables are errors unless intentionally prefixed with `_`.
- `console` is disallowed except `console.warn` and `console.error`. Source code should not rely on runtime logging as evidence.

**TypeScript:**
- TypeScript is strict by repo contract. `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, and `moduleResolution: "Bundler"`.
- Source code is ESM. `package.json` sets `"type": "module"`.
- Public declaration output is built from `src` only through `tsconfig.build.json`; tests and scratch files are not declaration surfaces.

**Repo Gate:**
- Use `npm run check:repo` as the full local and CI gate. It runs typecheck, lint, format check, Bun tests, package-surface check, and `git diff --check`.
- CI in `.github/workflows/check.yml` installs Bun `1.3.9` and runs `npm run check:repo`.
- Focused quality gates are `npm run quality:architecture`, `npm run quality:storage`, and `npm run quality:claims` in `package.json`.

## Import Organization

**Order:**
1. External runtime packages and Node builtins: `hono`, `zod`, `node:fs`, `node:path`, `node:os`, `node:url`.
2. Type-only imports from local source using `import type`, kept separate from value imports.
3. Local lane imports by relative path, with protocol consumers importing public faces instead of internals.

**Path Aliases:**
- Not used. All imports are relative paths or package imports.
- Do not add TypeScript path aliases unless the import-posture tests are updated intentionally.

**Boundary Rules:**
- `src/protocol/**` must not import storage adapters, HTTP transport, SDK/client code, runtime wrappers as authority, or reference gateways. Guarded by `test/architecture/import-posture.test.ts`.
- `src/http/**` and `src/sdk/**` must not import protocol area internals except through public indexes. Guarded by `test/architecture/import-posture.test.ts`.
- `src/adapters/**` must not import storage internals. Guarded by `test/architecture/import-posture.test.ts`.
- `src/storage/**` must not import primitive behavior modules or public schema/input aggregators as behavior. Guarded by `test/architecture/import-posture.test.ts`.
- Protocol area internals import other areas through their public `index.ts` face, with narrow schema exceptions documented in `test/architecture/import-posture.test.ts`.

## Error Handling

**Patterns:**
- Protocol and HTTP errors use `HandshakeProtocolError` and `HandshakeAmbiguousCommitError` from `src/protocol/foundation/errors.ts`.
- HTTP surfaces convert errors into typed envelopes with `TransitionErrorResponseSchema` in `src/http/errors/transition-error-envelope.ts`.
- Register stable protocol reason codes in `src/protocol/foundation/reason-codes.ts`.
- Register stable HTTP transition error codes in `src/http/errors/codes.ts`.
- `test/protocol/reason-code-registry.test.ts` scans emitted source literals and verifies they exist in the protocol or HTTP error registries.
- Zod schemas validate boundary input with `.parse()` or `.safeParse()`, as in `src/http/app.ts`, `src/http/errors/transition-error-envelope.ts`, and protocol area `inputs.ts` files.
- Use `throw new Error(...)` for impossible local invariants and test helper preconditions, such as missing fixture records in `test/support/fixtures.ts` or `test/http/http.test.ts`.
- Missing, partial, ambiguous, or refused evidence must become typed refusal, proof-gap, retryability, or commit-state data. Do not smooth it into generic success.

## Logging

**Framework:** None.

**Patterns:**
- Runtime logging is not a proof mechanism. Source and tests assert durable records, typed receipts, refusals, proof gaps, stream offsets, and error envelopes.
- `eslint.config.js` forbids `console` calls except `console.warn` and `console.error`.
- Test subprocesses may print inside generated script strings when the subprocess output is the assertion target, as in `test/protocol/authority-certificate.test.ts`.

## Comments

**When to Comment:**
- Comments are sparse and should explain authority-sensitive reasoning, not restate code. Example comments in `src/runtime/codemode-multi-action/generated-program-runner.ts` explain whole-block preflight and sequencing.
- Prefer lane manifests over inline prose for ownership rules. Each first-level `src/*/LANE.md` declares authority owner, proof claim, constraints, imports, public surface, and extraction trigger.

**JSDoc/TSDoc:**
- Not a primary convention. Public meaning is carried by typed schemas, exported type names, lane manifests, tests, and compact canon docs such as `QUALITY.md` and `STRUCTURE.md`.

## Function Design

**Size:** Keep transition methods and entrypoints thin when possible.
- `src/protocol/kernel.ts` delegates public kernel methods to area transition functions and centralizes recorder construction.
- `src/http/app.ts` keeps route registration, admission, parsing, scope checks, request context construction, and invoker dispatch separate.
- Split complex protocol behavior into schemas, inputs, guards, transition functions, and record builders inside the owning area.

**Parameters:** Use typed input objects rather than positional parameter lists for protocol transitions.
- Examples: `CompileIntentInput`, `ProposeActionContractInput`, `GatewayCheckInput`, and `CreateReceiptExportInput` are imported through `src/protocol/public/inputs.ts`.
- Boundary functions parse input objects through Zod schemas, as in protocol area `inputs.ts` files.

**Return Values:** Return typed protocol records or typed result objects.
- Gateway transitions return `GatewayCheckResult` with gate attempt, mutation attempt, receipt, refusal, and proof-gap context from `src/protocol/areas/gateway-gate`.
- Policy evaluation returns `{ decision: PolicyDecision; greenlight: Greenlight | null }` from `src/protocol/kernel.ts`.
- HTTP errors return `TransitionErrorResponseBody` from `src/http/errors/transition-error-envelope.ts`.

## Module Design

**Exports:** Keep public surfaces curated.
- Root exports live in `src/index.ts` and are protected by `test/architecture/root-exports.test.ts`.
- Runtime observer/compiler helpers live on `./runtime` through `src/runtime/index.ts`; they are intentionally absent from root exports.
- Reference gateway fixtures live on `./experimental` through `src/experimental.ts`; they are intentionally absent from root exports.
- Conformance checks live on `./conformance` through `src/conformance/index.ts`; they are intentionally absent from root exports.
- `package.json` exposes only `.`, `./conformance`, `./runtime`, `./experimental`, and `./package.json`.

**Barrel Files:** Use explicit public faces only where ownership is clear.
- Protocol area `index.ts` files export local schemas, inputs, guards, transitions, and types.
- `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts` are aggregator-only files. `test/architecture/import-posture.test.ts` rejects non-export lines in these files.
- Area `types.ts` faces are local-only and constrained by `test/architecture/import-posture.test.ts`.

**Scratch Boundary:**
- `.planning/`, `.agents/`, `skills-lock.json`, and workspace junk are scratch. `.gitignore` excludes `.planning/`, `.agents/`, and `skills-lock.json`.
- `scripts/check-package-surface.mjs` rejects `.planning/`, `.agents/`, `skills-lock.json`, `test/`, and deleted docs trees from the package dry-run.
- `test/architecture/package-surface.test.ts` verifies package files stay limited to `src`, `dist`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and compact `docs/internal/*` canon.

---

*Convention analysis: 2026-05-21*
