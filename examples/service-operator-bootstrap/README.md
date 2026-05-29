# Service operator bootstrap (x402 family)

Atomic install recipe for the **x402_payment.exact** catalog triplet: compile an
install proposal, then register compiled records through the control-plane
`InstallClient` transition. This does not create greenlights, perform gateway
checks, or mutate protected surfaces.

## Copy-paste

```bash
bun run examples/service-operator-bootstrap/run.ts
```

```bash
handshake service bootstrap
```

Inspect evidence:

```text
examples/service-operator-bootstrap/output/latest.json
```

## Success shape

`outcome: "compiled_records_registered"` with `recordRefs` for tool capability,
action type, gateway registry entry, and operating envelope, plus
`policyPackRef` / `policyPackVersion`.

## Refusal shape

`outcome: "install_proposal_refused"` with `reasonCodes` (for example
`x402_wallet_signer_not_gateway_held` when gateway readiness is not fixture-held).
No orphan catalog rows are written on refusal.

## Re-run / idempotency

A second run with the same compiled digest reuses existing catalog rows
(`recordConflictMode: absent_or_same`) and does not silently duplicate gateway
registry entries. A conflicting digest for the same catalog id returns
`bootstrap_record_digest_conflict`.

## Scope

x402_payment.exact only. Other action families are refused at the CLI with
`service_bootstrap_x402_only`.

See [service-operator-golden-path.md](../../docs/internal/service-operator-golden-path.md)
(Branch A — atomic bootstrap).
