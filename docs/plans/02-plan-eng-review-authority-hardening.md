# Plan Eng Review 02: Authority Hardening Gate

Status: Implemented closeout checkpoint
Version: v0.2.2 authority-hardening delivery checkpoint
Audience: Protocol implementers, SDK authors, runtime builders, gateway owners, platform engineering, security engineering
Implementation status: Phase 0 and Phase 1 implemented and verified; Phase 2 through Phase 5 remain unimplemented unless a later plan explicitly claims them
Canonical owner: Protocol owner
Extends: [`01-plan-eng-review-primitive-fields-state.md`](./01-plan-eng-review-primitive-fields-state.md)
Follows: [`01a-plan-eng-review-protocol-migration.md`](./01a-plan-eng-review-protocol-migration.md)
Archives input from: [`archive/02-plan-eng-review-agent-requirements.md`](./archive/02-plan-eng-review-agent-requirements.md)
Precedes: `03-plan-protected-mcp-cli-preview-deploy`
Last reviewed: 2026-05-18

## Invariant At Stake

Identity, authority, runtime evidence, gateway policy, and breaker isolation must not become ambient authority.

The full object-model obligations from `01` are real, but they are dangerous if implemented as a route explosion or as advisory metadata. Handshake must not let identity, a runtime facade, a contract skill, a gateway policy label, or a breaker observation look like execution permission.

The invariant remains:

```text
No consequential autonomous action executes outside declared bounds,
and divergent behavior must be haltable, isolatable, and reconstructable.
```

The enforcement rule remains narrower:

```text
only a passed gateway check bound to the exact one-use greenlight may precede mutation
```

Everything else is catalog, evidence, policy input, gateway input, lifecycle output, or posture. None of it is mutation authority by itself.

## Decision

Document the authority hardening gate, despite multi-agent review warnings that the full object-model map is too broad for one implementation pass.

This file is not permission to implement all objects at once. It is the checkpoint that prevents a warpath from starting without:

- authority status for every object;
- API/interface rules before any public route is added;
- staged implementation phases;
- invariant tests for every phase;
- explicit blocking criteria before `03`.

For execution order, "run 02" means this narrow gate only:

```text
Phase 0: active-doc vocabulary cleanup and guard scans
Phase 1a: one candidate per compilation and proposal API narrowing
Phase 1b: catalog/envelope digest pinning and immutable bootstrap registration
Phase 1c: secret-safe parameter storage
Phase 1d: pending-only gateway check outcomes with reconciliation finality
```

Phase 2 through Phase 5 remain frozen unless the later `03` plan explicitly claims the corresponding guarantee. Do not implement the full object model as "02." Do not let `02` create product-doc expansion, public routes, hosted surfaces, dashboards, or a second roadmap.

`archive/02-plan-eng-review-agent-requirements.md` is historical agent-requirements input. It is mined by this checkpoint, not executed as a separate phase.

Cloudflare Code Mode is product-pattern inspiration only: compact typed tool surfaces, generated code, and host-dispatched calls. It is not implementation scope for `02`. The Handshake obligation is narrower and harder: every consequential generated branch, tool call, or typed-API operation must reduce to exactly one digest-bound `CandidateAction` inside exactly one `IntentCompilationRecord`, or an explicit compilation refusal, before any `ActionContract` can exist. Multi-candidate compilation is out of scope for this pass.

## Review Verdict Baked In

The review consensus was not "build all of this now." The consensus was:

| Review | Warning | Plan response |
|---|---|---|
| API/interface review | Do not casually publish six new public routes; every route becomes a contract under Hyrum's Law. | New objects do not automatically get public routes. Route approval requires input/output schemas, error semantics, redaction, and invariant tests. |
| Engineering review | Full object-model implementation is too broad as one code pass. | Implementation is split into phases. Each phase must pass before the next phase starts. |
| Adversarial review | Biggest current gaps are candidate binding, direct config authority, caller-declared gateway outcomes, isolation race, raw secrets, weak review authority, and self-declared gateway-policy compatibility. | Phases prioritize those gaps before any product/runtime expansion. |

Blunt constraint:

```text
If a new object is not checked by policy, checked by the gateway, or recorded as evidence,
it is not part of the authority path.
```

## Delivery Progress

Closed out on 2026-05-18:

