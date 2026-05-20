# Coding Conventions

**Analysis Date:** 2026-05-20

## Naming Patterns

**Files:**
- Use ownership nouns, not generic buckets. `QUALITY.md`, `STRUCTURE.md`, and `test/architecture/naming-posture.test.ts` forbid source path segments such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service`.
- Keep first-level source lanes explicit and documented. `src/protocol/LANE.md`, `src/http/LANE.md`, `src/runtime/LANE.md`, `src/adapters/LANE.md`, `src/conformance/LANE.md`, `src/storage/LANE.md`, `src/sdk/LANE.md`, and `src/install/LANE.md` must each declare ownership, proof claim, imports, public surface, and extraction trigger.
- Use protocol area folders under `src/protocol/areas/*` for owned primitives. `test/architecture/import-posture.test.ts` enumerates the active protocol areas and checks that deprecated root compatibility shims stay removed.
- Keep generated-execution helper files named for proposal and graph roles. `src/runtime/package-install/action-proposal.ts`, `src/runtime/repo-write/action-proposal.ts`, `src/runtime/preview-deploy/action-proposal.ts`, and `src/runtime/codemode-multi-action/generated-program-runner.ts` are the current runtime naming pattern.

**Functions:**
- Durable writes should use explicit verbs such as `record*`, `persist*`, `commit*`, `consume*`, `mark*`, and `activate*` per `QUALITY.md`.
- Reads and derivations should use `get*`, `list*`, `derive*`, `build*`, `format*`, and `resolve*` per `QUALITY.md`.
- Avoid vague protocol mutation names such as `handle*`, `process*`, `do*`, and `run*` inside `src/protocol/**`; `test/architecture/naming-posture.test.ts` enforces this. Public adapter and runtime entrypoints may use `run*`, as in `src/adapters/package-install/gateway.ts` and `src/runtime/codemode-multi-action/generated-program-runner.ts`.
- Avoid overclaiming names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, and `secureApproval*`; `test/architecture/naming-posture.test.ts` enforces this over `src/**`.

**Variables:**
- Use explicit protocol nouns for records and outcomes. Representative examples are `actionContract`, `policy`, `greenlight`, `gatewayResult`, `proofGap`, and `surfaceOperationRef` in `test/integration/package-install-end-to-end.test.ts` and `test/integration/repo-write-d1-http.test.ts`.
- Use `*Ref`, `*Id`, `*Digest`, `*ReasonCode`, and `*Status` suffixes for protocol identity, canonicalization, refusal, and state fields. This pattern is visible in `src/protocol/public/schemas.ts`, `src/protocol/store/port.ts`, and `test/support/fixtures.ts`.
- Use `as const` and `satisfies` when values must remain narrow and checked. Examples include role-token maps in `test/http/http.test.ts` and `test/support/d1-http-harness.ts`.

**Types:**
- Schema-derived types use the paired `Schema`/type pattern with Zod. Examples include `ReceiptSchema` and `Receipt` in `src/protocol/areas/receipt-export/schemas.ts`, plus public aggregators in `src/protocol/public/schemas.ts`.
- Public package types are exported deliberately through `src/index.ts`, `src/conformance/index.ts`, and `src/experimental.ts`; `test/architecture/root-exports.test.ts` enforces the root, conformance, and experimental export sets.
- Store and adapter contracts are structural TypeScript types, not classes where plain contracts are enough. Examples include `ProtocolStore` in `src/protocol/store/port.ts`, `ProtectedMutationAdapterProbe` in `src/conformance/index.ts`, and gateway input/result types under `src/adapters/*/gateway.ts`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc.json`: `printWidth` 120, semicolons enabled, double quotes, and trailing commas.
- Keep all TypeScript and markdown compatible with `npm run format:check` from `package.json`; the full gate also runs `git diff --check` from `package.json`.

**Linting:**
- Use ESLint via `eslint.config.js` and `npm run lint` from `package.json`.
- `eslint.config.js` applies `typescript-eslint` recommended rules to `src/**/*.ts` and `test/**/*.ts`.
- `eslint.config.js` requires separate type-only imports through `@typescript-eslint/consistent-type-imports`.
- `eslint.config.js` fails unused variables unless prefixed with `_`, and forbids `console` except `console.warn` and `console.error`.

## Import Organization

