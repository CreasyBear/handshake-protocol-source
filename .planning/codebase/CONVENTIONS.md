# Coding Conventions

**Analysis Date:** 2026-05-23

## Naming Patterns

**Files:**
- Use lower-kebab concept names for implementation files: `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/surfaces/boundary-manifest.ts`, and `src/http/admission/request-context.ts`.
- Use owned-domain directory names, not buckets: `src/protocol/areas/action-contract/`, `src/protocol/areas/policy-greenlight/`, `src/protocol/areas/gateway-gate/`, `src/sdk/surface-clients/`, and `src/mcp/`.
- Do not introduce source path segments named `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service`; `test/architecture/naming-posture.test.ts` enforces this against `src/**`.
- Name tests by guarded behavior and ownership lane: `test/architecture/surface-boundary-posture.test.ts`, `test/mcp/mcp-schema-contract.test.ts`, `test/mcp/mcp-reference-transcript.test.ts`, `test/sdk/role-clients.test.ts`, and `test/conformance/x402-upstream-exact-fixtures.test.ts`.
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
- Use explicit `false` flags for non-authority posture instead of deriving absence from missing properties. The shared posture is enforced by `SurfaceOutcomeCommonSchema` in `src/surfaces/outcome.ts`, `cliOutput()` in `src/cli/output.ts`, and `mcpReferenceNonAuthorityPosture` in `src/mcp/reference-transcript.ts`.

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
- External/model/operator inputs must enter through bounded Zod schemas before protocol calls. Examples: `McpX402PaymentProposalInputSchema` in `src/mcp/x402-proposal.ts` caps refs, URLs, extension keys, SDK package versions, and atomic amount strings; `RuntimeIngressDispatchBlockSchema` in `src/runtime/ingress/index.ts` caps dispatch blocks at 32 items; CLI x402 commands parse local install/probe payloads through schemas in `src/cli/x402/index.ts` and `src/cli/x402/local-state.ts`.

## Response And Telemetry Artifact Contracts

**Committed telemetry hardening at HEAD:**
- Keep policy-evaluation responses structured and explicit. `src/protocol/areas/policy-greenlight/transitions.ts` returns `PolicyEvaluationResponse` with `authorityCreated`, `gatewayCheckPerformed: false`, `mutationAttempted: false`, `policyDecisionRef`, `greenlightRef`, `refusalRef`, `refusalReasonCode`, `reviewRequired`, `nextAction`, `retryability`, and `evidenceRefs`; `src/http/routes/transition-response-schemas.ts` mirrors this schema for HTTP.
- Preserve committed refusal posture through client and HTTP boundaries. `src/sdk/client.ts` exposes `HandshakeClientError.retryability`, `commitState`, `proofRef`, and `refusalRef`; `src/http/errors/transition-error-envelope.ts` classifies transition failures with `retryability`, `commitState`, and evidence refs instead of reducing them to status text.
- Runtime ingress must return response posture, not authority. `src/runtime/ingress/index.ts` emits `RuntimeIngressResponsePosture` with `schemaVersion: "handshake.runtime-ingress.outcome.v1"`, explicit false non-authority flags, redacted evidence refs, runtime/graph/draft/compilation/contract refs, refusal refs, `reasonCodes`, `nextAction`, and `retryability`.
- CLI output must go through `cliOutput()` in `src/cli/output.ts`, which emits `schemaVersion: "handshake.cli.v1"`, non-claims, reason codes, next action, retryability, commit state, redaction profile refs, evidence refs, proof-gap refs, and refusal refs on every command envelope.
- MCP proposal and evidence output must use `SurfaceOutcomeSchema` from `src/surfaces/outcome.ts` and `McpToolResultSchema` from `src/mcp/output.ts`. `src/mcp/x402-proposal.ts` preserves committed transition evidence in structured non-authority outcomes by mapping committed refusals/proof gaps to `commitState: "protocol_recorded"` and evidence URIs instead of generic tool errors.

