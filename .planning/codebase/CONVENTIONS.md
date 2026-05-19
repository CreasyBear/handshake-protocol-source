# Coding Conventions

**Analysis Date:** 2026-05-19

## Naming Patterns

**Files:**
- Use lowercase owned-concept file names with hyphens for multi-word concepts: `src/runtime/package-install/action-proposal.ts`, `src/http/routes/transition-route-registry.ts`, `src/protocol/foundation/reason-codes.ts`.
- Use `index.ts` as the public face for multi-file folders: `src/protocol/areas/action-contract/index.ts`, `src/http/routes/index.ts`, `src/storage/d1/index.ts`.
- Keep protocol areas under owned primitive folders: `src/protocol/areas/action-contract`, `src/protocol/areas/policy-greenlight`, `src/protocol/areas/gateway-gate`, `src/protocol/areas/proof-gap`.
- Do not create bucket directories named `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service`; `test/architecture/naming-posture.test.ts` enforces this for `src/**`.
- Root `test/` has no loose `*.test.ts` files; place tests under domain folders such as `test/protocol`, `test/http`, `test/runtime`, `test/adapters`, `test/architecture`, `test/integration`, and `test/conformance`.

**Functions:**
- Use camelCase for functions and methods: `createRuntimeExecution`, `proposeActionContract`, `evaluatePolicy`, `gatewayCheck`, `reconcileSurfaceOperation`.
- Durable write functions should start with explicit write verbs from `QUALITY.md`: `record*`, `persist*`, `commit*`, `consume*`, `mark*`, `activate*`.
- Read and derivation functions should use explicit read/derive verbs from `QUALITY.md`: `get*`, `list*`, `derive*`, `build*`, `format*`, `resolve*`.
- Avoid vague mutation verbs inside protocol modules: `handle*`, `process*`, `do*`, and `run*`; `test/architecture/naming-posture.test.ts` enforces this in `src/protocol/**`.
- Runtime and adapter public runners may use `run*` only for runner entrypoints such as `runPackageInstallGateway` in `src/adapters/package-install/gateway.ts`.
- Avoid overclaiming names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, and `secureApproval*`; `test/architecture/naming-posture.test.ts` enforces this in `src/**`.

**Variables:**
- Use camelCase for local variables and parameters: `observedParameters`, `surfaceOperationRef`, `refusalReasonCodes`, `gatewayPolicyDrift`.
- Use uppercase constants for stable shared constants: `PROTOCOL_VERSION` in `src/protocol/foundation/schema-core.ts`, `MAX_STREAM_COMMIT_RETRIES` in `src/protocol/areas/gateway-gate/transitions.ts`, `TEST_CALLER_AUTH_TOKENS` in `test/http/http.test.ts`.
- Prefer discriminated outcome values over booleans for authority-bearing results: `outcome: "action_contract_proposed"`, `outcome: "intent_compilation_refused"`, `outcome: "gateway_check_refused"`.
- Use `_`-prefixed names only for intentionally unused variables; `eslint.config.js` permits unused args, caught errors, and vars only when they match `^_`.

