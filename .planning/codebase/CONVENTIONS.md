# Coding Conventions

**Analysis Date:** 2026-05-24

## Current State Inputs

**Closeout remap state:**
- Treat commit `b3635c5` as the current source baseline for this map. The seven
  macro-plan implementation commits are source truth; `.planning/codebase/*.md`
  remains scratch.
- Do not treat older "dirty worktree" notes in prior maps as current defects.
  Runtime and MCP x402 request/provider posture fields now exist in
  `src/runtime/ingress/index.ts` and `src/mcp/x402-proposal.ts`.
- New post-closeout convention: any release, hosted, verifier, adapter-pack, or
  bypass-harness surface must carry explicit non-authority fields when it could
  be mistaken for permission, trust, custody, settlement, payment management,
  certification, host-wide enforcement, or package safety proof.
- `.planning/` artifacts can guide review and closeout, but source-facing names,
  scripts, exports, package metadata, and canonical docs must come from tracked
  source and passing gates.

## Naming Patterns

**Files:**
- Name files by owned protocol concepts, not buckets. `QUALITY.md` and `STRUCTURE.md` make this prescriptive for `src/**`: use concept paths such as `src/protocol/areas/action-contract/transitions.ts`, `src/runtime/package-install/action-proposal.ts`, `src/http/routes/transition-invokers.ts`, and `src/adapters/x402-payment/wallet-gateway.ts`.
- Do not add generic source path segments such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service`; `test/architecture/naming-posture.test.ts` enforces this over `src/**`.
- Multi-file folders need an `index.ts` public face; `test/architecture/naming-posture.test.ts` enforces this for `src/**`.
- Keep root `test/` free of loose `.test.ts` files; use ownership folders such as `test/protocol/`, `test/runtime/`, `test/adapters/`, `test/mcp/`, and `test/architecture/`. `test/architecture/naming-posture.test.ts` enforces this.
- Keep active repo canon compact. `README.md`, `AGENTS.md`, `QUALITY.md`, `STRUCTURE.md`, and `docs/internal/*` are authority. `.planning/` is derived scratch and must not become source paths, scripts, CI names, exported symbols, or canonical docs.

**Functions:**
- Use write verbs that say the durable effect: `record*`, `persist*`, `commit*`, `consume*`, `mark*`, and `activate*`. `QUALITY.md` defines these naming rules.
- Use read/derivation verbs that say the operation: `get*`, `list*`, `derive*`, `build*`, `format*`, and `resolve*`. Examples include `buildPackageInstallCompileIntentInput()` in `src/runtime/package-install/action-proposal.ts`, `digestCanonical()` in `src/protocol/foundation/canonical.ts`, and `verifyAuthorityCertificate()` in `src/protocol/areas/authority-certificate/`.
- Avoid vague protocol mutation verbs such as `handle*`, `process*`, `do*`, and `run*` inside `src/protocol/**`; `test/architecture/naming-posture.test.ts` enforces this. Runtime and adapter runner entrypoints may use `run*`, such as `runPackageInstallGateway()` in `src/adapters/package-install/gateway.ts` and `runX402WalletGateway()` in `src/adapters/x402-payment/wallet-gateway.ts`.
- Avoid overclaiming names such as `ensureSafe*`, `guarantee*`, `proveExecution*`, `trustedAgent*`, and `secureApproval*`; `test/architecture/naming-posture.test.ts` enforces this over `src/**`.

**Variables:**
- Use explicit protocol nouns for IDs, refs, digests, and outcomes. Examples: `actionContractId`, `greenlightId`, `paramsDigest`, `surfaceOperationRef`, `gatewayCredentialRefId`, and `refusalReasonCodes` in `src/protocol/kernel.ts`, `src/runtime/package-install/action-proposal.ts`, and `src/adapters/package-install/gateway.ts`.
- Prefer discriminated `outcome` strings for branchable results. Examples: `PackageInstallGatewayResult` in `src/adapters/package-install/gateway.ts`, `PackageInstallRuntimeResult` in `src/runtime/package-install/action-proposal.ts`, and MCP structured outcomes in `src/surfaces/outcome.ts`.
- Prefix intentionally unused values with `_`; `eslint.config.js` allows unused args, caught errors, and vars only when they match `^_`.

**Types:**
- Pair Zod schemas with inferred exported types: `ActionContractSchema` and `ActionContract` in `src/protocol/areas/action-contract/schemas.ts`, `PackageInstallParametersSchema` and `PackageInstallParameters` in `src/adapters/package-install/gateway.ts`, and `SurfaceOutcomeSchema` and `SurfaceOutcome` in `src/surfaces/outcome.ts`.
- Use exact protocol object names from `QUALITY.md`: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.
- Use `type` imports for types; `eslint.config.js` enforces `@typescript-eslint/consistent-type-imports`.
- Runtime/client protocol seams should be narrow structural interfaces, such as `PackageInstallRuntimeProtocol` in `src/runtime/package-install/action-proposal.ts`, `PackageInstallProtocol` in `src/adapters/package-install/gateway.ts`, and `McpRuntimeProposalClient` in `src/mcp/x402-proposal.ts`.
- x402 local/reference sandbox and gateway evidence types stay explicit about authority posture. Examples include `LocalX402PaidHttpSandboxChallenge`, `LocalX402PaidHttpSandboxRetryResult`, and `X402PaymentSignatureEvidence` in `src/adapters/x402-payment/sandbox-http.ts` and `src/adapters/x402-payment/wallet-gateway.ts`; each carries `authorityCreated: false` or gateway-held credential posture instead of implying payment authority.

## Code Style

**Formatting:**
- Prettier is the formatter. `.prettierrc.json` sets `printWidth: 120`, semicolons, double quotes, and trailing commas.
- `.prettierignore` excludes generated or scratch surfaces including `dist`, `coverage`, `.wrangler`, `.agents`, `.planning`, `docs/internal/archive`, and generated example outputs under `examples/*/output`.
- Keep code ASCII unless the local file already needs non-ASCII. Existing source and tests are plain TypeScript/Markdown.

**Linting:**
- ESLint uses `typescript-eslint` recommended config in `eslint.config.js`.
- `npm run lint` runs `eslint src test --max-warnings=0`; zero warnings is the bar from `README.md`, `QUALITY.md`, and `package.json`.
- `no-console` is enabled for `src/**/*.ts` and `test/**/*.ts`, with only `console.warn` and `console.error` allowed. Do not add `console.log()` outside string fixtures or subprocess source text.
- `@typescript-eslint/no-unused-vars` is an error except names beginning with `_`.
- `@typescript-eslint/consistent-type-imports` is an error and prefers separate type imports.

**TypeScript Strictness:**
- `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, `resolveJsonModule`, and Bundler module resolution.
- `npm run check:types` runs `tsc --noEmit --pretty false`; `npm run typecheck` is the interactive alias.
- `tsconfig.build.json` emits declarations only from `src/` into `dist/`. Package-surface checks depend on those declarations.
- Use explicit nullability in schemas and types. Existing schemas use `.nullable()` and defaults deliberately, such as `ActionContractSchema` in `src/protocol/areas/action-contract/schemas.ts` and MCP outcome fields in `src/surfaces/outcome.ts`.