**Stable schemas:**
- Use strict Zod schemas for emitted machine artifacts, not ad hoc JSON literals. `SurfaceOutcomeSchema` in `src/surfaces/outcome.ts`, `McpToolResultSchema` in `src/mcp/output.ts`, `CliOutputEnvelopeSchema` in `src/cli/output.ts`, `TransitionErrorResponseSchema` in `src/http/errors/transition-error-envelope.ts`, and projection schemas in `src/protocol/evidence-projections/schemas.ts` are the source-owned contracts.
- Keep schema-version literals stable and explicit on surfaced artifacts: `handshake.surface-outcome.v0.1` in `src/surfaces/outcome.ts`, `handshake.cli.v1` in `src/cli/output.ts`, and `surface-boundary.v0.1` in `src/surfaces/boundary-manifest.ts`.
- Emit explicit false non-authority posture fields on model/operator outputs. Required fields include `authorityCreated`, `authorityCertificateMinted`, `credentialMaterialIncluded`, `gatewayCheckPerformed`, `greenlightCreated`, `mutationAttempted`, `mutationCommandIncluded`, `rawInternalRecordIncluded`, and `receiptExportCreated` in `src/surfaces/outcome.ts` and `src/cli/output.ts`.
- Use explicit `null` refs for unavailable authority/evidence refs instead of omitting fields. `src/mcp/x402-proposal.ts` returns `greenlightRef: null`, `gatewayCheckRef: null`, `mutationAttemptRef: null`, `receiptRef: null`, and `authorityCertificateRef: null` on proposal outcomes.

**Reason codes and recovery posture:**
- Register source-emitted protocol reason codes in `src/protocol/foundation/reason-codes.ts`; HTTP error codes live in `src/http/errors/codes.ts`. `test/protocol/reason-code-registry.test.ts` checks registry uniqueness and source-emitted literal coverage.
- Keep `ReasonCodeSchema` open for operator-supplied future reasons in `src/protocol/foundation/schema-core.ts`, but do not introduce unregistered source literals in protocol, MCP, CLI, runtime, or adapter code.
- Surface recoverability through structured fields, not prose-only errors. MCP outcomes in `src/surfaces/outcome.ts` and `src/mcp/x402-proposal.ts` carry `reasonCodes`, `nextAction`, `retryability`, and `commitState`; HTTP errors in `src/http/errors/transition-error-envelope.ts` carry `retryability`, `commitState`, `proofRef`, and `refusalRef`.

**Redaction and proof gaps:**
- Evidence reads must return redacted projections, not raw protocol records. Use `redactionProfileRef`, `omittedFields`, refs, and digests from `src/protocol/evidence-projections/schemas.ts` and `src/protocol/evidence-projections/projections.ts`.
- Never surface raw `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, control-plane tokens, gateway custody tokens, signer objects, raw credential material, raw internal records, mutation commands, or receipt exports through CLI/MCP/SDK response artifacts. The forbidden terms and output fields are source-owned in `src/surfaces/boundary-manifest.ts` and tested by `test/architecture/surface-boundary-posture.test.ts`.
- Downstream uncertainty must become a proof gap or refusal artifact. `src/adapters/x402-payment/wallet-gateway.ts` returns `payment_signature_proof_gap` for missing downstream responses; `src/protocol/evidence-projections/schemas.ts` separates gateway admission, downstream outcome, and finality status in receipt timelines.

**Local and pre-hosted language:**
- Use local/reference wording for current surfaces. `README.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `src/cli/output.ts`, and `src/surfaces/boundary-manifest.ts` explicitly reject hosted operation, provider custody, broad x402 compatibility, aggregate spend-window enforcement, cross-org trust, marketplace certification, settlement finality, and broad MCP/CLI/browser/shell/network control claims.
- Treat RuntimeClient, MCP proposal, CLI evidence, demo transcript, and demo APS success as proposal/evidence posture only. These surfaces do not create policy authority, greenlights, gateway checks, protected mutations, receipt exports, hosted proof, provider custody, or cross-org AuthorityCertificate trust.

