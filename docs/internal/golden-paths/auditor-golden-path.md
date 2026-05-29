# Auditor Golden Path

> **Doc type:** How-to

Auditors and reviewers reconstruct what happened on a protected action without
treating readback surfaces as authority. Category claim:
**reconstructable clearance before consequence**.

## Readback + correlation (read-only)

For a known `actionContractId`:

| Surface | HTTP route (evidence read roles) |
| ------- | -------------------------------- |
| Operation readback | `GET /v0.2/evidence/operations/:actionContractId/readback` |
| Correlation index | `GET /v0.2/evidence/operations/:actionContractId/correlation` |

SDK: `EvidenceClient.getOperationReadbackProjection` and
`EvidenceClient.getOperationCorrelationIndex`.

MCP: `handshake://evidence/operations/{id}/readback` and
`handshake://evidence/operations/{id}/correlation`.

CLI:

```bash
handshake evidence fetch --contract-id <actionContractId>
```

## Proof-gap-as-refusal pattern

When policy or gateway evidence is missing, treat the terminal posture as
**proof gap** or **refusal** — not as proof that downstream execution succeeded.
Gateway admission evidence is separate from downstream business outcome.

## Non-claims

- Readback does not issue greenlights.
- Correlation index links existing refs; it does not create authority.
- Compilation stages in readback (`intent_compilation`, `candidate_action`) are
  provenance labels only.

## Related docs

- [protocol-layman.md](../protocol-layman.md)
- [service-workflow-story.md](../service-workflow-story.md) — Passport negation table
