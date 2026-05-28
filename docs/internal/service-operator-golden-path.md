# Service Operator Golden Path

Primary time-to-first-value (TTHW) for operators integrating Handshake on a
service API or agent host. This doc is product vocabulary and runnable spine
narrative only — it does not create authority.

## Section 0 — Unified Operator Journey

### 1. What Handshake is

Handshake is protected action infrastructure for automated decision making.
It helps a service accept, refuse, and reconstruct a cleared protected-action
event: one terminal Handshake event with reconstructable evidence.

Handshake is not agent auth, tracing, approvals, or compliance theatre. Every
consequential automated action becomes an exact action contract, receives policy
evaluation, passes a gateway check before mutation, and leaves a receipt,
refusal, or proof gap.

### 2. Dual enforcement

Two layers must both be true before a protected mutation is Handshake-enforced:

```text
http/admission (middleware: identity + transition scope)
  +
adapter.run*Gateway before mutation (route handler enforcement)
```

Ingress or admission alone is advisory, not Handshake. See
[decisions.md](./decisions.md) (Clerk-for-agents dual enforcement).

### 3. Step 3 — Choose your custody role (fork)

**Branch A — I operate the service API** (default; continue below)

**Branch B — I operate the agent host (MCP/runtime)** → see
[host-golden-paths-and-trace-guidance.md](./host-golden-paths-and-trace-guidance.md).
Canonical host commands: `handshake host doctor`, `handshake quickstart x402`,
`handshake simulate x402-payment`. Optional convenience:
`handshake quickstart agent-spine` (recommended sequencer; not required for
service-only operators).

---

## Branch A — Service Operator Path

### Product chain (agent lane)

```text
Standing Bounds → Delegated Mandate (when required) → Compile → Work Order → Clearance → Outcome
```

Schema-native mapping lives in [service-workflow-story.md](./service-workflow-story.md).

### Progressive onboarding (default)

Register the **catalog triplet** per endpoint family first:

- `ToolCapability`
- `ActionType`
- `GatewayRegistryEntry`

Then bind per-instance `OperatingEnvelope`, policy pack, and optional
`DelegatedAuthorityRef` at delegation or admission time. See plan 03 bootstrap
for atomic install.

### Regulated exception (not default)

Full day-one `OperatingEnvelope` plus policy pack for every agent is reserved
for **fixed-tenant / regulated** services only — not the default multi-agent
hosted path.

| Posture              | Default multi-agent hosted | Fixed-tenant / regulated |
| -------------------- | -------------------------- | ------------------------ |
| Catalog triplet      | Required per family        | Required per family      |
| Day-one full envelope| No — per-instance bounds   | Yes — standing bounds upfront |
| Delegated mandate    | Per spend/delegation event | May be pre-provisioned   |
| Proof expectation    | x402 runnable wedge        | Same; extra audit rows   |

### Atomic bootstrap (D-08)

Register the x402 catalog triplet atomically via control-plane
`InstallClient.registerInstallProposalCompiledRecords` (control_plane credential
required on live workers):

```bash
bun run examples/service-operator-bootstrap/run.ts
handshake service bootstrap
```

Optional input fixture path:

```bash
handshake service bootstrap ./my-x402-install-input.json
```

**Success** (`outcome: compiled_records_registered`): `recordRefs` include
`toolCapabilityId`, `actionTypeId`, `gatewayRegistryEntryId`, `operatingEnvelopeId`,
plus `policyPackRef` / `policyPackVersion`. Authority flags remain false.

**Refusal** (`outcome: install_proposal_refused`): `reasonCodes` explain compile or
setup refusal; no orphan catalog writes.

Inspect artifact: `examples/service-operator-bootstrap/output/latest.json`

Product tests: `test/product/service-operator-bootstrap.test.ts`

### Runnable clearance wedge (x402 only)

Only **buyer-side `x402_payment.exact` per-call** is runnable in this phase.
auth.md, package-install, and registry discoverability remain proof-gap prose.

### End-to-end service flow

```text
verify caller → admission/handle → clearance (x402) → readback
```

1. **Verify caller** — present passport evidence; service returns admission (non-authority).
2. **Admission/handle** — carry workflow context for correlation only.
3. **Clearance** — fresh exact `ActionContract` → policy → one-use greenlight → gateway check.
4. **Readback** — receipt, refusal, or proof gap; admission readback is not a receipt.

### Canon demo: service workflow admission

```bash
npm run demo:service-workflow-admission
```

Inspect outputs:

```text
examples/service-workflow-admission/output/latest.json
examples/service-workflow-admission/output/latest.md
```

In `latest.json`, confirm `authorityBoundary` flags:

```text
createsAuthority: false
createsGreenlight: false
performsGatewayCheck: false
freshActionContractRequired: true
```

Follow the embedded x402 clearance cross-ref to
`examples/x402-protected-spend/output/latest.json` for the fresh protected-action
path (`ActionContract → PolicyDecision → Greenlight → GatewayCheck`).

The demo proves admission/handle projection only until you wire your own gateway
adapter on Branch A routes. Product test anchor:
`test/product/service-workflow-admission.test.ts`.

### Proof-gap list (not runnable in phase 04)

| Family                         | Runnable | Notes                                      |
| ------------------------------ | -------- | ------------------------------------------ |
| auth.md live gateway           | false    | Credential discovery ≠ mutation authority  |
| package-install live gateway   | false    | Material adapter pack is proof context     |
| MCP Registry discoverability   | false    | npm publish ≠ registry lookup proof        |

Do not treat quickstart-shaped stub directories as clearance paths.

### Operator-visible failures

_Table filled by plan 05 (`failureClass` × HTTP status × safe retry × forbidden actions)._

| failureClass | HTTP | Safe retry | Forbidden |
| ------------ | ---- | ---------- | --------- |
| _(pending plan 05)_ | | | |

### Advanced (not first 30 minutes)

- [integrator-tier-1-transitions.md](./integrator-tier-1-transitions.md) — Tier-1 integrator appendix
- [service-workflow-story.md](./service-workflow-story.md) — plain-language vocabulary
- [decisions.md](./decisions.md) — custody and expansion ledger
