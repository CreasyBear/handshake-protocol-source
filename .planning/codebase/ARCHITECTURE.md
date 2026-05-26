<!-- refreshed: 2026-05-26 -->
# Architecture

**Analysis Date:** 2026-05-26

## System Overview

```text
External callers, hosts, package consumers, and local tools
  |
  |-- HTTP/Worker transport: `src/http/app.ts`, `src/worker.ts`
  |-- SDK transport: `src/sdk/client.ts`, `src/sdk/surface-clients/*`
  |-- MCP proposal/evidence: `src/mcp/*`, `src/mcp/stdio/*`
  |-- CLI readback/operator commands: `src/cli/*`, `bin/handshake`
  |-- Published subpaths: `src/adapter-sdk`, `src/hosted-admission`,
  |   `src/x402-protected-tool`, `src/surfaces/service-workflow-admission`
  |
  v
Product/readback and admission surfaces
  `src/surfaces/boundary-manifest.ts`
  `src/surfaces/service-workflow-admission/index.ts`
  `src/http/admission/*`
  |
  v
Protocol authority spine
  `src/protocol/kernel.ts`
  `src/protocol/areas/*`
  `src/protocol/foundation/*`
  `src/protocol/events/*`
  |
  |-- Evidence-only protocol area:
  |   `src/protocol/areas/negotiation/*`
  |
  v
Append-only record/event persistence
  `src/protocol/store/port.ts`
  `src/storage/d1/index.ts`
  `src/storage/memory/index.ts`
  `migrations/0001_protocol_kernel.sql`
  |
  v
Gateway adapters and protected surfaces
  `src/adapters/*`
  `src/protocol/evidence-projections/*`
  `src/http/handlers/evidence-read.ts`
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Package root | Curated public exports for HTTP app creation, protocol schemas/inputs, SDK client, protocol navigation, gateway verification helpers, and certificate verification. | `src/index.ts` |
| Worker entrypoint | Creates the Hono app and exposes the Cloudflare Worker `fetch` handler. | `src/worker.ts` |
| HTTP app | Registers transition routes, evidence routes, hosted readiness, verifier endpoints, raw internal read endpoint, body limits, security headers, error envelopes, and transition request identity headers. | `src/http/app.ts` |
| HTTP route registry | Declares each `/v0.2/*` transition path, custody role, scope resolver, request schema, response schema, and non-authority summary. | `src/http/routes/transition-route-registry.ts` |
| HTTP transition invokers | Maps route ids to `HandshakeKernel` methods and the composite runtime-ingress proposal bridge. | `src/http/routes/transition-invokers.ts` |
| Hosted admission | Performs provider-neutral caller admission, hosted identity freshness checks, scoped route checks, read entitlement checks, and redacted caller evidence generation. | `src/http/admission/*`, `src/hosted-admission/*` |
| Kernel facade | Owns the authority transition surface and delegates to protocol area transition modules. | `src/protocol/kernel.ts` |
| Protocol areas | Own primitive schemas, inputs, guards, transitions, and local indexes by authority area. | `src/protocol/areas/*` |
| Negotiation evidence area | Records A2A-style negotiation sessions, offers, decisions, linked agreements, obligation bindings, and status transitions as imported/local evidence only. It has schemas and input aliases, no transitions, no root export, and no product/runtime imports. | `src/protocol/areas/negotiation/*` |
| Object registry | Discriminates every durable protocol object type, including the negotiation evidence object types added in commit `4946237`. | `src/protocol/areas/object-registry/schemas.ts` |
| Event schemas | Defines append-only event types, including `negotiation_*_recorded` and `agreement_*_recorded` evidence events. | `src/protocol/events/schemas.ts` |
| Protocol recorder | Builds canonical records, commits records with event chains, retries stream conflicts, and writes transition request context evidence. | `src/protocol/events/records.ts` |
| Store port | Defines atomic protocol persistence, stream reads, current-index reads, one-use greenlight consumption, and gateway-check commit contracts. | `src/protocol/store/port.ts` |
| D1 store | Durable reference `ProtocolStore` implementation using SQL statements and batched commits. | `src/storage/d1/index.ts` |
| Memory store | In-memory `ProtocolStore` fixture and invariant oracle. | `src/storage/memory/index.ts` |
| Runtime ingress | Converts generated dispatch blocks into runtime evidence, generated graph evidence, tool-call drafts, intent compilations, and action-contract proposals without policy or gateway authority. | `src/runtime/ingress/index.ts` |
| Runtime family registry | Names supported runtime dispatch families: package install, x402 payment, and auth.md protected API call. | `src/runtime/ingress/registry.ts` |
| Reference gateways | Demonstrate mutation only after `VerifiedGatewayCheck`, then reconcile downstream evidence or proof gaps. | `src/adapters/*/gateway.ts` |
| x402 wallet gateway | Official x402 exact buyer-side signer path; signer/payment material stays inside the wallet gateway after gate verification. | `src/adapters/x402-payment/wallet-gateway.ts` |
| SDK clients | Invoke public HTTP transition/evidence routes and role-scoped activation clients; clients transport custody, not product authority. | `src/sdk/client.ts`, `src/sdk/surface-clients/*` |
| MCP surface | Model-facing proposal/evidence catalog for `handshake.actions.x402_payment.propose` plus read-only resources. | `src/mcp/*` |
| CLI surface | Local command manifest and JSON evidence/operator commands without gateway, policy, signer, receipt export, or mutation authority. | `src/cli/*` |
| Adapter SDK | Definition-only protected-action adapter pack and install-proposal shape review surface. | `src/adapter-sdk/index.ts` |
| x402 protected tool | Public protected-tool facade/profile/readiness subpath for first normal-agent-tool x402 proposal flow; proposal and profile only. | `src/x402-protected-tool/index.ts` |
| Surfaces manifest | Source-owned surface ids, allowed route families, forbidden imports, forbidden credentials, and required non-authority flags. | `src/surfaces/boundary-manifest.ts` |
| Service workflow projection | Admission, handle, principal-agent link, and context refs as non-authority readback/projection contracts. | `src/surfaces/service-workflow-admission/index.ts` |
| Conformance | Narrow invariant probes for protected mutation adapters and x402 posture checks. | `src/conformance/index.ts` |

## Pattern Overview

**Overall:** Layered protocol authority kernel with port/adapters persistence and constrained proposal/readback surfaces.

**Key Characteristics:**
- Protocol meaning lives in `src/protocol/areas/*`; transports and product surfaces call the kernel or public schemas rather than owning primitive semantics.
- Authority-bearing transitions flow through `HandshakeKernel` in `src/protocol/kernel.ts:100` and `ProtocolRecorder` in `src/protocol/events/records.ts:77`.
- Runtime, MCP, CLI, SDK, hosted admission, adapter SDK, service workflow, and protected-tool surfaces are proposal/readback/setup surfaces unless they explicitly route to a protocol transition.
- Gateway-side mutation adapters must require `VerifiedGatewayCheck` before protected consequence in files such as `src/adapters/x402-payment/wallet-gateway.ts` and `src/adapters/package-install/gateway.ts`.
- The A2A negotiation area from commit `4946237` is evidence-only: `src/protocol/areas/negotiation/schemas.ts` defines records, while `test/architecture/negotiation-no-authority-surface.test.ts` guards against transitions, root export, control-area imports, and downstream surface imports.

## Layers

**Protocol Authority Kernel:**
- Purpose: Own exact contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, recovery, review binding, generated-execution evidence boundaries, and canonical transition invariants.
- Location: `src/protocol/`
- Contains: `src/protocol/kernel.ts`, `src/protocol/areas/*`, `src/protocol/foundation/*`, `src/protocol/events/*`, `src/protocol/context/*`, `src/protocol/navigation/*`, `src/protocol/public/*`, `src/protocol/store/*`.
- Depends on: Zod schemas, deterministic canonicalization, `ProtocolStore` port, and protocol-local modules.
- Used by: `src/http/*`, `src/sdk/*`, `src/runtime/*`, `src/mcp/*`, `src/adapters/*`, and tests.

**Evidence-Only Negotiation Area:**
- Purpose: Record imported A2A/ACP/ANP/AP2/MCP/runtime-handoff negotiation context and local agreement evidence without creating protected-action authority.
- Location: `src/protocol/areas/negotiation/`
- Contains: `NegotiationSessionSchema`, `NegotiationOfferSchema`, `NegotiationDecisionSchema`, `LinkedAgreementSchema`, `AgreementObligationBindingSchema`, and `AgreementStatusTransitionSchema` in `src/protocol/areas/negotiation/schemas.ts`.
- Depends on: `src/protocol/foundation/schema-core.ts` and `zod`.
- Used by: `src/protocol/areas/object-registry/schemas.ts` and protocol tests only.
- Constraint: Do not add `transitions.ts`, package-root exports, SDK/HTTP/MCP/CLI imports, policy-greenlight imports, gateway-gate imports, receipt-export imports, or authority-certificate imports for this phase.

**Runtime Proposal Evidence:**
- Purpose: Convert observed generated execution into runtime records, graph records, draft tool-call state, intent compilations, action-contract proposals, or refusals.
- Location: `src/runtime/`
- Contains: `src/runtime/ingress/index.ts`, `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/registry.ts`, `src/runtime/package-install/action-proposal.ts`, `src/runtime/codemode-multi-action/*`.
- Depends on: Protocol public/area types and adapter-family proposal builders.
- Used by: HTTP runtime ingress route, SDK `RuntimeClient`, MCP x402 proposal bridge, examples, and tests.

**HTTP Transport And Admission:**
- Purpose: Bind transition routes to custody roles, validate request bodies, build request-context evidence, apply hosted or token admission, and invoke kernel methods.
- Location: `src/http/`
- Contains: `src/http/app.ts`, `src/http/routes/*`, `src/http/admission/*`, `src/http/handlers/*`, `src/http/errors/*`, `src/http/openapi/*`, `src/http/store/*`.
- Depends on: Protocol public schemas, `HandshakeKernel`, storage resolution, Hono, and admission helpers.
- Used by: `src/worker.ts`, SDK clients, integration tests, and Worker runtime.

**Storage Port And Implementations:**
- Purpose: Persist canonical protocol records, event streams, current indexes, idempotency state, isolation state, protected-path posture, operation claims, receipt indexes, and greenlight consumption.
- Location: `src/protocol/store/`, `src/storage/`
- Contains: `src/protocol/store/port.ts`, `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `src/storage/memory/index.ts`, `src/storage/kv/index.ts`.
- Depends on: Protocol object metadata and event schemas.
- Used by: `ProtocolRecorder`, `HandshakeKernel`, HTTP store resolution, D1/HTTP tests, and invariant tests.

**Gateway Adapter Proof Lanes:**
- Purpose: Hold reference mutation behavior and upstream profile evidence; mutation-capable adapters run only after verified gateway checks.
- Location: `src/adapters/`
- Contains: `src/adapters/x402-payment/*`, `src/adapters/package-install/*`, `src/adapters/repo-write/*`, `src/adapters/preview-deploy/*`, `src/adapters/auth-md/*`, `src/adapters/protected-path-probes/*`.
- Depends on: Gateway verification helpers and protocol public schemas.
- Used by: `src/experimental.ts`, `src/x402-protected-tool/*`, conformance tests, adapter tests, and demos.

**Product/Readback Surfaces:**
- Purpose: Expose proposal, setup, profile, readback, readiness, support, and local verification surfaces without creating protocol authority.
- Location: `src/surfaces/`, `src/cli/`, `src/mcp/`, `src/sdk/`, `src/adapter-sdk/`, `src/hosted-admission/`, `src/x402-protected-tool/`
- Contains: Surface boundary manifest, CLI command manifest, MCP catalog/resources, SDK role clients, hosted admission helper exports, adapter authoring definitions, service workflow projection contracts, protected-tool profiles.
- Depends on: Public schemas/inputs, transport helpers, surface manifests, and narrow adapter profile helpers.
- Used by: package exports in `package.json`, package bins in `bin/`, product tests, architecture tests, and examples.

## Data Flow

### Primary Protected Action Path

1. Runtime, MCP, SDK, or HTTP submits generated execution/proposal evidence (`src/runtime/ingress/index.ts:176`, `src/mcp/x402-proposal.ts:146`, `src/sdk/surface-clients/runtime-client.ts:20`, `src/http/app.ts:37`).
2. Runtime ingress records runtime execution, generated graph evidence, and finalized tool-call drafts (`src/runtime/ingress/index.ts:190`, `src/runtime/ingress/index.ts:261`, `src/runtime/ingress/index.ts:655`).
3. Intent compilation reduces proposed work to a `CandidateAction` or refusal (`src/protocol/areas/intent-compilation/transitions.ts:43`).
4. Action contract proposal canonicalizes one contractable candidate and asserts catalog/envelope/gateway/credential/delegated-authority bindings (`src/protocol/areas/action-contract/transitions.ts:53`).
5. Policy evaluation computes exact policy input, checks isolation, sequence dependencies, protected-path posture, idempotency, gateway credential refs, and delegated authority refs (`src/protocol/areas/policy-greenlight/transitions.ts:126`).
6. Gateway check verifies the exact greenlight, observed parameters, policy drift, idempotency, isolation, protected-path posture, delegated authority refs, and credential refs before mutation (`src/protocol/areas/gateway-gate/transitions.ts:87`).
7. Adapter performs consequence only after `verifiedGatewayCheckFromResult` returns a verified gate, then records credential resolution, reconciliation, receipt, refusal, or proof gap (`src/adapters/x402-payment/wallet-gateway.ts:177`, `src/adapters/package-install/gateway.ts:95`).
8. Records and stream events commit through `ProtocolRecorder` and `ProtocolStore` (`src/protocol/events/records.ts:77`, `src/protocol/store/port.ts:155`).

### A2A Negotiation Evidence Path

1. External negotiation context is represented as digest-bound imported evidence refs, party proof posture, offers, decisions, linked agreements, obligation bindings, and status transitions (`src/protocol/areas/negotiation/schemas.ts:97`, `src/protocol/areas/negotiation/schemas.ts:113`, `src/protocol/areas/negotiation/schemas.ts:164`).
2. Negotiation object types are admitted to the protocol object registry (`src/protocol/areas/object-registry/schemas.ts:64`, `src/protocol/areas/object-registry/schemas.ts:119`).
3. Negotiation events are represented as event vocabulary for reconstruction (`src/protocol/events/schemas.ts:25`).
4. Architecture tests keep this area out of authority, root package exports, and downstream product/runtime surfaces (`test/architecture/negotiation-no-authority-surface.test.ts:8`).
5. A linked agreement may reference local `candidate_action`, `intent_compilation`, `generated_execution_graph`, or `action_contract` evidence, but it cannot point at greenlights, gateway checks, receipts, certificates, settlement, payment, signers, or reusable authority (`src/protocol/areas/negotiation/schemas.ts:64`, `src/protocol/areas/negotiation/schemas.ts:164`).

### HTTP Transition Path

1. `createApp()` installs transition routes from `transitionRouteDefinitions` (`src/http/app.ts:37`, `src/http/app.ts:54`).
2. `handleTransition()` authorizes caller custody, builds transition request context, parses body against the route schema, resolves hosted scope when configured, and calls the route invoker (`src/http/app.ts:122`).
3. `transitionInvokers` invokes a kernel method or composite runtime-ingress proposal (`src/http/routes/transition-invokers.ts:10`, `src/http/routes/transition-invokers.ts:36`).
4. `kernelFor()` constructs a `HandshakeKernel` over D1 or an explicit fallback store (`src/http/store/resolution.ts:10`).

### Product/Readback Surface Path

1. Surface manifests define which surfaces may write/read which route families and which imports/credential shapes are forbidden (`src/surfaces/boundary-manifest.ts:1`, `src/surfaces/boundary-manifest.ts:202`, `src/surfaces/boundary-manifest.ts:610`).
2. Service workflow contracts expose `Passport`, `ServiceWorkflowAdmission`, `ServiceWorkflowHandle`, `PrincipalAgentLink`, and context refs as projection/readback evidence only (`src/surfaces/service-workflow-admission/index.ts:24`, `src/surfaces/service-workflow-admission/index.ts:58`, `src/surfaces/service-workflow-admission/index.ts:209`).
3. CLI, MCP, SDK, adapter SDK, hosted admission, and x402 protected-tool subpaths must keep non-authority flags explicit and route fresh consequential work back into the protocol authority path (`src/cli/command-manifest.ts`, `src/mcp/x402-proposal.ts`, `src/sdk/surface-clients/*`, `src/adapter-sdk/index.ts`, `src/hosted-admission/index.ts`, `src/x402-protected-tool/index.ts`).

**State Management:**
- Durable state is canonical `ProtocolRecord` plus `ContractStreamEvent` evidence, not in-memory service objects (`src/protocol/areas/object-registry/schemas.ts`, `src/protocol/events/schemas.ts`).
- D1 is the durable reference implementation (`src/storage/d1/index.ts:23`); memory is a fixture/oracle (`src/storage/memory/index.ts:29`).
- Current-index state for greenlight issuance, idempotency, isolation, protected path posture, operation claims, and receipt lookup is represented through `ProtocolStore` methods (`src/protocol/store/port.ts:169`, `src/protocol/store/port.ts:177`, `src/protocol/store/port.ts:179`).

## Key Abstractions

**`HandshakeKernel`:**
- Purpose: Transition facade over protocol areas.
- Examples: `src/protocol/kernel.ts:100`, `src/protocol/kernel.ts:156`, `src/protocol/kernel.ts:192`, `src/protocol/kernel.ts:196`
- Pattern: Thin method facade; semantic work stays in area modules.

**`ProtocolStore`:**
- Purpose: Persistence port for records, event streams, current indexes, idempotency, isolation, and gateway-check atomic commits.
- Examples: `src/protocol/store/port.ts:155`, `src/storage/d1/index.ts:23`, `src/storage/memory/index.ts:29`
- Pattern: Port/adapters; protocol transitions depend on the port, not D1/memory directly.

**`ProtocolRecord` And `ContractStreamEvent`:**
- Purpose: Canonical durable object and append-only reconstruction event.
- Examples: `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/events/schemas.ts`
- Pattern: Discriminated Zod object registry plus event vocabulary.

**`CandidateAction` -> `ActionContract`:**
- Purpose: Separate compiler output from exact proposed commitment.
- Examples: `src/protocol/areas/intent-compilation/transitions.ts:43`, `src/protocol/areas/action-contract/transitions.ts:53`
- Pattern: Deterministic candidate digest and contract digest binding.

**`PolicyDecision` / `Greenlight` / `GatewayCheck`:**
- Purpose: Separate exact policy outcome from one-use gateway-bound pre-mutation enforcement.
- Examples: `src/protocol/areas/policy-greenlight/transitions.ts:126`, `src/protocol/areas/gateway-gate/transitions.ts:87`
- Pattern: Policy may issue one-use authority; gateway consumes and verifies before consequence.

**`AuthorityCertificate`:**
- Purpose: Terminal evidence verification, not permission.
- Examples: `src/protocol/areas/authority-certificate/*`, `src/index.ts:28`
- Pattern: Certificate signs existing terminal evidence and is verified against explicit trust material.

**`SurfaceBoundary`:**
- Purpose: Source-owned manifest for product/readback surface claims, allowed route families, forbidden imports, and required non-authority flags.
- Examples: `src/surfaces/boundary-manifest.ts:1`, `test/architecture/surface-boundary-posture.test.ts`
- Pattern: Architecture tests enforce boundary posture.

**`NegotiationSession` / `LinkedAgreement`:**
- Purpose: A2A-style negotiation and agreement evidence records that can support reconstruction without replacing local protected-action clearance.
- Examples: `src/protocol/areas/negotiation/schemas.ts:97`, `src/protocol/areas/negotiation/schemas.ts:151`
- Pattern: Strict evidence-only schema area; no transition module and no root export.

## Entry Points

**HTTP Worker:**
- Location: `src/worker.ts`
- Triggers: Cloudflare Worker `fetch`
- Responsibilities: Construct default Hono app and delegate requests.

**HTTP App Factory:**
- Location: `src/http/app.ts`
- Triggers: Worker runtime, tests, embedded server setup.
- Responsibilities: Register transition/evidence routes, enforce admission, parse requests, and invoke kernel transitions.

**Package Root:**
- Location: `src/index.ts`
- Triggers: `import "handshake-protocol-kernel"`
- Responsibilities: Curate stable root exports; keep hosted admission, adapter SDK, MCP, CLI, x402 protected tool, and service workflow helpers on explicit subpaths.

**CLI:**
- Location: `src/cli/main.ts`, `bin/handshake`
- Triggers: `handshake ...`
- Responsibilities: Local setup/readiness/evidence/conformance/certificate commands; no policy, gateway, signer, receipt export, or mutation authority.

**MCP Stdio Server:**
- Location: `src/mcp/stdio/server.ts`, `bin/handshake-mcp`, `server.json`
- Triggers: MCP host process.
- Responsibilities: Register proposal tool and read-only evidence resources; no policy, greenlight, gateway check, signer, mutation, receipt export, or certificate minting.

**SDK Clients:**
- Location: `src/sdk/client.ts`, `src/sdk/surface-clients/*`
- Triggers: Package consumers.
- Responsibilities: Transport transition/evidence requests with role-scoped credentials and typed errors.

**Runtime Ingress:**
- Location: `src/runtime/ingress/index.ts`
- Triggers: HTTP/SDK runtime ingress route or direct runtime helper call.
- Responsibilities: Convert observed dispatch blocks into proposal evidence and action contracts or refusals.

**Reference Adapter Gateways:**
- Location: `src/adapters/*/gateway.ts`
- Triggers: Gateway custody process or tests.
- Responsibilities: Verify one-use greenlight through kernel gateway check before calling protected mutation surfaces.

## Architectural Constraints

- **Threading:** Node/Bun/Worker event-loop model; no worker-thread orchestration is present in `src/`.
- **Global state:** `src/storage/memory/index.ts` stores fixture state in instance-local maps; `src/mcp/stdio/server.ts` uses reference fixture clients by default; `src/http/app.ts` creates an optional fallback in-memory store only when injected/configured.
- **Circular imports:** Architecture tests in `test/architecture/import-posture.test.ts` guard import posture; use first-level lane manifests such as `src/protocol/LANE.md`, `src/http/LANE.md`, and `src/runtime/LANE.md` when changing imports.
- **Storage atomicity:** Authority-bearing transitions must commit through `ProtocolStore.commitProtocolRecords()` or `ProtocolStore.commitGatewayCheck()` (`src/protocol/store/port.ts:178`, `src/protocol/store/port.ts:179`).
- **Surface/root export curation:** Public subpaths are declared in `package.json`; root export remains curated in `src/index.ts`.
- **Negotiation boundary:** `src/protocol/areas/negotiation/` is evidence-only; do not add policy/gateway/receipt/certificate authority or downstream surface imports.
- **Product surface boundary:** `src/surfaces/service-workflow-admission/index.ts` and `src/hosted-admission/*` are readback/evidence helpers; they must not become policy, gateway, payment, receipt, certificate, or mutation surfaces.

## Anti-Patterns

### Product Surface As Authority

**What happens:** A CLI, MCP, SDK evidence client, service workflow handle, hosted admission record, adapter definition, or x402 protected-tool profile is treated as permission.
**Why it's wrong:** These surfaces expose proposal/readback/setup evidence, not protocol authority.
**Do this instead:** Route consequential work through fresh action-contract, policy, and gateway transitions in `src/protocol/kernel.ts`.

### Negotiation Evidence As Clearance

**What happens:** A `LinkedAgreement` or A2A external ref is treated as a greenlight, payment approval, signer access, receipt, or certificate.
**Why it's wrong:** `src/protocol/areas/negotiation/schemas.ts` explicitly marks external refs as imported evidence and blocks authority-shaped obligation refs.
**Do this instead:** Use negotiation records only as evidence refs for a later local protected-action candidate.

### Runtime Evidence As Gateway Enforcement

**What happens:** Runtime ingress, generated execution graphs, tool-call drafts, or MCP proposal success are treated as enough to mutate.
**Why it's wrong:** Runtime evidence can propose; it cannot evaluate policy, consume greenlights, or own mutation credentials.
**Do this instead:** Use `evaluatePolicy()` and `gatewayCheck()` via `src/protocol/kernel.ts` and only mutate through a gateway adapter after `VerifiedGatewayCheck`.

### Reusable Greenlight

**What happens:** One greenlight is replayed across multiple gateway attempts or divergent parameters.
**Why it's wrong:** This is ambient authority; `ProtocolStore.consumeGreenlight()` and gateway replay refusal exist to prevent it.
**Do this instead:** Create a new exact action contract for new parameters, retries, or follow-up recovery.

### Hidden Surface Exception

**What happens:** A product/readback surface imports protocol internals, storage, gateway fixtures, signer code, or raw records to make a demo easier.
**Why it's wrong:** It bypasses the declared surface manifest and makes the UI/API advisory claims look enforceable.
**Do this instead:** Update `src/surfaces/boundary-manifest.ts` first and add architecture tests before exposing any new route family or import root.

## Error Handling

**Strategy:** Protocol failures become typed `HandshakeProtocolError`, structured HTTP transition error envelopes, durable refusals, replay refusals, proof gaps, or explicit conflict outcomes.

**Patterns:**
- Validate all boundary inputs through Zod schemas in files such as `src/protocol/public/inputs.ts`, `src/runtime/ingress/schemas.ts`, and `src/mcp/x402-proposal.ts`.
- Throw `HandshakeProtocolError` for protocol violations and map it to HTTP error envelopes in `src/http/errors/transition-error-envelope.ts`.
- Record refusals and proof gaps as first-class protocol objects rather than smoothing uncertainty into success.
- Return surface-level non-authority outcomes from MCP and CLI for stale metadata, not-ready posture, invalid input, or refused proposals.

## Cross-Cutting Concerns

**Logging:** No shared logging framework is present. Evidence and diagnostics are represented as protocol records, stream events, reason codes, redacted projections, and CLI/MCP structured outputs.

**Validation:** Zod schemas are the primary boundary validators across `src/protocol/areas/*/schemas.ts`, `src/protocol/public/*`, `src/runtime/ingress/schemas.ts`, `src/mcp/x402-proposal.ts`, and `src/surfaces/service-workflow-admission/index.ts`.

**Authentication:** HTTP uses role-scoped bearer custody in `src/http/admission/caller-auth.ts`; hosted mode uses provider-neutral verifier adapters and redacted caller evidence in `src/http/admission/*` and `src/hosted-admission/*`.

**Redaction:** Surface outputs must keep credential/payment material out of records and projections. Guardrails live in `src/surfaces/boundary-manifest.ts`, `src/mcp/resources.ts`, `src/cli/command-manifest.ts`, and adapter custody schemas.

**Canonicalization:** Authority-bearing digests use canonical digest helpers in `src/protocol/foundation/canonical.ts`; candidate params, contract bindings, policy inputs, gateway checks, and negotiation evidence must remain digest-bound.

---

*Architecture analysis: 2026-05-26*