- Phase 0 active vocabulary cleanup and guard test are implemented. Root active docs and active code now use gateway/protected-surface vocabulary; provenance plans/specs remain excluded from the active scan.
- Phase 1a candidate binding is implemented. `IntentCompilationRecord` embeds exactly one `CandidateAction` for one consequential candidate; `ProposeActionContractInput` is narrowed to `intentCompilationId`, `candidateActionId`, `candidateDigest`, and optional signing material; `ActionContract` derives authority-bearing fields from the embedded candidate.
- Phase 1b catalog/envelope digest pinning is implemented. Candidate material stores canonical digests for the tool capability, action type, gateway registry entry, and operating envelope; proposal refuses drift; bootstrap catalog/envelope registration is idempotent for the same digest and rejects same-ID/different-digest replacement.
- Phase 1c secret-safe parameter storage is implemented for top-level secret-bearing fields. Secret-bearing keys in non-secret params are refused; protocol records store non-secret params/summaries, `secretRefs`, and canonical params digests.
- Phase 1d pending-only gateway outcome semantics are implemented. Public gateway-check input no longer accepts caller-declared downstream success/failure/refusal/unknown; a passed gateway check records pending/submitted mutation evidence until reconciliation proves finality or records a proof gap.
- Existing runtime/gateway flows were updated: package install wrapper, repo write wrapper, codemode multi-action flow, Hono/D1 routes, OpenAPI, and SDK-facing tests.

Verification performed:

```bash
npm run typecheck -- --pretty false
npm run build -- --pretty false
bun test
git diff --check
rg -n "\bReceiver\b|ReceiverGate|receiver_|receiver-|receiver gate|registerReceiver|receiverGate|reconcileReceiver" README.md QUALITY.md Agent-Founder.md src test docs --glob '!docs/plans/**' --glob '!docs/specs/**' --glob '!docs/**/archive/**' --glob '!test/active-vocabulary.test.ts'
```

The explicit vocabulary scan is expected to exit non-zero with no matches.

Still not implemented by `02`:

- `AuthorityGrant`, `AgentIdentity`, durable reviewer authority, production GitHub App, hosted UI, and auth-provider integration.
- Split `GatewayPolicyContract` objects or signed/mechanical gateway policy conformance evidence.
- Public `RuntimeFacadeCall`, public `ContractSkill`, public `CandidateAction`, or multi-candidate compilation.
- Nested secret path syntax; Phase 1 only treats `ToolCapability.secretBearingFields` as top-level parameter keys.
- Production DB-level immutability controls beyond the kernel/store bootstrap write path.

## What Already Exists

The v0.2.2 kernel must prove this closed enforcement loop:

```text
ToolCapability
  -> ActionType
  -> GatewayRegistryEntry
  -> OperatingEnvelope
  -> IntentCompilationRecord
  -> ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt
  -> pending/submitted MutationAttempt, gateway refusal, or ProofGap
  -> Receipt
  -> SurfaceOperationReconciliation for pending/unknown downstream finality
  -> RecoveryRecommendation
  -> IsolationState / BreakerDecision
  -> ContractStreamEvent reconstruction
```

Existing durable mechanics:

- D1 stores generic `protocol_records`, `stream_events`, `greenlight_consumptions`, `greenlight_issuances`, and `recovery_terminal_claims`.
- `greenlight_issuances` is the durable one-greenlight-per-contract claim.
- `greenlight_consumptions` is the one-use gateway-check consumption ledger.
- `BreakerDecision` already records listener ID, listener version, rule pack, observed stream watermarks, and the resulting `IsolationState`.
- Gateway checks already enforce exact contract/greenlight binding, params digest, policy drift mode, sequence dependencies, isolation, replay, and expiration.
- Proof gaps already represent missing or uncertain evidence instead of smoothing missing evidence into success.

Phase 1 obligations now delivered by this closeout:

- `IntentCompilationRecord` must persist one embedded digest-bound `CandidateAction`; `ActionContract` must derive from that candidate only.
- Catalog and envelope registration are bootstrap/setup surfaces, not agent-callable authority; same-ID/different-digest replacement must be rejected.
- Public gateway-check input must not accept caller-declared downstream success, failure, refusal, or unknown finality.
- Raw `ActionContract.parameters` must be non-secret only; `ToolCapability.secretBearingFields` is interpreted as top-level parameter keys in Phase 1.

