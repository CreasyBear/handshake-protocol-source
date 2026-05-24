# Macro Plan Input: Customer-Owned Gateway Custody Proof

Run ID: `customer-owned-gateway-custody-proof-20260524T071623Z`

## Target

Create a source-grounded macro plan for critical-path item 1 from `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`: **Customer-Owned Gateway Custody Proof**.

Goal: define the implementation path for proving a protected path is real because the mutation credential lives behind a customer/provider gateway that enforces the exact greenlight before consequence.

The desired mechanism from the active register:

```text
gateway install evidence
-> credential ref binding
-> protected-path posture
-> custody/bypass probe packet
-> gateway check binds exact contract
-> redacted custody projection
```

## User Constraints

- Use `$gsd-macro-plan` as a subagent-first workflow.
- This is planning only. Do not implement source changes under this run.
- Handshake is protected actions for automated decision making, not just engineering agents.
- x402 is the first wedge, but x402 must not define the protocol.
- Keep Tier 1 protocol/kernel meaning stable.
- Preserve customer-owned gateway custody as the enforcement model.
- Do not introduce Handshake-held wallets, payment credentials, balances, settlement state, or payment management.
- Do not claim live provider/customer custody until a source-owned custody proof packet, negative tests, and redacted projections exist.
- Do not add provider-specific vault/KMS architecture without marking official-doc/source verification as required before implementation.

## Source Boundary

Allowed source files for first-pass agents:

- `AGENTS.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`
- `.planning/macro/README.md`
- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`
- `.planning/macro/active/claim-boundary-cleanup/PLAN.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `src/protocol/areas/credential-custody/schemas.ts`
- `src/protocol/areas/credential-custody/inputs.ts`
- `src/protocol/areas/credential-custody/custody-posture.ts`
- `src/protocol/areas/credential-custody/transitions.ts`
- `src/protocol/areas/protected-path-posture/schemas.ts`
- `src/protocol/areas/protected-path-posture/inputs.ts`
- `src/protocol/areas/protected-path-posture/transitions.ts`
- `src/protocol/areas/gateway-gate/schemas.ts`
- `src/protocol/areas/gateway-gate/inputs.ts`
- `src/protocol/areas/gateway-gate/artifacts.ts`
- `src/protocol/areas/gateway-gate/transitions.ts`
- `src/protocol/areas/policy-greenlight/transitions.ts`
- `src/protocol/evidence-projections/projections.ts`
- `src/protocol/evidence-projections/assembly.ts`
- `src/adapters/x402-payment/install-proposal.ts`
- `src/adapters/x402-payment/wallet-gateway.ts`
- `src/adapters/x402-payment/bypass-probes.ts`
- `src/adapters/x402-payment/conformance.ts`
- `src/adapters/auth-md/profiles.ts`
- `src/adapters/auth-md/gateway.ts`
- `src/adapters/auth-md/revocation.ts`
- `src/adapters/auth-md/bypass-probes.ts`
- `src/adapters/protected-path-probes`
- `test/protocol/credential-custody.test.ts`
- `test/protocol/evidence-projections.test.ts`
- `test/protocol/kernel-policy-gateway.test.ts`
- `test/adapters/x402-wallet-gateway.test.ts`
- `test/adapters/x402-bypass-probes.test.ts`
- `test/adapters/auth-md-gateway-pressure.test.ts`
- `test/adapters/auth-md-serialization-redaction.test.ts`
- `test/conformance/x402-payment-conformance.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/import-posture.test.ts`
- `test/architecture/root-exports.test.ts`

Forbidden files for first-pass agents:

- sibling raw outputs under this run;
- normalized outputs under this run;
- the final `PLAN.md` for this run before chair synthesis;
- unrelated historical `.planning/macro/archive/**` files unless a specific current source file links to them;
- source files not listed above unless the agent first records why the listed source packet is insufficient.

## Required Output Directory

All artifacts for this item must stay under:

```text
.planning/macro/active/customer-owned-gateway-custody-proof/
```

First-pass outputs:

```text
.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/raw/STRATEGY.md
.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/raw/ARCH.md
.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/raw/EXECUTION.md
.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/raw/RISK.md
.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/raw/ADOPTION.md
```

Chair outputs:

```text
.planning/macro/active/customer-owned-gateway-custody-proof/PLAN.md
.planning/macro/active/customer-owned-gateway-custody-proof/CONTEXT.md
.planning/macro/active/customer-owned-gateway-custody-proof/ASSUMPTIONS.md
.planning/macro/active/customer-owned-gateway-custody-proof/DECISIONS.md
.planning/macro/active/customer-owned-gateway-custody-proof/RISKS.md
.planning/macro/active/customer-owned-gateway-custody-proof/VALIDATION.md
.planning/macro/active/customer-owned-gateway-custody-proof/TASKS.jsonl
.planning/macro/active/customer-owned-gateway-custody-proof/runs/customer-owned-gateway-custody-proof-20260524T071623Z/synthesis.md
```

## Plan Requirements

The chair plan must include:

- goal;
- non-goals;
- source boundary;
- current state;
- target state;
- assumptions;
- decisions;
- phases;
- task graph;
- risks and mitigations;
- validation gates;
- cut lines;
- rollback / stop conditions;
- smallest next action.

The plan must explicitly cover:

- whether to extend existing `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, and bypass probe primitives or add a new proof packet primitive;
- custody proof packet schema shape and digest binding;
- binding custody proof to protected-path posture, action contract, policy/greenlight, gateway check, and redacted projections;
- provider-neutral fields for custody provider, key handle, lease/version, attestation refs, resolver version, redacted audit refs, and drift status;
- negative tests for agent-exposed signer, stale credential ref, provider drift, resolver failure, missing custody packet, unsafe custody status, redaction failure, and raw sibling path;
- how x402 uses the custody proof without broadening into payment management or provider custody claims;
- how auth.md learnings around credential refs, revocation, and redaction inform this mechanism without turning Handshake into an auth provider;
- projection redaction rules that never expose secret paths, signer material, payment payloads, bearer tokens, or mutation credentials;
- claim guards preventing provider/customer custody claims from fixture keys;
- external verification that must happen later for any named vault/KMS/provider custody implementation.

## Success Criteria

- The macro plan is executable as a future implementation slice without altering Tier 1 protocol meaning.
- The plan strengthens the enforcement story for protected actions while preserving customer-owned custody and avoiding Handshake-held payment custody.
- Each task names source/test/doc candidate paths and closeout evidence.
- `TASKS.jsonl` parses as JSONL.
- Validation gates are specific enough to fail stale custody, drift, redaction, and unsafe signer exposure.
- The plan names antipatterns and stop conditions.

## External Verification

Do not browse by default for this planning pass. If a perspective proposes a named vault, KMS, wallet provider, x402 provider, JWKS, Cloudflare, npm, MCP Registry, legal, or payment-regulatory detail, it must mark that detail as requiring official source verification before implementation. Provider-neutral schema planning may proceed from repo source only.

## 10 Star Product Bar

Custody proof is successful when a buyer can see that the automated decision system never received the mutation credential, the customer-owned gateway had the credential, the exact greenlight was checked immediately before mutation, drift/stale/unsafe custody refuses before consequence, and the surviving evidence is redacted but reconstructable.
