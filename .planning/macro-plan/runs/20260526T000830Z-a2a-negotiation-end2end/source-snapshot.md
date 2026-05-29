# A2A Negotiation Source Snapshot

Run: `20260526T000830Z-a2a-negotiation-end2end`

## Worktree Posture

Branch: `codex/architectural-north-star-simplification`

The worktree is already heavily dirty with unrelated tracked and untracked work
across `.planning/`, docs, examples, CLI, HTTP, protocol, runtime, storage,
surfaces, x402 protected-tool code, and tests. This run must not revert,
normalize, or stage unrelated edits.

`.planning/` is ignored by `.gitignore`. New planning files under `.planning/`
must be force-added if the user wants them committed.

## Canonical Current Anchors

- `AGENTS.md`: governing invariant that rendered plans, generated code, and
  agreement-like artifacts are not authority.
- `README.md`: product kernel, current x402 wedge, MCP proposal/evidence
  boundary, package posture, and non-claims.
- `docs/internal/decisions.md`: current product kernel, proof ledger,
  expansion admission, and launch-gate posture.
- `docs/internal/protocol-kernel-architecture.md`: protocol transition map,
  extension boundary, and bilateral ecosystem note.
- `docs/internal/protocol-layman.md`: plain-language bilateral ecosystem
  explanation.
- `src/protocol/foundation/schema-core.ts`: `clearingEvidenceRefs` already
  includes `correlationRef`, `obligationRef`, and `counterpartyRef`.
- `src/protocol/events/schemas.ts`: source-owned contract event enum.
- `src/protocol/areas/object-registry/`: object export posture and raw-read
  posture.
- `src/protocol/kernel.ts`: transition facade.
- `src/protocol/areas/action-contract/`: exact proposed commitment.
- `src/protocol/areas/policy-greenlight/`: policy decisions, greenlights, and
  sequence dependency handling.
- `src/protocol/areas/gateway-gate/`: final enforcement before consequence.

## Existing Source Truth For Bilateral Operation

Current docs already permit future negotiation and linked agreements, with the
hard cut line that each party's obligation must still become its own normal
`ActionContract`, policy decision, greenlight, gateway check, and
receipt/refusal/proof-gap chain.

The current protocol is not a marketplace, escrow system, settlement layer,
legal-contract system, reputation layer, dispute-resolution system, or generic
A2A protocol.

## Current Non-Proofs

- No implemented `negotiation` protocol area exists.
- No `LinkedAgreement` or `AgreementObligationBinding` schema exists.
- No negotiation event types exist in `ContractStreamEventSchema`.
- No policy hook validates agreement-backed obligations.
- No cross-org trust model exists.
- No A2A x402 fixture exists.
- No readback projection links agreement -> obligation -> contract -> policy
  -> gateway -> terminal outcome.
- No launch claim may say Handshake supports A2A negotiation today.

## Existing Useful Seam

`clearingEvidenceRefs.obligationRef` and `counterpartyRef` are the right bridge
from a negotiated obligation to an `ActionContract`. The extension should use
that seam before adding new authority-bearing concepts.
