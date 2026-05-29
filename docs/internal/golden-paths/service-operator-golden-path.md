# Service Operator Golden Path

> **Doc type:** How-to

Service operators integrate Handshake on the API lane: dual enforcement (admission
middleware **and** gateway-before-mutation in handlers) plus honest product
completion gates.

## Start here

Primary narrative: [service-operator-golden-path.md](../service-operator-golden-path.md)

Maintenance runbook: [service-operator-runbook.md](../service-operator-runbook.md)
(Phase 05 A4 — dual enforcement checklist, mutation manifest, `dual_enforcement_posture`)

## Dual enforcement (non-negotiable)

```text
http/admission (identity + transition scope)
  +
adapter.run*Gateway before mutation (handler enforcement)
```

Admission alone does not authorize mutation. See `src/http/mutation-route-manifest.ts`.

## Bootstrap commands

```bash
handshake service bootstrap --cwd .
handshake host doctor   # only when you also operate the host lane
```

## Evidence readback for operators

```bash
handshake evidence fetch --contract-id <actionContractId>
```

## Host lane (optional branch)

If you operate MCP/runtime binding, continue in
[host-operator-runbook.md](../host-operator-runbook.md) and
[host-golden-paths-and-trace-guidance.md](../host-golden-paths-and-trace-guidance.md).