**Claim Boundaries:**
- Treat `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md` as the source of claim language. They currently define the checkout as local foundation/reference proof, not hosted operation or provider enforcement.
- Treat the publishable package surface as explicit but non-enforcing. `package.json` exposes root, `./runtime`, `./conformance`, `./sdk/role-clients`, `./cli`, `./mcp`, `./experimental`, and `./package.json`; `bin/handshake` is the local CLI evidence/readiness command and `bin/handshake-mcp` plus the `handshake-protocol-kernel` bin start the local stdio MCP proposal/evidence server. These surfaces are not authority or enforcement gates.
- Do not broaden local/reference adapter proof into hosted/provider claims. `test/architecture/claim-boundary.test.ts` enforces x402 and MCP wording, including "not broad x402 compatibility", "not live provider custody", and MCP proposal/evidence-only posture.
- Keep x402 first-wedge language narrow: official buyer-side `exact` per-call proof only. `test/conformance/x402-upstream-exact-fixtures.test.ts`, `test/conformance/x402-payment-conformance.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/integration/x402-d1-http.test.ts`, and `test/product/x402-protected-spend-demo-report.test.ts` pin unsupported surfaces, gateway-held signer evidence, local/reference 402 challenge evidence, post-gate signed retry observation, and the absence of aggregate spend-window enforcement.
- Keep MCP language proposal/evidence-only. `test/architecture/mcp-surface-posture.test.ts`, `test/mcp/mcp-schema-contract.test.ts`, `test/mcp/mcp-resource-redaction.test.ts`, and `test/mcp/mcp-stdio-process.test.ts` forbid policy, greenlight, gateway check, mutation, credential material, raw records, and hosted/provider claims.

## Import Organization

**Order:**
1. External runtime libraries and Node/Bun modules first, such as `zod`, `bun:test`, `node:fs`, and `@modelcontextprotocol/*`.
2. Source value imports from the owning lane, such as `../../protocol/foundation/canonical` or `../downstream-failure-evidence`.
3. Source `type` imports, kept separate when needed by `eslint.config.js`.
4. Local sibling imports last, such as `./output`, `./resources`, `./schemas`, and `./types`.

