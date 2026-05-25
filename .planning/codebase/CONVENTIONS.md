# Coding Conventions

**Analysis Date:** 2026-05-25

## Naming Patterns

**Files:**
- Use kebab-case files named by owned protocol concepts: `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/areas/gateway-gate/artifacts.ts`, `src/runtime/package-install/action-proposal.ts`.
- Use `index.ts` as the public face for multi-file folders. `test/architecture/naming-posture.test.ts` enforces this for source folders with more than three TypeScript files.
- Keep protocol primitives under `src/protocol/areas/<concept>/`. Do not add root-level compatibility shims such as `src/protocol/policy.ts`; `test/architecture/import-posture.test.ts` asserts removed shim paths stay absent.
- Do not create bucket directories named `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service` under `src/**`; `test/architecture/naming-posture.test.ts` fails on those path segments.
- Every first-level source lane needs a `LANE.md` or `README.md` with ownership fields. Existing lanes include `src/protocol/LANE.md`, `src/runtime/LANE.md`, `src/mcp/LANE.md`, `src/sdk/LANE.md`, `src/cli/LANE.md`, `src/surfaces/LANE.md`, and `src/conformance/LANE.md`.
- Tests live in domain folders under `test/`: `test/protocol/`, `test/runtime/`, `test/adapters/`, `test/http/`, `test/architecture/`, `test/mcp/`, `test/cli/`, `test/product/`, `test/conformance/`, `test/integration/`, `test/sdk/`, and `test/adapter-sdk/`. Do not add loose root `test/*.test.ts` files.

**Functions:**
- Use camelCase for functions and methods: `proposeActionContract()` in `src/protocol/areas/action-contract/transitions.ts`, `evaluatePolicy()` in `src/protocol/areas/policy-greenlight/transitions.ts`, `gatewayCheck()` in `src/protocol/areas/gateway-gate/transitions.ts`.
- Protocol write functions should make the write explicit with verbs such as `record*`, `persist*`, `commit*`, `consume*`, `mark*`, or `activate*`. Examples include `recordCredentialResolutionEvidence()` in `src/protocol/kernel.ts` and `commitGatewayCheckPlan()` in `src/protocol/areas/gateway-gate/transitions.ts`.
- Read and derivation functions should use `get*`, `list*`, `derive*`, `build*`, `format*`, `resolve*`, or `project*`. Examples include `deriveGatewayConstraintEvaluation()` in `src/protocol/areas/gateway-gate/transitions.ts`, `buildPolicyInput()` in `src/protocol/areas/policy-greenlight/transitions.ts`, and `projectProtectedActionMetadata()` in `src/protocol/areas/protected-action-representation/projections.ts`.
- Avoid vague protocol mutation verbs such as `handle*`, `process*`, `do*`, and `run*` inside `src/protocol/**`. Runtime and adapter runner entrypoints may use `run*`, such as `runX402WalletGateway()` in `src/adapters/x402-payment/wallet-gateway.ts`.
- Avoid overclaiming function names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, and `secureApproval*`; `test/architecture/naming-posture.test.ts` enforces this in source.

**Variables:**
- Use camelCase for local variables and object members. Use precise suffixes for authority-bearing refs and digests: `actionContractId`, `greenlightId`, `candidateDigest`, `gatewayRegistryDigest`, `policyInputDigest`.
- Use uppercase constants for version and fixed-registry values: `PROTOCOL_VERSION` in `src/protocol/foundation/schema-core.ts`, `CANONICALIZER_VERSION` in `src/protocol/foundation/canonical.ts`, and `MAX_STREAM_COMMIT_RETRIES` in `src/protocol/areas/gateway-gate/transitions.ts`.
- Use explicit non-authority booleans on projection and surface outputs: `authorityCreated`, `greenlightCreated`, `gatewayCheckPerformed`, `mutationAttempted`, `rawInternalRecordIncluded`, `credentialMaterialIncluded`, `receiptExportCreated`, and `authorityCertificateMinted`.

