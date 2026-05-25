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
