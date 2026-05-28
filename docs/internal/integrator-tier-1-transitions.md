# Tier-1 integrator transitions (appendix)

> **Do not read in your first 30 minutes.** Service operators should follow [service-operator-golden-path.md](./service-operator-golden-path.md) Branch A first. Host operators use [host-golden-paths-and-trace-guidance.md](./host-golden-paths-and-trace-guidance.md).

Tier-1 transitions are the bounded HTTP/SDK surface for integrators wiring Handshake into a service. They record evidence and clearance steps only — no bundled execute shortcut.

## Progressive onboarding

1. **Catalog triplet** — register `ToolCapability`, `ActionType`, `GatewayRegistryEntry`, and `OperatingEnvelope` (control plane).
2. **Atomic install** — `registerInstallProposalCompiledRecords` refuses orphan catalogs without a gateway registry entry ([service-operator-bootstrap](../../examples/service-operator-bootstrap/) recipe).
3. **Compile and propose** — `compileIntent` then `proposeActionContract` on runtime evidence role.
4. **Policy** — `evaluatePolicy` returns one-use greenlight or refusal (control plane).
5. **Gateway** — `gatewayCheck` then optional `reconcileSurfaceOperation` (gateway custody).

Host doctor, quickstart x402, and simulate are **not** Tier-1 kernel transitions — see the host golden path fork.

## Tier-1 transition table

| transitionId | phase | HTTP | SDK client + method | caller role | authority boundary | runnable in phase 04? |
| --- | --- | --- | --- | --- | --- | --- |
| registerToolCapability | catalog | POST /v0.2/catalog/tool-capabilities | ControlPlaneClient.registerToolCapability | control_plane | catalog availability only | yes |
| registerActionType | catalog | POST /v0.2/catalog/action-types | ControlPlaneClient.registerActionType | control_plane | catalog availability only | yes |
| registerGatewayRegistryEntry | catalog | POST /v0.2/catalog/gateways | ControlPlaneClient.registerGatewayRegistryEntry | control_plane | catalog availability only | yes |
| registerOperatingEnvelope | catalog | POST /v0.2/envelopes | ControlPlaneClient.registerOperatingEnvelope | control_plane | catalog availability only | yes |
| registerInstallProposalCompiledRecords | install_setup | POST /v0.2/install-proposals/compiled-records | InstallClient.registerInstallProposalCompiledRecords | control_plane | install setup evidence only | yes |
| registerDelegatedAuthorityRef | delegated_authority | POST /v0.2/delegated-authority-refs | ControlPlaneClient.registerDelegatedAuthorityRef | control_plane | delegated authority evidence only | yes |
| compileIntent | intent_compilation | POST /v0.2/intent-compilations | RuntimeClient.compileIntent | runtime_evidence | candidate evidence only | yes |
| proposeActionContract | action_contract | POST /v0.2/action-contracts | RuntimeClient.proposeActionContract | runtime_evidence | exact contract proposal only | yes |
| evaluatePolicy | policy | POST /v0.2/policy-decisions | PolicyClient.evaluatePolicy | control_plane | policy decision / greenlight only | yes |
| gatewayCheck | gateway | POST /v0.2/gateway-check-attempts | GatewayClient.gatewayCheck | gateway_custody | gateway check before mutation | yes (x402 wedge) |
| reconcileSurfaceOperation | operation_lifecycle | POST /v0.2/surface-operation-reconciliations | GatewayClient.reconcileSurfaceOperation | gateway_custody | downstream observation only | yes |

## Install triplet + HTTP profile

Atomic install requires **ToolCapability**, **ActionType**, and **GatewayRegistryEntry** together. Orphan catalogs (capability/action without gateway) must refuse at install compile. Shared transport canonicalization lives in `src/adapters/http-profile/` (used by family adapters such as auth-md and x402).

Runnable x402 triplet reference: [examples/service-operator-bootstrap/](../../examples/service-operator-bootstrap/).

## Tier-2+ transitions (reference only)

Negotiation sessions, recovery terminal conflict resolution, bypass probes, authority certificates, review artifacts, and generated execution graph transitions remain available on the HTTP surface but are **not** Tier-1 integrator requirements for phase 04 operator TTHW.

## SDK walkthrough recipe

See `test/sdk/role-clients-walkthrough.test.ts` for a mocked composition: InstallClient → ControlPlaneClient (delegated mandate) → RuntimeClient propose path → PolicyClient → GatewayClient, with distinct role credentials and idempotency keys per attempt.