Residual gaps that this plan must not hide:

- `ReviewDecision` binds digests but does not yet verify reviewer authority against a durable allowed-reviewer source.
- Gateway policy compatibility can be self-declared instead of mechanically proven.
- Direct database access outside the kernel/store bootstrap write path can still corrupt catalog/envelope immutability unless production permissions or migrations close that path.
- `secretRefs` are opaque strings in Phase 1; a later phase must constrain reference format/provider so callers cannot launder raw secret values into refs.

## Full Object Model

The full object set is allowed as design vocabulary. Each object must stay in its lane.

### AuthorityGrant

Purpose: immutable principal/org delegation snapshot.

Required semantics:

- identifies issuer principal, subject principal, organization role, tenant boundary, delegation scope, validity window, and revocation epoch;
- references authority evidence and auth-session evidence without storing tokens or SSO assertions;
- is checked by policy before greenlight;
- is checked again, directly or by snapshot epoch, at gateway check before mutation.

Not allowed:

- no bearer token, JWT body, OAuth refresh token, or session secret;
- no mutation authority by itself;
- no gateway acceptance based only on `authorityGrantId`.

### AgentIdentity

Purpose: immutable runtime/run identity assertion.

Required semantics:

- binds agent ID, run ID, session ID, runtime adapter, runtime version, agent instance, owner principal, model/runtime ref, attestation ref, tool catalog ref, and isolation scope keys;
- records attestation expiry and revocation check time;
- is referenced by compilation, envelope, policy input, and gateway check;
- supports isolation scopes for agent, run, runtime adapter, gateway, resource, and tenant.

Not allowed:

- no raw prompt body unless separately redacted;
- no private key material;
- no claim that agent identity is permission.

### CandidateAction

Purpose: digest-bound candidate emitted by intent compilation.

Required semantics:

- binds tool capability, action type, gateway registry entry, operating envelope, action class, gateway ID, resource ref, canonicalized non-secret params, secret refs, side effects, evidence refs, bounds, idempotency key, sequence dependencies, generated refs, expiry, and the canonical digests of the tool/action/gateway/envelope records used during compilation;
- one `IntentCompilationRecord` contains one `CandidateAction` for one consequential tool call;
- records rejected candidates and overreach reason codes;
- is the only source from which an `ActionContract` may be proposed.

Not allowed:

- no clean compilation for one action followed by proposal of another;
- no raw secret-bearing parameter values;
- no candidate without pinned catalog, gateway registry, and operating-envelope canonical digests;
- no public `CandidateAction` route in Phase 1.

### ContractSkill

Purpose: runtime-facing instruction and grammar evidence.

Required semantics:

- records skill version, runtime family, instruction digest, tool catalog ref, action catalog ref, gateway registry ref, compatible facade versions, example-set refs, refusal-recovery grammar refs, and validity window;
- is evidence/posture only;
- may help an agent propose valid candidates.

Not allowed:

- no public route by default;
- no policy or gateway authority;
- no claim that following the skill prevents raw tool bypass.

### RuntimeFacadeCall

Purpose: evidence from the runtime/tool interception boundary.

Required semantics:

- records runtime adapter, facade version, run ID, agent instance, tool-call ref, raw capability ref, raw params digest, canonical params digest, classification, bypass indicators, candidate action ref, decision status, and refusal/proof-gap refs;
- records raw tool evidence by ref, not by dumping secrets or environment values;
- attaches to `IntentCompilationRecord` as evidence unless a later ADR proves it deserves a lifecycle object.

Not allowed:

- no top-level public resource by default;
- no mutation authority;
- no hidden bypass path marked as protected.

### GatewayPolicyContract

Purpose: immutable gateway policy version or conformance evidence.

Required semantics:

- declares accepted action classes, parameter schema refs, resource binding rules, required greenlight shape, freshness window, idempotency rules, replay rules, evidence requirements, receipt requirements, failure modes, and compensation evidence requirements;
- binds gateway owner, gateway ID, action catalog version, schema source ref, policy signature or conformance report, and supersession;
- is referenced by `GatewayRegistryEntry`, `ActionContract`, `PolicyDecision`, `Greenlight`, and gateway check;
- drift compatibility must be mechanically comparable or backed by signed conformance evidence.

Not allowed:

