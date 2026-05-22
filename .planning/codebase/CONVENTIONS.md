# Coding Conventions

**Analysis Date:** 2026-05-22

## Naming Patterns

**Files:**
- Use lower-kebab concept names for implementation files: `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/surfaces/boundary-manifest.ts`, and `src/http/admission/request-context.ts`.
- Use owned-domain directory names, not buckets: `src/protocol/areas/action-contract/`, `src/protocol/areas/policy-greenlight/`, `src/protocol/areas/gateway-gate/`, `src/sdk/surface-clients/`, and `src/mcp/`.
- Do not introduce source path segments named `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service`; `test/architecture/naming-posture.test.ts` enforces this against `src/**`.
- Name tests by guarded behavior and ownership lane: `test/architecture/surface-boundary-posture.test.ts`, `test/mcp/mcp-schema-contract.test.ts`, `test/sdk/role-clients.test.ts`, and `test/conformance/x402-upstream-exact-fixtures.test.ts`.
- Keep root `test/` free of loose `.test.ts` files; place tests under `test/protocol/`, `test/architecture/`, `test/http/`, `test/runtime/`, `test/adapters/`, `test/mcp/`, `test/cli/`, `test/sdk/`, `test/conformance/`, `test/product/`, or `test/integration/`.

**Functions:**
- Use lowerCamelCase for functions and methods: `canonicalize()` in `src/protocol/foundation/canonical.ts`, `proposeMcpX402Payment()` in `src/mcp/x402-proposal.ts`, `runCliCommand()` in `src/cli/main.ts`, and `runX402WalletGateway()` in `src/adapters/x402-payment/wallet-gateway.ts`.
- Use durable write verbs when the function records protocol state: `recordCredentialResolutionEvidence()` in `src/protocol/kernel.ts`, `persistRecordIfAbsentOrSame()` through `src/protocol/events/records.ts`, `commitPolicyEvaluation()` in `src/protocol/areas/policy-greenlight/policy-record/index.ts`, and `consume`-style gateway greenlight handling in `src/protocol/areas/gateway-gate/`.
- Use derivation/read verbs for pure or read-only helpers: `digestCanonical()` in `src/protocol/foundation/canonical.ts`, `buildX402PaymentCompileIntentInput()` in `src/adapters/x402-payment/action-proposal.ts`, `format`-style CLI output helpers in `src/cli/output.ts`, and `resolveRecoveryTerminalConflictProofGap()` in `src/protocol/kernel.ts`.
- Do not add protocol functions named with vague mutation verbs such as `handle*`, `process*`, `do*`, or `run*` inside `src/protocol/**`; runtime and adapter public runner entrypoints may use `run*`, as in `src/cli/main.ts` and `src/adapters/x402-payment/wallet-gateway.ts`.
- Do not use overclaiming names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, or `secureApproval*`; `test/architecture/naming-posture.test.ts` scans `src/**` for these names.

**Variables:**
- Use lowerCamelCase for local values and object fields: `runtimeExecution`, `toolCallDraft`, `intentCompilation`, and `actionContract` in `src/mcp/x402-proposal.ts`.
- Use UPPER_SNAKE_CASE only for stable public constants that are already named that way: `PROTOCOL_VERSION` in `src/protocol/public/schemas.ts`, `CANONICALIZER_VERSION` in `src/protocol/foundation/canonical.ts`, and `CLI_SCHEMA_VERSION` in `src/cli/output.ts`.
- Use lowerCamelCase plural arrays with `as const` for registries and literal unions: `surfaceIds`, `surfaceRouteFamilies`, `surfaceNonAuthorityFlags`, and `surfaceBoundaryManifest` in `src/surfaces/boundary-manifest.ts`.
- Use explicit nulls for absent protocol refs instead of `undefined` in durable shapes: `greenlightRef: null`, `gatewayCheckRef: null`, and `mutationAttemptRef: null` in `src/mcp/x402-proposal.ts` and `src/surfaces/outcome.ts`.

