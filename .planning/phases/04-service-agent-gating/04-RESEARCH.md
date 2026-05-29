# Phase 04: Service agent gating — Research

**Researched:** 2026-05-28  
**Domain:** Agent-first service operator UX — dual enforcement (hosted/API admission + gateway-checked mutation) without protocol kernel semantic changes  
**Confidence:** HIGH for codebase anchors and locked decisions; MEDIUM for exact Tier-1 ID list and RFC 9457 wire shape (needs planner confirmation on backward compatibility)

## Summary

Phase 04 makes Handshake legible to **service operators** who must gate **agents** on consequential endpoints while keeping the protocol kernel frozen. The product chain is already modeled in `service-workflow-admission` (Passport → Admission → Handle → fresh Clearance per event) and enforced in the kernel spine (compile → contract → policy → gateway → receipt). What is missing is **operator-grade packaging**: dual-lane vocabulary, a **Tier-1 integrator transition surface**, a **public failure taxonomy** that separates auth from execution-control, **custody matrices** (service vs host), **HTTP-profile generalization** from auth.md, and **structural bypass proof** (architecture tests + conformance-gated service scaffold) — not prose claiming “middleware = protection.”

**Clerk-for-agents analogy (user-locked framing):** In Next.js, Clerk middleware can identify the session and attach identity to the request, but **route handlers** must still enforce authorization before a consequential write. Handshake is the same shape for agents: **hosted/API admission** (`src/http/admission/index.ts`) answers “who may invoke kernel transitions / read evidence,” while **adapter-wrapped gateway checks** (`src/adapters/*/gateway.ts`, `src/conformance/`) answer “does this exact greenlight authorize this exact mutation.” Admission alone is **advisory**; only gateway-checked adapter paths are Handshake.

**Primary recommendation:** Extend product surfaces and HTTP error taxonomy in place; tag `protocol/navigation` with Tier-1 integrator metadata; generalize auth.md’s HTTP parameter profile into a shared adapter contract; add architecture + conformance tests that fail if a service registers consequential routes without adapter binding — **one runnable spine remains x402** (`src/cli/quickstart/x402.ts`, `docs/internal/host-golden-paths-and-trace-guidance.md`).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Caller identity before kernel HTTP | API / Backend (`src/http/admission/`) | Hosted verifier adapters (`src/hosted-admission/`) | Admission runs before transition handlers; no mutation authority |
| Catalog triplet + atomic install | API / Backend (control-plane transitions) | SDK `InstallClient` (`src/sdk/surface-clients/install-client.ts`) | Service operator registers ToolCapability, ActionType, GatewayRegistryEntry + envelope atomically |
| Intent → exact contract | Protocol kernel (`compileIntent`, `proposeActionContract`) | Runtime ingress / MCP proposal surfaces | Compilation is evidence; contract is the commitment shape |
| Policy greenlight / refusal | Protocol kernel (`evaluatePolicy`) | HTTP POST + `PolicyClient` | One-use greenlight is kernel-owned |
| Mutation enforcement | Adapter / gateway (`run*Gateway` + `VerifiedGatewayCheck`) | External PEP in front (optional glue only) | Enforcement is observed-parameter re-check at mutation boundary |
| Agent workflow correlation | Product projection (`src/surfaces/service-workflow-admission/`) | MCP metadata on x402 proposal | Non-authority handles; fresh contract per protected action |
| Host binding attestation | Host operator CLI (`src/cli/host/doctor.ts`, MCP doctor) | `host-trusted-binding` classifier | Digests attest host posture; not service gateway ownership |
| Public HTTP errors | HTTP transport (`transition-error-envelope.ts`) | `reason-code-remediation` | Service consumers need auth vs clearance separation |
| Bypass proof | Test + conformance (`test/architecture/*`, `src/conformance/`) | Proof packets (deferred per-service launch) | Structural gates, not documentation-only |

