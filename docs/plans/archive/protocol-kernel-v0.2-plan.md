# Handshake v0.2 Protocol Kernel Plan

Status: Non-canonical implementation planning artifact
Version: v0.2.1
Audience: Protocol implementers
Implementation status: Superseded as product documentation by `docs/protocol/protocol-kernel.md`; still useful as implementation history
Canonical owner: Protocol owner
Last reviewed: 2026-05-17

## Invariant At Stake

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

## Waves

```text
Wave 0: Project shape
  -> TypeScript/Hono Worker scaffold
  -> D1/KV bindings
  -> protocol plan

Wave 1: Protocol objects
  -> Zod schemas
  -> deterministic canonical JSON
  -> digest/signature helpers
  -> explicit state enums

Wave 2: Kernel transitions
  -> compile intent
  -> propose action contract
  -> evaluate policy
  -> issue one-use greenlight/refusal/review/halt/quarantine
  -> gateway check check
  -> receipt/proof gap
  -> isolation interdict

Wave 3: HTTP and SDK
  -> Hono routes
  -> OpenAPI metadata
  -> minimal client SDK

Wave 4: Verification
  -> invariant tests
  -> D1 persistence boundary tests
  -> developer docs
```

## NOT In Scope

| Deferred work | Rationale |
|---|---|
| Broad management UI | A management UI cannot enforce gateway-checked authority. |
| Broad connector library | One reference gate is enough to prove the protocol loop. |
| Multi-party dispute workflow | Receipts and proof gaps must exist before disputes mean anything. |
| Enterprise policy compiler | v0.2 starts with deterministic policy inputs and explicit refusals. |
| General browser enforcement | Browser-side tools remain bypass-prone unless the gateway enforces. |

## Protocol Loop

```text
principal intent
  -> catalog-bound compiler
  -> intent compilation record
  -> action contract
  -> policy decision
  -> greenlight/refusal/review/halt/quarantine
  -> gateway check attempt
  -> mutation/refusal/proof gap
  -> receipt
  -> stream event chain
  -> isolation state for future decisions/gates
```

## First Reference Gateway

The first gateway is a generic reference gate, not a real deploy/package manager. It proves the invariant by refusing missing, replayed, mismatched, expired, or isolated greenlights before a simulated mutation is recorded.