**Types:**
- Use PascalCase for exported types, interfaces, and classes: `HandshakeKernel`, `HandshakeProtocolError`, `PackageInstallGatewayResult`, `ProtocolStore`.
- Zod schemas use the `*Schema` suffix and infer exported types from schemas: `ActionContractSchema` and `type ActionContract` in `src/protocol/areas/action-contract/schemas.ts`.
- Transition input types use the `*Input` suffix and are backed by Zod input schemas: `ProposeActionContractInputSchema` and `ProposeActionContractInput` in `src/protocol/areas/action-contract/inputs.ts`.
- Result unions should use exact string discriminants instead of loosely shaped nullable objects: `PackageInstallGatewayResult` in `src/adapters/package-install/gateway.ts`.
- Protocol object names stay exact: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, `IsolationState`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc.json`.
- Settings: `printWidth: 120`, semicolons enabled, double quotes, trailing commas enabled.
- Run `npm run format:check` for verification and `npm run format` to rewrite formatting.

**Linting:**
- Use ESLint flat config in `eslint.config.js` with `typescript-eslint` recommended rules.
- Lint scope is `src` and `test` via `npm run lint`.
- Warnings are failures: `eslint src test --max-warnings=0`.
- Use separate type-only imports where possible; `@typescript-eslint/consistent-type-imports` is `error`.
- Do not leave unused values unless the name is intentionally `_`-prefixed.
- Do not use `console` except `console.warn` and `console.error`; ordinary logging is not a code pattern in `src/**`.

**TypeScript:**
- `tsconfig.json` enables strict mode, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- Target is `ES2022`, module is `ESNext`, and module resolution is `Bundler`.
- Runtime type surfaces use `zod` schemas at transition, adapter, HTTP, SDK, and fixture boundaries.

## Import Organization

**Order:**
1. External runtime dependencies such as `hono` and `zod`.
2. Node and Bun built-ins in tests and harnesses, such as `node:fs/promises`, `node:path`, and `bun:sqlite`.
3. Local source value imports from the owning lane.
4. Local source type imports using `import type`.
5. Test support imports from `test/support/*`.

**Path Aliases:**
- Not detected. Use relative imports inside `src/**` and `test/**`.
- Package-style public imports are smoke-tested through `await import("../../src")` in `test/architecture/root-exports.test.ts`.

**Import Boundaries:**
- `src/protocol/**` must not import storage adapters, HTTP transport, runtime wrappers, SDK code, or reference gateways; see `src/protocol/LANE.md` and `test/architecture/import-posture.test.ts`.
- `src/http/**` and `src/sdk/**` must not import protocol area internals except public area indexes; see `test/architecture/import-posture.test.ts`.
- `src/storage/**` imports store interfaces and object metadata, not primitive transition behavior; see `src/storage/LANE.md`.
- `src/adapters/**` imports gateway verification helpers and adapter-local schemas, not storage internals; see `src/adapters/LANE.md`.
- `src/runtime/**` may observe and propose but must not issue policy decisions, greenlights, gateway checks, receipts, or mutation attempts; see `src/runtime/LANE.md`.

## Error Handling

**Patterns:**
- Validate external or transition input with Zod before business logic: `GatewayCheckInputSchema.parse` in `src/protocol/areas/gateway-gate/transitions.ts`, `PackageInstallParametersSchema.parse` in `src/adapters/package-install/gateway.ts`, and `route.requestSchema` parsing in `src/http/app.ts`.
- Use `HandshakeProtocolError` for protocol and HTTP-facing failures, with stable `code`, HTTP `status`, and optional metadata in `src/protocol/foundation/errors.ts`.
- Use `HandshakeAmbiguousCommitError` for ambiguous durable commits and preserve `retryability: "ambiguous"` plus `commitState: "unknown"`.
- Convert HTTP errors into typed transition envelopes through `src/http/errors/transition-error-envelope.ts`.
- SDK callers receive `HandshakeClientError` with typed `code`, `retryability`, `commitState`, `proofRef`, and `refusalRef` in `src/sdk/client.ts`.
- Adapters catch mutation-surface failures only after a verified gate, then reconcile the surface operation as failed; see `runPackageInstallGateway` in `src/adapters/package-install/gateway.ts`.
- Record missing or uncertain evidence as refusals, proof gaps, or ambiguous commit metadata rather than smoothing it into success.

## Logging

**Framework:** console restricted by ESLint

**Patterns:**
- No general application logging framework is present.
- `no-console` is enforced for `src` and `test`, with only `console.warn` and `console.error` allowed in `eslint.config.js`.
- Tests expose debugging detail through assertion failure messages, structured error envelopes, and helper snapshots such as `TransitionBudgetRecorder` in `test/support/transition-budget-recorder.ts`.

## Comments

**When to Comment:**
- Keep source comments sparse. The dominant documentation pattern is explicit naming, schemas, lane manifests, and invariant tests.
- Add comments only when code cannot make an authority boundary or failure mode obvious on its own.
- Use `src/*/LANE.md` manifests for lane-level constraints, not inline comments.

**JSDoc/TSDoc:**
- Not detected as a routine convention in `src/**` or `test/**`.
- Prefer exported schema/type names and lane manifests over broad JSDoc blocks unless a public API needs generated documentation.

## Function Design

**Size:**
- Protocol transitions split into parse, context loading, assertion, build-plan, and commit-plan helpers: `src/protocol/areas/action-contract/transitions.ts` and `src/protocol/areas/gateway-gate/transitions.ts`.
- Keep public methods on `HandshakeKernel` thin; `src/protocol/kernel.ts` delegates to area transition functions and only wraps guard failures.

**Parameters:**
- Transition functions take typed input objects, not positional argument lists: `EvaluatePolicyInput`, `GatewayCheckInput`, `CreateReceiptExportInput`.
- Adapter runners take a single input object that includes protocol port, mutation surface, IDs, and observed parameters: `PackageInstallGatewayInput` in `src/adapters/package-install/gateway.ts`.
- Runtime helper configs are explicit objects with tenant, organization, principal, agent, run, catalog, action, gateway, expiry, and optional signing secret fields: `PackageInstallRuntimeConfig`.

**Return Values:**
- Return exact protocol records, typed result objects, or discriminated unions.
- Avoid returning bare success booleans for authority-bearing operations.
- Use `null` explicitly where protocol state requires absence, such as `greenlight: Greenlight | null` from `evaluatePolicy`.

## Module Design

**Exports:**
- Root exports are curated in `src/index.ts` and enforced by `test/architecture/root-exports.test.ts`.
- Internal kernel and store objects are intentionally absent from the package root: `HandshakeKernel`, `InMemoryProtocolStore`, and `D1ProtocolStore` are not root exports.
- Experimental reference gateway fixtures live on `src/experimental.ts` and are tested as a separate surface.
- Conformance checks live on `src/conformance/index.ts` and are exported through the `./conformance` package subpath in `package.json`.

**Barrel Files:**
- Use `index.ts` barrels as public faces for multi-file folders.
- Area `types.ts` faces stay local and should only re-export `../../foundation/schema-core`, `./schemas`, and `./inputs`; `test/architecture/import-posture.test.ts` enforces this.
- Public schema and input aggregators in `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts` are aggregation-only files.

**Architecture Conventions:**
- Every first-level `src/*` lane must keep `LANE.md` or `README.md` with the required fields listed in `QUALITY.md`; `test/architecture/import-posture.test.ts` enforces this.
- Split by authority owner, not by implementation convenience: `src/protocol`, `src/http`, `src/runtime`, `src/adapters`, `src/conformance`, `src/storage`, and `src/sdk`.
- Keep `.planning/` scratch out of canonical repo-facing surfaces; `README.md`, `QUALITY.md`, and `STRUCTURE.md` state that `.planning/` is not repo truth.
- Keep stale boundary vocabulary out of active docs, code, migrations, commands, and tests through `test/architecture/active-vocabulary.test.ts`.
- Preserve package surface curation through `package.json`, `scripts/check-package-surface.mjs`, and `test/architecture/package-surface.test.ts`.

---

*Convention analysis: 2026-05-19*
