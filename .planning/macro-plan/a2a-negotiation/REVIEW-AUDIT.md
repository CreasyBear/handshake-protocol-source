# A2A Negotiation Review And Audit Gates

Status: planned

## Required Review Chain

1. CEO review:
   - market-opening value;
   - first buyer;
   - why Handshake should not own the marketplace;
   - cleared work unit thesis.
2. Engineering review:
   - schema and transition architecture;
   - policy/gateway interaction;
   - storage/event/replay behavior;
   - package-surface risk.
3. Design review:
   - agreement-vs-authority legibility;
   - operator readback;
   - redacted support packet;
   - mobile/detail state.
4. DevEx review:
   - time to first A2A proof;
   - fixture path;
   - errors and reason codes;
   - public API/export posture.
5. Agent review:
   - runtime profile;
   - tool contract;
   - write scopes;
   - stop conditions;
   - protected-action overlay.
6. Security review:
   - tenancy;
   - cross-party evidence;
   - raw read posture;
   - secret and signer material;
   - replay and stale state.
7. Claim audit:
   - docs, examples, README, CLI help, package exports;
   - forbidden words and overclaims.
8. Verification audit:
   - each requirement mapped to tests, generated outputs, or explicit proof gap.

## Current Inline Reviews

This macro package includes inline reviews under:

```text
runs/20260526T000830Z-a2a-negotiation-end2end/raw/
```

These satisfy phase-planning pressure. They do not replace post-implementation
code review, secure-phase review, or goal-backward verification.

## P0 Audit Questions

- Does any record create authority before `PolicyDecision` and `GatewayCheck`?
- Can one accepted offer authorize more than one mutation?
- Can one party authorize another party's gateway?
- Can an agent reach raw x402 payment material?
- Can stale, expired, withdrawn, disputed, or superseded agreement state clear?
- Can readback hide proof gaps?
- Can support/export leak raw terms or secrets?
- Can terminal certificate be mistaken for permission?
- Can public docs claim marketplace, settlement, or legal contract formation?

## Promotion Gates

Phase planning may begin when this package exists.

Implementation may begin only after `A2A-001` has a detailed phase plan.

Agent execution may begin only after:

- exact file write scopes exist;
- focused tests are named;
- stop conditions are explicit;
- source branch/worktree state is classified;
- rollback/abandonment criteria exist.

Launch claims may begin only after:

- implementation is merged or otherwise source-owned;
- demo outputs are regenerated;
- claim and architecture gates pass;
- support/readback packet exists;
- non-claims are visible.
