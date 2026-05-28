# External Adapter SDK Example

Run:

```bash
npm run demo:adapter-sdk
```

This example shows how an external SDK author uses the adapter authoring surface:

```ts
import {
  defineProtectedActionAdapterPack,
  projectAdapterSdkInstallProposalReport,
} from "handshake-protocol-kernel/adapter-sdk";
```

The local repo runner imports from `../../src/adapter-sdk` so tests do not depend
on prebuilt `dist/` artifacts, but the package contract is the
`handshake-protocol-kernel/adapter-sdk` subpath.

The example emits:

- one definition report for a third-party protected-action adapter pack;
- one refused install proposal;
- one ready install proposal with compiled catalog and envelope records;
- explicit proof gaps for runtime ingress registration, gateway binding, and conformance fixture execution.

It is definition-only: not runtime ingress registration, not gateway binding,
not policy evaluation, not greenlight issuance, not gateway check, not mutation,
not receipt export, not provider custody, not marketplace certification, and
not hosted operation.

## Dual-enforcement checklist (integrators)

Before claiming Handshake enforcement on a third-party adapter pack:

- [ ] Catalog triplet registered (`ToolCapability`, `ActionType`, `GatewayRegistryEntry`)
- [ ] Atomic install or compiled-records refusal on orphan catalog (D-08)
- [ ] Service HTTP handler calls `adapter.run*Gateway` before mutation
- [ ] Hosted admission configured for transition scope (advisory layer only)
- [ ] External PEP (if any) is deployment glue — adapter re-check still required (D-12)

Operator golden path (runnable x402 wedge only):
[docs/internal/service-operator-golden-path.md](../../docs/internal/service-operator-golden-path.md).

## Dual-enforcement checklist (D-00, D-12)

Before shipping an external adapter integration:

- [ ] Catalog triplet registered (`ToolCapability`, `ActionType`, `GatewayRegistryEntry`)
- [ ] Atomic install or compiled-records refusal on orphan catalog (D-08)
- [ ] Service HTTP handler calls `adapter.run*Gateway` before mutation
- [ ] Hosted admission configured for transition scope
- [ ] External PEP (if any) is glue only — adapter re-check required (D-12)
- [ ] Conformance probe registered (`ProtectedMutationAdapter`)
- [ ] Proof gaps documented honestly — do not fake `pack:check` green

See [service-operator-golden-path.md](./service-operator-golden-path.md#proof-gap-list-not-runnable-in-phase-04) for proof-gap families (not stub example dirs).

## Dual-enforcement checklist (integrators)

Before shipping a family adapter:

1. **Admission** — HTTP/MCP ingress may identify the caller; admission alone is advisory, not Handshake enforcement.
2. **Exact contract** — Every consequential attempt reduces to an inspectable action contract before policy.
3. **Gateway check** — `run*Gateway` (or family equivalent) must verify exact greenlight binding before mutation.
4. **HTTP profile** — REST-like transports compose `HttpProtectedMutationProfileSchema` from `src/adapters/http-profile` (see [integrator-tier-1-transitions.md](../../docs/internal/integrator-tier-1-transitions.md)).
5. **Proof gaps** — Document non-runnable families honestly; x402 is the only runnable clearance wedge in phase 04 ([service-operator-golden-path.md](../../docs/internal/service-operator-golden-path.md)).
