# DevEx Review: A2A Negotiation

Status: PASS_WITH_FIRST_PROOF_REQUIREMENT

## Invariant At Stake

Developers should not need to learn the full kernel to prove the first A2A
path, but the quickstart must not hide the authority boundary.

## First Developer Job

An agent builder wants to let a buyer agent accept a seller agent's paid API
offer without giving either agent raw spend authority.

## First Proof Path

```text
npm install handshake-protocol-kernel
-> run A2A x402 fixture
-> see accepted offer create no authority
-> bind obligation to x402_payment.exact ActionContract
-> see policy greenlight/refusal
-> see gateway pass/refuse before signer use
-> inspect receipt/refusal/proof-gap readback
```

## Required Developer Artifacts

- one fixture JSON input;
- one fixture Markdown output;
- one support/readback packet;
- one CLI or test command that runs the fixture;
- one failure fixture for stale/changed params;
- one failure fixture for accepted offer without binding.

## P0/P1 Findings

P0: A developer must not be asked to assemble protocol records manually for the
first proof. Provide a fixture runner or helper facade.

P0: Quickstart copy must say "proposal/evidence only" until policy/gateway
transitions are run.

P1: If the first proof requires hosted operation, customer custody, registry
listing, or cross-org trust, adoption stalls. Keep it local/reference first.

P1: Errors need reason codes, not prose-only failures.

## DevEx Recommendation

Add an example package path before broad API design:

```text
examples/a2a-negotiated-x402/
  input/
  output/latest.json
  output/latest.md
  run.ts
  README.md
```

Then add CLI only after the fixture proves stable. Do not expose public package
root helpers until package-surface tests prove the intended boundary.