- no self-declared "compatible stricter" without evidence;
- no compensation callback secrets;
- no public route until input/output, versioning, and drift tests are specified.

### Hardened BreakerDecision

Purpose: durable isolation-producing decision over stream windows.

Required semantics:

- keep `BreakerDecision` as the lifecycle output;
- bind observed stream watermarks, listener version, rule pack version, observed window digest, matched rule IDs, missing evidence, proof gaps, and created isolation state;
- harden races by binding isolation epochs or versions into policy and gateway checks;
- gateway check must re-check isolation immediately before credential use.

Not allowed:

- no separate `BreakerListenerRun` route by default;
- no listener output that merely recommends without writing durable isolation;
- no isolation event that cannot reconstruct the stream window it observed.

## Authority Status Table

| Object | Status | Policy input | Gateway input | Can authorize mutation? | Required evidence |
|---|---|---:|---:|---:|---|
| ToolCapability | Catalog | Yes | Indirect | No | tool catalog digest, wrapper status |
| ActionType | Catalog | Yes | Indirect | No | action catalog digest, schema refs |
| GatewayRegistryEntry | Catalog/gateway binding | Yes | Yes | No | endpoint ref, adapter version, capability status |
| GatewayPolicyContract | Catalog/gateway policy version | Yes | Yes | No | signed policy/conformance digest |
| AuthorityGrant | Policy/gateway input snapshot | Yes | Yes | No | issuer, scope, validity, revocation epoch |
| AgentIdentity | Policy/gateway input assertion | Yes | Yes | No | runtime attestation, run binding, expiry |
| OperatingEnvelope | Attempt boundary | Yes | Indirect | No | authority grant, identity, policy pack |
| ContractSkill | Evidence/posture | Maybe | No | No | instruction digest, grammar refs |
| RuntimeFacadeCall | Evidence | Yes | No | No | raw/canonical digests, bypass classification |
| CandidateAction | Compilation lifecycle output | Yes | Indirect | No | catalog bindings, params digest, evidence refs |
| IntentCompilationRecord | Lifecycle output | Yes | Indirect | No | candidate/rejection records |
| ActionContract | Proposed commitment | Yes | Yes | No | exact binding digest |
| PolicyDecision | Lifecycle output | Yes | Yes | No | policy input digest, decision signature |
| Greenlight | One-use execution authority input | No | Yes | Only through passed gateway check | one exact contract, max uses 1 |
| GatewayCheckAttempt | Enforcement lifecycle output | No | Yes | Gate pass precedes mutation | consumed greenlight, current isolation |
| MutationAttempt | Consequence evidence | No | No | No | downstream operation/refusal evidence |
| Receipt | Audit packet | No | No | No | stream offsets, receipt digest |
| ProofGap | Missing evidence object | Yes | Yes | No | expected vs missing evidence |
| BreakerDecision | Lifecycle output | Yes | Yes through isolation | No | stream watermarks, rule pack |
| IsolationState | Blocking state | Yes | Yes | No | source decision and epoch/version |

## Data Flow

```text
principal authority evidence
  -> AuthorityGrant snapshot
  -> OperatingEnvelope

runtime/run attestation evidence
  -> AgentIdentity assertion
  -> IntentCompilationRecord

generated code/spec/tool call
  -> RuntimeFacadeCall evidence
  -> IntentCompilationRecord containing one CandidateAction
  -> proposeActionContract(intentCompilationId + candidateActionId + candidateDigest)
  -> ActionContract derived from exact candidate, not caller restatement
  -> PolicyDecision over contract + envelope + authority + identity + gateway policy + isolation
  -> Greenlight maxUses=1
  -> GatewayCheckAttempt reloads contract + greenlight + gateway policy + authority/identity snapshot + isolation
  -> pending/submitted mutation attempt or refusal
  -> SurfaceOperationReconciliation proves finality or records proof gap
  -> Receipt/export/recovery evidence and stream reconstruction
```

If any arrow is missing evidence, stale, mismatched, isolated, revoked, or unredacted, the result must be refusal, review, quarantine, halt, or proof gap. It must not be mutation authority.

## API And Interface Rules

No public route is accepted just because an object exists.

Any new route must satisfy these rules before implementation:

