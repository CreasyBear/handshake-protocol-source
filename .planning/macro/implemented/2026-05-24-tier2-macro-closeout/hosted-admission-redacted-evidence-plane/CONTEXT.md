# Context

This run is planning-only for the macro item: hosted admission plus redacted evidence plane.

The hard product frame is protected actions for automated decision making. The first wedge is exact x402 per-call protected action, not general engineering-agent execution control. Engineering agents are relevant as stress and adoption context only.

The hosted surface must stay narrow. It may admit exact protected-call transitions before kernel invocation and expose redacted evidence records through tenant-scoped read controls. It must not become hosted mutation authority, payment management, settlement, provider custody, general hosted Handshake operation, or compliance/audit theatre.

The goal path is:

```text
caller role token
-> route admission
-> tenant/org/project scope
-> protocol transition or redacted read
-> durable D1/KV storage
-> audit-safe response
```

Known source state to preserve:

- hosted mode already exists as a transport admission seam;
- hosted caller role/freshness/scope checks happen before body parse/kernel invocation;
- accepted hosted transitions store digest/ref evidence, not raw tokens/user headers;
- evidence read routes check tenant/org boundaries;
- generic raw record reads consult rawReadPosture;
- D1/HTTP tests cover durable protocol surface/local D1.

The macro plan closes the gap between local hosted mechanics and an operated hosted read/admission posture without pretending local D1 tests, provider-neutral identity, or redacted receipts prove production readiness.
