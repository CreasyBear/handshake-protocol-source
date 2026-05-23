<!-- refreshed: 2026-05-23 -->
# Architecture

**Analysis Date:** 2026-05-23

## System Overview

```text
+----------------------------------------------------------------------------------+
|                    Handshake TypeScript Protocol Kernel                            |
| one exact contract -> policy -> one-use greenlight -> gateway check before action |
+----------------------+------------------------+----------------------+------------+
| Runtime proposal     | HTTP and SDK transport | CLI and MCP evidence | Gateways   |
| `src/runtime/`       | `src/http/`, `src/sdk/`| `src/cli/`, `src/mcp/` | `src/adapters/` |
+----------+-----------+-----------+------------+----------+-----------+-----+------+
           |                       |                       |                 |
           | proposal/evidence     | route response        | non-authority   | verified gate only
           v                       v                       v                 v
+----------------------------------------------------------------------------------+
|                         Protocol transition facade                                |
|                         `src/protocol/kernel.ts`                                  |
+----------------------------------------------------------------------------------+
           |
           v
+----------------------------------------------------------------------------------+
| Protocol primitives, response objects, reason codes, events, projections          |
| `src/protocol/areas/*`, `src/protocol/public/*`, `src/protocol/foundation/*`      |
+----------------------------------------------------------------------------------+
           |
           v
+----------------------------------------------------------------------------------+
| Durable reconstruction and atomic indexes                                         |
| `src/protocol/store/port.ts` -> `src/storage/d1/*`, `src/storage/memory/*`        |
+----------------------------------------------------------------------------------+
```

Authority is enforced only in the Tier 1 kernel/gateway path: exact `ActionContract` -> `PolicyDecision` -> one-use `Greenlight` -> `GatewayCheck` before mutation. Tier 2 surfaces in `src/runtime/*`, `src/sdk/surface-clients/*`, `src/cli/*`, `src/mcp/*`, and `src/surfaces/*` expose proposal posture, response envelopes, readiness, or redacted evidence. They do not enforce mutation authority, hosted operation, provider custody, settlement, clearing-house operation, or downstream business success.

Current git-state boundary: committed source includes the Tier 1 kernel, runtime ingress, x402/package-install proof lanes, CLI/MCP/SDK response posture, and transition-budget telemetry hardening. The visible `auth.md` adapter work is dirty working-tree state: tracked diffs mention it in `STRUCTURE.md`, `docs/internal/protocol-notes.md`, `src/adapters/LANE.md`, `src/experimental.ts`, and `test/architecture/root-exports.test.ts`; untracked implementation/test files exist under `src/adapters/auth-md/*` and `test/adapters/auth-md-adapter.test.ts`. Treat that auth.md state as observed adapter work, not committed architecture.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Doctrine and invariants | Defines the authority rule and the non-claim boundary for generated execution, review, telemetry, receipts, and gateway enforcement. | `AGENTS.md` |
| Repo orientation | States the local proof boundary, runtime ingress status, x402 proof profile, commands, source map, and non-claims. | `README.md` |
| Quality rules | Defines lane ownership, naming, test gates, and the exact response/receipt separation expected from source changes. | `QUALITY.md` |
| Structure canon | Defines source, test, docs, and ownership paths for protocol, HTTP, runtime, adapters, SDK, CLI, MCP, surfaces, storage, and examples. | `STRUCTURE.md` |
| Protocol definition | Defines authority rule, canonical state path, protocol objects, gateway policy, deny events, boundary claim, and extension boundary. | `docs/internal/protocol-definition.md` |
| Kernel architecture canon | Maps transitions, record taxonomy, schema backbone, store atomicity, evidence projections, and extension boundary. | `docs/internal/protocol-kernel-architecture.md` |
| Protocol facade | Exposes one source-owned transition method set over primitive areas. | `src/protocol/kernel.ts` |
| Protocol response objects | Aggregates strict public schemas and inputs used by HTTP, SDK, examples, and root exports. | `src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts` |
| Reason-code registry | Owns protocol reason codes by kind, phase, and public-safety posture. | `src/protocol/foundation/reason-codes.ts` |
| HTTP route response schemas | Owns composite HTTP success response schemas for policy, gateway, reconciliation, breaker, and recovery transitions. | `src/http/routes/transition-response-schemas.ts` |
| HTTP error envelope | Normalizes request and transition failures into typed error bodies with retryability, commit state, request identity, proof ref, and refusal ref. | `src/http/errors/transition-error-envelope.ts` |
| HTTP transition transport | Performs admission, body parsing, request-context evidence, route invocation, and response mapping. | `src/http/app.ts`, `src/http/routes/*` |
| HTTP evidence reads | Serves redacted generated graph, contract, agent transaction, idempotency, receipt timeline, and install-health projections. | `src/http/handlers/evidence-read.ts`, `src/http/routes/evidence-read-route-registry.ts` |
| Raw record read guard | Allows generic record reads only for object-registry postures that are not `internal_only`. | `src/http/handlers/internal-record-read.ts`, `src/protocol/areas/object-registry/*` |
| SDK low-level client | Mirrors HTTP routes and parses typed responses/errors; it remains an all-route compatibility client, not the model-facing Tier 2 surface. | `src/sdk/client.ts` |
| SDK role clients | Expose runtime proposal writes and evidence reads through single-role credentials. | `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/surface-clients/transport.ts` |
| CLI output contract | Wraps local operator/evidence command output with explicit false authority flags and non-claim labels. | `src/cli/output.ts` |
| CLI command manifest | Declares active CLI command ids, route families, filesystem posture, redaction posture, and non-goals. | `src/cli/command-manifest.ts` |
| CLI support bundle | Assembles caller-supplied redacted projections and local x402 posture only. | `src/cli/support-bundle.ts` |
| MCP outcome contract | Reuses shared non-authority surface outcomes for model-facing proposal and resource reads. | `src/surfaces/outcome.ts`, `src/mcp/output.ts` |
| MCP catalog and resources | Exposes one proposal tool and read-only resource templates without process, gateway, signer, receipt export, or certificate minting authority. | `src/mcp/catalog.ts`, `src/mcp/resources.ts` |
| MCP x402 proposal bridge | Validates strict `x402_payment.exact` input, checks freshness/readiness bounds, and uses `RuntimeClient` to create runtime evidence, tool-call draft, intent compilation, and action contract proposal only. | `src/mcp/x402-proposal.ts` |
| MCP transcript harness | Produces source-owned transcript rows for metadata, proposal, readback, stale metadata, tools-list change, readiness, gateway offline, amount/params mismatch, replay, raw sibling-shaped input, and proof gap. | `src/mcp/reference-transcript.ts`, `examples/mcp-reference-transcript/run.ts` |
| Runtime ingress | Converts observed package-install and x402 dispatch blocks into runtime execution, generated graph, tool-call draft, compilation, contract, or refusal evidence. | `src/runtime/ingress/index.ts` |
| Runtime package subpath | Exports runtime ingress as an observer/compiler surface, not as policy, gateway, mutation, or receipt authority. | `src/runtime/index.ts` |
| Transition-budget telemetry hardening | Committed test harness that records read/write/record/event/partition counts for authority-bearing transitions and fails on budget drift. | `test/support/transition-budget-recorder.ts`, `test/protocol/transition-budget-recorder.test.ts` |
| x402 install compiler | Compiles one buyer-side `x402_payment.exact` install proposal into catalog/envelope/gateway records or refusal reasons. | `src/adapters/x402-payment/install-proposal.ts` |
| x402 action proposal | Builds exact x402 candidate parameters and idempotency material from official PAYMENT-REQUIRED evidence. | `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/upstream-evidence.ts` |
| x402 wallet gateway | Uses official x402 SDK signing only after `VerifiedGatewayCheck`; records redacted payment evidence and reconciliation. | `src/adapters/x402-payment/wallet-gateway.ts` |
| Adapter conformance and probes | Classifies unsupported x402 surfaces and hostile signer/bypass posture without creating authority or provider certification. | `src/adapters/x402-payment/conformance.ts`, `src/adapters/x402-payment/bypass-probes.ts` |
| Visible dirty auth.md adapter state | Working-tree-only profile for OAuth Protected Resource Metadata `agent_auth`, credential-custody intake, and `auth_md_protected_api_call.exact` proposal. It is not committed and must not be treated as a stable provider/auth product claim. | `src/adapters/auth-md/*`, `test/adapters/auth-md-adapter.test.ts`, `src/experimental.ts` |
| Storage port | Defines durable records, stream events, greenlight consumption, idempotency, posture, isolation, operation-claim, and receipt indexes. | `src/protocol/store/port.ts` |
| D1 store | Durable reference `ProtocolStore` implementation with protocol records, stream events, and authority indexes. | `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql` |
| Memory store | Test fixture and invariant oracle implementing the same atomic store contract. | `src/storage/memory/index.ts` |
| APS demo | Runs the local x402 proof path through role clients, policy, gateway, evidence projection, certificate verification, and replay refusal. | `examples/x402-protected-spend/run.ts`, `examples/x402-protected-spend/README.md` |
| Architecture/export guards | Enforce public exports, package surface, import posture, CLI/MCP/surface posture, naming, claims, and vocabulary. | `test/architecture/*` |

## Pattern Overview

**Overall:** Tiered source-lane protocol kernel with strict response contracts, reason-code telemetry, non-hosted role-scoped surfaces, append-only reconstruction storage, and reference gateway fixtures.

**Key Characteristics:**
- Treat Tier 1 as the authority kernel and gateway enforcement chain: `src/protocol/*`, `src/http/*` transport, `src/storage/*` stores, and gateway-side `src/adapters/*/gateway.ts` mutation fixtures after `VerifiedGatewayCheck`.
- Treat Tier 2 as activation and evidence surfaces only: `src/runtime/*`, `src/sdk/surface-clients/*`, `src/cli/*`, `src/mcp/*`, and `src/surfaces/*` can propose, render, read redacted evidence, or report readiness, but cannot authorize, mutate, clear, settle, or certify.
- Use source lanes as authority boundaries. Each first-level lane has a manifest such as `src/protocol/LANE.md`, `src/http/LANE.md`, `src/runtime/LANE.md`, `src/sdk/LANE.md`, `src/cli/LANE.md`, `src/mcp/LANE.md`, `src/adapters/LANE.md`, `src/storage/LANE.md`, `src/surfaces/LANE.md`, `src/install/LANE.md`, and `src/conformance/LANE.md`.
- Keep protocol meaning under `src/protocol/*`. HTTP routes, SDK clients, CLI commands, MCP resources, examples, and tests must import public faces rather than primitive internals.
- Treat response objects as contracts. Protocol schemas live in `src/protocol/public/schemas.ts`; HTTP composite responses live in `src/http/routes/transition-response-schemas.ts`; surface outcomes live in `src/surfaces/outcome.ts`; CLI and MCP wrap those responses without adding authority.
- Treat reason codes as product evidence. `src/protocol/foundation/reason-codes.ts` classifies denial, proof gap, posture, graph, policy, gateway, isolation, recovery, and transition errors by phase and public-safety posture.
- Treat redacted projections as read-only telemetry. `src/protocol/evidence-projections/*` and `src/http/handlers/evidence-read.ts` expose diagnostic views and omitted fields; they do not export raw internal records or downstream success.
- Treat role-scoped SDK and MCP as Tier 2 activation lanes. `src/sdk/surface-clients/*` and `src/mcp/*` submit proposal/evidence only and are guarded away from policy, gateway, signer, receipt-export, storage, and raw-record imports.
- Treat CLI output as evidence/readiness posture. `src/cli/output.ts` sets authority, greenlight, gateway, mutation, raw-record, credential-material, receipt-export, and certificate-mint flags to false for every command result.
- Treat adapters as consequence holders. `src/adapters/*/gateway.ts` and `src/adapters/x402-payment/wallet-gateway.ts` may mutate only after `verifiedGatewayCheckFromResult()` yields a `VerifiedGatewayCheck`.
- Treat x402 as a proof profile. `src/adapters/x402-payment/*` models one buyer-side `exact` per-call path; session/day/review spend windows are metadata until a ledger exists.
- Treat dirty adapter state separately from committed architecture. `src/adapters/auth-md/*` is visible in the working tree with matching dirty export/test/doc changes, but it is not committed source and does not promote Handshake into an auth provider, OAuth server, generic API gateway, provider custodian, or certification body.

## Layers

**Canonical Doctrine And Guard Layer:**
- Purpose: Keep product claims, architecture boundaries, response contracts, and repo shape aligned with actual source.
- Location: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`, `test/architecture/*`
- Contains: Invariants, source ownership, claim boundaries, package export rules, import posture, CLI/MCP/surface guard tests.
- Depends on: Live source and tests.
- Used by: Planning, implementation, review, package checks, mapper outputs.

**Protocol Response Layer:**
- Purpose: Define protocol objects, input contracts, reason codes, errors, navigation metadata, and redacted projections.
- Location: `src/protocol/public/*`, `src/protocol/foundation/*`, `src/protocol/navigation/*`, `src/protocol/evidence-projections/*`, `src/protocol/areas/*`
- Contains: Zod schemas, transition inputs, `ReasonCodeSchema`, `ProtocolReasonCodeEntry`, `HandshakeProtocolError`, object registry metadata, projection schemas.
- Depends on: Protocol primitive areas and foundation helpers.
- Used by: HTTP, SDK, CLI, MCP, examples, tests, root exports.

**HTTP Transport And Envelope Layer:**
- Purpose: Expose transitions and evidence reads through role-scoped Hono/Worker routes.
- Location: `src/http/app.ts`, `src/http/admission/*`, `src/http/routes/*`, `src/http/handlers/*`, `src/http/errors/*`, `src/http/openapi/*`, `src/http/store/*`
- Contains: Route registry, route invokers, response schemas, transition error envelopes, evidence routes, raw record guard, request context.
- Depends on: `src/protocol/kernel.ts`, protocol public schemas/inputs, protocol store port, storage resolution.
- Used by: SDK clients, demos, HTTP tests, Worker entrypoint.

**Runtime Proposal Layer:**
- Purpose: Convert generated execution observations into evidence, graph, draft, compilation, contract proposal, or refusal.
- Location: `src/runtime/ingress/index.ts`, `src/runtime/*/action-proposal.ts`, `src/runtime/codemode-multi-action/*`, `src/runtime/index.ts`
- Contains: Observed dispatch schemas, runtime graph builders, tool-call draft finalization, package-install and x402 proposal helpers.
- Depends on: Protocol public area indexes, canonicalization helpers, adapter-owned action proposal builders.
- Used by: Runtime subpath, MCP bridge, x402 demo, runtime tests.

**Tier 2 Surface Layer:**
- Purpose: Provide local/source runtime, evidence, and operator surfaces without granting authority or hosted-operation claims.
- Location: `src/sdk/surface-clients/*`, `src/cli/*`, `src/mcp/*`, `src/surfaces/*`
- Contains: Role-scoped SDK clients, CLI output envelopes, support bundle, local project/x402 readiness, MCP catalog/resources/proposal bridge, shared outcome and boundary manifests.
- Depends on: HTTP response contracts, protocol projections, surface manifest.
- Used by: Examples, MCP transcript, CLI tests, SDK tests, architecture posture tests.

**Gateway Adapter Layer:**
- Purpose: Demonstrate mutation-side enforcement after a verified gateway check.
- Location: `src/adapters/package-install/*`, `src/adapters/repo-write/*`, `src/adapters/preview-deploy/*`, `src/adapters/x402-payment/*`
- Contains: Fixture gateways, x402 wallet signing surface, hostile probes, conformance classifiers, upstream x402 evidence decoding.
- Depends on: Public protocol gateway verification helpers and adapter-local parameter schemas.
- Used by: Experimental subpath, conformance, demos, adapter/integration tests.

**Visible Dirty Adapter Layer:**
- Purpose: Show uncommitted auth.md adapter direction without treating it as committed architecture.
- Location: `src/adapters/auth-md/*`, `test/adapters/auth-md-adapter.test.ts`, plus tracked dirty edits in `src/experimental.ts`, `src/adapters/LANE.md`, `STRUCTURE.md`, `docs/internal/protocol-notes.md`, and `test/architecture/root-exports.test.ts`.
- Contains: Protected Resource Metadata normalization, redacted registration evidence, `GatewayCredentialRef` intake, and `auth_md_protected_api_call.exact` proposal helper.
- Depends on: Protocol credential-custody, intent-compilation, action-contract, and foundation digest helpers.
- Used by: Dirty adapter test only in the current working tree.

**Storage And Reconstruction Layer:**
- Purpose: Persist protocol evidence and atomic indexes for reconstruction, replay refusal, idempotency, posture, isolation, and receipt lookup.
- Location: `src/protocol/store/port.ts`, `src/storage/d1/*`, `src/storage/memory/*`, `src/storage/kv/*`, `migrations/0001_protocol_kernel.sql`
- Contains: `ProtocolStore`, `StoredProtocolRecord`, `GatewayCheckCommit`, `ProtocolCommit`, D1 SQL statements, in-memory fixture.
- Depends on: Protocol object types, event schemas, canonical digests.
- Used by: Kernel, HTTP app, tests, examples.

## Active Tier 2 Response And Telemetry Lanes

**Protocol response objects:**
- Use `src/protocol/public/schemas.ts` and `src/protocol/public/inputs.ts` for public schema aggregation.
- Use primitive schemas under `src/protocol/areas/*/schemas.ts` for object ownership.
- Use `src/protocol/evidence-projections/schemas.ts` for redacted telemetry response shapes.
- Evidence note: `test/architecture/root-exports.test.ts` enumerates the curated root schema exports and rejects kernel/store internals.

**Reason codes:**
- Use `src/protocol/foundation/reason-codes.ts` for phase/kind/public-safety classification.
- Use `test/protocol/reason-code-registry.test.ts` to guard registry posture.
- Evidence note: MCP, CLI, runtime ingress, x402 install, policy, gateway, proof-gap, and protected-path posture all use reason-code strings as response evidence.

**HTTP success and error envelopes:**
- Use `src/http/routes/transition-response-schemas.ts` for composite success bodies such as policy plus greenlight, gateway check plus receipt/proof gap, reconciliation plus proof gaps, breaker plus isolation, and recovery status changes.
- Use `src/http/errors/transition-error-envelope.ts` for failure response contract fields: `code`, `message`, `transitionName`, `callerCustodyRole`, `retryability`, `commitState`, `requestIdentity`, `proofRef`, `refusalRef`, and schema issues.
- Use `src/http/app.ts` for request identity headers and admission-before-body-parsing behavior.
- Evidence note: `test/http/http.test.ts` and `test/http/d1-http.test.ts` cover route behavior; `test/architecture/import-posture.test.ts` keeps route metadata, invokers, and response schemas separated.

**SDK clients:**
- Use `src/sdk/client.ts` for all-route compatibility and HTTP parity.
- Use `src/sdk/surface-clients/runtime-client.ts` for runtime execution, tool-call draft, intent compilation, and action contract proposal routes only.
- Use `src/sdk/surface-clients/evidence-client.ts` for projection reads and local verification of supplied terminal certificates only.
- Use `src/sdk/surface-clients/transport.ts` for a single role credential.
- Evidence note: `test/sdk/role-clients.test.ts` rejects role maps/fallback tokens and verifies no policy, gateway, receipt export, or certificate mint methods exist on role clients.

**CLI command output and support bundle:**
- Use `src/cli/output.ts` for the JSON envelope and non-claims.
- Use `src/cli/command-manifest.ts` for command ids, aliases, route families, filesystem posture, and non-goals.
- Use `src/cli/support-bundle.ts` to assemble caller-supplied redacted projections and local x402 posture records only.
- Use `src/cli/projection-evidence.ts`, `src/cli/aps-report.ts`, and `src/cli/certificate.ts` for evidence wrappers and local certificate verification.
- Evidence note: `test/architecture/cli-command-posture.test.ts`, `test/cli/cli-evidence.test.ts`, `test/cli/cli-support-bundle.test.ts`, `test/cli/cli-local-project.test.ts`, and `test/cli/cli-x402-install-probes.test.ts` guard non-authority CLI posture.

**MCP transcript and resources:**
- Use `src/mcp/catalog.ts` for `handshake.actions.x402_payment.propose` and read-only resource templates.
- Use `src/mcp/resources.ts` for `handshake://` URI parsing and evidence-client resource reads.
- Use `src/mcp/x402-proposal.ts` for strict x402 proposal validation and runtime-client bridge.
- Use `src/mcp/output.ts` and `src/surfaces/outcome.ts` for structured non-authority tool results.
- Use `src/mcp/reference-transcript.ts` and `examples/mcp-reference-transcript/run.ts` for the source-owned transcript harness.
- Evidence note: `test/mcp/*` and `test/architecture/mcp-surface-posture.test.ts` guard no policy, greenlight, gateway check, mutation, raw record, signer, wallet, `PaymentPayload`, `PAYMENT-SIGNATURE`, or package export posture.

