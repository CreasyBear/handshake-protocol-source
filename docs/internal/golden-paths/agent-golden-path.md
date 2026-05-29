# Agent Golden Path

> **Doc type:** How-to

Agent hosts and integrators run the authority spine without treating readback as
permission. Handshake is **reconstructable clearance before consequence** — not
agent auth, tracing, or an approval workflow.

## One-import ergonomics (D-56)

```typescript
import { PolicyClient, GatewayClient, EvidenceClient } from "handshake-protocol-kernel";
```

For smaller bundles: `handshake-protocol-kernel/sdk/role-clients`.

## Authority spine (labels only)

```text
Standing Bounds → Delegated Mandate (when required)
→ Intent compilation (readback stage; non-authority)
→ Candidate action (readback stage; non-authority)
→ Compile → Work Order → Policy → Greenlight or refusal
→ Gateway check before mutation → Outcome
```

Intent compilation and candidate-action stages appear in operation readback only.
They do not create greenlights or gateway passes.

## Runnable readback

After you have an `actionContractId`:

```bash
handshake evidence fetch --contract-id <actionContractId> --base-url https://your-handshake-host
```

Uses the canonical HTTP readback route
`/v0.2/evidence/operations/:actionContractId/readback`. Readback does not issue
clearance.

## Next docs

- [protocol-layman.md](../protocol-layman.md) — plain-English spine
- [integrator-parity-transitions.md](../integrator-parity-transitions.md) — integrator parity appendix