**Package and export posture:**
- Keep the package surface narrow. `package.json` exports the root, `./runtime`, `./conformance`, `./sdk/role-clients`, `./experimental`, and `./package.json`; it does not export MCP internals, surface manifests, raw stores, policy kernels, gateway runners, or receipt exporters.
- Keep role clients on the explicit `handshake-protocol-kernel/sdk/role-clients` subpath. `src/sdk/surface-clients/runtime-client.ts` owns runtime proposal/evidence writes; `src/sdk/surface-clients/evidence-client.ts` owns redacted evidence reads and local verification of supplied certificates.
- Keep generated demo snapshots under ignored `examples/*/output/` folders. `examples/x402-protected-spend/output/` and `examples/mcp-reference-transcript/output/` are local artifacts, not package source, canonical docs, or exportable receipt stores.

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
- HTTP and SDK code must import protocol behavior through public faces, public area indexes, or explicit architecture-test exceptions; `src/sdk/client.ts` remains the broad low-level HTTP mirror, while `src/sdk/surface-clients/*` must stay role-scoped and away from authority-bearing area internals.
- `src/runtime/` must stay on observer/compiler evidence and proposal helpers; it must not import gateway, policy, receipt, or mutation authority internals.
- `src/cli/` and `src/mcp/` must not import authority-bearing clients, gateway runners, signer factories, raw stores, or protocol kernel internals; `test/architecture/cli-command-posture.test.ts` and `test/architecture/mcp-surface-posture.test.ts` enforce this.

## Error Handling

**Patterns:**
- Protocol transitions throw `HandshakeProtocolError` from `src/protocol/foundation/errors.ts` with stable `code`, HTTP-like `status`, and optional metadata such as `retryability`, `commitState`, `proofRef`, and `refusalRef`.
- Guard functions return structured `TransitionGuardResult` values and callers convert failed guards into `HandshakeProtocolError`, as `HandshakeKernel.assertTransition()` does in `src/protocol/kernel.ts`.
- Boundary schemas parse input with Zod before building protocol records: `X402PaymentAttemptSchema.parse()` in `src/adapters/x402-payment/action-proposal.ts`, `X402PaymentParametersSchema.parse()` in `src/adapters/x402-payment/wallet-gateway.ts`, and `McpX402PaymentProposalInputSchema.safeParse()` in `src/mcp/x402-proposal.ts`.
- MCP and surface code should return structured refusal/not-ready/error outcomes instead of leaking authority-shaped exceptions; `proposeMcpX402Payment()` in `src/mcp/x402-proposal.ts` maps invalid input, stale metadata, changed tools list, install not ready, gateway offline, amount bounds, replay/idempotency failures, and runtime bridge errors into `mcpNonContractOutcome()`.
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
- Demo scripts may print walkthrough markdown at the process edge, as `examples/x402-protected-spend/run.ts` and `examples/mcp-reference-transcript/run.ts` do, but the source-owned assertions must stay in tests and JSON/markdown outputs. Do not use demo console output as authority evidence.

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
- Use reason codes and `nextAction` fields to expose user/operator/dev/agent recovery posture. `doctorLocalProject()` in `src/cli/local-project/index.ts` returns concrete readiness failures such as `cli_token_ref_missing`, `cli_gateway_posture_unknown`, and `cli_state_root_inside_workspace`; `proposeMcpX402Payment()` in `src/mcp/x402-proposal.ts` returns `reload_metadata`, `fix_install`, `wait_for_gateway`, `recraft_request`, `read_evidence`, or `stop` instead of generic failure text.

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

## Auth.md Adapter Posture

