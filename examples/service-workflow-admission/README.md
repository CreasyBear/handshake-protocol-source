# Service Workflow Admission Example

Status: local/source-owned product-surface proof
Scope: one non-authority service workflow admission and handle, followed by one
fresh x402 protected-action clearance path composed from the existing APS demo.

## Invariant At Stake

Admission and handle records can help a service correlate evidence and readback.
They cannot become identity, permission, policy, greenlight, gateway check,
receipt evidence, signer access, payment approval, or reusable auth.

## Run

From the repo root:

```bash
npm run demo:service-workflow-admission
```

The demo writes:

```text
examples/service-workflow-admission/output/latest.md
examples/service-workflow-admission/output/latest.json
```

The demo also refreshes `examples/x402-protected-spend/output/latest.json` by
running `npm run demo:aps` internally, then reads only the redacted local APS
report fields needed to show that protected-action clearance is separate from
workflow admission.

## What This Proves

- `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` parse through the
  source-owned non-authority schemas.
- The five workflow IDs are correlation and reconstruction fields only.
- Admission readback is not receipt evidence.
- The workflow handle is not permission.
- x402 clearance appears only in the fresh protected-action path:
  `ActionContract -> PolicyDecision -> one-use Greenlight -> GatewayCheck`.
- The generated-agent misuse posture lists loop/retry reuse, changed
  parameters, dynamic tool construction, stale review, raw sibling bypass,
  replay, and proof-gap cases as non-authority outcomes.

## What This Does Not Prove

- No hosted operation.
- No provider custody.
- No settlement finality.
- No broad x402 compatibility.
- No host-wide containment.
- No reusable passport authority.
- No handle-as-permission.
- No auth, policy, gateway admission, signer access, payment approval, receipt
  evidence, or reusable clearance from admission or handle records.
