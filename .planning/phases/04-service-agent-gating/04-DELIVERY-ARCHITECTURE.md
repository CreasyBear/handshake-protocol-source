# Phase 04 — Delivery architecture (comprehensive)

**Purpose:** Engineering blueprint for replanned `04-0N-PLAN.md` files. This is **not** an MVP enablement slice.

## Product surfaces (three operator personas)

| Persona | Runnable artifacts this phase | Authority boundary |
|---------|------------------------------|-------------------|
| **Service operator** | `service-operator-golden-path.md`, `examples/service-operator-bootstrap/`, canonized `demo:service-workflow-admission`, `handshake service bootstrap` (x402 family) | Owns gateway registry, adapter wiring, per-route `run*Gateway` |
| **Host operator** | Mandatory `handshake quickstart agent-spine`, host golden path sync, doctor attestation chain | Owns trusted binding digests, MCP proposal wiring — not gateway ownership |
| **Integrator (SDK/HTTP)** | Tier-1 navigation + parity, role-scoped clients walkthrough tests, failure taxonomy on all transports | Uses kernel transitions; never bundles execute |

## Clerk-for-agents (enforced in code + docs + CI)

```text
Request
  → http/admission (middleware: identity + transition scope)
  → kernel transitions (compile, propose, policy, gatewayCheck evidence)
  → service app handler (route handler: adapter.run*Gateway before mutation)
  → downstream effect
```

**Failure mode to eliminate:** Operators deploy admission + API auth and believe agents are gated.

## Operator journey (single Start Here — product/user audit)

| Step | All operators | Service branch (Branch A) | Host branch (Branch B) |
|------|---------------|---------------------------|------------------------|
| 1–2 | What Handshake is; dual enforcement | — | — |
| 3 | **Custody fork** | Golden path continues | `host doctor` → `quickstart x402` → `simulate` |
| Runnable | — | `demo:service-workflow-admission`, `handshake service bootstrap` | Optional convenience: `quickstart agent-spine` |

**Not runnable (prose proof-gap list only):** auth.md live gateway, package install live gateway, registry discoverability — no quickstart-shaped stub packages.

## Subsystems delivered

### S1 — Doctrine & dual-lane canon (Plan 01)
- Agent lane in `service-workflow-story.md`, `protocol-layman.md`, `protocol-definition.md`
- `dual-enforcement-posture.test.ts`, extended `claim-boundary.test.ts`
- `ecosystem-strategy.md` layer discipline unchanged

### S2 — Service-operator golden path product (Plan 02)
- `docs/internal/service-operator-golden-path.md` as **primary TTHW** with unified journey + step-3 custody fork
- `docs/internal/developer-experience-index.md` single Start Here → golden path (not dual spines)
- Branch A: verify caller → admission/handle → clearance (x402) → readback
- Branch B: host commands in fork (agent-spine optional)

### S3 — Atomic install executable (Plan 03)
- `examples/service-operator-bootstrap/` — TypeScript recipe: catalog triplet + `InstallClient.registerInstallProposalCompiledRecords`
- `src/cli/service/bootstrap.ts` + manifest entry `handshake service bootstrap` (x402 family only)
- Tests: `test/product/service-operator-bootstrap.test.ts`, extend `http.test.ts` install path as reference
- Golden path links with copy-paste blocks

### S4 — Agent-host spine recommended (Plan 04)
- `src/cli/quickstart/agent-spine.ts` — **recommended** convenience chaining: doctor → x402 quickstart → simulate (non-authority)
- Canonical host path remains discrete commands in devex index
- `test/cli/cli-agent-spine-sequencer.test.ts` — anti-theatre: no bundled execute, no greenlight reuse

### S5 — Failure taxonomy — HTTP + operator table (Plan 05)
- `failureClass`, `failurePhase`, `problemType` on `TransitionErrorEnvelope`
- `httpStatusForFailureClass` — 401/403 auth only; 409 refusals; 422 proof gaps
- `test/http/transition-error-failure-class.test.ts` — negative + **positive** readback 200+claim (D-20)
- `src/http/openapi/index.ts` documents new fields
- Golden path + devex index: **one** `failureClass` operator table (not three transport cheat sheets)