**Committed conventions:**
- Keep auth.md under the experimental/reference adapter boundary. The committed `src/adapters/auth-md/index.ts` re-exports adapter-local profiles, proposal, and gateway helpers; the current dirty index also re-exports lifecycle/probe helpers. `src/experimental.ts` keeps the surface explicit and off the package root.
- Treat OAuth Protected Resource Metadata plus authorization-server `agent_auth` as machine provenance and `/auth.md` prose as supporting evidence. `buildAuthMdDiscoveryEvidence()` in `src/adapters/auth-md/profiles.ts` normalizes PRM and authorization-server metadata, sorts list values, records `authMdDocumentDigest` only as support, and emits `authorityCreated: false`.
- Import issued credentials into gateway custody only as opaque refs. `buildAuthMdGatewayCredentialIntake()` returns redacted `AuthMdRegistrationEvidence` plus `RegisterGatewayCredentialRefInput`; it must not return `credentialMaterial`, ID subject values, bearer tokens, access tokens, API keys, JWTs, private keys, or provider secrets.
- Keep raw credential leak detection close to auth.md parsing and downstream evidence. `assertNoLeakedAuthMdCredentialMaterial()` in `src/adapters/auth-md/profiles.ts` scans plain strings, URL-decoded variants, and base64-like decoded variants for bearer tokens, private keys, token/secret assignments, and JWT-like material.
- Proposed auth.md service calls are contracts only. `proposeAuthMdProtectedApiCallActionContract()` can compile/propose `auth_md_protected_api_call.exact` with gateway credential bindings, but it does not evaluate policy, issue greenlights, perform gateway checks, create receipts, or mutate the downstream API.
- The auth.md gateway is the consequence holder. `runAuthMdProtectedApiCallGateway()` must call `gatewayCheck()`, require `VerifiedGatewayCheck`, record `CredentialResolutionEvidence` only after the gate, refuse drift/replay/non-authoritative gates before service execution, and reconcile success/refusal/proof-gap/failure without leaking raw auth material.
- Refuse auth.md bypass and overreach before compilation or before gateway execution. `authMdProtectedApiCallRefusalReasonCodes()` rejects non-consequential methods, endpoint origin mismatch, raw authorization headers, dynamic endpoint/host construction, wildcard scopes, stale metadata, stale/revoked/expired credential refs, missing idempotency material, retry authority reuse, and unsafe runtime-visible credential custody.

**Current dirty expansion conventions:**
- `applyAuthMdCredentialLifecycleIsolation()` in `src/adapters/auth-md/revocation.ts` maps logout, explicit revocation, credential expiry, downstream 401, metadata drift, and ambiguous lifecycle events to credential-ref isolation. It records evidence and isolation, not authority.
- `authMdProtectedApiCallBypassProbeExecutors()` in `src/adapters/auth-md/bypass-probes.ts` classifies hostile paths as prevented, detected, or proof gap. Probe outputs must stay redacted and cannot create protected-path authority by themselves.
- Dirty auth.md evidence labels in `src/protocol/evidence-projections/projections.ts` are buyer-readable reconstruction aids. They must not imply provider custody, gateway admission, or downstream success without the matching Handshake policy/gate/reconciliation records.

## Active Tier 2 SDK/CLI/MCP Surface Posture

