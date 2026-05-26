# Coding Conventions

**Analysis Date:** 2026-05-26

## Naming Patterns

**Files:**
- Use lowercase kebab-case for owned source concepts: `src/runtime/package-install/action-proposal.ts`, `src/protocol/areas/action-contract/contract-record.ts`, `src/http/routes/transition-route-registry.ts`.
- Keep protocol primitives under `src/protocol/areas/<concept>/`: `src/protocol/areas/action-contract`, `src/protocol/areas/policy-greenlight`, `src/protocol/areas/negotiation`.
- Use `index.ts` as the public face for multi-file modules: `src/protocol/areas/action-contract/index.ts`, `src/sdk/surface-clients/index.ts`, `src/http/routes/index.ts`.
- Use lane manifests for first-level source ownership: `src/protocol/LANE.md`, `src/http/LANE.md`, `src/install/LANE.md`, `src/x402-protected-tool/LANE.md`.
- Do not add bucket directories named `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service` under `src/**`; `test/architecture/naming-posture.test.ts` enforces this.
- Keep tests under a domain directory with `.test.ts` suffix: `test/protocol/kernel-policy-gateway.test.ts`, `test/http/http.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`. Root `test/*.test.ts` files are banned by `test/architecture/naming-posture.test.ts`.

**Functions:**
- Use camelCase exported functions with explicit protocol verbs: `proposeActionContract` in `src/protocol/areas/action-contract/transitions.ts`, `evaluatePolicy` in `src/protocol/areas/policy-greenlight/transitions.ts`, `proposeRuntimeIngressActionContracts` in `src/runtime/ingress/index.ts`.
- Use durable write verbs when a function records state: `recordCredentialResolutionEvidence` in `src/protocol/kernel.ts`, `commitProtocolRecords` in `src/storage/memory/index.ts`, `consumeGreenlight` in `src/storage/memory/index.ts`.
- Use read and derivation verbs for pure projection or lookup work: `getCurrentIdempotencyLedgerEntry` in `src/storage/memory/index.ts`, `derivePolicyConstraintEvaluation` and `buildPolicyInput` in `src/protocol/areas/policy-greenlight/transitions.ts`.
- Avoid vague protocol mutation names in protocol modules. `test/architecture/naming-posture.test.ts` rejects `handle*`, `process*`, `do*`, and `run*` patterns under `src/protocol`.
- Public runners may use `run*` only where runner semantics are explicit, such as `runCliCommand` in `src/cli/main.ts`, `runX402WalletGateway` in `src/adapters/x402-payment/wallet-gateway.ts`, and example `run.ts` files under `examples/**`.
- Avoid overclaiming names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, and `secureApproval*`; `test/architecture/naming-posture.test.ts` enforces this in `src/**`.

**Variables:**
- Use camelCase for local values and object fields: `policyInputDigest`, `gatewayCredentialBindingEvaluation`, and `protectedPathPosture` in `src/protocol/areas/policy-greenlight/transitions.ts`.
- Use UPPER_SNAKE_CASE for stable exported constants where they are global protocol headers or versions: `PROTOCOL_VERSION` in `src/protocol/foundation/schema-core.ts`, `CANONICALIZER_VERSION` in `src/protocol/foundation/canonical.ts`.
- Use explicit non-authority flags on product, runtime, CLI, and MCP projections: `authorityCreated`, `greenlightCreated`, `gatewayCheckPerformed`, `mutationAttempted`, `credentialMaterialIncluded`, `authorityCertificateMinted`.
- Use `as const` and `satisfies` to lock literal surfaces without widening: `TEST_CALLER_AUTH_TOKENS` in `test/http/http.test.ts`, `expectedIdByType` in `test/protocol/negotiation-object-registry.test.ts`.
- Use fixture names that state authority posture: `createGreenlitContract`, `recordSafeBypassProbes`, and `makePackageInstallCandidate` in `test/support/fixtures.ts`.

**Types:**
- Use PascalCase type names and schema names ending in `Schema`: `ActionContractSchema` and `ActionContract` in `src/protocol/areas/action-contract/schemas.ts`, `NegotiationSessionSchema` and `NegotiationSession` in `src/protocol/areas/negotiation/schemas.ts`.
- Derive runtime-validated types from Zod schemas with `z.infer` for stored records and `z.input` for caller input shapes: `RuntimeIngressProposalInput` in `src/runtime/ingress/index.ts`, `TransitionErrorEnvelope` in `src/http/errors/transition-error-envelope.ts`.
- Model transition results as discriminated unions or explicit outcome records: `RuntimeIngressActionProposal` in `src/runtime/ingress/index.ts`, `PolicyEvaluationResponse` in `src/protocol/areas/policy-greenlight/transitions.ts`.
- Keep protocol object names exact where they represent primitives: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState` are named in `QUALITY.md`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc.json`: `printWidth: 120`, semicolons enabled, double quotes, trailing commas enabled.
- Use `.editorconfig`: UTF-8, LF endings, two-space indentation, final newline, and trimmed trailing whitespace for code.
- Keep Markdown trailing whitespace behavior from `.editorconfig`; `.md` files do not trim trailing whitespace.
- Format the full tree with `npm run format` and check it with `npm run format:check` from `package.json`.
- TypeScript is strict. `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`; treat optional values and indexed reads as proof obligations.

