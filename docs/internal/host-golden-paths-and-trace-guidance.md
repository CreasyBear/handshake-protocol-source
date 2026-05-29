# Host golden paths and trace guidance

Host-operator TTHW for MCP/runtime custody. Product vocabulary only — no authority
is created by doctor, quickstart, or simulate commands.

## Service operator prerequisite (D-22)

Before host attestation, the service side must register the gateway registry and
catalog triplet for the protected endpoint family. Complete Branch A bootstrap
first:

- [service-operator-golden-path.md](./service-operator-golden-path.md) (Branch A)
- `handshake service bootstrap` or `examples/service-operator-bootstrap/run.ts`

Host doctor attestation binds to those registry digests; it does not substitute
for service install. The host lane **does not own gateway registry** — registry
and gateway credential custody remain service-operator responsibilities (D-21).

## Bilateral setup order (host lane, D-22)

After service bootstrap completes:

1. `handshake host doctor` — binding digest attestation (non-authority).
2. `handshake quickstart x402` — local probe and readiness scaffolding.
3. `handshake simulate x402-payment` — non-authority simulation output.

Optional: `handshake quickstart agent-spine` (same three steps). Trusted binding
digests must match current service registry; stale digests fail closed.

## Canonical host commands (primary)

Run these discrete commands in order:

```bash
handshake host doctor
handshake quickstart x402
handshake simulate x402-payment
```

Each command returns `authorityCreated: false`, `greenlightCreated: false`,
`gatewayCheckPerformed: false`, and `mutationAttempted: false`.

## Recommended convenience (optional)

```bash
handshake quickstart agent-spine
```

Equivalent to the three canonical commands above. Not required for operator
product completion or service-only operators.

## Doctor attestation (D-23)

`handshake host doctor` emits `attestationDigest` and `bindingDigestInputs` as
evidence for binding checks. It is not a parallel identity system, hosted trust
anchor, or gateway readiness certification.

## Trace guidance

- Correlate host steps with service admission readback using workflow handles only.
- Simulation output is non-authority scaffolding — not a gateway check or mutation.
- Fresh clearance still requires a new exact action contract per call.