**Shared surface boundary:**
- Use `src/surfaces/boundary-manifest.ts` as the executable Tier 2 posture table. It marks `sdk.runtime`, `sdk.evidence`, `cli.operator`, `cli.evidence`, and `mcp.runtime` as active; `sdk.install`, `sdk.gateway`, and `cli.process` remain deferred.
- Every active model/operator surface must carry non-authority flags from `src/surfaces/outcome.ts` or `src/cli/output.ts`: `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, `mutationAttempted: false`, `credentialMaterialIncluded: false`, `rawInternalRecordIncluded: false`, `receiptExportCreated: false`, and `authorityCertificateMinted: false`.
- Do not use `.planning/macro/surfaces/*/PLAN.md` as implementation truth when it conflicts with source. The macro plans still describe some surfaces as nonexistent or blocked, while the current source owns active slices in `src/sdk/`, `src/cli/`, `src/mcp/`, and `src/surfaces/`.
- Treat surface success as posture or proposal success only. A successful `RuntimeClient`, CLI, MCP, transcript, or demo call does not create policy authority, greenlights, gateway checks, mutation attempts, receipt exports, provider custody, hosted operation, cross-org trust, or clearing-house readiness.

**SDK posture:**
- Treat `src/sdk/client.ts` as the low-level route mirror and compatibility substrate. It can call control-plane, runtime, gateway, review, recovery, and evidence routes through role tokens and remains the only SDK object exported from `src/index.ts`.
- Use `src/sdk/surface-clients/runtime-client.ts` and `src/sdk/surface-clients/evidence-client.ts` for Tier 2 activation work. `RuntimeClient` may create runtime execution evidence, tool-call drafts, intent compilations, and action contracts only; `EvidenceClient` may read redacted projections and verify a supplied terminal certificate only.
- Do not root-export role clients. They are exposed through the explicit `handshake-protocol-kernel/sdk/role-clients` package subpath, while `test/architecture/root-exports.test.ts` keeps root exports curated.

**CLI posture:**
- The active CLI slice is local operator/evidence posture only: `schema`, `init`, `doctor`, `evidence aps-report`, `evidence contract-view`, `evidence receipt-timeline`, `cert verify`, `support bundle`, `install x402-payment`, `probes x402-payment`, `install health`, and `conformance x402-payment` in `src/cli/command-manifest.ts`.
- `src/cli/main.ts` may read explicit JSON paths, write local non-secret project pointers, write external local x402 posture/probe records when `--record-local` is supplied, and write JSON to stdout/stderr. It must not add process startup, policy evaluation, gateway checks, mutation commands, raw-record reads, receipt export, signer use, provider certification, or credential values.
- All CLI output must use `cliOutput()` from `src/cli/output.ts` so agent-consumable JSON remains evidence, not permission.
- CLI `doctor` readiness is deliberately severe: local x402 probe reports use `trustedReadiness: false` in `src/cli/x402/local-state.ts`, so even a passed local classification remains `not_ready` until a trusted gateway/control-plane readiness source exists.

**MCP posture:**
- MCP is internal source, not a package-root export. `src/mcp/catalog.ts` exposes read resources plus exactly one proposal tool: `handshake.actions.x402_payment.propose`.
- `src/mcp/x402-proposal.ts` must bridge through the narrowed `McpRuntimeProposalClient` interface and may call only runtime evidence, tool-call draft, intent compilation, and action-contract proposal methods.
- MCP resources in `src/mcp/resources.ts` must route evidence reads through `EvidenceClient` projection methods or return reference-only metadata/challenge/certificate objects. They must not expose raw records, credentials, receipt exports, signer material, or certificate minting.
- The MCP reference transcript in `src/mcp/reference-transcript.ts` and `examples/mcp-reference-transcript/run.ts` is a source-owned harness, not a public MCP host. It must stay bound to catalog/resource/tool/shared-outcome source functions and explicit CLI readback command IDs.

**Demo script posture:**
- `npm run demo:aps` uses `examples/x402-protected-spend/run.ts` to produce a local buyer-readable x402 protected-spend report. Tests require it to use `RuntimeClient` and `EvidenceClient`, not the all-role `HandshakeClient`.
- `npm run demo:mcp-transcript` uses `examples/mcp-reference-transcript/run.ts` to produce a source-owned MCP transcript for metadata read, valid proposal, evidence readback, stale metadata, tools-list change, install not ready, gateway offline, amount mismatch, parameter drift, replay refusal, raw sibling-shaped input, and proof-gap cases.
- Demo outputs belong under `examples/*/output/` with `.gitignore` guards. Treat generated report files as local evidence artifacts, not canonical docs or package source.

---

*Convention analysis: 2026-05-23*