**Runtime ingress:**
- Use `src/runtime/ingress/index.ts` for local `wrapped_package_install`, `raw_sibling_package_install`, `ambiguous_package_install`, `wrapped_x402_payment`, `raw_sibling_x402_payment`, and `ambiguous_x402_payment` dispatch schemas.
- Use `src/runtime/index.ts` for the explicit `./runtime` package subpath.
- Evidence note: `test/runtime/runtime-ingress.test.ts` verifies runtime ingress creates runtime/graph/draft/compilation/contract records, refuses ambiguous/raw/dynamic/truncated inputs, and creates no policy, greenlight, gateway check, mutation, receipt, or certificate records.

**Adapters including x402:**
- Use `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, and `src/adapters/preview-deploy/gateway.ts` for reference mutation fixtures.
- Use `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/bypass-probes.ts`, and `src/adapters/x402-payment/conformance.ts` for the x402 proof profile.
- Evidence note: `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-install-proposal.test.ts`, `test/conformance/x402-payment-conformance.test.ts`, and `test/conformance/x402-upstream-exact-fixtures.test.ts` guard the exact x402 cut line and gateway-held signer posture.

**Storage evidence:**
- Use `src/protocol/events/records.ts` for canonical record commits and transition request context.
- Use `src/protocol/store/port.ts` for atomic store contracts.
- Use `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, and `migrations/0001_protocol_kernel.sql` for durable D1 reconstruction.
- Use `src/storage/memory/index.ts` for invariant fixture behavior.
- Evidence note: `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/protocol/fault-injecting-protocol-store.test.ts`, `test/http/d1-http.test.ts`, and `test/integration/x402-d1-http.test.ts` guard commit/replay/storage behavior.