**Types:**
- Use PascalCase for TypeScript types and classes: `HandshakeKernel` in `src/protocol/kernel.ts`, `ActionContract` in `src/protocol/areas/action-contract/schemas.ts`, `GatewayCheckResult` in `src/protocol/areas/gateway-gate/artifacts.ts`.
- Pair Zod schemas with inferred types using the `FooSchema` / `type Foo = z.infer<typeof FooSchema>` pattern. Examples: `ActionContractSchema` and `ActionContract` in `src/protocol/areas/action-contract/schemas.ts`; `GatewayCheckAttemptSchema` and `GatewayCheckAttempt` in `src/protocol/areas/gateway-gate/schemas.ts`.
- Public transition inputs use named input schemas: `ProposeActionContractInputSchema`, `EvaluatePolicyInputSchema`, `GatewayCheckInputSchema`, `CreateRuntimeExecutionInputSchema`.
- Literal registries use readonly arrays with `as const`, then derive union types from them. Examples: `surfaceIds`, `surfaceRouteFamilies`, and `surfaceAuthorityPostures` in `src/surfaces/boundary-manifest.ts`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc.json`: `printWidth: 120`, semicolons enabled, double quotes, trailing commas.
- Use `.editorconfig`: UTF-8, LF endings, two-space indentation, final newline, trimmed trailing whitespace except Markdown.
- TypeScript is strict. `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. Treat optional values and array indexing as explicit proof obligations.

**Linting:**
- ESLint config is `eslint.config.js` with `typescript-eslint` recommended rules.
- Use type-only imports where possible; `@typescript-eslint/consistent-type-imports` is an error and uses separate type imports.
- Unused variables are errors unless prefixed with `_`.
- `console` is an error except `console.warn` and `console.error`; use structured protocol records, receipts, refusals, proof gaps, or CLI JSON instead of incidental logs.

**Quality gates:**
- Full closeout gate: `npm run check:repo`.
- Focused claim gate: `npm run quality:claims`.
- Focused architecture gate: `npm run quality:architecture`.
- Focused storage/kernel gate: `npm run quality:storage`.
- Package gate: `npm run pack:check`.
- Base local checks: `npm run check:types`, `npm run lint`, `npm run format:check`, `npm run test`, and `git diff --check`.

## Import Organization

**Order:**
1. External packages and Node builtins: `zod`, `bun:test`, `node:fs`, `node:path`, `@x402/*`.
2. Source value imports from the nearest owning module or public index.
3. Source type imports using `import type`.
4. Test support imports from `test/support/*`.

**Path Aliases:**
- No TypeScript path aliases are configured in `tsconfig.json`. Use relative imports.
- Protocol modules should import other protocol areas through public area indexes where possible, such as `../policy-greenlight` rather than internal transition files. `test/architecture/import-posture.test.ts` enforces public-index imports between protocol areas.

**Layer constraints:**
- `src/protocol/**` must not import `src/http/**`, `src/storage/**`, `src/runtime/**`, `src/sdk/**`, or adapter fixtures. Use the `ProtocolStore` port in `src/protocol/store/port.ts`.
- `src/http/**` owns transport, route metadata, handlers, errors, admission, and store resolution; it must not define protocol meaning. `test/architecture/import-posture.test.ts` keeps route registry metadata separate from invokers and response schemas.
- `src/runtime/**` is proposal-only. `test/architecture/import-posture.test.ts` checks `src/runtime/ingress/registry.ts` for `authorityPosture: "proposal_only"`, `compileInputAuthority: "candidate_only"`, and `rawBypassPosture: "bypass_evidence_only"`.
- `src/mcp/**` is proposal/evidence only. `test/architecture/mcp-surface-posture.test.ts` forbids imports of `protocol/kernel`, policy/gateway internals, adapters, storage, experimental surfaces, and `sdk/client`.
- Official x402 signer and paid-client imports are allowed only in `src/adapters/x402-payment/wallet-gateway.ts`; `test/architecture/import-posture.test.ts` forbids `@x402/core/client`, `@x402/fetch`, `@x402/axios`, and `@x402/evm*` elsewhere in `src/**`.