### S6 — Failure taxonomy — multi-surface parity only (Plan 06)
- SDK: `failureClass` on `HandshakeClientError` via `transport.ts` / `repair.ts`
- MCP: shared classifier helper used by `mcp/x402-proposal.ts` + `test/mcp/mcp-failure-class-parity.test.ts`
- `test/sdk/role-clients-failure-class.test.ts` — Policy/Gateway/Evidence clients surface typed failures

### S7 — Tier-1 integrator platform (Plan 07)
- `integratorTier1: true` metadata on navigation entries
- `docs/internal/integrator-tier-1-transitions.md` — IDs, roles, HTTP routes, SDK clients
- `test/architecture/integrator-tier-1-parity.test.ts`
- Tier-1 set: catalog quartet, `registerInstallProposalCompiledRecords`, `registerDelegatedAuthorityRef`, `compileIntent`, `proposeActionContract`, `evaluatePolicy`, `gatewayCheck`, `reconcileSurfaceOperation`, evidence readbacks

### S8 — HTTP profile & adapter platform (Plan 08)
- `src/adapters/http-profile/` — shared transport schema + `canonicalizeHttpProfile`
- auth.md refactored to compose profile
- `src/adapters/http-profile/generic-gateway-skeleton.ts` — conformance probe only, **definition_only** posture, no live mutation
- `test/adapters/http-profile-canonicalization.test.ts`
- Install triplet template doc section + test that orphan catalog without gateway registry entry fails compile

### S9 — Proof-gap honesty (Plan 09)
- Prose proof-gap table in golden path (no stub example directories)
- `test/architecture/proof-gap-honesty.test.ts`
- Upgrade `examples/external-adapter-sdk/README.md` with dual-enforcement checklist

### S10 — Custody & bilateral operations (Plan 10)
- `decisions.md` production acceptance matrix: configured-by columns
- Bilateral setup sections in golden path + host golden path (standalone runbooks **post-execute**)
- Doctor output framed as attestation evidence in `src/cli/host/doctor.ts` copy + `mcp/doctor.ts`

### S11 — Bypass enforcement minimal (Plan 11)
- `test/architecture/http-handler-mutation-gating.test.ts` — walk handlers for adapter binding posture (**phase 04 D-24**)
- **Deferred:** manifest module, registry sync, conformance expansion, product-completion inventory slice → phase 05

### S12 — Two-tier E2E verification (Plan 12)
- `test/integration/service-operator-golden-path.test.ts` — admission demo + bootstrap idempotency smoke
- `operator-product-completion-contract` vs `maintainer-product-completion-contract`
- `04-VERIFICATION.md` with operator vs full sign-off
- `scripts/check-service-agent-gating-phase.mjs --tier operator|full`

## Wave execution graph

```text
Wave 1: 01, 02 (doctrine + golden path product)
Wave 2: 03, 04 (service bootstrap + agent spine) — parallel
Wave 3: 05 (failure HTTP + operator failure table)
Wave 4: 06, 07 (failure parity + tier-1) — parallel; 06 after 05; 07 after 03
Wave 5: 08 (HTTP profile platform) — after 05
Wave 6: 09, 10 (proof-gap honesty + custody) — parallel; 09 after 08; 10 after 02, 04
Wave 7: 11 (handler mutation gating) — after 03, 07, 08
Wave 8: 12 (E2E verification) — after all
```

## Success definition

### Operator tier (waves 1–6 + handler walk — shippable TTHW)

A service operator can:

1. Follow **one** golden path (step-3 fork) and run **admission demo** + **service bootstrap** in &lt; 30 minutes without integrator appendix.
2. Use the **failureClass table** for HTTP errors (SDK/MCP parity proven in CI, not separate reading).
3. Understand custody split via bilateral sections and decisions matrix.

A host operator can:

4. Use **doctor → x402 quickstart → simulate** (agent-spine optional).

CI:

5. Fails if docs claim admission-only protection.
6. Fails if first-party handlers lack adapter binding (`http-handler-mutation-gating`).

### Full tier (wave 8 — engineering complete)

Adds integrator Tier-1 parity, http-profile platform, proof-gap honesty tests, maintainer contract bundle. Manifest/sync still deferred to phase 05 with explicit pointer.

## Explicit non-goals (unchanged locks)

- Second runnable clearance path (auth.md, package install live)
- Kernel transition changes
- Schema renames
- MCP registry acceptance green
- Per-customer production route `pack:check` for arbitrary third-party services (D-25 scoped to first-party dogfood + scaffold)