**Demos:**
- Use `examples/x402-protected-spend/run.ts` and `examples/x402-protected-spend/README.md` for APS proof artifacts.
- Use `examples/mcp-reference-transcript/run.ts` and `examples/mcp-reference-transcript/README.md` for model-facing transcript artifacts.
- Evidence note: `test/product/x402-protected-spend-demo-report.test.ts` verifies APS output uses `RuntimeClient` and `EvidenceClient`, not low-level `HandshakeClient` or direct runtime helper calls.

**Architecture and export guards:**
- Use `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`, `test/architecture/import-posture.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, `test/architecture/mcp-surface-posture.test.ts`, `test/architecture/claim-boundary.test.ts`, `test/architecture/active-vocabulary.test.ts`, and `test/architecture/naming-posture.test.ts`.
- Evidence note: These tests are the active guardrail for keeping response/telemetry surfaces from becoming gateway authority.

**Committed transition-budget telemetry hardening:**
- Use `test/support/transition-budget-recorder.ts` as the store wrapper that counts reads, writes, committed records, emitted events, touched stream partitions, record writes by type, event writes by type, and store method calls.
- Use `test/protocol/transition-budget-recorder.test.ts` to assert conservative ceilings for `evaluatePolicy`, `gatewayCheck`, `createReceiptExport`, `reconcileSurfaceOperation`, and `transitionRecoveryRecommendationStatus`.
- Evidence note: This is architecture telemetry for transition blast-radius drift, not hosted observability or clearing-house monitoring.

## Data Flow

### Primary Protected Action Path

1. x402 install input compiles into catalog, action type, gateway registry entry, operating envelope, probe plan, and refusal reasons through `compileX402InstallProposal()` in `src/adapters/x402-payment/install-proposal.ts`.
2. Catalog/envelope records are persisted through `HandshakeKernel.putCatalogObject()` in `src/protocol/kernel.ts` or HTTP routes declared in `src/http/routes/transition-route-registry.ts`.
3. Protected-path posture and bypass evidence are recorded by gateway-custody transitions and hostile probe executors in `src/protocol/areas/protected-path-posture/*`, `src/protocol/areas/bypass-probe/*`, and `src/adapters/x402-payment/bypass-probes.ts`.
4. Runtime or MCP proposal evidence reaches `RuntimeClient` in `src/sdk/surface-clients/runtime-client.ts` or `proposeRuntimeIngressActionContracts()` in `src/runtime/ingress/index.ts`.
5. Runtime evidence, generated graph evidence, and finalized tool-call draft records are written before intent compilation through `src/protocol/areas/runtime-evidence/*`, `src/protocol/areas/generated-execution-graph/*`, and `src/protocol/areas/tool-call-draft/*`.
6. Intent compilation emits either a contractable `CandidateAction` or refusal evidence in `src/protocol/areas/intent-compilation/*`.
7. Action contract proposal canonicalizes one exact proposed commitment in `src/protocol/areas/action-contract/*`; it is still not authority.
8. Policy evaluation creates a `PolicyDecision` and optional one-use `Greenlight` through `src/protocol/areas/policy-greenlight/*`.
9. A gateway adapter calls `gatewayCheck()` before mutation; `src/protocol/areas/gateway-gate/*` verifies exact greenlight, posture, policy version, params digest, idempotency, and isolation.
10. Only after `verifiedGatewayCheckFromResult()` succeeds may `src/adapters/x402-payment/wallet-gateway.ts` create official x402 `PaymentPayload`/`PAYMENT-SIGNATURE` evidence and reconcile downstream operation posture.
11. `ProtocolStore.commitGatewayCheck()` in `src/protocol/store/port.ts` atomically persists gate evidence, mutation attempt, receipt/proof gap/refusal evidence, greenlight consumption, operation claim, idempotency update, receipt index, and stream events.
12. Redacted evidence is read through `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/*`, `src/sdk/surface-clients/evidence-client.ts`, `src/mcp/resources.ts`, and `src/cli/projection-evidence.ts`.

### HTTP Response Path

1. `src/http/app.ts` registers transition routes, evidence routes, raw record reads, health, and OpenAPI.
2. `authorizeTransitionAdmission()` in `src/http/admission/index.ts` rejects missing or wrong caller custody before body parsing.
3. `src/http/routes/transition-route-registry.ts` selects request schema, response schema, caller role, route path, and scope resolver.
4. `src/http/admission/request-context.ts` builds request identity evidence and headers.
5. `src/http/routes/transition-invokers.ts` invokes exactly one kernel transition per route.
6. Successful responses return route-specific schema bodies from `src/http/routes/transition-response-schemas.ts` or public protocol object schemas.
7. Failures return `TransitionErrorResponseSchema` from `src/http/errors/transition-error-envelope.ts` with retryability and commit state.

### MCP Proposal And Readback Path

1. A model-facing host reads `mcpCatalogSnapshot()` from `src/mcp/catalog.ts`.
2. Resource reads flow through `readMcpResource()` in `src/mcp/resources.ts`; source metadata and challenge reads are local, and evidence reads use an `EvidenceClient`.
3. Proposal calls enter `proposeMcpX402Payment()` in `src/mcp/x402-proposal.ts`.
4. Strict schema, metadata freshness, tools-list freshness, install posture, gateway posture, and per-call amount bounds are checked before runtime writes.
5. Runtime writes use `RuntimeClient` methods only: runtime execution, tool-call draft, draft finalization, intent compilation, and action contract proposal.
6. Success returns `action_contract_proposed` with non-authority flags and evidence refs; refusals return structured surface outcomes with reason codes and next actions.
7. The transcript harness in `src/mcp/reference-transcript.ts` binds MCP tool/resource behavior to CLI evidence readback command ids.

### CLI Evidence And Support Path

1. CLI command posture is declared in `src/cli/command-manifest.ts`.
2. `src/cli/main.ts` dispatches active source commands; there is no process supervision lane.
3. Evidence wrappers in `src/cli/aps-report.ts` and `src/cli/projection-evidence.ts` parse supplied reports/projections.
4. `src/cli/support-bundle.ts` accepts only redacted projections and local x402 posture records, then omits raw credentials, raw records, receipt exports, mutation commands, and payment material.
5. `src/cli/output.ts` wraps every result with non-authority flags.

### Visible Dirty auth.md Adapter Path

1. `src/adapters/auth-md/profiles.ts` normalizes OAuth Protected Resource Metadata `agent_auth` and redacts auth.md registration evidence.
2. `buildAuthMdGatewayCredentialIntake()` prepares a `RegisterGatewayCredentialRefInput` with opaque gateway custody and no raw credential material in returned evidence.
3. `src/adapters/auth-md/action-proposal.ts` rejects read-only methods, wrong origins, raw authorization-header passthrough, dynamic endpoint construction, and unsafe credential custody before compilation.
4. `proposeAuthMdProtectedApiCallActionContract()` compiles `auth_md_protected_api_call.exact` into intent compilation and action contract proposal only.
5. `test/adapters/auth-md-adapter.test.ts` asserts no greenlight, gateway check, or mutation attempt is created by this proposal helper.

This path is visible dirty worktree state. It is not committed source and does not create auth-provider, hosted, provider-custody, or generic API-gateway claims.

**State Management:**
- Protocol state is immutable `ProtocolRecord` payloads plus digest-linked `ContractStreamEvent` rows in `src/protocol/events/*`.
- Atomic authority indexes are `greenlight_issuances`, `greenlight_consumptions`, `idempotency_ledger_current`, `protected_path_posture_current`, `isolation_state_current`, `protected_surface_operation_claim_current`, and `receipt_by_mutation_attempt` in `migrations/0001_protocol_kernel.sql`.
- D1 is the durable reference store in `src/storage/d1/index.ts`; memory is the fixture/invariant oracle in `src/storage/memory/index.ts`; KV is cache posture only in `src/storage/kv/index.ts`.
- `.planning/` is scratch output only and must not become repo-facing source truth.

## Key Abstractions

**HandshakeKernel:**
- Purpose: Single facade over source-owned protocol transitions.
- Examples: `src/protocol/kernel.ts`
- Pattern: Delegates to primitive transition modules and writes through `ProtocolRecorder`.

**ProtocolStore:**
- Purpose: Atomic evidence persistence and reconstruction.
- Examples: `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, `src/storage/memory/index.ts`
- Pattern: Interface plus D1 durable implementation and memory fixture.

**ReasonCode:**
- Purpose: Portable explanation code for refusal, gateway decision, proof gap, posture, recovery, isolation, generated graph terminal state, and transition error evidence.
- Examples: `src/protocol/foundation/reason-codes.ts`, `src/protocol/foundation/schema-core.ts`
- Pattern: String code plus registry metadata by kind, phase, and public-safety posture.

**TransitionErrorEnvelope:**
- Purpose: HTTP/SDK error response contract with commit and retry semantics.
- Examples: `src/http/errors/transition-error-envelope.ts`, `src/sdk/client.ts`, `src/sdk/surface-clients/transport.ts`
- Pattern: Normalize Zod, protocol, ambiguous commit, and unknown errors into typed response bodies.

**SurfaceOutcome:**
- Purpose: Shared non-authority result contract for MCP and other model/operator surfaces.
- Examples: `src/surfaces/outcome.ts`, `src/mcp/output.ts`
- Pattern: Discriminated union with explicit false authority flags, reason codes, next action, retryability, commit state, and evidence refs.

**CliOutputEnvelope:**
- Purpose: Local command response contract that cannot be mistaken for permission or mutation evidence.
- Examples: `src/cli/output.ts`
- Pattern: Every command result carries false flags for authority, greenlight, gateway check, mutation, raw records, credentials, receipt export, and certificate minting.

**VerifiedGatewayCheck:**
- Purpose: Narrow adapter-side proof that a gateway check passed and can guard mutation.
- Examples: `src/protocol/areas/gateway-gate/*`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`
- Pattern: Adapter calls `verifiedGatewayCheckFromResult()` and refuses/non-mutates when it returns null.

**Redacted Evidence Projections:**
- Purpose: Diagnostic telemetry without raw secrets, raw records, or downstream certainty inflation.
- Examples: `src/protocol/evidence-projections/*`, `src/http/handlers/evidence-read.ts`
- Pattern: Purpose-built projection schemas with `redactionProfileRef` and `omittedFields`.

**TransitionBudgetRecorder:**
- Purpose: Guard committed authority-transition cost and record/event fan-out as architectural telemetry.
- Examples: `test/support/transition-budget-recorder.ts`, `test/protocol/transition-budget-recorder.test.ts`
- Pattern: Test-only `ProtocolStore` wrapper plus explicit per-transition ceilings; it does not create runtime telemetry, hosted monitoring, or authority.

## Entry Points

**HTTP App:**
- Location: `src/http/app.ts`
- Triggers: Hono app routes, tests, demos, Worker entrypoint.
- Responsibilities: Admission, parsing, request context, transition invocation, evidence reads, error envelopes.

**Cloudflare Worker:**
- Location: `src/worker.ts`
- Triggers: Worker `fetch`.
- Responsibilities: Bind Worker runtime to `createApp()`.

**Runtime Subpath:**
- Location: `src/runtime/index.ts`
- Triggers: `handshake-protocol-kernel/runtime` import.
- Responsibilities: Export runtime ingress observer/compiler helpers only.

**SDK Role Clients:**
- Location: `src/sdk/surface-clients/index.ts`
- Triggers: `handshake-protocol-kernel/sdk/role-clients` import.
- Responsibilities: Expose `RuntimeClient`, `EvidenceClient`, and `HandshakeClientError`.

**CLI Source Entrypoints:**
- Location: `src/cli/index.ts`, `src/cli/main.ts`
- Triggers: Source-local command tests or future bin wrapper.
- Responsibilities: Dispatch local manifest/evidence/readiness commands without authority.

**MCP Source Entrypoints:**
- Location: `src/mcp/index.ts`, `src/mcp/reference-transcript.ts`
- Triggers: Source tests and `examples/mcp-reference-transcript/run.ts`.
- Responsibilities: Catalog, proposal, resource, and transcript source behavior without package export or process custody.

**x402 APS Demo:**
- Location: `examples/x402-protected-spend/run.ts`
- Triggers: `npm run demo:aps`.
- Responsibilities: Produce local proof artifacts and buyer-readable report.

## Architectural Constraints

- **Authority:** Only gateway-side checks before mutation enforce authority. `src/runtime/*`, `src/sdk/*`, `src/cli/*`, `src/mcp/*`, demos, conformance, evidence projections, and HTTP admission are not enforcement points.
- **Tier boundary:** Tier 1 kernel code may define and enforce protocol authority. Tier 2 surfaces may propose, read, render, or report posture only.
- **Threading:** The code runs in JavaScript runtimes with async I/O. Authority consistency is expressed through store-level atomic commit contracts, not worker threads.
- **Global state:** Demos instantiate local stores and kernels in files such as `examples/x402-protected-spend/run.ts`. Source lanes do not rely on ambient global authority state.
- **Store consistency:** `ProtocolStore.commitProtocolRecords()` and `ProtocolStore.commitGatewayCheck()` are the authority-bearing write boundaries in `src/protocol/store/port.ts`.
- **Raw read posture:** Generic raw record reads must respect object-registry `rawReadPosture` in `src/protocol/areas/object-registry/*` and `src/http/handlers/internal-record-read.ts`.
- **Package surface:** `package.json` exports root, `./runtime`, `./sdk/role-clients`, `./conformance`, `./experimental`, and package metadata only.
- **MCP package posture:** `src/mcp/*` is source-owned and active, but there is no public `./mcp` package export and no MCP server process in this checkout.
- **CLI package posture:** `src/cli/*` is source-owned; there is no package/bin authority surface in this checkout.
- **x402 SDK imports:** Official x402 signer and client imports belong in `src/adapters/x402-payment/wallet-gateway.ts` and upstream parity tests, not MCP, CLI, SDK role clients, or root exports.
- **Spend windows:** x402 session/day/review spend bounds are metadata in `src/adapters/x402-payment/install-proposal.ts`; only per-call bounds are enforced.
- **Dirty adapter state:** `src/adapters/auth-md/*` and `test/adapters/auth-md-adapter.test.ts` are untracked; related tracked diffs are user-owned working-tree state. Do not treat auth.md as committed package shape until those files are committed and the architecture/package gates pass.

## Anti-Patterns

### Treating Telemetry As Authority

**What happens:** A projection, CLI support bundle, MCP resource, transcript row, or demo report is treated as permission or execution proof.
**Why it's wrong:** `src/protocol/evidence-projections/*`, `src/cli/support-bundle.ts`, `src/mcp/resources.ts`, and `examples/*` expose evidence and omitted fields only.
**Do this instead:** Require policy plus one-use greenlight plus gateway check in `src/protocol/areas/policy-greenlight/*` and `src/protocol/areas/gateway-gate/*`.

### Using All-Role SDK In Model-Facing Tier 2 Paths

**What happens:** Model-facing code uses `HandshakeClient` from `src/sdk/client.ts`.
**Why it's wrong:** `HandshakeClient` mirrors all transition routes and supports fallback `transitionToken`; it teaches broader authority shape than Tier 2 proposal/evidence clients.
**Do this instead:** Use `RuntimeClient` and `EvidenceClient` from `src/sdk/surface-clients/*` and the `./sdk/role-clients` package subpath.

### Adding MCP Or CLI Mutation Tools

**What happens:** MCP or CLI surfaces add commands/resources that evaluate policy, gateway-check, mutate, export receipts, mint certificates, or hold signer material.
**Why it's wrong:** `src/mcp/LANE.md`, `src/cli/LANE.md`, and `src/surfaces/boundary-manifest.ts` define MCP/CLI as proposal, evidence, operator setup, or readiness surfaces only.
**Do this instead:** Keep mutation in gateway adapters such as `src/adapters/x402-payment/wallet-gateway.ts` after `VerifiedGatewayCheck`.

### Hiding Authority Behind x402 Compatibility

**What happens:** Unsupported x402 surfaces such as `upto`, batch settlement, lifecycle hooks, seller middleware, signed offers/receipts, facilitator operation, or MCP auto-pay are described as protected.
**Why it's wrong:** `src/adapters/x402-payment/conformance.ts` classifies those as unsupported first-wedge surfaces with refusal/cut-line reason codes.
**Do this instead:** Keep `x402_payment.exact` as the only active proof profile and add a new protected action only with its own contract, policy, gateway, receipt, proof-gap, and tests.

## Error Handling

**Strategy:** Convert uncertainty, denial, conflict, and unsafe posture into structured refusal, transition error, replay refusal, proof gap, or isolation evidence.

**Patterns:**
- Schema errors become `invalid_request` response envelopes in `src/http/errors/transition-error-envelope.ts`.
- Protocol errors preserve code, retryability, commit state, proof ref, and refusal ref through `HandshakeProtocolError` and `TransitionErrorEnvelopeSchema`.
- Ambiguous store commits become `ambiguous_commit` or unknown commit state, not silent success.
- Runtime ingress turns raw sibling, ambiguous, dynamic, late-bound, and truncated graphs into refusal evidence in `src/runtime/ingress/index.ts`.
- MCP turns stale metadata, tools-list change, not-ready install, gateway offline, amount mismatch, replay, params mismatch, and runtime bridge errors into `SurfaceOutcome` values in `src/mcp/x402-proposal.ts`.
- CLI commands wrap failures/readiness as local posture with non-authority flags through `src/cli/output.ts`.

## Cross-Cutting Concerns

**Logging:** Not a primary authority surface. Durable evidence is `ProtocolRecord` and `ContractStreamEvent` data stored through `src/protocol/events/records.ts` and `src/protocol/store/port.ts`.

**Validation:** Zod strict schemas are the contract surface across `src/protocol/public/*`, `src/http/routes/*`, `src/protocol/evidence-projections/*`, `src/surfaces/outcome.ts`, `src/cli/*`, and `src/mcp/*`.

**Authentication:** HTTP admission uses role-scoped bearer custody or hosted caller identity seams in `src/http/admission/*`; this is route admission, not mutation authority.

**Redaction:** Projections and support bundles name omitted fields through `redactionProfileRef` and `omittedFields` in `src/protocol/evidence-projections/*`, `src/cli/support-bundle.ts`, and `src/mcp/resources.ts`.

**Claim Boundary:** `test/architecture/claim-boundary.test.ts`, `test/architecture/active-vocabulary.test.ts`, and canonical docs enforce local proof language and prohibit hosted/provider/broad-runtime/x402-overclaim language.

---

*Architecture analysis: 2026-05-23*