**Linting:**
- Use ESLint 10 with `typescript-eslint` recommended config from `eslint.config.js`.
- Lint only `src/**/*.ts` and `test/**/*.ts` with `npm run lint`; `dist/**`, `coverage/**`, `node_modules/**`, and `docs/internal/archive/**` are ignored in `eslint.config.js`.
- Enforce separate type imports through `@typescript-eslint/consistent-type-imports` in `eslint.config.js`.
- Treat unused values as errors unless they are intentionally prefixed with `_`; this is configured in `eslint.config.js`.
- Do not use `console` in source or tests except `console.warn` and `console.error`; this is enforced by `eslint.config.js`.

## Import Organization

**Order:**
1. Import external packages and Node built-ins first: `zod`, `hono`, `bun:test`, `node:fs`, `node:path`.
2. Import source value modules by relative path from the current lane: `src/http/app.ts` imports protocol, storage, route, and handler modules by relative paths.
3. Import source types with `import type`; ESLint requires separate type imports. Examples: `src/protocol/kernel.ts`, `src/runtime/ingress/index.ts`.
4. Import local sibling files last: protocol area transition files import `./schemas`, `./inputs`, `./guards`, or `./types` after cross-area dependencies.
5. In tests, import `bun:test` first, then source under `../../src`, then support helpers under `../support`. Examples: `test/protocol/kernel-policy-gateway.test.ts`, `test/runtime/runtime-ingress.test.ts`.

**Path Aliases:**
- No TypeScript path aliases are configured in `tsconfig.json`; use relative imports inside `src` and `test`.
- Package self-imports are used only where package subpath behavior is under test, such as `handshake-protocol-kernel/sdk/role-clients` in `test/sdk/role-clients.test.ts`.
- Public package surfaces are curated through `src/index.ts`, `src/adapter-sdk/index.ts`, `src/conformance/index.ts`, `src/runtime/index.ts`, `src/mcp/index.ts`, `src/x402-protected-tool/index.ts`, and `src/hosted-admission/index.ts`.
- Import posture is test-enforced by `test/architecture/import-posture.test.ts`: protocol cannot import storage adapters, HTTP/SDK cannot import protocol area internals, storage cannot import primitive behavior modules, and area-to-area imports stay on public `index.ts` faces.
- Official x402 signer and paid-client imports stay inside `src/adapters/x402-payment/wallet-gateway.ts`; `test/architecture/import-posture.test.ts` forbids `@x402/core/client`, `@x402/fetch`, `@x402/axios`, and `@x402/evm*` elsewhere in `src/**`.

## Error Handling

**Patterns:**
- Parse external or boundary input with Zod before transition logic runs. Examples: `EvaluatePolicyInputSchema.parse` in `src/protocol/areas/policy-greenlight/transitions.ts`, `RuntimeIngressDispatchBlockSchema.parse` in `src/runtime/ingress/index.ts`, `TransitionErrorResponseSchema.parse` in `src/http/errors/transition-error-envelope.ts`.
- Use `HandshakeProtocolError` for protocol and HTTP transition failures that need a stable code, status, retryability, commit state, proof ref, or refusal ref. Definition: `src/protocol/foundation/errors.ts`.
- Use guard functions returning `TransitionGuardResult` for invariant checks that should become structured transition errors. Examples: `guardPolicyEvaluation` in `src/protocol/areas/policy-greenlight/guards.ts`, `guardCatalogRegistration` in `src/protocol/areas/catalog-envelope`.
- Return structured refusals, proof gaps, and non-authority outcomes instead of generic success/failure booleans. Examples: `PolicyEvaluationResponse` in `src/protocol/areas/policy-greenlight/transitions.ts`, `RuntimeIngressResponsePosture` in `src/runtime/ingress/index.ts`.
- Convert protocol errors to HTTP error envelopes at the transport edge. `src/http/app.ts` uses `transitionErrorResult`; `src/sdk/surface-clients/transport.ts` converts failed responses into `HandshakeClientError`.
- Use generic `Error` for impossible internal/test fixture assertions and external adapter fixture failures only when no protocol envelope is being emitted. Examples: fixture assertions in `test/support/fixtures.ts` and `test/protocol/model-based-invariants.test.ts`.
- Preserve ambiguous commit as an explicit error state. `HandshakeAmbiguousCommitError` in `src/protocol/foundation/errors.ts` carries `retryability: "ambiguous"` and `commitState: "unknown"`.

## Logging

**Framework:** console