## User Constraints

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-00 — Dual enforcement:** Service operators need **admission** (caller identity / scope before kernel transitions) **and** **gateway check** (before mutation). Ingress-only posture is **advisory**, not Handshake.
- **D-00b — Wedge vs platform:** `x402_payment.exact` remains the **proof wedge**; phase 04 optimizes **any-service agent gating**, not payment-only product.
- **D-01 — Standing bounds:** `OperatingEnvelope` = class-level attempt bounds for principal+agent (not permission, not vague intent).
- **D-02 — Delegated mandate:** `DelegatedAuthorityRef` = episodic principal→agent mandate evidence for an instance (e.g. delegated spend); status transitions + isolation; **not** a greenlight or bearer pass.
- **D-03 — Compile bridge:** `IntentCompilationRecord` = vague intent/runtime evidence → one `CandidateAction` (uncertainty recorded, no authority).
- **D-04 — Work order:** `ActionContract` = exact proposed commitment; only this shape enters policy and gateway binding.
- **D-05 — Product vocabulary:** Teach **Standing Bounds → Delegated Mandate (when required) → Compile → Work Order → Clearance → Outcome** in agent-facing docs; keep schema-native names in protocol/API (attenuation-chain dual vocabulary, no export renames in this phase).
- **D-06 — Dual-lane docs:** Extend `service-workflow-story.md` pattern: agent lane parallel to unchanged canonical state path; every projection keeps explicit non-authority flags (`createsAuthority: false`, `freshActionContractRequired: true`).
- **D-07 — Progressive two-tier (default):** Service registers **catalog triplet** per endpoint family (`ToolCapability`, `ActionType`, `GatewayRegistryEntry`) first; **per-instance** `OperatingEnvelope` + policy pack and/or `DelegatedAuthorityRef` at delegation/admission time.
- **D-08 — Atomic install per family:** Control-plane `InstallProposal` commits catalog + gateway + baseline policy bundle per family **or refuses** — no orphan catalog without gateway entry.
- **D-09 — Full day-one envelope:** Reserved for **fixed-tenant / regulated** services only — not the default multi-agent hosted path.
- **D-10 — Hybrid layered model:** Shared **HTTP transport profile** (method, path template, allowlisted headers, raw body digest) for arbitrary REST-like endpoints; **family adapters** (x402, package install, preview deploy, repo write, auth.md) where semantic canonicalization and bypass probes matter.
- **D-11 — auth.md as profile prototype:** Treat `auth_md_protected_api_call.exact` as the pattern for HTTP-profile canonicalization, not as proof that one generic adapter covers all consequence shapes.
- **D-12 — External PEP optional:** Envoy/Kong/OPA may sit **in front** for deployment; Handshake still requires adapter-side observed-parameter re-check against exact greenlight — PEP is glue, not enforcement substitute.
- **D-13 — One runnable spine:** Single agent-first recipe: register catalog → agent proposes → policy → gateway → readback; **x402** is the only **runnable** reference implementation in this phase.
- **D-14 — Proof-gap stubs:** Add **non-runnable** recipe stubs for auth.md and package install (transition map + schema + explicit proof-gap / admission boundaries) if integrators need transfer confidence — not second runnable paths.
- **D-15 — Tier-1 kernel UX:** Document and test a **Tier-1** transition set for integrators (catalog, compile/propose, evaluatePolicy, gatewayCheck, readback); full `protocol/navigation` matrix remains reference for extenders.
- **D-16 — Optional recipe sequencer:** SDK/CLI helper that calls transitions in order is allowed only as **explicitly non-authority**, with invariant tests: no greenlight reuse, gateway required, fresh contract on retry, no bundled “execute” API.
- **D-17 — Extend `TransitionErrorEnvelope`:** Add `failureClass` / `phase` separating `auth`, `hosted_admission`, `protected_action_refusal`, `proof_gap`, `replay_refusal`, `stale_admission`.
- **D-18 — HTTP status discipline:** **401/403** only for credential/identity; **409** refusals/replay/stale binding; **422** proof gaps; never map clearance failure to generic forbidden (OAuth BCP anti-pattern).
- **D-19 — RFC 9457 compatibility:** Problem Details `type` URIs + `reason-code-remediation` extensions for public HTTP consumers.
- **D-20 — Outcome-as-success:** **200 + claim status** only on dedicated admission/readback routes — not on mutation attempts.
- **D-21 — Responsibility matrix:** Extend production acceptance / operator docs with **configured-by** columns: service operator vs host operator.
- **D-22 — Bilateral runbooks:** Paired `service-operator` and `host-operator` setup order (registry before host attestation; stale digests fail closed).
- **D-23 — Doctor as attestation:** Host `doctor` / readiness output framed as **attestation evidence** for binding digests — not a parallel identity system (SPIFFE analogy only in prose).
- **D-24 — Not documentation-only:** “Every consequential route adapter-wrapped” requires **architecture tests** + **conformance-gated service scaffold** — not prose alone.
- **D-25 — Launch gates deferred:** Product-completion-style per-service bypass proof packets (like x402/MCP activation) ship when route inventory and host evidence exist — not claimed in phase 04 for all services.

### Claude's Discretion

- Exact Tier-1 transition ID list and where it lives (`protocol/navigation` tags vs new doc).
- Whether proof-gap stubs ship in phase 04 or immediately after plan 01.
- Recipe sequencer module placement (`sdk/` vs `cli/quickstart/`).
- How many HTTP profile canonicalization rules are codified vs documented first.

### Deferred Ideas (OUT OF SCOPE)