- define separate input and output schemas;
- server owns IDs, `schemaVersion`, `createdAt`, canonical digests, signatures, and generated status fields;
- use stable nouns and one route shape per resource;
- do not expose runtime internals as public resources unless an ADR proves consumers need them;
- preserve consistent structured error responses with stable machine-readable codes;
- prove redacted output for generic record reads before storing secret-bearing refs or summaries;
- add OpenAPI and SDK methods only for approved public routes;
- add D1/Hono/SDK tests for every approved route;
- reject or redact raw secrets at the API boundary, not later in internal code;
- prefer immutable snapshots plus supersession over mutable authority records.
- treat catalog and envelope registration routes as bootstrap/setup routes only; they do not give agents runtime authority.

Candidate public surfaces, not approved routes:

| Candidate route | Default decision | Reason |
|---|---|---|
| `/v0.2/authority-grants` | Defer until Phase 2 | Authority snapshots need auth/provenance semantics first. |
| `/v0.2/agent-identities` | Defer until Phase 2 | Identity assertions need attestation and revocation semantics first. |
| `/v0.2/contract-skills` | Cut as public API | Skill text is guidance, not authority. |
| `/v0.2/runtime-facade-calls` | Cut as public API by default | Runtime call evidence should attach to compilation unless proven otherwise. |
| `/v0.2/catalog/gateway-policies` | Defer until Phase 3 | Useful only if policy versioning is mechanically enforced at policy and gateway. |
| `/v0.2/breaker-listener-runs` | Cut as public API by default | `BreakerDecision` already atomically records listener output and isolation. |

## Implementation Phases

This plan is intentionally broad. Implementation must be staged.

### Phase 0: Active-Doc Vocabulary Cleanup And Guard Scans

Goal: stop active docs from teaching pre-01a vocabulary or stale authority claims.

Required changes:

- migrate `README.md`, `QUALITY.md`, and `Agent-Founder.md` to gateway/surface vocabulary;
- explicitly mark historical docs as provenance where old terms remain;
- add or document a scan that excludes provenance docs but fails active docs/code on old receiver routes, SDK methods, object types, event names, and authority-theatre terms.

Gate:

```bash
rg -n "Receiver|ReceiverGate|receiver_|receiver-|receiver gate|registerReceiver|receiverGate|reconcileReceiver" \
  README.md QUALITY.md Agent-Founder.md src test docs \
  --glob '!docs/plans/**' \
  --glob '!docs/specs/**' \
  --glob '!docs/**/archive/**' \
  --glob '!test/active-vocabulary.test.ts'
```

Expected result: no active-code/API/root-doc matches outside explicitly marked historical provenance.

### Phase 1: CandidateAction Digest Binding And Secret-Safe Params

Goal: make intent compilation bind the exact candidate that may later become a contract.

Required slice 1a: candidate cardinality and proposal API

- introduce `CandidateAction` as explicit persisted candidate material inside `IntentCompilationRecord`; do not create a public route or independent lifecycle object in Phase 1;
- state and enforce that one `IntentCompilationRecord` contains one `CandidateAction`;
- give each candidate a stable candidate ID, canonical candidate digest, canonical params digest, non-secret params, redacted non-secret summary, secret refs, generated code/spec refs, sequence dependencies, bounds, expiry, and candidate status;
- record rejected candidates in the same compilation record with reason codes and no contract-proposable digest;
- make `ActionContract` derive action class, gateway ID, resource ref, params digest, idempotency expectation, side effects, and evidence requirements from exactly one candidate;
- change `ProposeActionContractInput` to accept only `intentCompilationId`, `candidateActionId`, `candidateDigest`, and optional signing material;
- reject contract proposal when the candidate ID or digest diverges.

Required slice 1b: catalog/envelope digest binding and bootstrap immutability

- store canonical digests of the tool capability, action type, gateway registry entry, and operating envelope records used during compilation;
- reject proposal if any durable record digest has drifted from the candidate pin;
- make catalog and envelope registration idempotent for same canonical digest and reject same-ID/different-digest replacement;
- keep lifecycle records update-capable where greenlight consumption, recovery status, receipts, and reconciliation require it.

Required slice 1c: secret-safe parameters

- enforce `ToolCapability.secretBearingFields`;
- interpret `secretBearingFields` as top-level parameter keys for this phase;
- reject candidate input that places a secret-bearing key in non-secret params or non-secret summaries;
- replace raw secret-bearing parameters with `secretRefs`, non-secret summaries, and canonical param digests;
- remove raw secret-bearing values from `ActionContract.parameters` rather than relying only on redaction;
- ensure `ActionContract`, stream events, receipts, exports, and generic record reads cannot leak raw secret-bearing values;