**Types:**
- Use PascalCase for exported types, classes, and schemas: `HandshakeKernel` in `src/protocol/kernel.ts`, `HandshakeClientError` in `src/sdk/client.ts`, `X402PaymentParametersSchema` in `src/adapters/x402-payment/wallet-gateway.ts`, and `McpX402PaymentProposalInputSchema` in `src/mcp/x402-proposal.ts`.
- Pair Zod schemas with derived input/output types: `McpX402PaymentProposalInputSchema` and `McpX402PaymentProposalInput` in `src/mcp/x402-proposal.ts`, `X402PaymentAttemptSchema` and `X402PaymentAttempt` in `src/adapters/x402-payment/action-proposal.ts`, and protocol schemas under `src/protocol/areas/*/schemas.ts`.
- Prefer discriminated unions for outcome-bearing APIs: `X402WalletGatewayResult` in `src/adapters/x402-payment/wallet-gateway.ts`, `X402PaymentRuntimeResult` in `src/adapters/x402-payment/action-proposal.ts`, and `SurfaceOutcome` in `src/surfaces/outcome.ts`.
- Use `readonly` and `as const` for manifest-style contracts that tests consume: `SurfaceBoundary` in `src/surfaces/boundary-manifest.ts` and `cliNonClaims` in `src/cli/output.ts`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc.json`.
- Keep `printWidth` at `120`, semicolons enabled, double quotes, and trailing commas.
- Run `npm run format:check` before closeout; `package.json` includes it in `npm run check:repo`.

**Linting:**
- Use ESLint flat config from `eslint.config.js`.
- Keep `typescript-eslint` recommended rules enabled for `src/**/*.ts` and `test/**/*.ts`.
- Use separate type imports where possible; `eslint.config.js` enforces `@typescript-eslint/consistent-type-imports`.
- Prefix intentionally unused variables or caught errors with `_`; `eslint.config.js` allows `^_` for args, vars, and caught errors.
- Do not add `console.log`; `eslint.config.js` permits only `console.warn` and `console.error`.

**TypeScript strictness:**
- Code must pass `tsc --noEmit --pretty false` through `npm run check:types`.
- `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`; prefer explicit null handling and `?.` checks over assuming indexed values exist.
- Runtime source is ESM only through `"type": "module"` in `package.json`; keep imports extensionless as the existing `moduleResolution: "Bundler"` setup expects.

## Import Organization

**Order:**
1. External runtime imports, such as `zod`, `@x402/core/*`, `@x402/evm/*`, `@x402/fetch`, `node:fs`, and `bun:test`.
2. Internal value imports for the current ownership lane, such as `digestCanonical` from `src/protocol/foundation/canonical.ts` or `RoleScopedTransport` from `src/sdk/surface-clients/transport.ts`.
3. Internal type imports using `import type`, kept separate when mixed with values because `eslint.config.js` enforces type-import separation.
4. Local relative imports within the module folder, such as `./output`, `./digest`, `./types`, `./schemas`, and `./inputs`.

**Path Aliases:**
- No TypeScript path aliases are configured in `tsconfig.json`; use relative imports as shown in `src/index.ts`, `src/protocol/kernel.ts`, `src/mcp/x402-proposal.ts`, and `test/support/fixtures.ts`.

**Layer imports:**
- Protocol area modules under `src/protocol/areas/*` may depend on `src/protocol/foundation/`, `src/protocol/events/`, `src/protocol/context/`, `src/protocol/store/`, and other area public indexes.
- Protocol areas must not import HTTP, storage implementations, runtime wrappers, SDK clients, or adapter fixtures; `test/architecture/import-posture.test.ts` enforces this.
- HTTP and SDK code must import protocol behavior through public faces, not area internals; `src/sdk/client.ts` imports public schemas/inputs and specific allowed helpers.
- `src/runtime/` must stay on observer/compiler evidence and proposal helpers; it must not import gateway, policy, receipt, or mutation authority internals.
- `src/cli/` and `src/mcp/` must not import authority-bearing clients, gateway runners, signer factories, raw stores, or protocol kernel internals; `test/architecture/cli-command-posture.test.ts` and `test/architecture/mcp-surface-posture.test.ts` enforce this.

## Error Handling

**Patterns:**
- Protocol transitions throw `HandshakeProtocolError` from `src/protocol/foundation/errors.ts` with stable `code`, HTTP-like `status`, and optional metadata such as `retryability`, `commitState`, `proofRef`, and `refusalRef`.
- Guard functions return structured `TransitionGuardResult` values and callers convert failed guards into `HandshakeProtocolError`, as `HandshakeKernel.assertTransition()` does in `src/protocol/kernel.ts`.
- Boundary schemas parse input with Zod before building protocol records: `X402PaymentAttemptSchema.parse()` in `src/adapters/x402-payment/action-proposal.ts`, `X402PaymentParametersSchema.parse()` in `src/adapters/x402-payment/wallet-gateway.ts`, and `McpX402PaymentProposalInputSchema.safeParse()` in `src/mcp/x402-proposal.ts`.
- MCP and surface code should return structured refusal/not-ready/error outcomes instead of leaking authority-shaped exceptions; `proposeMcpX402Payment()` in `src/mcp/x402-proposal.ts` maps invalid input, stale metadata, gateway offline, and runtime bridge errors into `mcpNonContractOutcome()`.
- SDK HTTP failures become `HandshakeClientError` from `src/sdk/client.ts`; clients should inspect `code`, `retryability`, `commitState`, `proofRef`, and `refusalRef` rather than parsing raw strings.
- Adapter gateways return discriminated results and non-mutation outcomes for failed gates; `runX402WalletGateway()` in `src/adapters/x402-payment/wallet-gateway.ts` returns `gateway_check_refused`, `gateway_check_not_authoritative`, `payment_signature_reconciled`, `payment_signature_proof_gap`, or `payment_signature_failed`.
- Downstream uncertainty must become receipt/proof-gap evidence, not swallowed exceptions; `runX402WalletGateway()` reconciles failed signing through `reconcileSurfaceOperation()` with redacted diagnostics.

## Logging

**Framework:** console/process output only

**Patterns:**
- Do not add general-purpose logging. `eslint.config.js` bans `console.log` in `src/**` and `test/**`.
- CLI user output belongs at the process boundary in `src/cli/main.ts` through `process.stdout.write()` and `process.stderr.write()`.
- Library modules should return structured outcomes, throw typed errors, or record protocol evidence instead of logging side effects.
- Tests should assert on durable records, returned envelopes, warnings arrays, and reason codes rather than reading logs.

## Comments

**When to Comment:**
- Prefer self-documenting names and explicit schema fields over comments; most source modules use comments sparingly.
- Use comments for type-level negative tests where the comment is part of the assertion, such as `// @ts-expect-error` in `test/sdk/role-clients.test.ts`.
- Put durable boundary explanations in `LANE.md` files and canonical docs, not inline comments; see `src/mcp/LANE.md`, `src/cli/LANE.md`, `src/sdk/LANE.md`, and `src/surfaces/LANE.md`.

**JSDoc/TSDoc:**
- Not used as the primary documentation mechanism. Public behavior is documented through schemas, types, lane manifests, `README.md`, `QUALITY.md`, `STRUCTURE.md`, and tests such as `test/architecture/root-exports.test.ts`.

## Function Design

**Size:** Keep protocol transition functions focused on one transition or one build/commit step.
- Split parsing, context loading, build planning, guard evaluation, and commit mechanics into separate helpers, as in `src/protocol/areas/action-contract/transitions.ts` and `src/protocol/areas/policy-greenlight/transitions.ts`.
- Keep public facades thin. `src/protocol/kernel.ts` delegates to area transition functions and owns only recorder/store wiring plus guard assertion.

**Parameters:** Prefer one typed input object for public APIs and transition functions.
- Use object inputs such as `ProposeActionContractInput`, `EvaluatePolicyInput`, `GatewayCheckInput`, `McpX402PaymentProposalInput`, and `X402WalletGatewayInput`.
- Pass capabilities as narrowed protocol/client interfaces when a module must not own authority, such as `McpRuntimeProposalClient` in `src/mcp/x402-proposal.ts` and `X402PaymentRuntimeProtocol` in `src/adapters/x402-payment/action-proposal.ts`.

**Return Values:** Return exact typed objects or discriminated unions.
- Use nullable refs to distinguish absent authority from missing fields, as in `greenlight: Greenlight | null` from `src/protocol/kernel.ts`.
- Use explicit non-authority boolean flags on product surfaces, as in `CliOutputEnvelope` in `src/cli/output.ts` and `SurfaceOutcomeCommonSchema` in `src/surfaces/outcome.ts`.
- Do not return raw credential material. x402 gateway evidence exposes refs and digests in `src/adapters/x402-payment/wallet-gateway.ts`.

## Module Design

**Exports:** Keep public surfaces curated.
- Root exports in `src/index.ts` expose app creation, request headers, transition error envelopes, caller auth types, navigation, selected gateway/certificate helpers, public protocol schemas/inputs, and `HandshakeClient`.
- Runtime proposal helpers live under the explicit `./runtime` subpath through `src/runtime/index.ts`.
- Reference gateway fixtures live under the explicit `./experimental` subpath through `src/experimental.ts`.
- Conformance helpers live under the explicit `./conformance` subpath through `src/conformance/index.ts`.
- `test/architecture/root-exports.test.ts`, `test/architecture/claim-boundary.test.ts`, and `test/architecture/package-surface.test.ts` guard export curation.

**Barrel Files:** Use `index.ts` as a public face for multi-file source folders.
- Multi-file protocol areas expose schemas, inputs, types, guards, transitions, and owned helpers through `src/protocol/areas/*/index.ts`.
- Public protocol aggregation stays in `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts`; these files must remain aggregator-only.
- Source folders with more than three TypeScript files need an `index.ts`; `test/architecture/naming-posture.test.ts` enforces this.

**Source lane contracts:** Keep lane ownership explicit.
- Every first-level `src/*` lane must carry `LANE.md` with the required fields enforced by `test/architecture/import-posture.test.ts`.
- Use `src/surfaces/boundary-manifest.ts` as the source-owned contract for SDK, CLI, MCP, and other non-kernel surface posture.
- Treat `.planning/` as scratch only. Repo-facing source, tests, exports, scripts, and canonical docs must use `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md` as evidence.

---

*Convention analysis: 2026-05-22*
