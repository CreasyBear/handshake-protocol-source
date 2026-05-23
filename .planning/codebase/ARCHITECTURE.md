<!-- refreshed: 2026-05-23 -->
# Architecture

**Analysis Date:** 2026-05-23

## System Overview

```text
+--------------------------------------------------------------------------------+
|                  Handshake TypeScript Protocol Kernel                           |
| exact contract -> policy decision -> one-use greenlight -> gateway check        |
+---------------------+---------------------+---------------------+--------------+
| Runtime proposal    | HTTP / SDK transport| CLI / MCP evidence  | Gateways     |
| `src/runtime/`      | `src/http/`         | `src/cli/`, `src/mcp/` | `src/adapters/` |
+----------+----------+----------+----------+----------+----------+------+-------+
           |                     |                     |                 |
           v                     v                     v                 v
+--------------------------------------------------------------------------------+
|                         Protocol transition facade                              |
|                         `src/protocol/kernel.ts`                                |
+--------------------------------------------------------------------------------+
           |
           v
+--------------------------------------------------------------------------------+
| Primitive-owned protocol areas, schemas, guards, events, navigation, context    |
| `src/protocol/areas/*`, `src/protocol/foundation/*`, `src/protocol/events/*`    |
+--------------------------------------------------------------------------------+
           |
           v
+--------------------------------------------------------------------------------+
| Durable reconstruction and atomic indexes                                       |
| `src/protocol/store/port.ts` -> `src/storage/d1/*`, `src/storage/memory/*`      |
+--------------------------------------------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Canonical doctrine | Defines product invariants, claim boundaries, and source of repo truth. | `AGENTS.md` |
| Repo orientation | States the current local foundation, command contract, source map, and x402 boundary. | `README.md` |
| Quality rules | Defines naming, import, test, and authority-boundary rules for TypeScript changes. | `QUALITY.md` |
| Structure canon | Defines source lane ownership and where code belongs. | `STRUCTURE.md` |
| Protocol definition | Defines the authority rule, state path, protocol objects, and boundary claim. | `docs/internal/protocol-definition.md` |
| Kernel architecture canon | Maps kernel transitions, object taxonomy, storage, projections, and extension boundary. | `docs/internal/protocol-kernel-architecture.md` |
| Package root | Curated stable export surface for app creation, schemas, inputs, SDK client, verified gate helpers, and certificate verification. | `src/index.ts` |
| Runtime subpath | Exposes runtime observer/compiler helpers without exporting policy, greenlight, gateway, mutation, or receipt types. | `src/runtime/index.ts` |
| Conformance subpath | Exposes narrow conformance checks without placing them on the root package surface. | `src/conformance/index.ts` |
| Experimental subpath | Explicitly names reference gateway fixture exports as experimental. | `src/experimental.ts` |
| Worker entrypoint | Creates the Hono app for Cloudflare Worker `fetch`. | `src/worker.ts` |
| HTTP app | Registers health, OpenAPI, transition routes, evidence reads, raw record reads, admission, context, parsing, and response mapping. | `src/http/app.ts` |
| Route registry | Declares HTTP transition path, caller role, scope resolver, request schema, and response schema. | `src/http/routes/transition-route-registry.ts` |
| Route invokers | Maps route IDs to exactly one kernel transition call per request. | `src/http/routes/transition-invokers.ts` |
| Admission | Enforces role-scoped bearer custody or hosted caller identity before route execution. | `src/http/admission/index.ts`, `src/http/admission/caller-auth.ts` |
| Kernel facade | Owns the public transition method set and delegates to primitive-owned transition modules. | `src/protocol/kernel.ts` |
| Protocol areas | Own primitive behavior for catalogs, runtime evidence, tool drafts, intent compilation, contracts, policy, review, gateway, receipt, proof gap, recovery, isolation, credential custody, and object metadata. | `src/protocol/areas/*` |
| Foundation | Owns canonical JSON, digests, IDs, errors, base schemas, reason codes, and transition guard helpers. | `src/protocol/foundation/*` |
| Recorder and events | Builds canonical stored records, request context records, and digest-linked contract stream events. | `src/protocol/events/records.ts`, `src/protocol/events/chains.ts` |
| Store port | Defines atomic persistence, stream, greenlight consumption, idempotency, posture, isolation, operation-claim, and receipt indexes. | `src/protocol/store/port.ts` |
| D1 store | Durable reference implementation of `ProtocolStore`. | `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql` |
| Memory store | Test fixture and invariant oracle implementation of `ProtocolStore`. | `src/storage/memory/index.ts` |
| KV cache | Optional isolation cache only; it is not durable authority. | `src/storage/kv/index.ts` |
| Runtime ingress | Converts observed dispatch blocks into runtime execution, generated graph, tool-call draft, intent compilation, action contract, or refusal evidence. | `src/runtime/ingress/index.ts` |
| Codemode runner | Converts bounded generated action lists into preflighted contract proposals without issuing authority. | `src/runtime/codemode-multi-action/generated-program-runner.ts` |
| Install compiler | Defines generic install proposal and adapter-pack record shapes. | `src/install/install-proposal/index.ts`, `src/install/protected-action-adapter-pack/index.ts` |
| Reference gateways | Hold consequence for fixture package install, repo write, preview deploy, and x402 payment signing after verified gateway check. | `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts` |
| x402 adapter pack | Compiles one `x402_payment.exact` install proposal and first-wedge payment attempt shape. | `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts` |
| x402 upstream evidence | Decodes official `PAYMENT-REQUIRED` evidence into non-authority source evidence. | `src/adapters/x402-payment/upstream-evidence.ts` |
| x402 probes and conformance | Encode signer-custody and bypass posture checks for the local protected-spend profile. | `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/x402-payment/conformance.ts` |
| Surface manifest | Source-owned boundary table for SDK, CLI, MCP, and deferred surface posture. | `src/surfaces/boundary-manifest.ts` |
| SDK client | Typed HTTP transition and evidence client; it submits requests and parses responses only. | `src/sdk/client.ts`, `src/sdk/surface-clients/*` |
| CLI | Local operator setup, readiness checks, evidence/readback wrappers, certificate verification, and x402 posture probes; no process startup or authority. | `src/cli/*` |
| MCP | Model-facing x402 proposal/resource source modules and reference transcript harness; no package export, process startup, gateway, signer, or authority. | `src/mcp/*`, `examples/mcp-reference-transcript/*` |
| x402 walkthrough | Local reference proof path and artifact generator for protected spend. | `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts` |
| MCP reference transcript | Source-owned Tier 2 MCP transcript generator that binds catalog, proposal, resources, and CLI readback IDs without claiming external host operation. | `src/mcp/reference-transcript.ts`, `examples/mcp-reference-transcript/run.ts` |
| Architecture tests | Enforce import posture, root exports, surface boundaries, naming, CLI posture, MCP posture, package surface, and claim boundary. | `test/architecture/*` |

## Pattern Overview

**Overall:** Source-lane-owned protocol kernel with a transition facade, append-only reconstruction store, role-scoped transport, non-authority product surfaces, and reference gateway adapters.

**Key Characteristics:**
- Use first-level source lanes as authority boundaries. Each lane carries a `LANE.md` ownership contract under `src/protocol/LANE.md`, `src/http/LANE.md`, `src/runtime/LANE.md`, `src/adapters/LANE.md`, `src/storage/LANE.md`, `src/sdk/LANE.md`, `src/cli/LANE.md`, `src/mcp/LANE.md`, `src/surfaces/LANE.md`, `src/install/LANE.md`, and `src/conformance/LANE.md`.
- Use primitive-owned protocol areas under `src/protocol/areas/*`. Each area exposes local `index.ts`, `schemas.ts`, `inputs.ts`, and `types.ts` faces; behavior lives behind the area public index.
- Keep transport separate from authority. `src/http/routes/transition-route-registry.ts` declares routes, `src/http/routes/transition-invokers.ts` invokes kernel methods, and `src/protocol/*` owns meaning.
- Persist protocol records and stream events instead of free-form logs. `src/protocol/events/records.ts` builds canonical records and commits them through `src/protocol/store/port.ts`.
- Treat runtime, SDK, CLI, and MCP as proposal or evidence surfaces. They can submit evidence, propose contracts, render redacted views, or verify supplied certificates; they must not mint policy, greenlight, gateway checks, mutations, receipt exports, or authority certificates.
- Treat adapters as consequence holders. Reference gateways in `src/adapters/*` mutate only after `VerifiedGatewayCheck` is derived from a passed gateway check.
- Keep x402 as one proof profile. `src/adapters/x402-payment/*` proves buyer-side `exact` per-call protected spend locally; it does not define the protocol or broad x402 compatibility.

## Layers

**Canonical Doctrine And Guard Layer:**
- Purpose: Keep product claims, architecture decisions, naming, and repo shape bounded by source-owned truth.
- Location: `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/*`, `test/architecture/*`
- Contains: Invariants, claim boundaries, architecture docs, naming rules, package surface expectations, surface posture tests.
- Depends on: Source and test evidence.
- Used by: Planning, implementation, review, package checks, and mapper output.

**Public Package Layer:**
- Purpose: Expose stable source-package entrypoints while hiding kernel internals and reference fixtures from the root.
- Location: `src/index.ts`, `src/runtime/index.ts`, `src/conformance/index.ts`, `src/experimental.ts`, `package.json`
- Contains: Root exports, runtime subpath, conformance subpath, experimental subpath, package export map.
- Depends on: HTTP app, public protocol schemas/inputs, SDK, conformance, runtime, experimental adapter surfaces.
- Used by: Consumers, examples, package checks, root export tests.

**Protocol Kernel Layer:**
- Purpose: Provide one facade over source-owned transition modules.
- Location: `src/protocol/kernel.ts`
- Contains: `HandshakeKernel` transition methods for catalog registration, runtime evidence, graph evidence, tool drafts, compilation, contracts, policy, review, gateway, receipt export, recovery, isolation, and certificates.
- Depends on: Protocol area public indexes, recorder, store port, request context.
- Used by: HTTP route invokers, examples, runtime helpers, adapter gateways, tests.

**Protocol Primitive Layer:**
- Purpose: Own protocol meaning and transition behavior.
- Location: `src/protocol/areas/*`
- Contains: Zod schemas, input schemas, guards, transition functions, type faces, and primitive-local helpers.
- Depends on: `src/protocol/foundation/*`, `src/protocol/events/*`, `src/protocol/context/*`, `src/protocol/store/*`, and other area public indexes.
- Used by: `src/protocol/kernel.ts`, public aggregators, evidence projections, focused tests.

**Transport Layer:**
- Purpose: Expose kernel transitions and redacted evidence reads over Hono/Worker HTTP.
- Location: `src/http/*`, `src/worker.ts`
- Contains: Hono app, route registry, invokers, admission, request context, error envelopes, OpenAPI projection, store resolution.
- Depends on: `src/protocol/kernel.ts`, public protocol schemas and inputs, `src/storage/d1/*`, memory fallback for tests.
- Used by: SDK, examples, HTTP tests, Worker entrypoint.

**Storage Layer:**
- Purpose: Store durable protocol evidence and atomic authority indexes.
- Location: `src/storage/*`, `migrations/0001_protocol_kernel.sql`
- Contains: D1 store, memory store, KV/noop isolation cache, SQL statement builders.
- Depends on: `src/protocol/store/port.ts`, object registry metadata, event schemas, canonical digest helpers.
- Used by: Kernel, HTTP app, tests, examples.

**Runtime Proposal Layer:**
- Purpose: Convert observed generated execution into evidence and action contract proposals.
- Location: `src/runtime/*`
- Contains: Runtime ingress schemas, dispatch graph construction, tool-call draft finalization, package-install proposal helper, repo-write/preview-deploy helpers, codemode multi-action runner.
- Depends on: Protocol public area indexes and canonicalization helpers; x402 proposal helper under `src/adapters/x402-payment/action-proposal.ts`.
- Used by: Runtime subpath, MCP bridge, x402 walkthrough, runtime tests.

**Gateway Adapter Layer:**
- Purpose: Demonstrate consequence-side enforcement after verified gateway checks.
- Location: `src/adapters/*`
- Contains: Fixture mutation gateways, x402 wallet gateway, hostile probe executors, x402 adapter pack, x402 conformance.
- Depends on: Public protocol gateway verification helpers and adapter-local parameter schemas.
- Used by: Experimental subpath, conformance, examples, adapter tests.

**Product Surface Layer:**
- Purpose: Provide non-authority ergonomics for humans, models, and callers.
- Location: `src/sdk/*`, `src/cli/*`, `src/mcp/*`, `src/surfaces/*`
- Contains: All-role SDK client, role-scoped runtime/evidence clients, CLI command manifest, MCP catalog/proposal/resource mapping, surface boundary manifest.
- Depends on: HTTP route contract, public protocol schemas/inputs, surface manifest.
- Used by: Examples, tests, external integrations.

## Active Tier 2 Surface Posture

**Source-owned boundary table:** `src/surfaces/boundary-manifest.ts` is the executable posture map for SDK, CLI, MCP, and deferred surfaces. Active entries are `sdk.runtime`, `sdk.evidence`, `cli.operator`, `cli.evidence`, and `mcp.runtime`; deferred entries are `sdk.install`, `sdk.gateway`, and `cli.process`. `test/architecture/surface-boundary-posture.test.ts` requires each surface to declare allowed/forbidden route families, forbidden imports, forbidden credential shapes, forbidden output fields, non-authority flags, and claim-boundary labels.

**Public export boundary:** `package.json` exports only root, `./runtime`, `./conformance`, `./experimental`, and package metadata. `src/index.ts` exposes the HTTP app, public protocol schemas/inputs, verified gateway helpers, authority-certificate verification helpers, and the all-route `HandshakeClient`; it does not export `src/cli/*`, `src/mcp/*`, `RuntimeClient`, `EvidenceClient`, stores, kernel internals, runtime ingress internals, or reference gateways. `test/architecture/root-exports.test.ts` and `test/architecture/package-surface.test.ts` are the public-surface gates.

**SDK:** `src/sdk/client.ts` is the all-route low-level HTTP mirror. It still supports `transitionToken` fallback across roles, so it is not the model-facing Tier 2 boundary. Tier 2 activation now uses the explicit `handshake-protocol-kernel/sdk/role-clients` package subpath: `RuntimeClient` is limited to runtime execution, tool-call drafts, intent compilation, and action contract proposal (`src/sdk/surface-clients/runtime-client.ts`), while `EvidenceClient` reads redacted projections and verifies supplied authority certificates without minting (`src/sdk/surface-clients/evidence-client.ts`). `src/sdk/surface-clients/transport.ts` accepts a single role credential and `test/sdk/role-clients.test.ts` rejects role-token bags/fallback tokens plus policy, gateway, receipt-export, and certificate-mint methods.

**CLI:** The active CLI slice is local operator and evidence posture: `schema`, `init`, `doctor`, `evidence aps-report`, `evidence contract-view`, `evidence receipt-timeline`, `cert verify`, `support bundle`, `install x402-payment`, `probes x402-payment`, `install health`, and `conformance x402-payment` (`src/cli/command-manifest.ts`). `src/cli/local-project/*` writes project config and credential-placeholder refs without token values; `src/cli/x402/*` records local x402 install/probe/readiness classification; `src/cli/projection-evidence.ts` wraps supplied projection JSON; `src/cli/support-bundle.ts` assembles supplied redacted projections and local posture records into one evidence-only support bundle. Every output goes through `src/cli/output.ts` with authority, greenlight, gateway, mutation, raw-record, credential-material, receipt-export, and certificate-mint flags set false. `test/architecture/cli-command-posture.test.ts`, `test/cli/cli-local-project.test.ts`, `test/cli/cli-x402-install-probes.test.ts`, and `test/cli/cli-support-bundle.test.ts` are the CLI posture gates.

**MCP:** The active MCP slice exposes exactly one proposal tool, `handshake.actions.x402_payment.propose`, plus read-only resource templates (`src/mcp/catalog.ts`). `proposeMcpX402Payment()` validates strict official exact x402 input, refuses stale metadata/not-ready install/offline gateway/amount overrun before runtime calls, derives the idempotency key from exact x402 request material rather than trusting a caller key, and then uses a role-scoped `RuntimeClient` to create runtime evidence, a finalized tool-call draft, intent compilation, and an action contract proposal only (`src/mcp/x402-proposal.ts`). Evidence resources route through `EvidenceClient`; metadata/challenge/certificate/pre-contract health reads are source or reference views (`src/mcp/resources.ts`). `src/mcp/reference-transcript.ts` and `examples/mcp-reference-transcript/run.ts` generate a source-owned transcript harness, not a public MCP host quickstart. `test/mcp/*` and `test/architecture/mcp-surface-posture.test.ts` assert no policy decision, greenlight, gateway check, mutation, receipt export, payment payload, signature, hosted operation, or package export appears in the MCP path.

**Runtime and adapter proof boundary:** `src/runtime/ingress/index.ts` currently recognizes local package-install and x402 dispatch blocks, including wrapped, raw-sibling, ambiguous, dynamic, retry, and loop shapes. It records runtime evidence, generated graph evidence, tool-call drafts, intent compilations, action contracts, refusals, or bypass evidence; it does not create policy, greenlight, gateway, mutation, receipt, or certificate evidence. `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, and `src/adapters/x402-payment/wallet-gateway.ts` are reference consequence holders and mutate only after `verifiedGatewayCheckFromResult()` returns a `VerifiedGatewayCheck`.

**Evidence/readback boundary:** HTTP evidence routes in `src/http/routes/evidence-read-route-registry.ts`, SDK reads in `src/sdk/surface-clients/evidence-client.ts`, MCP resources in `src/mcp/resources.ts`, and CLI readback wrappers in `src/cli/projection-evidence.ts` expose redacted projections. Raw record reads remain diagnostic and respect object-registry `rawReadPosture` through `src/http/handlers/internal-record-read.ts`; they are not the product audit surface.

**Architectural debt and ownership seams:** Keep these visible when planning Tier 2 work:
- `HandshakeClient` remains root-exported and all-role; its fallback `transitionToken` is useful for transition compatibility but unsafe as the model-facing surface (`src/sdk/client.ts`, `src/sdk/LANE.md`).
- Role clients are implemented and exposed through `./sdk/role-clients`, while root exports remain curated. Future SDK expansion still requires explicit package/root tests (`src/sdk/surface-clients/*`, `package.json`, `test/architecture/root-exports.test.ts`).
- MCP is source-owned and tested, but not a package export or installed server process. `src/mcp/reference-transcript.ts` proves source behavior, not external host custody.
- CLI local install/probe health is pre-contract readiness classification. It is not provider certification, hosted custody, or gateway operation (`src/cli/x402/*`, `src/cli/local-project/*`).
- The surface manifest is central and hand-maintained. Adding route families, commands, resources, or clients without updating `src/surfaces/boundary-manifest.ts` and posture tests creates drift.
- Evidence projections assemble useful readbacks by scanning stored records in `src/http/handlers/evidence-read.ts` and `src/protocol/evidence-projections/projections.ts`; this is acceptable for the local proof slice but not a provider-scale query model.
- x402 spend windows remain metadata/conformance labels, not an enforced aggregate spend ledger (`src/adapters/x402-payment/conformance.ts`, `src/cli/x402/local-state.ts`).

## Data Flow

### Primary Protected Action Path

1. Install input is compiled into catalog, action type, gateway registry entry, and operating envelope records by `compileX402InstallProposal()` (`src/adapters/x402-payment/install-proposal.ts:122`).
2. Records enter the store through `HandshakeKernel.putCatalogObject()` (`src/protocol/kernel.ts:92`) or the HTTP catalog routes declared in `src/http/routes/transition-route-registry.ts:70`.
3. Protected-path posture and bypass evidence are recorded through gateway-custody transitions (`src/protocol/kernel.ts:116`, `src/adapters/x402-payment/bypass-probes.ts`).
4. Generated execution reaches `proposeRuntimeIngressActionContracts()` (`src/runtime/ingress/index.ts:204`), which records runtime execution, generated graph evidence, finalized tool-call drafts, intent compilations, and action contracts.
5. Intent compilation loads catalog/envelope/gateway/runtime/draft context and emits either a `CandidateAction` or refusal (`src/protocol/areas/intent-compilation/transitions.ts:43`).
6. Action contract proposal rechecks pinned digests, generated graph binding, recovery linkage, and credential-ref bindings before persisting the exact contract (`src/protocol/areas/action-contract/transitions.ts:52`).
7. Policy evaluation loads contract, envelope, isolation, sequence dependencies, current posture, credential refs, and idempotency ledger state before returning a policy decision and optional one-use greenlight (`src/protocol/areas/policy-greenlight/transitions.ts:81`).
8. The gateway adapter calls `gatewayCheck()` before mutation (`src/adapters/x402-payment/wallet-gateway.ts:154`, `src/protocol/areas/gateway-gate/transitions.ts:85`).
9. x402 payment signing happens only after `verifiedGatewayCheckFromResult()` returns a `VerifiedGatewayCheck` (`src/adapters/x402-payment/wallet-gateway.ts:164`, `src/adapters/x402-payment/wallet-gateway.ts:172`).
10. The gateway check commits gate evidence, mutation attempt evidence, receipt or proof gap evidence, greenlight consumption, operation claim, and stream events atomically through `ProtocolStore.commitGatewayCheck()` (`src/protocol/areas/gateway-gate/transitions.ts:229`, `src/protocol/store/port.ts`).
11. Redacted transaction and receipt projections are served by evidence handlers (`src/http/handlers/evidence-read.ts:42`, `src/protocol/evidence-projections/*`).
12. Optional terminal `AuthorityCertificate` evidence is created only after terminal receipt, refusal, proof gap, or replay evidence exists (`src/protocol/kernel.ts:150`, `examples/x402-protected-spend/README.md:106`).

### HTTP Transition Flow

1. `createApp()` wires health, OpenAPI, transition routes, evidence routes, and raw record reads (`src/http/app.ts:26`, `src/http/app.ts:35`, `src/http/app.ts:38`, `src/http/app.ts:42`, `src/http/app.ts:46`).
2. `handleTransition()` authorizes caller custody before parsing the body (`src/http/app.ts:58`, `src/http/app.ts:70`).
3. The route registry supplies request schema, response schema, scope resolver, and role (`src/http/routes/transition-route-registry.ts:70`).
4. Hosted mode checks caller scope after route-specific scope resolution (`src/http/app.ts:78`).
5. Request identity and digest evidence are attached to transition records (`src/http/app.ts:89`, `src/protocol/events/records.ts:139`).
6. The route invoker calls the matching `HandshakeKernel` method (`src/http/app.ts:92`, `src/http/routes/transition-invokers.ts`).
7. Errors are normalized into `TransitionErrorEnvelope` with retryability, commit state, request identity, proof ref, and refusal ref (`src/http/errors/transition-error-envelope.ts`).

### MCP Proposal Flow

1. MCP exposes one proposal tool, `handshake.actions.x402_payment.propose`, and redacted resource templates (`src/mcp/catalog.ts:7`, `src/mcp/catalog.ts:66`).
2. `proposeMcpX402Payment()` validates strict official exact x402 input and checks metadata freshness, install posture, gateway posture, and per-call amount bound before contacting runtime routes (`src/mcp/x402-proposal.ts:103`).
3. MCP uses a role-scoped `RuntimeClient`, not the all-role SDK client (`src/sdk/surface-clients/runtime-client.ts:19`).
4. MCP derives a stable idempotency key from x402 request material, records runtime execution, tool-call draft, intent compilation, and action contract proposal, then returns non-authority flags and redacted evidence refs (`src/mcp/x402-proposal.ts`).
5. MCP currently records `generatedExecutionGraphId: null` because generated graph creation is not exposed by the role-scoped runtime client; the response labels that as non-authority posture, not missing permission (`src/mcp/x402-proposal.ts`).
6. MCP resource reads use `EvidenceClient` projections and mark every read as non-authority (`src/mcp/resources.ts`).
7. The source-owned transcript harness covers valid proposal, evidence readback, stale metadata, tools-list change, install-not-ready, offline gateway, amount mismatch, params mismatch, replay refusal, raw sibling-shaped input, and proof-gap/downstream uncertainty cases (`src/mcp/reference-transcript.ts`, `examples/mcp-reference-transcript/run.ts`).

### CLI Local Operator And Evidence Flow

1. The CLI command manifest declares each active command, plane, custody role, route families, filesystem behavior, and non-goals (`src/cli/command-manifest.ts`).
2. `init` and `doctor` manage local `.handshake/project.json` plus out-of-workspace credential-placeholder refs and trust-bundle posture; they do not create token values (`src/cli/local-project/index.ts`, `src/cli/local-project/doctor.ts`).
3. `install x402-payment`, `probes x402-payment`, and `install health` produce local pre-contract install/probe/readiness records; readiness is local classification and remains `not_contract_keyed_yet` until a contract exists (`src/cli/x402/index.ts`, `src/cli/x402/local-state.ts`).
4. `evidence aps-report`, `evidence contract-view`, and `evidence receipt-timeline` wrap supplied projection JSON into CLI outputs; they do not fetch raw records or create receipt exports (`src/cli/aps-report.ts`, `src/cli/projection-evidence.ts`).
5. `cert verify` performs offline verification against supplied trust material and cannot mint an authority certificate (`src/cli/certificate.ts`).
6. Every CLI output is wrapped through `cliOutput()` and guarded by CLI posture tests (`src/cli/output.ts`, `test/architecture/cli-command-posture.test.ts`, `test/cli/cli-evidence.test.ts`, `test/cli/cli-local-project.test.ts`, `test/cli/cli-x402-install-probes.test.ts`).

**State Management:**
- Protocol state is represented as immutable `ProtocolRecord` objects plus ordered `ContractStreamEvent` records (`src/protocol/areas/object-registry/schemas.ts`, `src/protocol/events/schemas.ts`).
- Atomic authority indexes live behind `ProtocolStore`: greenlight issuance and consumption, idempotency ledger, current protected path posture, isolation state, operation claim, and receipt-by-mutation-attempt (`src/protocol/store/port.ts`).
- D1 is durable reconstruction truth in the reference implementation (`src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`).
- Memory store is a test fixture and invariant oracle (`src/storage/memory/index.ts`).
- KV is cache posture only and must not become authority (`src/storage/kv/index.ts`).
- `.planning/` is scratch/context only and must not become repo-facing source truth (`AGENTS.md`, `README.md`).

## Key Abstractions

**HandshakeKernel:**
- Purpose: Single facade over all protocol transitions.
- Examples: `src/protocol/kernel.ts`
- Pattern: Delegates to primitive-owned transition modules and shares one `ProtocolRecorder`.

**ProtocolStore:**
- Purpose: Atomic persistence and reconstruction port.
- Examples: `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, `src/storage/memory/index.ts`
- Pattern: Interface plus D1 durable implementation and memory fixture.

**ProtocolRecord And Object Registry:**
- Purpose: Typed durable object envelope and raw-read/export posture.
- Examples: `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/areas/object-registry/index.ts`
- Pattern: Discriminated union plus registry metadata for IDs, export posture, raw-read posture, and isolation scope derivation.

**ProtocolNavigation:**
- Purpose: Source-owned transition metadata for phase, records written, events emitted, authority boundary, and evidence obligation.
- Examples: `src/protocol/navigation/index.ts`, `src/http/navigation/index.ts`
- Pattern: Metadata table consumed by tests/docs instead of inferred from comments.

**ActionContract:**
- Purpose: Exact proposed commitment, not permission.
- Examples: `src/protocol/areas/action-contract/*`
- Pattern: Canonical digest over candidate, envelope, gateway, action type, params, graph binding, credential refs, idempotency key, and recovery linkage.

**PolicyDecision And Greenlight:**
- Purpose: Decision over one exact contract and optional one-use gateway-bound pass.
- Examples: `src/protocol/areas/policy-greenlight/*`
- Pattern: Deterministic policy plus isolation, sequence, posture, credential, review, and idempotency constraints.

**VerifiedGatewayCheck:**
- Purpose: Typed proof that a gateway check passed for one exact action before mutation.
- Examples: `src/protocol/areas/gateway-gate/*`, `src/adapters/x402-payment/wallet-gateway.ts`
- Pattern: Adapter code receives a verified gate object before calling mutation/signing surfaces.

**RuntimeIngressDispatchBlock:**
- Purpose: Normalized runtime-observed dispatch block for local x402 and package-install proposal paths.
- Examples: `src/runtime/ingress/index.ts`
- Pattern: Discriminated dispatch kinds for wrapped, raw sibling, and ambiguous dispatches; raw/ambiguous dispatches become bypass or refusal evidence.

**SurfaceBoundaryManifest:**
- Purpose: Source-owned permissions table for SDK, CLI, MCP, and deferred surfaces.
- Examples: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`
- Pattern: Allowed and forbidden route families, imports, credential shapes, output fields, non-authority flags, and claim labels.

**RoleScopedTransport:**
- Purpose: SDK transport boundary that carries exactly one role credential.
- Examples: `src/sdk/surface-clients/transport.ts`, `src/sdk/surface-clients/runtime-client.ts`, `src/sdk/surface-clients/evidence-client.ts`
- Pattern: Runtime and evidence clients expose narrow method sets and reject role maps/fallback tokens in tests.

**CliLocalProjectPosture:**
- Purpose: Local setup/readiness state for CLI users without creating authority or credential values.
- Examples: `src/cli/local-project/index.ts`, `src/cli/local-project/doctor.ts`, `src/cli/x402/local-state.ts`
- Pattern: Workspace project config plus external state-root credential refs, trust bundle, x402 install/probe reports, and fail-closed doctor reasons.

**McpReferenceTranscript:**
- Purpose: Source-owned MCP behavior transcript for Tier 2 audit.
- Examples: `src/mcp/reference-transcript.ts`, `examples/mcp-reference-transcript/run.ts`, `test/mcp/mcp-reference-transcript.test.ts`
- Pattern: Deterministic catalog/proposal/resource cases with non-authority posture and CLI readback pairings.

**AuthorityCertificate:**
- Purpose: Terminal signed evidence only.
- Examples: `src/protocol/areas/authority-certificate/*`, `src/cli/certificate.ts`, `src/sdk/surface-clients/evidence-client.ts`
- Pattern: Mint after terminal evidence; verify offline with pinned trust material.

**x402 Adapter Pack:**
- Purpose: First-wedge exact buyer-side protected-spend proof profile.
- Examples: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Pattern: Install compiler plus runtime proposal helper plus gateway-held signer path; session/day/review spend windows are metadata until a ledger exists.

## Entry Points

**Package Root:**
- Location: `src/index.ts`
- Triggers: Importing `handshake-protocol-kernel`.
- Responsibilities: Expose curated stable public APIs and schemas; keep `HandshakeKernel`, stores, runtime ingress, conformance checks, and experimental gateways off the root export.

**Runtime Subpath:**
- Location: `src/runtime/index.ts`
- Triggers: Importing `handshake-protocol-kernel/runtime`.
- Responsibilities: Expose runtime ingress proposal helpers only.

**Conformance Subpath:**
- Location: `src/conformance/index.ts`
- Triggers: Importing `handshake-protocol-kernel/conformance`.
- Responsibilities: Expose protected mutation adapter and x402 posture checks.

**Experimental Subpath:**
- Location: `src/experimental.ts`
- Triggers: Importing `handshake-protocol-kernel/experimental`.
- Responsibilities: Expose reference gateway fixtures with `experimental*` names.

**Worker Runtime:**
- Location: `src/worker.ts`
- Triggers: Cloudflare Worker `fetch`.
- Responsibilities: Build the Hono app and delegate requests to `createApp()`.

**HTTP App:**
- Location: `src/http/app.ts`
- Triggers: Worker, tests, local harnesses.
- Responsibilities: Register routes, enforce admission, resolve store/kernel, call transition invokers, return typed success/error JSON.

**CLI:**
- Location: `src/cli/main.ts`
- Triggers: Bun/Node execution or import of `runCliCommand()`.
- Responsibilities: Render schemas/evidence, initialize local project posture, run local doctor checks, verify supplied certificate files, record local x402 install/probe/health classifications, and run x402 conformance classification without process startup or authority.

**MCP Source Surface:**
- Location: `src/mcp/index.ts`
- Triggers: Future MCP host integration importing source modules.
- Responsibilities: Expose catalog, proposal schema, resource parsing, x402 proposal bridge, and source-owned reference transcript builder without process startup, public package export, gateway custody, signer access, or authority.

**x402 Demo:**
- Location: `examples/x402-protected-spend/run.ts`
- Triggers: `npm run demo:aps`.
- Responsibilities: Exercise local protected-spend proof path and write redacted artifacts under `examples/x402-protected-spend/output/`.

**MCP Reference Transcript Demo:**
- Location: `examples/mcp-reference-transcript/run.ts`
- Triggers: `npm run demo:mcp-transcript`.
- Responsibilities: Generate JSON and Markdown reference transcript artifacts under `examples/mcp-reference-transcript/output/` from source-owned MCP behavior.

## Architectural Constraints

- **Threading:** JavaScript event loop only. No worker-thread architecture is used in source; Cloudflare Worker entry is `src/worker.ts` and local tests run on Bun.
- **Global state:** Production lanes avoid mutable module-level authority state. Module-level constants define registries/manifests such as `src/protocol/navigation/index.ts`, `src/protocol/foundation/reason-codes.ts`, `src/surfaces/boundary-manifest.ts`, `src/cli/command-manifest.ts`, and `src/mcp/catalog.ts`. The x402 demo uses top-level local fixture state in `examples/x402-protected-spend/run.ts`.
- **Circular imports:** No known circular dependency chain is documented. Import posture tests in `test/architecture/import-posture.test.ts` require kernel imports through area public indexes, HTTP/SDK off area internals, storage off primitive behavior modules, and protocol off storage adapters.
- **Gateway enforcement:** Protected claims require gateway-owned mutation credential plus exact greenlight check before consequence. Anything outside that installed path is evidence or advisory only.
- **Runtime ingress:** Current public runtime ingress is limited to local x402 payment and package-install dispatch boundaries (`src/runtime/ingress/index.ts`). It is observer/compiler evidence, not broad MCP/browser/shell/network interception.
- **x402 scope:** Current x402 enforcement is buyer-side `exact` per call through the local/reference wallet gateway. `src/adapters/x402-payment/conformance.ts` cuts unsupported surfaces such as `upto`, batch settlement, seller middleware, facilitator operation, and signed offers/receipts.
- **Root exports:** `src/index.ts` is curated. Reference gateways live under `src/experimental.ts`; runtime ingress lives under `src/runtime/index.ts`; conformance lives under `src/conformance/index.ts`.
- **Role clients:** `RuntimeClient` and `EvidenceClient` are implemented under `src/sdk/surface-clients/*` and exposed through `./sdk/role-clients`. Treat them as the first package-level Tier 2 activation surface, not as root exports.
- **CLI posture:** CLI readiness and install reports are local classification only. They do not prove hosted setup, provider custody, external gateway operation, or enforce aggregate spend.
- **MCP posture:** MCP modules are source-owned and tested, but there is no public `./mcp` package export and no installed MCP server process. The reference transcript is not an external-host transcript.
- **Evidence readback:** Redacted projections are the product read surface. Raw record reads are diagnostic and internal-only records are blocked; projection assembly currently scans local record sets and is not a scale-proof query architecture.
- **Raw reads:** Generic raw HTTP reads must respect object registry `rawReadPosture`; internal-only records such as stream events, idempotency ledger entries, bypass probes, and tool-call drafts are hidden by `src/http/handlers/internal-record-read.ts`.
- **Scratch docs:** `.planning/` may contain mapper and planning artifacts but is not repo truth.

## Anti-Patterns

### Runtime Or Surface Authority Leakage

**What happens:** SDK, CLI, or MCP code starts evaluating policy, minting greenlights, performing gateway checks, holding signer material, reading raw records, or exporting receipts.

**Why it's wrong:** That collapses proposal/evidence ergonomics into authority and lets model/operator-facing surfaces bypass the gateway boundary.

**Do this instead:** Add proposal/evidence behavior behind `src/sdk/surface-clients/*`, `src/cli/*`, or `src/mcp/*`, update `src/surfaces/boundary-manifest.ts`, and extend posture tests in `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/cli-command-posture.test.ts`, or `test/architecture/mcp-surface-posture.test.ts`.

### Adapter Mutation Before Verified Gateway Check

**What happens:** A gateway fixture or future adapter calls a mutation surface, signer, package manager, repo write, deploy API, or cloud API before deriving `VerifiedGatewayCheck`.

**Why it's wrong:** The mutation escaped the exact contract and one-use greenlight boundary.

**Do this instead:** Follow `src/adapters/x402-payment/wallet-gateway.ts`: call protocol `gatewayCheck()`, derive `VerifiedGatewayCheck` with `verifiedGatewayCheckFromResult()` (`src/adapters/x402-payment/wallet-gateway.ts:164`), and only then call the consequence holder (`src/adapters/x402-payment/wallet-gateway.ts:172`).

### Raw Records As Product Evidence

**What happens:** A product surface exposes raw protocol records or internal-only objects to make review/search/debugging easier.

**Why it's wrong:** Raw records include internal reconstruction and control state that can confuse evidence posture, leak internal details, or turn store shape into public API.

**Do this instead:** Add a redacted projection under `src/protocol/evidence-projections/*`, route it through `src/http/handlers/evidence-read.ts`, and add SDK/MCP reads through `src/sdk/surface-clients/evidence-client.ts` or `src/mcp/resources.ts`.

### All-Role SDK As Model Boundary

**What happens:** Model-facing code uses `HandshakeClient` with a broad `transitionToken` fallback because it is already root-exported and convenient.

**Why it's wrong:** This reintroduces ambient role authority at the surface that is supposed to be constrained to proposal or evidence.

**Do this instead:** Use `RuntimeClient` for proposal writes and `EvidenceClient` for readback under `src/sdk/surface-clients/*`; make any public export expansion explicit in `package.json`, `src/index.ts`, `test/architecture/root-exports.test.ts`, and `test/sdk/role-clients.test.ts`.

### CLI Probe As Provider Certification

**What happens:** `install x402-payment`, `probes x402-payment`, `install health`, or `doctor` output is treated as hosted gateway readiness or provider-grade certification.

**Why it's wrong:** The CLI records local posture and pre-contract readiness only; it cannot prove external gateway custody, signer custody, or future mutation enforcement.

**Do this instead:** Keep CLI outputs in the non-authority envelope from `src/cli/output.ts`; only gateway-side code such as `src/adapters/x402-payment/wallet-gateway.ts` can prove a checked mutation attempt.

### MCP Transcript As Hosted MCP Operation

**What happens:** The source-owned reference transcript is marketed or wired as if it proves an installed MCP server, external host custody, or production model integration.

**Why it's wrong:** `src/mcp/reference-transcript.ts` exercises source modules in-process and records non-authority posture; it does not prove process isolation, host transport, or deployment custody.

**Do this instead:** Treat `examples/mcp-reference-transcript/*` as a Tier 2 audit fixture. Add a separate host/process custody lane and package export only after `src/mcp/LANE.md`, `package.json`, `STRUCTURE.md`, and posture tests are updated.

### Adapter Rail Defining Protocol Meaning

**What happens:** x402/package-install specific nouns or provider behavior move into protocol primitives as if an adapter family defines the kernel.

**Why it's wrong:** The protocol primitive is exact contract, policy, one-use greenlight, gateway check, receipt/refusal/proof gap. Adapter rails are proof profiles.

**Do this instead:** Keep adapter-specific setup and validation in `src/adapters/x402-payment/*`, generic install records in `src/install/*`, and provider-neutral primitives in `src/protocol/areas/*`.

## Error Handling

**Strategy:** Refusals, proof gaps, replay refusals, isolation, and typed transition errors are first-class protocol outcomes.

**Patterns:**
- Use `HandshakeProtocolError` for transition failures with code, HTTP status, retryability/commit metadata (`src/protocol/foundation/errors.ts`).
- Map thrown errors to `TransitionErrorEnvelope` in HTTP, including retryability, commit state, request identity, proof ref, and refusal ref (`src/http/errors/transition-error-envelope.ts`).
- Record durable refusals with `authorityCreated: false` and `mutationAttempted: false` through `buildRefusal()` (`src/protocol/areas/refusal/records.ts`).
- Record proof gaps for missing, ambiguous, unavailable, expired, or contradictory evidence instead of reporting success (`src/protocol/areas/proof-gap/*`).
- Treat stream conflicts and authority races as explicit commit outcomes in `ProtocolStore` and `ProtocolRecorder` (`src/protocol/store/port.ts`, `src/protocol/events/records.ts`).
- Refuse replayed greenlights in gateway check commit handling (`src/protocol/areas/gateway-gate/transitions.ts`).

## Cross-Cutting Concerns

**Logging:** There is no application logging framework. Durable protocol records and stream events are the reconstruction mechanism (`src/protocol/events/*`, `src/protocol/store/port.ts`).

**Validation:** Zod schemas validate protocol objects, transition inputs, HTTP requests, CLI inputs, MCP inputs, and adapter parameters (`src/protocol/public/schemas.ts`, `src/protocol/public/inputs.ts`, `src/mcp/x402-proposal.ts`, `src/cli/aps-report.ts`, `src/adapters/x402-payment/wallet-gateway.ts`).

**Authentication:** HTTP transition admission uses role-scoped bearer tokens for `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody` or a hosted caller verifier seam (`src/http/admission/caller-auth.ts`, `src/http/admission/hosted-caller-identity.ts`).

**Authorization:** Authorization is not caller identity. Authority comes from exact contract, policy decision, one-use greenlight, current isolation/posture/credential/idempotency checks, and gateway check before mutation (`src/protocol/areas/policy-greenlight/*`, `src/protocol/areas/gateway-gate/*`).

**Canonicalization:** Contract, params, graph, credential, and evidence digests use deterministic canonical JSON helpers (`src/protocol/foundation/canonical.ts`).

**Redaction:** Evidence projections and surface outputs must exclude raw credential material, mutation commands, and raw internal records (`src/protocol/evidence-projections/*`, `src/surfaces/boundary-manifest.ts`, `src/mcp/resources.ts`, `src/cli/output.ts`).

**Package Surface:** `package.json` keeps the package private and exports root, runtime, conformance, role-scoped SDK clients, experimental, and package metadata subpaths. CLI and MCP remain source surfaces, not public package subpaths.

---

*Architecture analysis: 2026-05-23*