**Path Aliases:**
- Not detected. `tsconfig.json` does not define `paths`; use relative imports inside `src/**` and `test/**`.
- Package-subpath imports are reserved for public surface smoke tests, such as `handshake-protocol-kernel/sdk/role-clients` in `test/sdk/role-clients.test.ts`.

**Layer Restrictions:**
- Protocol modules in `src/protocol/**` must not import HTTP, storage implementations, runtime wrappers, SDK code, or adapter fixtures. `test/architecture/import-posture.test.ts` enforces this.
- HTTP and SDK code must not reach into protocol area internals; import public area indexes or curated root exports. The exception is the certificate verifier import in `src/sdk/surface-clients/evidence-client.ts`, enforced by `test/architecture/import-posture.test.ts`.
- Storage adapters in `src/storage/**` must not import primitive behavior modules. D1 SQL statement assembly stays in `src/storage/d1/statements.ts`; store behavior stays in `src/storage/d1/index.ts`.
- Runtime, representation helpers, and evidence projections must stay off policy/gateway/receipt/certificate authority behavior imports. `test/architecture/import-posture.test.ts` enforces this for `src/runtime`, `src/protocol/areas/protected-action-representation`, and `src/protocol/evidence-projections`.
- Official x402 signer and paid-client imports stay inside `src/adapters/x402-payment/wallet-gateway.ts`; `test/architecture/import-posture.test.ts` forbids `@x402/core/client`, `@x402/fetch`, `@x402/axios`, and `@x402/evm*` elsewhere in `src/**`. Official schema parsing may live in `src/adapters/x402-payment/upstream-evidence.ts`; local/reference sandbox orchestration lives in `src/adapters/x402-payment/sandbox-http.ts` without becoming a public signing surface.
- Keep the official signing factory off adapter barrels and package public surfaces. `src/adapters/x402-payment/index.ts` may export `action-proposal`, `bypass-probes`, `conformance`, `install-proposal`, `sandbox-http`, and `upstream-evidence`, but `test/architecture/import-posture.test.ts` forbids exporting `createOfficialExactX402SigningSurface` through adapter barrels, root exports, runtime, conformance, or experimental public surfaces.
- MCP source under `src/mcp/**` must not import `protocol/kernel`, policy/greenlight internals, gateway-gate internals, receipt-export authority, authority-certificate authority, adapters, storage, `experimental`, or all-role SDK clients. `test/architecture/mcp-surface-posture.test.ts` enforces this.

## Error Handling