- **Second runnable golden path** (auth.md or package install) in same phase — until admission packet + focused gates green (`decisions.md` proof contexts).
- **Schema export aliases** (`StandingBounds`, `DelegatedMandate`) — product docs only in phase 04.
- **Generic HTTP-only platform claim** without family adapters for wallet/repo/deploy/install — insufficient bypass posture.
- **External PEP as sole gate** — evidence theatre without adapter re-check.
- **Per-domain operator doc silos** — fragments agent-first spine.
- **Layer 5 clearing / cross-org verification** — `ecosystem-strategy.md` Layer 5.
- **Full kernel transition reduction** — breaks reconstruction and parity tests.
- **Hosted operation go-ahead** — separate hosted workspace per `protocol-notes.md` hosted admission lock.

</user_constraints>

## Standard Stack

### Core (existing — do not replace)

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `handshake-protocol-kernel` | 0.2.8 (local) | Protocol kernel, HTTP, SDK, surfaces | Source-owned authority spine [VERIFIED: `package.json`] |
| `bun` test runner | via `bun test` | Unit + architecture tests | Repo standard [VERIFIED: `package.json` scripts] |
| `zod` | workspace dep | Envelopes, admission, adapter params | All transition I/O validated [VERIFIED: codebase] |
| `hono` | HTTP app | Worker transition routes | `src/http/app.ts` [VERIFIED: ARCHITECTURE.md] |

### Supporting (extend in-phase)

| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| `protocol/navigation` | `src/protocol/navigation/index.ts` | Full transition catalog | Add Tier-1 metadata; no semantic edits |
| `InstallClient` | `src/sdk/surface-clients/install-client.ts` | Atomic catalog install | Service operator onboarding (D-07, D-08) |
| `ProtectedMutationAdapter` conformance | `src/conformance/index.ts` | Gateway-before-mutation probe | Every family adapter + service scaffold (D-24) |
| `adapter-sdk` | `src/adapter-sdk/` | External service adapter packs | Service-defined families (see `examples/external-adapter-sdk/`) |
| `reason-code-remediation` | `src/protocol/foundation/reason-code-remediation/` | Operator next steps on errors | Wire into `failureClass` + RFC 9457 `type` URIs (D-17, D-19) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend `TransitionErrorEnvelope` | New parallel error API | Breaks SDK `transitionErrorResult` consumers; duplicate taxonomy |
| Tier-1 tags in navigation | Separate integrator-only route registry | Drift from HTTP `transition-route-registry.ts`; tags + parity test is safer |
| Generic HTTP-only adapter | Family adapters only | Insufficient bypass posture per D-10/D-11 and `claim-boundary` expansion criteria |
| External PEP as enforcement | Adapter `VerifiedGatewayCheck` | Advisory-only path; violates D-00 and AGENTS.md |

**Installation:** No new npm dependencies required for phase scope. [VERIFIED: phase goal is docs, tests, envelope extension, navigation metadata]

## Package Legitimacy Audit

> Phase 04 does not introduce new external packages. Existing dependencies remain governed by repo `package.json` and supply-chain checks in `pack:check`.

| Package | Registry | slopcheck | Disposition |
|---------|----------|-----------|-------------|
| (none proposed) | — | — | N/A |