**Order:**
1. External runtime and standard-library imports, as in `src/http/openapi/index.ts` importing `zod` before local route and protocol modules.
2. Type-only local imports should use `import type`, as in `src/sdk/client.ts`, `src/protocol/store/port.ts`, and `test/protocol/model-based-invariants.test.ts`.
3. Value imports from local lanes should use the lane public face where the guard tests require it. `test/architecture/import-posture.test.ts` checks that HTTP, SDK, kernel, and protocol areas avoid importing protected internals directly.

**Path Aliases:**
- No TypeScript path aliases are configured. `tsconfig.json` uses `moduleResolution: "Bundler"` and repo code imports with relative paths.
- Use package subpaths only at the package boundary declared in `package.json`: `.`, `./conformance`, `./experimental`, and `./package.json`.

## Error Handling

**Patterns:**
- Use `HandshakeProtocolError` for protocol and HTTP transition failures that need status, retryability, commit-state, or request metadata. Examples live in `src/protocol/foundation/errors.ts`, `src/http/errors/transition-error-envelope.ts`, `src/http/admission/caller-auth.ts`, and `src/http/admission/request-context.ts`.
- Register stable source-emitted reason and transition error codes. `test/protocol/reason-code-registry.test.ts` scans `src/**` for emitted codes and verifies they exist in `src/protocol/foundation/reason-codes.ts` or `src/http/errors/codes.ts`.
- Represent expected negative outcomes as refusals, proof gaps, or typed result objects instead of throwing when the protocol can record evidence. Examples are gateway refusal assertions in `test/adapters/package-install-gateway.test.ts` and proof-gap assertions in `test/protocol/evidence-projections.test.ts`.
- Use plain `throw new Error(...)` for impossible test narrowing and local invariant failures where TypeScript cannot prove the branch, as in `test/runtime/package-install-runtime.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, and `test/support/fixtures.ts`.

## Logging

**Framework:** console

**Patterns:**
- Source and tests should not use routine logging. `eslint.config.js` forbids `console` in `src/**/*.ts` and `test/**/*.ts` except `warn` and `error`.
- Operational scripts may write concise process output. `scripts/check-package-surface.mjs` prints the package dry-run result after checking required and forbidden package files.

## Comments

**When to Comment:**
- Prefer lane manifests and explicit names over inline explanation. Ownership and constraints belong in `src/*/LANE.md`.
- Use comments sparingly in source. Current convention is to let Zod schemas, transition names, and tests carry meaning in `src/protocol/**` and `test/protocol/**`.

**JSDoc/TSDoc:**
- Not a dominant pattern. Public contracts are documented through exported type names in `src/index.ts`, schema names in `src/protocol/public/schemas.ts`, and guard tests in `test/architecture/*`.

## Function Design

**Size:** Keep functions narrow around one transition, projection, adapter action, or guard. `STRUCTURE.md` and `test/architecture/import-posture.test.ts` keep route metadata, invokers, response schemas, and protocol meaning separate.

**Parameters:** Prefer typed object inputs for protocol transitions and adapters. Examples include `CompileIntentInput` and `ProposeActionContractInput` in `src/protocol/public/inputs.ts`, gateway input types under `src/adapters/*/gateway.ts`, and client methods in `src/sdk/client.ts`.

**Return Values:** Return typed records or discriminated outcomes. Examples include gateway results in `src/protocol/areas/gateway-gate`, runtime proposal outcomes in `src/runtime/package-install/action-proposal.ts`, and conformance results in `src/conformance/index.ts`.

## Module Design

**Exports:** Keep exports curated by authority boundary. `src/index.ts` exposes stable root APIs, `src/conformance/index.ts` exposes reference checks, and `src/experimental.ts` exposes fixture gateway runners with explicit experimental names.

**Barrel Files:** Use `index.ts` as an intentional public face for multi-file folders. `QUALITY.md`, `STRUCTURE.md`, and `test/architecture/naming-posture.test.ts` require a public face for larger source folders and prevent loose source buckets.

**Source-Owned Truth:** Put durable metadata in source or tests that consume it. Examples include `src/protocol/navigation/index.ts`, `src/http/navigation/index.ts`, `src/protocol/foundation/reason-codes.ts`, and guard tests in `test/protocol/protocol-navigation.test.ts` and `test/protocol/reason-code-registry.test.ts`.

**Planning Boundary:** Treat `.planning/**` as scratch only. `AGENTS.md`, `README.md`, `QUALITY.md`, and `STRUCTURE.md` say tracked canon and source/tests are truth; do not promote planning labels into `package.json`, `.github/workflows/check.yml`, `src/**`, `test/**`, or canonical docs.

---

*Convention analysis: 2026-05-20*