**Patterns:**
- Protocol transitions should throw `HandshakeProtocolError` with reason code, message, HTTP status, and optional metadata. Examples: `src/protocol/areas/action-contract/transitions.ts`, `src/protocol/kernel.ts`, and `src/http/errors/transition-error-envelope.ts`.
- Gateway adapters should return discriminated results rather than hiding failure. `runPackageInstallGateway()` in `src/adapters/package-install/gateway.ts` returns `gateway_check_refused`, `gateway_check_not_authoritative`, `mutation_reconciled`, or `mutation_failed`.
- Downstream mutation failures are reconciled with redacted diagnostic evidence, not raw errors. `src/adapters/downstream-failure-evidence.ts` feeds reconciliation in `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, and `src/adapters/preview-deploy/gateway.ts`.
- Missing or ambiguous downstream evidence becomes `ProofGap`, not success. `docs/internal/protocol-notes.md`, `test/protocol/evidence-projections.test.ts`, and `test/adapters/x402-wallet-gateway.test.ts` exercise proof-gap outcomes.
- Runtime and MCP proposal surfaces should refuse before authority when inputs are dynamic, stale, raw-sibling-shaped, too large, ambiguous, or outside bounds. Examples: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, and `src/mcp/x402-proposal.ts`.
- x402 sandbox retry evidence is downstream fixture evidence only. `src/adapters/x402-payment/sandbox-http.ts` records a local/reference `402` challenge before authority, then records one signed retry only after gateway-created signature evidence; it refuses missing signature evidence, wrong header names, non-reference environments, and ambiguous request body posture.

## Logging

**Framework:** console

**Patterns:**
- No logging framework is used. `eslint.config.js` bans `console.log()` in `src/**` and `test/**`.
- CLI and MCP surfaces return structured non-authority output instead of logs: `src/cli/output.ts`, `src/surfaces/outcome.ts`, and `src/mcp/output.ts`.
- Use `console.warn` or `console.error` only when a CLI/process boundary genuinely needs stderr-style reporting. Prefer returning typed objects from `src/cli/main.ts`, `src/mcp/stdio/process-proof.ts`, and SDK clients.

## Comments

**When to Comment:**
- Keep comments rare and use them only to preserve a non-obvious invariant. Examples: `src/runtime/codemode-multi-action/generated-program-runner.ts` comments explain whole-block preflight and recompilation after prior contract IDs.
- Do not use comments to restate code. Encode authority boundaries through names, schemas, tests, and lane manifests.
- `@ts-expect-error` is used as type-boundary proof in tests, such as `test/sdk/role-clients.test.ts`; include the invariant in the comment.

**JSDoc/TSDoc:**
- Not detected as a dominant pattern. Existing source uses exported types and Zod schemas instead of JSDoc.

## Function Design

**Size:** Keep functions aligned to one transition or one surface boundary. Split parse/build/assert/commit steps when a transition carries authority.

**Parameters:** Use one input object for public transition functions and adapter runners. Examples: `proposeActionContract(input)` in `src/protocol/areas/action-contract/transitions.ts`, `runPackageInstallGateway(input)` in `src/adapters/package-install/gateway.ts`, and `proposeMcpX402Payment(input, options)` in `src/mcp/x402-proposal.ts`.

**Return Values:** Prefer discriminated unions with explicit `outcome`, typed refs, and `null` authority fields when authority is not created. Examples: `PackageInstallRuntimeResult` in `src/runtime/package-install/action-proposal.ts`, `PackageInstallGatewayResult` in `src/adapters/package-install/gateway.ts`, and MCP structured content in `src/surfaces/outcome.ts`.

**Authority Separation:**
- Runtime helpers may create runtime evidence, generated graphs, tool-call drafts, intent compilations, action contracts, and refusals. They must not issue policy decisions, greenlights, gateway checks, receipts, or mutations. `test/runtime/runtime-ingress.test.ts` and `test/runtime/codemode-multi-action-runtime.test.ts` assert record counts for this boundary.
- Gateway adapters may mutate only after `verifiedGatewayCheckFromResult()` returns a `VerifiedGatewayCheck`. `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, and `src/adapters/x402-payment/wallet-gateway.ts` follow this pattern.
- x402 official `PaymentPayload` / `PAYMENT-SIGNATURE` creation belongs behind `runX402WalletGateway()` after a passed gateway check. `src/adapters/x402-payment/action-proposal.ts`, `src/runtime/ingress/index.ts`, `src/mcp/x402-proposal.ts`, `src/sdk/surface-clients/runtime-client.ts`, and evidence projections must expose proposal/evidence refs and digests, never signer material or raw payment payloads.
- Evidence projections are read-only diagnostic surfaces. `src/protocol/evidence-projections/` and `test/protocol/evidence-projections.test.ts` distinguish gateway admission, downstream outcome, refusal, replay, and proof-gap evidence.

## Module Design

**Exports:** Curate public surfaces deliberately.
- `src/index.ts` exports stable public schemas, app/SDK entrypoints, navigation, and verified gate helpers. `test/architecture/root-exports.test.ts` pins the full export list and forbids kernel/store internals.
- `src/runtime/index.ts` exports only runtime ingress proposal functions and schemas. `test/architecture/root-exports.test.ts` and `test/architecture/claim-boundary.test.ts` forbid authority terms on this surface.
- `src/conformance/index.ts` exports protected mutation adapter conformance and x402 conformance helpers. It is the place for reference conformance checks, not provider certification claims.
- `src/experimental.ts` exports reference adapter fixtures with `experimental*`/`Experimental*` names. `test/architecture/root-exports.test.ts` enforces the naming boundary.
- `src/sdk/surface-clients/index.ts` exports role-scoped `RuntimeClient` and `EvidenceClient`; `test/sdk/role-clients.test.ts` keeps them off authority methods and role-map/fallback-token construction.

**Barrel Files:** Use lane and area `index.ts` files as public faces. `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts` are export-only aggregators; `test/architecture/import-posture.test.ts` enforces that they do not contain implementation logic.

**Lane Manifests:** Every first-level source lane must carry `LANE.md` with the fields required by `QUALITY.md`. Existing manifests include `src/protocol/LANE.md`, `src/http/LANE.md`, `src/runtime/LANE.md`, `src/adapters/LANE.md`, `src/conformance/LANE.md`, `src/storage/LANE.md`, `src/sdk/LANE.md`, `src/cli/LANE.md`, `src/mcp/LANE.md`, and `src/surfaces/LANE.md`. `test/architecture/import-posture.test.ts` enforces required manifest fields.

---

*Convention analysis: 2026-05-24*