## Error Handling

**Patterns:**
- Validate public transition inputs with Zod at the boundary. Examples: `ProposeActionContractInputSchema.parse()` in `src/protocol/areas/action-contract/transitions.ts`, `EvaluatePolicyInputSchema.parse()` in `src/protocol/areas/policy-greenlight/transitions.ts`, and `GatewayCheckInputSchema.parse()` in `src/protocol/areas/gateway-gate/transitions.ts`.
- Throw `HandshakeProtocolError` from `src/protocol/foundation/errors.ts` with stable `code`, message, HTTP-like `status`, and optional metadata for retryability, commit state, proof refs, and refusal refs.
- Use `HandshakeAmbiguousCommitError` for ambiguous transition commits; it sets retryability to `ambiguous` and commit state to `unknown`.
- HTTP error responses go through `transitionErrorResult()` and `TransitionErrorResponseSchema` in `src/http/errors/transition-error-envelope.ts`. Do not return ad hoc error JSON from handlers.
- Record refusals and proof gaps instead of smoothing missing evidence. `test/protocol/kernel-policy-gateway.test.ts`, `test/protocol/evidence-projections.test.ts`, and `test/adapters/x402-wallet-gateway.test.ts` assert refusal/proof-gap outcomes at the authority boundary.
- Test helpers may throw plain `Error` for impossible fixture states, such as `requireCandidateDigest()` in `test/support/fixtures.ts`. Production protocol code should prefer typed `HandshakeProtocolError`.

## Logging

**Framework:** console is restricted by `eslint.config.js`.

**Patterns:**
- Do not use logs as protocol evidence. Durable evidence lives in protocol records, stream events, receipts, refusals, proof gaps, and redacted projections.
- CLI and surface outputs must carry explicit non-authority flags. `test/architecture/cli-command-posture.test.ts` requires every CLI JSON output to include fields such as `authorityCreated`, `greenlightCreated`, `gatewayCheckPerformed`, and `mutationAttempted`.
- Surface helpers should return schema-validated objects. `surfaceOutcomeBase()` in `src/surfaces/outcome.ts` always sets authority-related fields to `false` or `null`.

## Comments

**When to Comment:**
- Prefer schemas, precise names, `LANE.md` files, and tests over explanatory comments.
- Add comments only when a complex transition or evidence boundary is not obvious from function names and types.
- Use lane manifests for durable ownership notes. Each first-level `src/*/LANE.md` states authority owner, proof claim, use cases, constraints, allowed imports, forbidden imports, guarding tests, and scope boundary.

**JSDoc/TSDoc:**
- Not broadly used. Do not introduce large docblocks as a substitute for typed schemas or tests.
- Public behavior should be encoded in `src/protocol/public/*`, package exports in `src/index.ts`, package subpaths in `package.json`, and executable tests under `test/**`.

## Function Design

**Size:** Transition functions may orchestrate several steps, but keep phase helpers small and named by their role. The dominant pattern is parse -> load context -> derive constraints -> build plan -> commit plan -> return typed response.

**Parameters:** Public and protocol transition functions should take one object input type, not positional argument clusters. Examples include `EvaluatePolicyInput`, `GatewayCheckInput`, `CreateRuntimeExecutionInput`, and `ProposeActionContractInput`.

**Return Values:** Return schema-shaped records or explicit outcome objects. Authority-bearing responses must distinguish policy decisions, one-use greenlights, gateway checks, mutation attempts, refusals, receipts, and proof gaps.

**Transition pattern:**
```typescript
export async function evaluatePolicy(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: EvaluatePolicyInput,
): Promise<PolicyEvaluationResponse> {
  const input = EvaluatePolicyInputSchema.parse(inputValue);
  const context = await getPolicyEvaluationContext(recorder, input);
  assertTransition(guardPolicyEvaluation(context.contract, context.envelope));
  const constraints = await derivePolicyConstraintEvaluation(store, context);
  // build, commit, then return explicit authority/non-authority posture
}
```

Use this shape when adding new kernel transitions under `src/protocol/areas/*`.