Required slice 1d: gateway outcome semantics

- remove or reject public caller-declared `downstreamMode: "succeed" | "fail" | "refuse" | "unknown"`;
- passed gateway check creates only pending/submitted mutation evidence;
- downstream success, failure, refusal, or unknown finality is recorded only by surface-operation reconciliation;
- receipts and exports must distinguish gateway pass from downstream business success.

Blocker status:

```text
Phase 1 is the minimum hard blocker before 03 agent-runtime work.
```

### Phase 2: AuthorityGrant And AgentIdentity Snapshots

Goal: make principal authority and agent identity replayable, revocation-aware inputs checked before policy and before gateway mutation.

Required changes:

- add immutable authority and identity snapshots or assertions;
- bind them into `OperatingEnvelope`, `IntentCompilationRecord`, `ActionContract`, `PolicyDecision`, `Greenlight`, and gateway check;
- policy refuses stale, expired, revoked, mismatched, or missing authority/identity evidence;
- gateway check refuses when authority or identity snapshot is stale, revoked, mismatched, or blocked by isolation.

Blocker status:

```text
Phase 2 blocks 03 only if 03 creates new public runtime/API surfaces or claims org/principal authority enforcement.
```

### Phase 3: GatewayPolicyContract Or Conformance Evidence

Goal: make gateway policy drift mechanically auditable.

Required changes:

- decide whether to split gateway policy out of `GatewayRegistryEntry` or keep it embedded with stronger digest material;
- if split, introduce immutable gateway policy versions under catalog semantics;
- bind policy digest/version into candidate, contract, policy decision, greenlight, and gateway check;
- require same-version or signed/mechanical compatible-stricter evidence;
- refuse unknown or incompatible policy drift before mutation.

### Phase 4: RuntimeFacadeCall And ContractSkill As Evidence/Posture

Goal: preserve runtime and skill evidence without mistaking it for enforcement.

Required changes:

- attach facade call digests, bypass classification, and skill instruction digests to compilation evidence;
- avoid public routes unless a later ADR proves stable consumers;
- require install posture to state `not_enforcing` unless raw sibling mutation tools are absent, blocked, or credentials are removed from the agent.

### Phase 5: Breaker Race Hardening

Goal: prevent isolation races between stream observation, policy, greenlight consumption, and gateway credential use.

Required changes:

- bind isolation epochs/versions or observed watermarks into policy and gateway checks;
- require gateway re-check immediately before credential use;
- keep breaker output atomic: observed stream window plus isolation write;
- record proof gaps for missing stream evidence or stale listener windows.

## Required Test Map For Full Object Model

Closeout note: Phase 0 and Phase 1 tests are complete for this checkpoint. Phase 2 through Phase 5 rows become blocking when those phases are started or when `03` claims their guarantee.

| Invariant | Required tests |
|---|---|
| Clean compilation cannot propose a different contract later. | Candidate digest mismatch refuses proposal; candidate params/resource/action/gateway drift refuses proposal. |
| Config writes cannot manufacture permissive authority without provenance. | Direct permissive config without authority/provenance is refused or marked non-authoritative. |
| Raw secret-bearing params cannot persist. | Contract, stream, receipt, export, and generic record read contain redacted summary/ref only. |
| Revoked authority after greenlight refuses at gateway check. | Greenlight issued before revocation; gateway check after revocation refuses before mutation. |
| Changed agent identity/runtime attestation refuses before mutation. | Identity mismatch between compilation/policy/gateway check refuses. |
| Gateway policy drift is not self-declared. | Same version passes; signed compatible stricter passes with evidence; unknown/incompatible drift refuses. |
| Breaker isolation blocks future policy and already-issued gateway checks. | Isolation after greenlight blocks gateway check before mutation. |
| Public APIs exist only for approved surfaces. | OpenAPI and SDK expose no cut/deferred routes. |
| Caller cannot declare downstream success as proof. | Gateway-check success without downstream evidence creates pending mutation/proof gap or requires signed gateway evidence. |
| Review approval is not naked identity. | Review decision without allowed reviewer evidence refuses greenlight. |

## NOT In Scope

