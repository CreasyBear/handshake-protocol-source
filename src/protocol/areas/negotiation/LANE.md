# Negotiation

## Authority owner

The protocol kernel owns negotiation records as transition evidence.

## Current proof claim

This area defines strict evidence schemas for `NegotiationSession` records and
related offer, decision, agreement, obligation-binding, and status-transition
records. It does not perform protected-action control transitions.

## Use cases

- Record imported A2A-style conversation context as digest-bound evidence.
- Keep party proof posture explicit instead of implying counterparty proof from
  an agent or endpoint string.
- Link accepted-offer evidence to local proposed protected-action evidence.

## Constraints and assumptions

- External protocol refs are imported evidence only.
- Raw transcripts and raw-readable offer terms are outside this area.
- Agreement and obligation records are local evidence objects, not reusable
  permission.
- Protected-action enforcement remains owned by the existing contract, policy,
  gate, and terminal-evidence areas.

## Core components

- `NegotiationSessionSchema`
- `NegotiationOfferSchema`
- `NegotiationDecisionSchema`
- `LinkedAgreementSchema`
- `AgreementObligationBindingSchema`
- `AgreementStatusTransitionSchema`

## Failure and scale posture

Missing, stale, or unverifiable counterparty material is modeled with proof-gap
refs. Sequence and supersession fields preserve later reconstruction without
claiming lifecycle enforcement in this phase.

## Future package target

None in A2A-001. This area is not exported through the package root in this
phase.

## Allowed imports

- `zod`
- protocol foundation schemas

## Forbidden imports

- protected-action control transition areas
- runtime adapters
- HTTP, CLI, MCP, SDK, storage, or package-surface modules

## Guarding tests

- `test/protocol/negotiation-schemas.test.ts`
- `test/protocol/negotiation-object-registry.test.ts`
- `test/protocol/negotiation-events.test.ts`
- `test/architecture/negotiation-no-authority-surface.test.ts`

## Public surface

Area-local schemas and inferred types only.

## Extraction trigger

Extract only after runtime adapters and readback surfaces prove stable imported
evidence shapes without widening the protected-action control path.

## Scope boundary

A negotiation record can be referenced by a later local protected-action path.
It cannot replace that path.
