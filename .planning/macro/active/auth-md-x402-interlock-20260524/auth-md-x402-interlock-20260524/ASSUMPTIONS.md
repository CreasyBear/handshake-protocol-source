# Assumptions

| ID | Assumption | Confidence | Evidence | Invalidation Trigger |
| --- | --- | --- | --- | --- |
| A1 | x402 remains the first official buyer-side exact per-call protected-spend wedge. | High | Input constraints and all raw lenses. | Repo canon or owner decision promotes another official wedge. |
| A2 | auth.md should remain credential provenance/custody/lifecycle evidence, not authority. | High | Input constraints, strategy, arch, risk, and adoption outputs. | A source-owned exact protected action requires auth.md credential use and passes gateway tests. |
| A3 | The smallest safe combination is a redacted packet/read artifact. | High | Raw consensus favors packet before composite execution. | Fail-first packet test shows packet cannot express required evidence without source protocol changes. |
| A4 | Existing auth.md focused gates still represent the closed adapter/custody slice. | Medium | Prior closeout memory and raw execution validation list. | Current focused auth.md gate fails or source paths drift. |
| A5 | Existing x402 focused gates still represent the official protected-spend wedge. | Medium | Raw validation lists and x402 product packet references. | Current focused x402 or demo gate fails. |
| A6 | Local/reference fixtures are acceptable for the first packet if labeled. | Medium | Adoption and execution lenses. | Product docs or tests imply live provider custody, settlement, or cross-org trust. |
| A7 | A future composite action may be useful but is not yet justified. | Medium | Arch, execution, and risk outputs defer composite action. | Packet and hostile harness pass, and wedge scoring favors composite paid authenticated call. |
| A8 | One downstream paid authenticated call should have one exact authority spine. | High | Core Handshake invariant and risk lens. | A verified coordination design proves multiple gateways can preserve one-use failure-closed authority. |

## Working Constraints

- Treat external `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md` as
  read-only evidence.
- Do not import auth-md runtime code into Handshake.
- Do not document planned packet verification commands as current capability
  until source-owned commands exist.
- Do not use `.planning/` as public product truth.

## Proof Gaps To Preserve

- Live auth.md provider custody and revocation authority.
- Live x402 settlement, provider custody, facilitator operation, and seller
  middleware.
- Customer gateway/vault operation.
- Hosted verifier and remote trust.
- Aggregate spend enforcement.
- Broad MCP/browser/shell/network/package containment.
- Composite paid authenticated execution.
