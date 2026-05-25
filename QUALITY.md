# Quality

Handshake quality is not cosmetic polish detached from the control primitive. The TypeScript tree must make authority boundaries readable before a reviewer opens a file.

## Non-Negotiables

- Vague intent is not authority.
- Generated code is not an action contract.
- A rendered plan is not permission.
- A greenlight authorizes one exact gateway-checked mutation attempt.
- The gateway check is the enforcement point before consequence.
- Receipts must distinguish gateway check evidence from downstream execution evidence.
- Missing evidence is recorded as a proof gap.
- Isolation state must be checked before future greenlights and gateway checks.

## Product And Protocol Language

- Product language centers on the cleared protected-action event: one terminal Handshake event with reconstructable evidence that a service can accept, refuse, or treat as a proof gap.
- The protocol kernel is the source-owned state machine and schema set. It owns exact contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, and terminal certificates.
- A product surface is CLI, MCP, SDK, docs, demo, or service-facing code that exposes proposal/evidence/readback without creating authority.
- The certificate is terminal evidence, not permission, identity, settlement, hosted trust, or reusable auth.
- Public npm availability does not create authority. MCP Registry discoverability remains a proof gap until verified.
- Production proof is ledgered by evidence state. Hosted operation, provider
  custody, settlement/finality, facilitator operation, seller middleware,
  marketplace/certification, cross-org trust, broad x402 compatibility,
  aggregate spend enforcement, MCP Registry discoverability, and host-wide
  containment stay proof gaps, outside claims, or cut lines until source
  evidence and gates change.

## Repo Shape

- `src/protocol` owns protocol meaning.
- `src/http` owns transport, admission, route metadata, handlers, and response mapping.
- `src/runtime` owns generated-execution proposal helpers; it does not issue authority.
- `src/adapter-sdk` owns third-party adapter definition helpers; it does not register runtime ingress, bind gateways, or issue authority.
- `src/adapters` owns reference gateway fixtures; mutation follows `VerifiedGatewayCheck`.
- `src/conformance` owns reference checks that verify protocol posture without creating authority.
- `src/storage` owns atomic record, stream, and cache mechanics.
- `src/sdk` owns typed client ergonomics; it does not infer authority.

No source directory should become a bucket. Split by owned concept, not by `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, or `service`.

Every first-level source lane must keep a `LANE.md` or `README.md` with these fields:

```text
Authority owner
Current proof claim
Use cases
Constraints and assumptions
Core components
Failure and scale posture
Future package target
Allowed imports
Forbidden imports
Guarding tests
Public surface
Extraction trigger
Scope boundary
```

These fields keep repo aesthetics tied to system design practice: a lane must state who uses it, what constraints bind it, which components form its high-level design, and how it behaves under bottlenecks or failure.

## Naming

Files and folders name owned concepts. Use boring protocol nouns.

Allowed protocol object names stay exact:

```text
ActionContract
PolicyDecision
Greenlight
GatewayCheck
Receipt
Refusal
ProofGap
IsolationState
```

Durable write functions should make the write explicit:

```text
record*
persist*
commit*
consume*
mark*
activate*
```

Read and derivation functions should say what they do:

```text
get*
list*
derive*
build*
format*
resolve*
```

Avoid vague protocol mutation names such as `handle*`, `process*`, `do*`, and `run*` inside protocol modules. Runtime and adapter runners may use `run*` when they are public runner entrypoints.

Avoid overclaiming names:

```text
ensureSafe*
guarantee*
proveExecution*
trustedAgent*
secureApproval*
```

## Tests And Gates

Run local slices with:

```bash
npm run check:types
bun test
git diff --check
```

Run the full repo gate with:

```bash
npm run check:repo
```

Focused gates:

```bash
npm run quality:architecture
npm run quality:storage
npm run quality:claims
```

Architecture tests must enforce:

- no workspace metadata junk in active repo surfaces;
- no repo-local `.agents` skill bundles or `skills-lock.json` in active canon;
- no root `test/*.test.ts`;
- no banned bucket names in `src/**`;
- no source directory above the loose-file threshold without an intentional public face;
- every multi-file source folder has an `index.ts` public face;
- every first-level source lane declares use cases, constraints, core components, failure posture, imports, public surface, and extraction trigger;
- no internal planning labels in repo-facing scripts, README, CI, source, or test surfaces;
- no overclaiming function names;
- curated root exports;
- import posture between protocol, HTTP, storage, runtime, adapters, and SDK.

Expansion tests must enforce that no second action family is called
execution-ready until source and tests name its generated execution shape,
protected path, gateway authority holder, credential holder,
`CandidateAction`/refusal boundary, bypass posture, evidence/readback path,
proof-gap model, recovery/isolation path, non-claims, focused gates, package
gates, and full repo gate.

## Closeout

A structural cleanup is done only when:

- TypeScript passes;
- lint passes with zero warnings;
- formatting check passes;
- tests pass;
- `git diff --check` passes;
- no protocol behavior changes are hidden inside aesthetic changes.