## Module Design

**Exports:** 
- Keep package root exports curated in `src/index.ts`. `test/architecture/root-exports.test.ts` asserts the exact root export list and keeps internals such as `HandshakeKernel`, `ProtocolRecorder`, `InMemoryProtocolStore`, and `D1ProtocolStore` off the root surface.
- Public subpaths are declared in `package.json`: `.`, `./conformance`, `./adapter-sdk`, `./runtime`, `./sdk/role-clients`, `./cli`, `./mcp`, `./x402-protected-tool`, and `./experimental`.
- Adapter authoring helpers belong on `src/adapter-sdk/index.ts`; runtime ingress belongs on `src/runtime/index.ts`; conformance checks belong on `src/conformance/index.ts`.

**Barrel Files:** 
- Use local `index.ts` files as intentional public faces, not dumping grounds.
- `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts` are aggregators only; `test/architecture/import-posture.test.ts` fails if they contain lines other than `export * from ...`.
- Area `types.ts` files are local-only faces. `test/architecture/import-posture.test.ts` restricts them to allowed schema/input exports.

## Authority-Language Rules

Use the exact product/protocol vocabulary from `QUALITY.md`, `STRUCTURE.md`, `AGENTS.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`.

- Say `protected actions for automated decision making`, not engineering-agent-only category language.
- Say `cleared protected-action event` for one terminal event with reconstructable evidence.
- Say `protocol kernel` for source-owned state machine and schemas.
- Say `product surface` for CLI, MCP, SDK, docs, demo, or readback surfaces that expose proposal/evidence/readback without creating authority.
- Say `AuthorityCertificate` is terminal evidence, not permission, identity, settlement, hosted trust, or reusable auth.
- Say public npm availability and MCP Registry discoverability are distribution facts, not authority.
- Say missing provider custody, hosted operation, settlement/finality, aggregate spend, host-wide containment, and broad x402 compatibility are proof gaps, outside claims, or cut lines until source and gates change.

The claim-boundary gate is executable in `test/architecture/claim-boundary.test.ts`; update that test when simplifying canonical language so the simplification keeps the invariant rather than weakening it.

## Projection Vs Authority

Projection code must expose readback without becoming authority.

- Projection helpers use `project*` names and return non-authority fields. Examples: `projectProtectedActionMetadata()` and `projectProtectedActionChallengeFromRefusal()` in `src/protocol/areas/protected-action-representation/projections.ts`.
- Surface outputs in `src/surfaces/outcome.ts` set `authorityCreated`, `greenlightCreated`, `gatewayCheckPerformed`, `mutationAttempted`, `credentialMaterialIncluded`, `rawInternalRecordIncluded`, `receiptExportCreated`, and `authorityCertificateMinted` to `false`.
- `src/surfaces/boundary-manifest.ts` declares `authorityPosture`, `allowedRouteFamilies`, `forbiddenRouteFamilies`, forbidden credential shapes, forbidden output fields, and claim-boundary labels for each product surface.
- `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, and `test/architecture/mcp-surface-posture.test.ts` enforce that SDK, CLI, MCP, and x402 protected-tool surfaces do not import or expose authority internals.

Do not simplify kernel language by merging projection, evidence, policy, gateway, and mutation terms. Use shorter words only when the state boundary remains explicit.

## Simplification Rules

When simplifying confusing kernel language:

- Preserve the chain: exact contract -> policy decision -> one-use greenlight or refusal -> gateway check -> receipt/refusal/proof gap.
- Prefer shorter nouns already accepted in `QUALITY.md`: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.
- Do not rename a projection to imply enforcement. A `project*` function cannot evaluate policy, create a greenlight, perform a gateway check, mutate, or mint terminal evidence.
- Do not remove non-claim fields from public outputs; they are part of the boundary contract.
- Update canonical docs and their tests together: `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `test/architecture/claim-boundary.test.ts`, `test/architecture/active-vocabulary.test.ts`, and `test/architecture/naming-posture.test.ts`.

---

*Convention analysis: 2026-05-25*