**Patterns:**
- Do not add ordinary `console.log` calls to `src` or `test`; `eslint.config.js` rejects console usage except `warn` and `error`.
- Do not use logs as protocol evidence. Durable evidence lives in protocol records, stream events, receipts, refusals, proof gaps, and redacted projections.
- CLI and demo output should flow through explicit output/rendering modules or process stdout behavior rather than incidental logging. Relevant files: `src/cli/main.ts`, `src/cli/command-manifest.ts`, `examples/service-workflow-admission/run.ts`.
- Tests assert serialized output and generated artifacts directly instead of depending on console logs. Examples: `test/cli/cli-evidence.test.ts`, `test/product/external-adapter-sdk-demo.test.ts`, `test/product/service-workflow-admission.test.ts`.

## Comments

**When to Comment:**
- Keep comments sparse and tied to boundary or type-level intent. Use names, schemas, lane manifests, and tests as the primary documentation mechanism.
- Use comments for intentional compile-time negative tests with `@ts-expect-error`, as in `test/sdk/role-clients.test.ts`.
- Avoid TODO/FIXME/HACK/XXX comments in active source and tests; no matches were detected under `src` or `test`.

**JSDoc/TSDoc:**
- Not a primary convention. Public meaning is expressed through Zod schemas, exported TypeScript types, lane manifests such as `src/protocol/LANE.md`, and architecture tests such as `test/architecture/root-exports.test.ts`.

## Function Design

**Size:** Prefer orchestration functions that delegate into named context/build/commit helpers for transitions. Examples: `evaluatePolicy` in `src/protocol/areas/policy-greenlight/transitions.ts`, `proposeRuntimeIngressActionContracts` in `src/runtime/ingress/index.ts`.

**Parameters:** Use object parameters for public transition inputs and complex helper calls. Examples: `CompileIntentInput` in `src/protocol/public/inputs.ts`, `EvaluatePolicyInput` in `src/protocol/areas/policy-greenlight/inputs.ts`, `RuntimeIngressDispatchBlock` in `src/runtime/ingress/index.ts`.

**Return Values:** Return typed records or discriminated results with explicit authority flags. Examples: `PolicyEvaluationResponse` in `src/protocol/areas/policy-greenlight/transitions.ts`, `RuntimeIngressResult` in `src/runtime/ingress/index.ts`, CLI output in `src/cli/main.ts`.

**Async:** Use `async` for store-backed transitions, digest calculation, gateway checks, HTTP handling, and process proofs. Examples: `digestCanonical` in `src/protocol/foundation/canonical.ts`, `createRuntimeIngressEvidence` in `src/runtime/ingress/index.ts`, `createGeneratedGraphEvidenceFixture` in `test/support/http-protocol-fixtures.ts`.

**Validation:** Validate before building authority-bearing objects. Examples: `derivePolicyConstraintEvaluation` in `src/protocol/areas/policy-greenlight/transitions.ts` collects isolation, sequence, posture, idempotency, credential, and delegated-authority state before policy decision construction; `runX402WalletGateway` tests in `test/adapters/x402-wallet-gateway.test.ts` assert signing happens only after a verified gateway check.

## Module Design

**Exports:** Export stable package surfaces deliberately. `src/index.ts` exposes HTTP app creation, public schemas/inputs, selected evidence/navigation helpers, and SDK client types; `test/architecture/root-exports.test.ts` enforces the exact root export list.

**Barrel Files:** Use `index.ts` barrels as ownership faces, not uncontrolled dumping grounds. Examples: `src/protocol/areas/action-contract/index.ts`, `src/protocol/areas/negotiation/index.ts`, `src/http/routes/index.ts`.

**Area Modules:** Keep protocol primitive code under `src/protocol/areas/*` with local `schemas.ts`, `inputs.ts`, `types.ts`, `transitions.ts`, `guards.ts`, and `index.ts` faces where applicable. Examples: `src/protocol/areas/gateway-gate`, `src/protocol/areas/policy-greenlight`, `src/protocol/areas/receipt-export`.

**Schema Modules:** Define Zod schemas beside their owned primitive and export derived TypeScript types from the same file. Examples: `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/areas/gateway-gate/schemas.ts`, `src/protocol/areas/negotiation/schemas.ts`.

**Schema-Only Evidence Areas:** For evidence-only areas that must not create authority, follow the negotiation pattern from commit `4946237`: `src/protocol/areas/negotiation/index.ts` exports only `./schemas` and `./inputs`; `src/protocol/areas/negotiation` has no `transitions.ts`; `src/index.ts` does not export negotiation; downstream product/runtime surfaces do not import negotiation. `test/architecture/negotiation-no-authority-surface.test.ts` enforces the guard.

**Boundary Tests:** Treat architecture and naming tests as part of module design. `test/architecture/import-posture.test.ts`, `test/architecture/naming-posture.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/root-exports.test.ts`, and `test/architecture/negotiation-no-authority-surface.test.ts` define what future modules may import, name, export, and claim.

---

*Convention analysis: 2026-05-26*
