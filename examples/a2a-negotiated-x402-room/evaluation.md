# A2A Negotiated x402 Room Evaluation

Scope: this scorecard evaluates the local/reference A2A negotiated x402 readback path only. It does not evaluate a production marketplace, live provider custody, legal agreement formation, settlement finality, or host-native containment (`native_host_containment`).

## Scores

| Lens |  Score | Evidence                                                                                                                                                                     | Remaining gap                                                                               |
| ---- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| DX   | 9.1/10 | A developer can run `bun examples/a2a-negotiated-x402-room/generate.ts` and inspect `latest.json`, `latest.md`, and `agent-handoff.md` without importing test fixtures.      | Fresh package-install walkthrough is not yet a separate published-package onboarding proof. |
| AX   | 9.2/10 | `agent-handoff.md` gives runtime profile, source boundary, tool contract, protected-action boundary, stop conditions, eval path, next step, and machine-readable non-claims. | Host-specific generated-code containment remains a separate blocked proof.                  |
| CX   | 9.1/10 | `latest.md` separates agreement evidence, obligation binding, one-use greenlight, gateway check, downstream unknown, proof gap, and redacted payment material.               | There is no production customer UI or live external receipt finality proof in this slice.   |

## Ten-Star Ambition

A ten-star version of this surface means a developer, agent, or operator can reconstruct the protected-action chain without reading internal source, guessing authority semantics, or trusting prose.

- DX: one command produces a support packet, customer readback, and agent handoff with stable file names.
- DX: public package import posture exposes readback helpers without exposing kernel, signer, gateway, or mutation authority.
- DX: failure modes are named as proof gaps, refusals, or blocked evidence instead of generic demo failures.
- AX: the next agent receives source boundaries, allowed reads, forbidden material, stop conditions, and eval commands.
- AX: agreement acceptance is explicitly non-authority, so a generated program cannot treat negotiation as permission.
- AX: retries require a fresh exact contract and gateway check, not reuse of a greenlight.
- CX: the operator sees what was negotiated, what exact action was bound, what the policy greenlit, and what the gateway checked.
- CX: downstream uncertainty is visible as unknown/proof-gap evidence, not smoothed into success.
- CSO: raw payment payloads, signatures, and credential material are absent from readback outputs.
- Product: all non-claims stay visible: marketplace operation, legal contract formation, escrow, settlement finality, reputation, cross-org trust, provider custody, reusable authority, and native host containment (`native_host_containment`).

## CSO And Product Review

Threat: agreement acceptance is confused with authority.
Mechanism: `authorityBoundary.agreementAcceptanceCreatedAuthority` is false, the product readback repeats the boundary, and policy/gateway events remain separate.

Threat: the readback leaks payment or credential material.
Mechanism: outputs include redaction posture and product tests reject `PAYMENT-SIGNATURE`, payment payload digests, and credential material.

Threat: replay turns one greenlight into ambient authority.
Mechanism: the local room records a refused replay, customer readback says not to retry with the same greenlight, and tests assert the signer count stays at one.

Threat: a public helper becomes an authority surface.
Mechanism: the public readback subpath projects support-packet evidence only and exports no `HandshakeKernel`, policy client, gateway checker, signer, or mutation runner.

Threat: product language overclaims external operation.
Mechanism: the example and generated readbacks state local/reference scope and preserve non-claims for marketplace operation, legal contract formation, escrow, settlement finality, reputation, cross-org trust, provider custody, reusable authority, and native host containment (`native_host_containment`).

## Validation Evidence

- `bun examples/a2a-negotiated-x402-room/generate.ts`
- `bun test test/product/a2a-negotiated-x402-room.test.ts`
- `npm run quality:claims`
- `npm run quality:architecture`
- `npm run check:repo`

## Brutal Verdict

Keep, but keep it narrow. This slice is a product-grade readback and handoff path for one local/reference negotiated x402 protected action. It is not marketplace operation, not legal contract formation, not settlement finality, not provider custody, not reusable authority, and not native-host containment.
