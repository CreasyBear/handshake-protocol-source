# Developer Experience Index

> **Doc type:** Reference

Single entry for operator onboarding. Service API gating is the primary buyer
path; host-operator commands apply only when you operate MCP/runtime binding.

## Start Here — Persona golden paths

| Persona            | Golden path                                                                                    | Boundary                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Agent / integrator | [golden-paths/agent-golden-path.md](./golden-paths/agent-golden-path.md)                       | Root import, compile→contract spine, `handshake evidence fetch` |
| Service operator   | [golden-paths/service-operator-golden-path.md](./golden-paths/service-operator-golden-path.md) | Dual enforcement, bootstrap, links service runbook              |
| Auditor / reviewer | [golden-paths/auditor-golden-path.md](./golden-paths/auditor-golden-path.md)                   | Readback + correlation index; proof-gap honesty                 |

Legacy long-form operator narrative (Step 3 fork):

→ [service-operator-golden-path.md](./service-operator-golden-path.md)

## Operator runbooks (maintenance)

| Doc                                                          | Boundary                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [service-operator-runbook.md](./service-operator-runbook.md) | Service API lane: dual enforcement, mutation manifest, completion gates |
| [host-operator-runbook.md](./host-operator-runbook.md)       | Host lane: doctor/quickstart/simulate; non-authority only               |

## Service operator commands (first)

| Command                                                              | Purpose                                     |
| -------------------------------------------------------------------- | ------------------------------------------- |
| [service-operator-golden-path.md](./service-operator-golden-path.md) | Primary TTHW narrative                      |
| `npm run demo:service-workflow-admission`                            | Canonical service-side admission demo       |
| `handshake service bootstrap`                                        | Atomic x402 catalog install (control-plane) |

Operator-visible HTTP failures (`failureClass`, status discipline, safe retry):
see the failure table in [service-operator-golden-path.md](./service-operator-golden-path.md#operator-visible-failures).

Vocabulary: [service-workflow-story.md](./service-workflow-story.md)

## Host operator commands (only if you operate the host)

| Command                                                                              | Purpose                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------ |
| [host-golden-paths-and-trace-guidance.md](./host-golden-paths-and-trace-guidance.md) | MCP/runtime host path                      |
| `handshake host doctor`                                                              | Host readiness attestation (non-authority) |
| `handshake quickstart x402`                                                          | Runnable x402 proposal spine               |
| `handshake simulate x402-payment`                                                    | Simulated clearance readback               |
| `handshake quickstart agent-spine`                                                   | Optional recommended sequencer (plan 04)   |

Host branch is required only when you operate MCP/runtime binding — not for
every service operator.

## Agent SDK quick import (one-import ergonomics, D-56)

```typescript
import { PolicyClient, EvidenceClient, explainHandshakeError } from "handshake-protocol-kernel";
```

For precision or smaller bundles, use the subpath: `handshake-protocol-kernel/sdk/role-clients`.

## Advanced (not first session)

- [integrator-parity-transitions.md](./integrator-parity-transitions.md) — integrator parity transition appendix; defer until after golden path

## Canonical internal docs

- [decisions.md](./decisions.md) — product and protocol boundaries
- [protocol-layman.md](./protocol-layman.md) — plain-English protocol guide
- [protocol-notes.md](./protocol-notes.md) — compact implementation notes