**Packages removed due to slopcheck [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
                    ┌──────────────────────────────────────┐
                    │  Agent / host runtime (MCP, CLI)      │
                    │  proposal + host-trusted binding      │
                    └─────────────────┬────────────────────┘
                                      │ evidence / proposal only
                                      v
┌─────────────────────────────────────────────────────────────────────────┐
│ Service operator plane                                                   │
│  Passport / Admission / Handle (service-workflow-admission)             │
│  Catalog triplet + InstallClient atomic setup                             │
│  Service HTTP routes (app handlers) ──must──> adapter.run*Gateway         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP + bearer / hosted admission
                                v
┌─────────────────────────────────────────────────────────────────────────┐
│ Handshake HTTP Worker                                                    │
│  authorizeTransitionAdmission() ──> caller identity / roles              │
│  kernel transitions: compile → propose → evaluatePolicy → gatewayCheck   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ VerifiedGatewayCheck only
                                v
┌─────────────────────────────────────────────────────────────────────────┐
│ Gateway adapter (x402, auth.md, package-install, service-defined…)       │
│  observed params re-check → mutation OR refusal / proof_gap evidence       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended file touch map (planner task seeds)

| Workstream | Primary paths | Tests |
|------------|---------------|-------|
| Tier-1 integrator UX | `src/protocol/navigation/index.ts`, new `docs/internal/integrator-tier-1-transitions.md` | `test/architecture/integrator-tier-1-parity.test.ts` |
| Public failure taxonomy | `src/http/errors/transition-error-envelope.ts`, `src/http/admission/caller-auth.ts`, `src/http/openapi/index.ts` | `test/http/transition-error-failure-class.test.ts` |
| Dual-lane agent docs | `docs/internal/service-workflow-story.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-definition.md` (cross-link only) | `test/architecture/claim-boundary.test.ts` (new required strings) |
| Service operator golden path | new `docs/internal/service-operator-golden-path.md`, extend `docs/internal/decisions.md` | `test/architecture/dual-enforcement-posture.test.ts` |
| Host/service custody | `docs/internal/decisions.md`, `docs/internal/host-golden-paths-and-trace-guidance.md`, `src/surfaces/x402-protected-tool-acceptance.ts` (pattern) | `test/architecture/custody-matrix-parity.test.ts` |
| HTTP profile layer | new `src/adapters/http-profile/` (extract from `src/adapters/auth-md/action-proposal.ts` + `profiles.ts`) | `test/adapters/http-profile-canonicalization.test.ts` |
| Proof-gap recipe stubs | `examples/auth-md-protected-api-stub/`, `examples/package-install-protected-action-stub/` | `test/architecture/proof-gap-recipe-stub.test.ts` |
| Recipe sequencer (optional) | `src/cli/quickstart/agent-spine.ts` or `src/sdk/agent-spine-sequencer.ts` | `test/cli/cli-agent-spine-sequencer.test.ts` |
| Service bypass scaffold | new `src/surfaces/service-mutation-route-manifest/` + `test/architecture/service-mutation-route-manifest.test.ts` | extend `test/conformance/protected-mutation-adapter-conformance.test.ts` |

### Pattern 1: Tier-1 transition tagging (D-15)

**What:** Add `integratorTier: 1 | 2 | 3` (or `integratorSurface: "tier1" | "extender"`) on `ProtocolNavigationEntry` entries in `src/protocol/navigation/index.ts`, plus exported `integratorTier1TransitionIds` const.

**Recommended Tier-1 IDs** (align with D-15 + existing HTTP routes in `src/http/routes/transition-route-registry.ts`):

| Tier-1 transition | Phase | Runnable in phase 04? |
|-------------------|-------|------------------------|
| `registerToolCapability` | catalog | Yes (setup) |
| `registerActionType` | catalog | Yes |
| `registerGatewayRegistryEntry` | catalog | Yes |
| `registerOperatingEnvelope` | catalog | Yes (per-instance or regulated day-one) |
| `registerInstallProposalCompiledRecords` | install_setup | Yes (atomic family install) |
| `registerDelegatedAuthorityRef` | delegated_authority | Yes (agent mandate evidence) |
| `compileIntent` | intent_compilation | Yes |
| `proposeActionContract` | action_contract | Yes |
| `evaluatePolicy` | policy | Yes |
| `gatewayCheck` | gateway | Yes |
| `reconcileSurfaceOperation` | operation_lifecycle | Yes (outcome readback) |

**Explicitly Tier-2+ (document, do not hide):** negotiation graph, recovery terminal conflict, bypass probes, review artifacts, authority certificate mint, isolation/breaker — still in navigation for extenders.

**When to use:** Integrator docs, SDK quickstart, architecture parity tests (every Tier-1 ID has HTTP route + role + non-authority sequencer guard).

### Pattern 2: `failureClass` on `TransitionErrorEnvelope` (D-17–D-20)

**What:** Extend `TransitionErrorEnvelopeSchema` in `src/http/errors/transition-error-envelope.ts`:

```typescript
// Recommended fields (planner: exact enum names + migration)
failureClass: z.enum([
  "auth",
  "hosted_admission",
  "protected_action_refusal",
  "proof_gap",
  "replay_refusal",
  "stale_admission",
  "internal",
]),
failurePhase: z.enum(["admission", "transition", "readback"]).nullable(),
problemType: z.string().url().nullable(), // RFC 9457 type URI
```

Map in `classifyTransitionError()` and admission paths (`caller-auth.ts`, hosted verifier errors) using existing `HandshakeProtocolError.code` prefixes and `reason-code-remediation` owner surfaces.

**HTTP status discipline (D-18):**

| failureClass | Status | Examples |
|--------------|--------|----------|
| `auth` | 401 / 403 | Missing bearer, wrong role |
| `hosted_admission` | 403 | Stale hosted identity, org mismatch |
| `protected_action_refusal` | 409 | Policy refusal, gateway refusal |
| `replay_refusal` | 409 | Greenlight reuse |
| `stale_admission` | 409 | Handle/admission stale vs fresh contract |
| `proof_gap` | 422 | Missing evidence, ambiguous commit |
| `internal` | 500 | Unexpected |

**RFC 9457 (D-19):** Add optional `Content-Type: application/problem+json` variant or dual-body policy documented in OpenAPI — **keep** existing `{ error: TransitionErrorEnvelope }` for SDK compatibility; add `problemType` URI derived from `remediation.docsUrl` + code slug. [MEDIUM confidence: no existing Problem Details in repo — verified by grep]

### Pattern 3: HTTP transport profile (D-10, D-11)

**What:** Extract shared fields from `AuthMdProtectedApiCallParametersSchema` (`src/adapters/auth-md/action-proposal.ts` lines 19–46) into reusable `HttpProtectedMutationProfileSchema`:

- `targetHttpMethod`, `endpointUrl`, `pathTemplate`, `requestBodyDigest`, `selectedHeadersDigest`
- anti-bypass flags: `dynamicEndpointConstructionObserved`, `dynamicHostConstructionObserved`, `retryAuthorityReuseDetected`

Family adapters **narrow** the profile with semantic fields (x402 payment params, package coordinates, etc.). `auth_md` remains the reference implementation, not the only adapter.

**Source pattern:** `runAuthMdProtectedApiCallGateway` in `src/adapters/auth-md/gateway.ts` — gateway check → credential resolution → surface execute → reconcile.

### Pattern 4: Service mutation route manifest (D-24)

**What:** Source-owned manifest type (similar to `boundary-manifest.ts`) listing each service consequential HTTP route with:

- `routeId`, `actionClass`, `adapterGatewayFn`, `conformanceProbeRef`
- `admissionOnly: false` (must be false for consequential)
- `requiresVerifiedGatewayCheck: true`

Architecture test: every manifest entry must register a `ProtectedMutationAdapterProbe`; unlisted service routes in example scaffolds fail CI.

**Do not** claim per-service `pack:check` bypass packets in phase 04 (D-25).

### Pattern 5: Proof-gap recipe stubs (D-14)

**What:** Non-runnable example packages under `examples/*-stub/` with:

- Transition map excerpt (Tier-1 only)
- JSON schema fixtures
- `proofGaps: [...]` and `runnable: false`
- Explicit admission boundaries copied from `service-workflow-story.md`

Mirror structure of `examples/service-workflow-admission/run.ts` but stop before live gateway/signers.

### Anti-Patterns to Avoid

- **Admission-as-protection:** Returning 403 on policy refusal from admission middleware only — violates D-00/D-18.
- **Bundled “execute” API:** Single SDK method that policy+gateway+mutates — violates D-16 and greenlight reuse invariants.
- **Generic HTTP adapter without family probes:** Declaring platform support without `ProtectedMutationAdapter` conformance — violates D-10 and D-24.
- **Second runnable quickstart:** auth.md or package-install quickstart that hits signers — deferred until admission packets green.
- **Kernel transition edits:** Any change to transition semantics or outcome classes — forbidden (Phase 03 lock).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gateway-before-mutation guard | Custom boolean in each service route | `assertProtectedMutationAdapterConformance` | Proven pattern in `test/conformance/protected-mutation-adapter-conformance.test.ts` |
| Atomic catalog registration | Three separate POSTs without install transition | `registerInstallProposalCompiledRecords` + `InstallClient` | Orphan catalog without gateway is a bypass vector (D-08) |
| Operator error taxonomy | Ad-hoc string codes per service | `TransitionErrorEnvelope` + `failureClass` + `reason-code-remediation` | SDK already parses envelope (`src/sdk/client.ts`) |
| Service workflow authority | New “workflow permission” object | `service-workflow-admission` + fresh `ActionContract` | Already guarded by `workflow-admission-boundary.test.ts` |
| Host identity system | Parallel SPIFFE-like IDs in product | `host-trusted-binding` + `handshake host doctor` | Phase 03 parity; D-23 |
| Per-service launch proof | Fake green bypass packets | Architecture manifest + deferred proof packets | D-25; honest proof gaps |

**Key insight:** The repo already has the enforcement primitive (`VerifiedGatewayCheck`); phase 04 packages **operator mental models** and **failure surfaces** around it without new authority types.

## Common Pitfalls

### Pitfall 1: Middleware theatre

**What goes wrong:** Docs or examples imply hosted admission or Passport/Handle replaces gateway enforcement.  
**Why it happens:** Clerk/OAuth analogies overextended.  
**How to avoid:** Dual-lane docs + `dual-enforcement-posture.test.ts` forbidding phrases like “admission authorizes mutation.”  
**Warning signs:** 403 on clearance failures; missing adapter on service REST handlers.

### Pitfall 2: Tier-1 / HTTP route drift

**What goes wrong:** Integrators call transitions that exist in kernel but lack HTTP routes or roles.  
**Why it happens:** `protocolNavigation` and `transitionRouteDefinitions` maintained separately today.  
**How to avoid:** `integrator-tier-1-parity.test.ts` asserts Tier-1 ⊆ `transition-route-registry.ts` with matching roles.  
**Warning signs:** SDK client methods 404 on Worker deploy.

### Pitfall 3: failureClass / status mis-map

**What goes wrong:** Policy refusals returned as 403; agents retry with same contract.  
**Why it happens:** Default `HandshakeProtocolError.status` mapping in `classifyTransitionError`.  
**How to avoid:** Explicit mapping table in `transition-error-envelope.ts` + tests per class.  
**Warning signs:** OAuth-style “forbidden” for stale greenlight.

### Pitfall 4: HTTP profile over-generalization

**What goes wrong:** Single “generic REST adapter” without family-specific bypass probes.  
**Why it happens:** Desire to avoid N adapters.  
**How to avoid:** Shared profile schema + mandatory family adapter for wallet/repo/deploy/install consequence shapes (D-10).  
**Warning signs:** No `createBypassProbe` or conformance probe for new family.

### Pitfall 5: Proof script / dist staleness

**What goes wrong:** Surface changes without `npm run build` pass `pack:check` falsely.  
**Why it happens:** Proof scripts import `dist/surfaces/index.mjs`.  
**How to avoid:** Keep `proof-script-build-freshness.test.ts`; document in operator runbooks. [VERIFIED: CONCERNS.md]

## Code Examples

### Protected mutation conformance (existing)

```typescript
// Source: test/conformance/protected-mutation-adapter-conformance.test.ts
await assertProtectedMutationAdapterConformance({
  name: "package-install",
  mutationCount: () => surface.mutationCount,
  async attemptWithoutVerifiedGatewayCheck() {
    await runPackageInstallGateway({ /* greenlight without verified gate */ });
  },
});
```

### Service workflow non-authority boundary (existing)

```typescript
// Source: test/architecture/workflow-admission-boundary.test.ts
expect(admission.authorityBoundary).toEqual(serviceWorkflowNonAuthorityBoundary());
expect(admission.nextActionRequirement).toBe("fresh_action_contract_required");
```

### HTTP profile fields (auth.md prototype)

```typescript
// Source: src/adapters/auth-md/action-proposal.ts — extract to http-profile
targetHttpMethod: z.string().min(1),
endpointUrl: z.string().url(),
pathTemplate: z.string().min(1),
requestBodyDigest: DigestSchema.nullable(),
selectedHeadersDigest: DigestSchema,
dynamicEndpointConstructionObserved: z.boolean(),
```

### Recommended failureClass classification (new)

```typescript
// Source: pattern from src/http/errors/transition-error-envelope.ts classifyTransitionError
function failureClassForProtocolError(error: HandshakeProtocolError): FailureClass {
  if (error.code.startsWith("caller_") || error.code === "unauthorized") return "auth";
  if (error.code.startsWith("hosted_")) return "hosted_admission";
  if (error.code.includes("replay")) return "replay_refusal";
  if (error.code.includes("proof_gap") || error.status === 422) return "proof_gap";
  if (error.code.includes("refusal") || error.status === 409) return "protected_action_refusal";
  return "internal";
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Host-trusted binding diverged MCP vs adapter | Shared `classifyHostTrustedProposalBinding` | Phase 03 | Host parity tests — do not replan |
| Single error code string only | `TransitionErrorEnvelope` + remediation | Pre-04 | Extend with `failureClass`, not replace |
| x402-only operator story | Service workflow + multi-family adapters | Phase 02–03 surfaces | Phase 04 generalizes operator UX |
| auth.md+x402 admission packet local green | Still blocked for live composite execution | 2026-05 CONCERNS | Stubs only in phase 04 |

**Deprecated/outdated:**

- Treating `ServiceWorkflowHandle` as bearer permission — forbidden by `service-workflow-story.md` and architecture tests.
- Ingress-only generated-code blocking as sole enforcement — runtime ingress is evidence, not gateway (AGENTS.md).

## What NOT to Build (phase boundary)

| Item | Reason |
|------|--------|
| New kernel transitions or outcome class changes | CONTEXT + Phase 03 freeze |
| Runnable auth.md / package-install quickstart | D-14; admission packets not green |
| `StandingBounds` / `DelegatedMandate` export aliases | Deferred |
| Per-service product-completion bypass packets | D-25 |
| Envoy/OPA as enforcement substitute | D-12; advisory only |
| Hosted operation go-ahead workspace | Deferred hosted lock |
| Turning `pack:check` live x402 / host containment green | Out of scope |
| Schema renames in protocol public API | D-05 product vocabulary only |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | RFC 9457 can be additive (dual JSON shape) without breaking SDK | failureClass | SDK clients ignore unknown fields if envelope preserved |
| A2 | Tier-1 list should include `registerDelegatedAuthorityRef` for agent mandate story | Tier-1 | Integrators skip mandate evidence path |
| A3 | `src/adapters/http-profile/` is the right extraction point | HTTP profile | Could live in `adapter-sdk` instead — planner discretion |
| A4 | Proof-gap stubs ship as `examples/*-stub/` in phase 04 | D-14 discretion | May slip to plan 02 if scope tight |

## Open Questions

1. **RFC 9457 wire format**
   - What we know: No `application/problem+json` today [VERIFIED: repo grep].
   - What's unclear: Single response body vs `Accept` negotiation.
   - Recommendation: Plan 01 — extend envelope with `problemType` URI; optional Problem Details wrapper behind content negotiation in Plan 02 if needed.

2. **Recipe sequencer placement**
   - What we know: `quickstart/x402.ts` pattern is non-authority stepped CLI with explicit flags.
   - Recommendation: `src/cli/quickstart/agent-spine.ts` delegating to x402 steps only (runnable), linking to stubs (non-runnable).

3. **Service manifest location**
   - Recommendation: `src/surfaces/service-mutation-route-manifest/index.ts` + example manifest in `examples/external-adapter-sdk/` for conformance gate.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, some scripts | ✓ | ≥20 (engines) | — |
| bun | `npm test` | ✓ | (project default) | — |
| npm run build | proof scripts / dist | ✓ | package scripts | Required before pack:check |

**Missing dependencies with no fallback:** none identified for phase scope.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | bun test [VERIFIED: package.json] |
| Config file | none (bun native) |
| Quick run command | `bun test test/architecture/integrator-tier-1-parity.test.ts` (after added) |
| Full suite command | `bun test` |

### Phase Requirements → Test Map

| Req / Decision | Behavior | Test Type | Automated Command | File Exists? |
|----------------|----------|-----------|-------------------|-------------|
| D-00 dual enforcement | Docs/tests forbid admission-only protection claims | architecture | `bun test test/architecture/dual-enforcement-posture.test.ts` | ❌ Wave 0 |
| D-15 Tier-1 UX | Tier-1 transitions ⊆ HTTP routes + roles | architecture | `bun test test/architecture/integrator-tier-1-parity.test.ts` | ❌ Wave 0 |
| D-17–D-19 failure taxonomy | failureClass + status mapping | unit/http | `bun test test/http/transition-error-failure-class.test.ts` | ❌ Wave 0 |
| D-06 dual-lane docs | Agent vocabulary in canonical docs | architecture | extend `bun test test/architecture/claim-boundary.test.ts` | ✅ extend |
| D-24 bypass scaffold | Manifest + conformance gate | architecture + conformance | `bun test test/architecture/service-mutation-route-manifest.test.ts` | ❌ Wave 0 |
| D-14 proof-gap stubs | Non-runnable examples | architecture | `bun test test/architecture/proof-gap-recipe-stub.test.ts` | ❌ Wave 0 |
| D-11 HTTP profile | Shared canonicalization rules | unit | `bun test test/adapters/http-profile-canonicalization.test.ts` | ❌ Wave 0 |
| D-16 sequencer | No authority leakage | cli | `bun test test/cli/cli-agent-spine-sequencer.test.ts` | ❌ Wave 0 (optional) |
| Regression | Service workflow boundary | architecture | `bun test test/architecture/workflow-admission-boundary.test.ts` | ✅ |
| Regression | Protected mutation adapters | conformance | `bun test test/conformance/protected-mutation-adapter-conformance.test.ts` | ✅ |

### Sampling Rate

- **Per task commit:** targeted `bun test` on touched test files
- **Per wave merge:** `bun test test/architecture test/http test/conformance`
- **Phase gate:** full `bun test` green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `test/architecture/integrator-tier-1-parity.test.ts`
- [ ] `test/architecture/dual-enforcement-posture.test.ts`
- [ ] `test/http/transition-error-failure-class.test.ts`
- [ ] `test/architecture/service-mutation-route-manifest.test.ts`
- [ ] `test/architecture/proof-gap-recipe-stub.test.ts`
- [ ] `test/adapters/http-profile-canonicalization.test.ts` (if http-profile extracted)
- [ ] `docs/internal/integrator-tier-1-transitions.md`
- [ ] `docs/internal/service-operator-golden-path.md`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Hosted verifier + bearer tokens; 401/403 only for auth class (D-18) |
| V3 Session Management | yes | Hosted identity freshness (`assertHostedCallerFresh`) |
| V4 Access Control | yes | Role-scoped transition admission; separate clearance failure class |
| V5 Input Validation | yes | Zod on all transition bodies and adapter observed parameters |
| V6 Cryptography | partial | Digests for contracts/params; no hand-rolled crypto |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Raw tool / route bypass | Elevation of privilege | Adapter conformance + route manifest (D-24) |
| Greenlight reuse / ambient authority | Spoofing | Kernel gateway binding + sequencer invariant tests (D-16) |
| Admission token → mutation | Elevation | Dual enforcement docs + failureClass separation |
| Dynamic endpoint construction | Tampering | HTTP profile flags from auth.md pattern |
| Confusing auth vs refusal | Information disclosure | HTTP status discipline (D-18) |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in repo. **`AGENTS.md`** is authoritative doctrine: gateway enforcement, no authority from surfaces, proof gaps over fake certainty, planning scratch quarantine (`.planning/` not canonical exports).

## Sources

### Primary (HIGH confidence)

- `.planning/phases/04-service-agent-gating/04-CONTEXT.md` — locked decisions D-00–D-25
- `.planning/codebase/ARCHITECTURE.md` — layer diagram, admission vs kernel flow
- `src/http/admission/index.ts`, `src/http/errors/transition-error-envelope.ts` — admission and envelope extension point
- `src/protocol/navigation/index.ts` — full transition catalog
- `src/adapters/auth-md/action-proposal.ts`, `gateway.ts` — HTTP profile prototype
- `src/conformance/index.ts`, `test/conformance/protected-mutation-adapter-conformance.test.ts` — bypass enforcement pattern
- `test/architecture/workflow-admission-boundary.test.ts` — non-authority workflow surfaces
- `docs/internal/service-workflow-story.md`, `docs/internal/decisions.md` (acceptance matrix pattern)

### Secondary (MEDIUM confidence)

- OAuth BCP / 403 vs 409 discipline — aligned with D-18; exact code→status table to be finalized in implementation

### Tertiary (LOW confidence)

- RFC 9457 dual-response negotiation — no prior art in repo; validate with integrator consumers during plan review

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — repo-native; no new packages
- Architecture: HIGH — anchors exist; phase is packaging + tests
- Pitfalls: HIGH — enforced by existing tests and AGENTS.md
- failureClass / RFC 9457 wire: MEDIUM — extension design clear; wire compatibility TBD

**Research date:** 2026-05-28  
**Valid until:** 2026-06-28 (stable kernel); 2026-06-14 for failureClass API if external consumers integrate early

---

## RESEARCH COMPLETE

**Phase:** 04 - service-agent-gating  
**Confidence:** HIGH

### Key Findings

- Phase 04 is **operator UX and structural proof** on an existing kernel spine — not new transitions; dual enforcement (admission + gateway) is already architecturally present but under-documented and under-tested for generic services.
- **Clerk-for-agents:** admission identifies callers; only **adapter-wrapped `VerifiedGatewayCheck`** paths are Handshake for mutation — must be tested and documented, not implied.
- **Tier-1** should be tagged in `src/protocol/navigation/index.ts` with parity tests against `transition-route-registry.ts`; recommended IDs listed above include catalog, atomic install, delegated mandate, compile/propose, policy, gateway, reconcile.
- **`TransitionErrorEnvelope`** is the correct extension point for `failureClass` + HTTP status discipline; RFC 9457 should be additive via `problemType` URIs tied to `reason-code-remediation`.
- **auth.md** already implements the HTTP transport profile prototype; extract to shared `http-profile` module and keep family adapters + `ProtectedMutationAdapter` conformance for bypass proof (D-24).
- **One runnable spine stays x402** (`quickstart/x402.ts`); auth.md and package-install ship as **non-runnable proof-gap stubs** only.

### File Created

`.planning/phases/04-service-agent-gating/04-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard stack | HIGH | No new deps; existing Handshake modules |
| Architecture | HIGH | Code paths verified in repo |
| Pitfalls | HIGH | Prior phase tests + doctrine |
| Public error wire | MEDIUM | Envelope extension clear; RFC 9457 shape TBD |

### Open Questions (RESOLVED)

- **RFC 9457 wire shape** — **RESOLVED:** Additive `problemType` URI on existing `TransitionErrorEnvelope` only (Plan 02). Full `application/problem+json` negotiation deferred until an external consumer requires it.
- **Recipe sequencer placement** — **RESOLVED:** `src/cli/quickstart/agent-spine.ts` with `cli-agent-spine-sequencer` anti-theatre tests (Plan 03). No bundled SDK `execute()` API.
- **Proof-gap stub timing** — **RESOLVED:** Stubs ship in Plan 04 (`examples/*-stub/`); Plan 01 docs link to stubs after merge.
- **Service mutation manifest location** — **RESOLVED:** `src/surfaces/service-mutation-route-manifest/` + example JSON under `examples/external-adapter-sdk/` (Plan 06).

### Ready for Planning

Research complete. Planner can now create PLAN.md files with concrete paths, test Wave 0, and explicit out-of-scope table above.
