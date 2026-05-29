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

## Dual-enforcement checklist (D-00, D-12)

Before shipping an external adapter integration:

- [ ] Catalog triplet registered (`ToolCapability`, `ActionType`, `GatewayRegistryEntry`)
- [ ] Atomic install or compiled-records refusal on orphan catalog (D-08)
- [ ] Service HTTP handler calls `adapter.run*Gateway` before mutation
- [ ] Hosted admission configured for transition scope (advisory layer only)
- [ ] External PEP (if any) is glue only — adapter re-check required (D-12)
- [ ] Conformance probe registered (`ProtectedMutationAdapter`)
- [ ] Proof gaps documented honestly — do not fake `pack:check` green

Admission alone is not Handshake enforcement. Every consequential attempt must reduce to an exact action contract, receive policy evaluation, and pass a gateway check before mutation. REST-like transports compose `HttpProtectedMutationProfileSchema` from `src/adapters/http-profile` (see [integrator-parity-transitions.md](../../docs/internal/integrator-parity-transitions.md)).

Proof-gap families (auth.md, package-install, registry discoverability) are prose-only in phase 04 — x402 is the only runnable clearance wedge:
[service-operator-golden-path.md](../../docs/internal/service-operator-golden-path.md#proof-gap-list-not-runnable-in-phase-04).
