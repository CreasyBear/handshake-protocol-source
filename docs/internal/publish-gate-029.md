# Publish gate — handshake-protocol-kernel@0.2.9

**Status:** Canonical publish-readiness contract for the A1 evidence-layer release.  
**Branch:** `feat/a1-evidence-layer-0.2.9`  
**Invariant:** npm publish and MCP metadata do not create authority. Publish language must match what is structurally proven.

## User path matrix

| Persona / path                     | Role at 0.2.9 publish       | Runnable proof                                                                                                                                                         | Non-claims                                                                                                                              |
| ---------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Buyer integrator (x402 wedge)**  | **Primary publish gate**    | `handshake quickstart x402`, `handshake simulate x402-payment`, wallet gateway: compile → policy → gateway check → receipt; optional `delegationProvenance` on receipt | Not ambient authority; one greenlight = one exact mutation attempt; receipt ≠ downstream business success                               |
| **Agent host (MCP stdio)**         | **Secondary co-gate**       | `handshake host doctor`, `handshake quickstart x402`, `handshake-mcp` with `handshake.actions.x402_payment.propose` and `handshake.evidence.delegation.verify`         | Verify is evidence-only (`authorityCreated: false`); MCP is not policy, greenlight, or gateway                                          |
| **Runtime ingress (D-76a/b)**      | **Adjunct milestone proof** | `proposeRuntimeIngressActionContracts` with structured wire refusals; optional `delegationEvidenceRef` at compile                                                      | Ingress does not issue greenlight; terminal outcomes are refusal/proof-gap/candidate only                                               |
| **Service operator (HTTP kernel)** | **Proof gap at publish**    | Golden path documented in `docs/internal/service-operator-golden-path.md`; partial harness coverage                                                                    | Do not claim hosted Worker GA, dual-enforcement runtime parity on arbitrary integrator routes, or full HTTP clearance beyond x402 wedge |
| **MCP Registry discoverability**   | **Proof gap at publish**    | `server.json` synced to package version; registry lookup not verified                                                                                                  | npm publish ≠ registry acceptance; discoverability remains owner-held evidence                                                          |
| **Hosted operation**               | **Proof gap at publish**    | Hosted-admission surfaces exist for correlation/readback only (D-71)                                                                                                   | Not production org auth, mutation authority, or hosted trust                                                                            |

## Primary gate commands (buyer x402)

1. Install / pin `handshake-protocol-kernel@0.2.9`
2. Run buyer quickstart or simulate path against local/reference gateway
3. Confirm terminal evidence distinguishes gateway check from downstream execution
4. When delegation evidence is attached, confirm receipt `delegationProvenance` is optional and non-authoritative

## Secondary co-gate commands (agent host)

1. `handshake host doctor` — activation profile and MCP wiring
2. Exercise `handshake.actions.x402_payment.propose` through configured host
3. Exercise `handshake.evidence.delegation.verify` — expect `proof_gap` / non-authoritative outcome

## Manifest publish posture (D-71)

The following surfaces remain in `src/surfaces/boundary-manifest.ts` but are **not** published npm subpaths in 0.2.9:

- `surfaces.hosted_admission` (`src/hosted-admission/`)
- `surfaces.service_workflow_admission` (`src/surfaces/service-workflow-admission/`)

Published surface exports are defined in `package.json` and tested by `test/architecture/manifest-coverage.test.ts`.

## Deferred backlog (not in 0.2.9 publish scope)

| Item                                                                              | Why deferred                                                     | Reopen when                                                                                                                                    |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1-ACCEPT-01** — compile-time digest carry-only until receipt                   | Accepted risk; verify is non-authoritative                       | Harness demonstrates divergence between compile-time binding and receipt reconstruction                                                        |
| **A1-ACCEPT-03** — internal ingress programming throws                            | Wire refusals closed (D-76b); throws are programming-error paths | External harness hits throw paths in production flows                                                                                          |
| **D-76d** — unified harness-neutral ingress envelope                              | Wedge discipline; parallel ingress paths remain                  | N≥2 external harness integrations blocked on duplicate glue **and** conformance test proves identical `IntentCompilationRecord` + reason codes |
| **Hybrid export Option 3** — publish `./surfaces/service-workflow-admission` only | No integrator requires npm import now                            | Named buyer/host integrator blocked without npm subpath                                                                                        |
| **Artifact repo re-project**                                                      | Depends on source PR merge + publish                             | After npm `0.2.9` publish and maintainer checklist                                                                                             |

## Related decisions

- D-71 — hosted-admission re-export-only; narrow npm surface
- D-74–D-76 — delegation evidence re-namespace, no mint/authorize, ingress refusals
- `.planning/milestones/a1-integration/SECURITY.md` — 18/18 STRIDE closed; accepted risks documented
