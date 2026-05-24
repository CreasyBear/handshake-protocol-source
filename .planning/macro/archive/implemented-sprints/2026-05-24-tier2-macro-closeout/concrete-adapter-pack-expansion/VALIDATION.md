# Validation

## Validation Matrix

| Gate | Required Evidence | Passing Condition | Failure Means |
| --- | --- | --- | --- |
| Adapter contract freeze | Adapter pack manifest fields and references | Manifest is the activation boundary and no god registry is introduced | Expansion is structurally unsafe |
| Runtime ingress boundary | Runtime ingress routing behavior | Ingress selects compiler only and does not authorize | Shortcut authority |
| Package-install contract | Canonical package-install proposal | One npm install attempt is exact, inspectable, and policy-evaluable | Vague intent laundered into fake precision |
| Policy decision | Policy rule pack result | Decision is greenlight, refusal, review, halt, or quarantine against exact contract | Advisory policy |
| Gateway observed-parameter validation | Observed install parameters | Gateway rejects drift and enforces one-use exact binding | This is advisory, not Handshake |
| Lifecycle script posture | Contract and observed install flags | Lifecycle scripts blocked unless separately contracted | Hidden consequential execution |
| npm material evidence | Signature/provenance/tarball/registry evidence | Evidence recorded within real scope, with proof gaps when absent | Provenance laundering |
| Bun lockfile evidence | Lockfile material and reconstruction notes | Lockfile recorded as local reconstruction/drift evidence only | False provenance claim |
| Receipt mapping | Receipt/refusal/proof-gap output | Receipt distinguishes proposal, policy, gateway check, execution result, proof gaps | Evidence theatre |
| Bypass probes | Hostile fixtures | Raw sibling bypass is detected, isolated, or blocks promotion | Generated code escaped the contract boundary |
| Buyer report | Report artifact | Report sections bind to exact contract and receipt evidence | Review theatre |
| Export conformance | Exported fixture and receipt | Chain reconstructs without runtime transcript | This is not auditable |

## Hostile Fixture Requirements

Required hostile fixtures:

- provenance laundering;
- missing provenance;
- invalid npm registry signature;
- tarball integrity mismatch;
- registry substitution;
- lockfile drift;
- lifecycle script attempt;
- raw sibling package-manager invocation;
- stale policy decision;
- reusable greenlight attempt;
- credential custody ambiguity;
- report/contract mismatch.

## Closeout Commands

Run closeout only after implementation work exists. This macro plan itself is planning-only.

Expected closeout command set:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Focused closeout must also include the existing package-install runtime/gateway test target once its exact project script name is confirmed.

## Closeout Evidence

Closeout requires:

- package-install conformance fixture for one npm install attempt;
- contract canonicalization evidence;
- gateway observed-parameter validation evidence;
- npm material evidence receipt mapping;
- Bun lockfile reconstruction evidence, if Bun material is present;
- explicit proof-gap case;
- lifecycle-script blocked case;
- raw sibling bypass case;
- buyer-readable report bound to exact contract and receipt ids;
- no product claims beyond protected dependency-action gating.