- Auth provider integration.
- Hosted control plane.
- Dashboard, Contract Viewer, or Receipt Timeline UI.
- Payment rails, wallets, settlement, budgets, accounting, or marketplace behavior.
- Production GitHub App implementation.
- Treating identity, contract skills, runtime facade calls, review screens, or gateway policy labels as mutation authority.
- Deployed-data migration.
- v0.3 compatibility aliases.

## 03 Gate

`03-plan-protected-mcp-cli-preview-deploy` must not proceed as if the current protocol can safely accept arbitrary generated runtime calls.

Default gate:

```text
03 was blocked by Phase 0 and Phase 1; that blocker is satisfied for the v0.2.2 protocol kernel.
```

Rationale:

- Phase 0 prevents agents and future maintainers from reading stale receiver-era authority language.
- Phase 1 prevents generated code from compiling one action and proposing another, and prevents secret-bearing params from entering durable protocol evidence.
- Phase 1 also prevents fixture-only gateway outcome inputs from being mistaken for production downstream proof.
- Durable reviewer authority remains Phase 2 unless `03` explicitly claims review authority.

Phase 2 through Phase 5 may be implemented before or during `03` only after a focused plan narrows the slice. If `03` claims org/principal authority enforcement, runtime identity enforcement, gateway policy conformance, durable reviewer authority, production DB immutability, secret-ref provider guarantees, or breaker race safety, then the relevant later phase becomes a blocker before that claim ships.

## Assumptions

- `02` may create a breaking v0.2.2 schema/API change.
- The doc may be broad, but implementation must be phased.
- No new public route is added for `CandidateAction`.
- Multi-candidate compilation is out of scope for this pass.
- Nested secret path syntax is out of scope; Phase 1 handles top-level keys only.
- Auth provider integration, `AuthorityGrant`, `AgentIdentity`, durable reviewer authority, production GitHub App, hosted UI, and gateway policy-contract splitting remain later phases unless `03` explicitly claims them.
- No new public route is approved by this documentation alone.
- D1 generic tables can store new object types, but hot-path lookups may need indexed side tables if authority, identity, or policy checks become frequent.

## Closeout Premortem

If this delivery still fails under real agent behavior, the likely causes are:

1. Generated code escapes the contract boundary by calling an unwrapped sibling tool, raw MCP operation, shell command, browser-side mutator, package manager, repo writer, deploy surface, or cloud API. Phase 1 proves candidate-to-contract binding only for protected paths that enter Handshake.
2. Bootstrap/setup routes are exposed as runtime agent-callable surfaces. Catalog and envelope registration are immutable enough through the kernel path, but they are still setup authority and must not be confused with mutation authority.
3. Secret refs become a secret smuggling channel. Phase 1 rejects top-level secret-bearing parameter keys in non-secret params, but it does not yet prove that every `secretRef` is an opaque provider reference rather than a raw value.
4. Catalog/envelope immutability is bypassed below the kernel. The store path rejects same-ID/different-digest replacement, but production D1 access controls or migration constraints must prevent direct replacement.
5. Review authority is implied by a review record. That remains wrong until Phase 2 adds durable reviewer authority or `03` refuses to claim review authority at all.
6. Pending receipts are misread as downstream success. The receipt proves the gateway check and submitted mutation evidence; finality belongs to `SurfaceOperationReconciliation` or a proof gap.
7. Gateway policy drift is waved through as "compatible stricter." That remains advisory until a mechanical or signed conformance mechanism exists.
8. Breaker/isolation races remain possible around already-issued greenlights unless later phases bind isolation epochs or re-checks directly at credential-use time.

## Brutal Verdict

Keep the full object model as the map. Do not pretend `02` implemented it all.

The immediate hardening path that `02` owned is now delivered:

```text
active vocabulary guard
  -> one digest-bound CandidateAction per compilation
  -> ActionContract derived only from candidate id + digest
  -> immutable-enough bootstrap catalog/envelope registration
  -> secret-safe params
  -> pending-only gateway checks with reconciliation finality
  -> then choose authority/identity, gateway policy, runtime evidence, or breaker hardening as separate phases
```

Smallest next mechanism: before `03-plan-protected-mcp-cli-preview-deploy`, decide whether `03` only uses the protected package-install/repo-write gateway path now hardened here, or whether it claims a later guarantee that must become the next narrow phase.
