# Macro Plan Input: auth.md x402 Interlock Refresh

Run id: auth-md-x402-interlock-20260524
Date: 2026-05-24

## User Prompt

We already have an auth.md macro plan. Rerun it now that the GSD map has been
updated. Similar to the x402 sandbox, it may be worthwhile looking at auth.md
as well. The two are likely interlinked.

## Invariant At Stake

auth.md registration and x402 payment challenges are upstream protocol evidence,
not authority. They matter to Handshake only when they can be reduced into exact
protected actions, evaluated by policy, checked by a gateway before consequence,
and reconstructed as receipt, refusal, proof gap, or terminal evidence.

## Target Output

Create a refreshed macro plan for an auth.md/x402 interlock proof path.

The plan must decide whether auth.md should remain:

- a closed adapter/provenance/custody slice;
- a new narrow proof surface analogous to the x402 sandbox;
- a comparative wedge-evaluation input beside x402;
- or an integrated protected-action packet where auth.md establishes agent
  credential provenance and x402 proves protected spend.

## Required Source Packet

Handshake repo canon and current maps:

- `AGENTS.md`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/TESTING.md`

Existing Handshake planning artifacts:

- `.planning/macro/implemented/2026-05-23-auth-md-integration/auth-md-integration-20260523T073249Z/PLAN.md`
- `.planning/macro/implemented/2026-05-23-auth-md-integration/auth-md-integration-20260523T073249Z/VALIDATION.md`
- `.planning/macro/implemented/2026-05-24-tier2-x402-sandbox/tier2-x402-sandbox-20260524T010215Z/synthesis.md`
- `.planning/macro/active/x402-product-evaluation-20260524/20260524-x402-product-evaluation/PRODUCT-EVALUATION-PLAN.md`
- `.planning/macro/implemented/2026-05-24-tier2-macro-closeout/AUDIT.md`
- `.planning/macro/implemented/2026-05-24-tier2-macro-closeout/GSD-REMAP.md`

External local auth.md source evidence, read-only:

- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/README.md`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/AUTH.md`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/.planning/codebase/ARCHITECTURE.md`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/.planning/codebase/CONCERNS.md`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/.planning/codebase/TESTING.md`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/agent-services/src/routes/agent-auth.ts`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/agent-services/src/verify.ts`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/agent-services/src/store.ts`
- `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md/agent-providers/src/jwts.ts`

## Forbidden Inputs

- Do not treat `.planning/` as canonical product truth.
- Do not edit `/Users/joelchan/Documents/Coding/App-Dev/live/auth-md`.
- Do not import auth-md runtime code into Handshake.
- Do not use web claims unless explicitly verifying a current external source.

## Hard Constraints

- Handshake is protected action infrastructure for automated decision making,
  not agent auth, not OAuth hosting, not x402 payments infrastructure, not
  settlement, not marketplace, and not certification.
- x402 remains one official buyer-side `exact` per-call protected-spend wedge.
- auth.md remains registration, provenance, credential lifecycle, revocation,
  and custody evidence until an exact protected action passes the Handshake
  chain.
- Credential material, claim tokens, bearer values, API keys, signing material,
  payment payloads, and signatures cannot enter generated execution, MCP, CLI,
  SDK read surfaces, reports, or receipts except as redacted post-gate evidence.
- Runtime ingress, MCP, CLI, hosted verifier/readiness, release proof, and
  reports are proposal/evidence/read surfaces unless a gateway owns and checks
  the mutation credential before consequence.

## Questions To Resolve

- What is the smallest auth.md proof surface worth building after x402 sandbox?
- Should auth.md and x402 be separate wedge evaluations or a combined
  buyer-facing packet?
- What is the exact interlock between ID-JAG/auth.md credential provenance and
  x402 signer/payment custody?
- Which path proves more market urgency, adoption clarity, and expansion merit:
  protected spend, agent registration custody, or a composite protected
  commerce action?
- What failure modes appear only when auth.md and x402 are combined?
- What would be review theatre, credential theatre, payment theatre, or
  evidence theatre in this plan?

## Required Plan Posture

Use the review structure:

- Invariant at stake
- Primitive
- Failure mode
- Boundary
- Mechanism
- Adoption
- Audit
- Brutal verdict

## Success Criteria

- The plan gives a concrete verdict: separate, combine, sequence, or cut.
- It names a smallest next mechanism.
- It preserves the exact authority boundary.
- It lists anti-patterns and stop conditions.
- It names validation gates that can be run inside the Handshake repo.
- It does not claim live provider custody, production hosted operation, actual
  x402 settlement, auth-provider status, WorkOS endorsement, MCP Registry
  publication, package safety, or cross-org trust.
