# Developer Experience Index

Single entry for operator onboarding. Service API gating is the primary buyer
path; host-operator commands apply only when you operate MCP/runtime binding.

## Start Here — Operator journey

→ [service-operator-golden-path.md](./service-operator-golden-path.md)

Includes Step 3 custody fork (service API vs agent host). You do not need two
top-level Start Here paths.

## Service operator commands (first)

| Command | Purpose |
| ------- | ------- |
| [service-operator-golden-path.md](./service-operator-golden-path.md) | Primary TTHW narrative |
| `npm run demo:service-workflow-admission` | Canonical service-side admission demo |
| `handshake service bootstrap` | Atomic x402 catalog install (control-plane) |

Operator-visible HTTP failures (`failureClass`, status discipline, safe retry):
see the failure table in [service-operator-golden-path.md](./service-operator-golden-path.md#operator-visible-failures).

Vocabulary: [service-workflow-story.md](./service-workflow-story.md)

## Host operator commands (only if you operate the host)

| Command | Purpose |
| ------- | ------- |
| [host-golden-paths-and-trace-guidance.md](./host-golden-paths-and-trace-guidance.md) | MCP/runtime host path |
| `handshake host doctor` | Host readiness attestation (non-authority) |
| `handshake quickstart x402` | Runnable x402 proposal spine |
| `handshake simulate x402-payment` | Simulated clearance readback |
| `handshake quickstart agent-spine` | Optional recommended sequencer (plan 04) |

Host branch is required only when you operate MCP/runtime binding — not for
every service operator.

## Advanced (not first session)

- [integrator-tier-1-transitions.md](./integrator-tier-1-transitions.md) — Tier-1 integrator transition appendix; defer until after golden path

## Canonical internal docs

- [decisions.md](./decisions.md) — product and protocol boundaries
- [protocol-layman.md](./protocol-layman.md) — plain-English protocol guide
- [protocol-notes.md](./protocol-notes.md) — compact implementation notes
