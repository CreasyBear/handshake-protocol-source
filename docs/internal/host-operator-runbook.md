# Host Operator Runbook

Doc type: How-to

Companion maintenance guide for Branch B host operators (Phase-04 plan `04-10`, D-22).
Host commands are non-authority scaffolding — they do not create ServiceWorkflowAdmission,
ServiceWorkflowHandle, clearance, policy decisions, greenlights, gateway checks, or mutations.

## Start Here

1. Complete service Branch A bootstrap first ([service-operator-golden-path.md](./service-operator-golden-path.md)).
2. Read [host-golden-paths-and-trace-guidance.md](./host-golden-paths-and-trace-guidance.md) for bilateral order.
3. Use this runbook when changing host doctor, quickstart, or simulate flows.

## Canonical host commands

```bash
handshake host doctor
handshake quickstart x402
handshake simulate x402-payment
```

Optional sequencer:

```bash
handshake quickstart agent-spine
```

Each command returns `authorityCreated: false`, `greenlightCreated: false`,
`gatewayCheckPerformed: false`, and `mutationAttempted: false`.

## MCP / runtime custody notes

- Host doctor emits binding digests for attestation — not a trust anchor.
- Quickstart and simulate are local scaffolding; they are not gateway checks.
- Registry and gateway credential custody remain service-operator responsibilities (D-21).

## Trace guidance

- Correlate host steps with service admission readback using workflow handles only.
- Fresh clearance still requires a new exact action contract per protected call.
- Stale registry digests fail closed against current service bootstrap.

## Non-claims

- Handshake does not create native host certification or live host config mutation.
- Host doctor does not substitute for service gateway registry install.
- Simulation output is not downstream business finality.
