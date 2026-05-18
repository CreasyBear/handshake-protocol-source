# Handshake Codebase Quality Standards

This document defines the repo quality bar for Handshake.

Handshake is a protocol-first product. Code quality is not just about cleanliness; it is about preserving the protocol invariant:

> No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

The repo should make sloppy authority, vague naming, hidden mutation, accidental greenlight reuse, missing receipts, and untraceable state transitions hard to introduce.

---

## 1. Repo mantra

```text
Protocol clarity over clever abstraction.
Gateway enforcement over runtime promises.
Receipts over logs.
Proof gaps over fake certainty.
One greenlight, one gateway-checked attempt.
No mutation without reconstructable evidence.
```

Every meaningful code review should be able to point back to one of these lines.

---

## 2. Protocol language is sacred

Use Handshake vocabulary exactly. Do not casually rename protocol objects because the protocol depends on precise meaning.

### Preferred terms

```text
Principal
AgentIdentity
OperatingEnvelope
IntentRecord
IntentCompilation
ActionContract
PolicyDecision
Greenlight
GatewayCheck
Receipt
Refusal
ProofGap
IsolationState
```

### Avoid vague substitutes

```text
approval
permission
auth
log
event
trace
job
task
run
safe action
agent request
execution token
```

These words may appear in user-facing explanations only when they are explicitly mapped back to Handshake protocol objects.

### Examples

Bad:

```ts
const approval = await approveAction(action);
```

Good:

```ts
const decision = await evaluateActionContract(contract);

if (decision.type === "greenlight") {
  const greenlight = await issueGreenlight(contract, decision);
}
```

Bad:

```ts
await logActionResult(result);
```

Good:

```ts
await recordReceipt({
  contractId,
  gatewayCheckResult,
  executionAttemptResult,
  proofGap,
});
```

---

## 3. Repo-wide module ownership

Each module must have one reason to exist and one owner for the meaning it
contains. Handshake should avoid monoliths, but it should also avoid shallow
file sprawl. The target is deep modules: small interfaces that hide meaningful
behavior and concentrate locality.

Current v0.2 layout:

```text
src/protocol/   = protocol meaning and transition invariants
src/http/       = Hono transport adapter and hosted caller custody
src/sdk/        = remote client over public HTTP transition routes
src/runtime/    = runtime wrappers that compile generated tool calls into candidates
src/adapters/   = reference mutation adapters that require VerifiedGatewayCheck
src/storage/    = ProtocolStore implementations and atomic storage primitives
test/           = invariant, conformance, posture, and integration evidence
docs/           = product, protocol, plan, ADR, and reference truth owners
```

Rules:

- `src/protocol` owns Handshake meaning. It must not import Hono, SDK, runtime
  wrappers, adapters, storage implementations, Workers, or product surfaces.
- `src/protocol/kernel.ts` is the named transition facade. It delegates to
  invariant-owned protocol areas; it must not grow primitive logic that belongs
  to an area.
- Protocol area modules are organized by invariant, not file type. A valid area
  owns its local `schemas.ts`, `inputs.ts`, guards, transition function,
  constructors, event descriptors, and tests.
- Root `src/protocol/schemas.ts` and `src/protocol/inputs.ts` are public
  compatibility aggregators only. Protocol internals, storage adapters,
  reference adapters, and runtime wrappers must import from owning area indexes.
- `src/http` is a transport adapter. It may parse requests, check caller
  custody, build request context, invoke one kernel transition, map errors, and
  describe OpenAPI. It must not decide policy, lifecycle, gateway, review,
  proof-gap, recovery, or object meaning.
- HTTP transition files have separate owners: `transition-route-registry.ts`
  owns route metadata, `transition-invokers.ts` owns kernel dispatch, and
  `transition-response-schemas.ts` owns transport response shape composition.
  `openapi.ts` reads route metadata; `app.ts` owns Hono request flow.
- `src/sdk` is a remote client. It may mirror public transition routes and
  caller-custody headers. It must not reimplement policy or infer protocol
  state from responses.
- `src/runtime` may inspect runtime/tool input and call `compileIntent` /
  `proposeActionContract`. It must not issue policy decisions, greenlights,
  gateway checks, receipts, or mutations.
- `src/adapters` may mutate only after a `VerifiedGatewayCheck`. Reference
  adapters call protocol interfaces, not storage internals.
- `src/storage` implements `ProtocolStore` and atomic index/commit behavior.
  Storage must not decide what a policy result, lifecycle state, proof gap,
  review artifact, recovery status, or gateway refusal means.
- D1 storage keeps `d1.ts` as the `ProtocolStore` implementation and keeps SQL
  mutation statement assembly in `d1-statements.ts`. Storage-private files may
  express database mechanics; they must not define protocol primitives or
  reinterpret protocol outcomes.
- Tests should target module interfaces and protocol invariants. Import-posture
  tests are architecture tests, not hygiene tests.

Dependency direction:

```text
HTTP / SDK / runtime / adapters
  -> public protocol surfaces
  -> HandshakeKernel
  -> area-owned protocol modules
  -> ProtocolRecorder / ProtocolStore port
  -> storage adapters
```

Forbidden direction:

```text
protocol -> http/sdk/runtime/adapters/storage implementation
storage -> protocol primitive modules
runtime/adapters -> root protocol schemas/inputs compatibility aggregators
transport -> protocol area internals
area module -> another area's private file
```

Use the deletion test before adding a module:

```text
If deleting the module would make its rules reappear across several callers, it
is earning its keep. If deleting it only removes a pass-through wrapper, it is
file sprawl.
```

Use the two-adapter test before inventing a seam:

```text
One adapter is a hypothesis. Two adapters make the seam real. Until then, prefer
a narrow private helper inside the owning module.
```

When a file feels too large, split by owned step, not by convenience:

```text
Good: gateway commit assembly, replay refusal receipt builder, posture evaluator
Bad: helpers, utils, common, misc, handler extras
```

Architecture acceptance gates:

```text
bun test test/import-posture.test.ts test/root-exports.test.ts
bun test test/protected-mutation-adapter-conformance.test.ts
npm run typecheck -- --pretty false
git diff --check
```

---

## 4. Naming standards

Prefer boring names over clever names.

Bad:

```ts
bless();
stamp();
gatekeep();
zap();
agentVibeCheck();
```

Good:

```ts
evaluatePolicy();
issueGreenlight();
verifyGatewayCheck();
recordRefusal();
recordProofGap();
```

Names should mirror the protocol loop:

```text
recordIntent
recordIntentCompilation
proposeActionContract
canonicalizeActionContract
evaluatePolicy
issueGreenlight
verifyGatewayCheck
recordReceipt
recordRefusal
recordProofGap
activateIsolation
```

If a function changes durable state, its name must say so.

Good:

```ts
recordReceipt();
persistPolicyDecision();
markIsolationActive();
consumeGreenlight();
```

Bad:

```ts
handleReceipt();
processDecision();
checkGreenlight();
```

`checkGreenlight()` sounds read-only. If the function consumes a one-time-use greenlight, name it `consumeGreenlightAfterGatewayCheck()` or split verification from consumption.

---

## 5. TypeScript conventions

Use `PascalCase` for protocol types:

```ts
type ActionContract = {};
type PolicyDecision = {};
type GatewayCheck = {};
type ProofGap = {};
```

Use `camelCase` for runtime variables:

```ts
const actionContract = ...;
const policyDecision = ...;
const gatewayCheckResult = ...;
```

Use `snake_case` for persisted database columns:

```sql
contract_id
principal_id
greenlight_id
gateway_id
created_at
expires_at
canonical_hash
```

Use branded IDs to prevent accidental cross-use:

```ts
type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type PrincipalId = Brand<string, "PrincipalId">;
export type ActionContractId = Brand<string, "ActionContractId">;
export type GreenlightId = Brand<string, "GreenlightId">;
export type ReceiptId = Brand<string, "ReceiptId">;
```

This prevents bugs like passing a `greenlightId` where a `contractId` is expected.

Recommended `tsconfig` posture:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true
  }
}
```

---

## 6. Schema-first protocol objects

Every protocol object must have:

```text
TypeScript type
runtime validation schema
JSON serialization form
canonicalization behavior, if applicable
database mapping, if persisted
test fixture
documentation example
```

Preferred pattern:

```ts
export const ActionContractSchema = z.object({
  actionContractId: ActionContractIdSchema,
  principalId: PrincipalIdSchema,
  agentId: AgentIdSchema,
  runId: RunIdSchema,
  gatewayId: GatewayIdSchema,
  actionClass: ActionClassSchema,
  resourceRef: ResourceRefSchema,
  paramsDigest: DigestSchema,
  idempotencyKey: z.string(),
  expiresAt: IsoDateTimeSchema,
  actionContractDigest: DigestSchema,
});

export type ActionContract = z.infer<typeof ActionContractSchema>;
```

No untyped protocol payloads.

Avoid:

```ts
payload: any;
metadata: any;
context: any;
```

If extensibility is needed, make it explicit:

```ts
extensions?: Record<string, JsonValue>;
```

Document what may and may not live in `extensions`.

---

## 7. Keep protocol code pure where possible

Core protocol functions should be deterministic and side-effect-free.

Good pure functions:

```ts
canonicalizeActionContract(contract);
hashActionContract(canonicalContract);
assertGreenlightMatchesContract(greenlight, contract);
isGreenlightExpired(greenlight, now);
isReplayAttempt(greenlight, receiptHistory);
assertAllowedTransition(from, to);
```

Impure functions should be obvious:

```ts
storeActionContract(db, contract);
recordPolicyDecision(db, decision);
markGreenlightUsed(db, greenlightId);
writeReceipt(db, receipt);
```

Rule:

```text
Pure protocol logic should be easy to test without a database, network, Worker runtime, or gateway.
```

---

## 8. State transitions must be explicit

Handshake is a protocol/state-machine product. Do not allow ad hoc status changes.

Bad:

```ts
contract.status = "greenlit";
await db.save(contract);
```

Good:

```ts
const transition = transitionActionContract({
  from: contract.status,
  to: "greenlit",
  reason: "policy_decision_greenlight",
  actor: "policy_evaluator",
});

await storeTransition(db, transition);
```

Maintain a single transition map per protocol lifecycle:

```ts
export const ACTION_CONTRACT_TRANSITIONS = {
  proposed: ["policy_evaluating", "expired"],
  policy_evaluating: ["greenlit", "refused", "review_required", "halted", "quarantined"],
  greenlit: ["gateway_checking", "expired"],
  gateway_checking: ["mutation_attempted", "gateway_refused", "proof_gap_recorded"],
  mutation_attempted: ["receipt_recorded", "proof_gap_recorded"],
} as const;
```

Every transition must be:

```text
validated
persisted
timestamped
attributed
reconstructable
```

---

## 9. DRY mechanics, not meaning

Do not abstract too early.

Some repetition is healthy if it keeps protocol stages legible.

Acceptable repetition:

```ts
recordActionContract();
recordPolicyDecision();
recordGatewayCheckResult();
recordReceipt();
```

Bad abstraction:

```ts
recordThing();
processEntity();
handleLifecycleObject();
```

Rule:

```text
DRY mechanics, not protocol meaning.
```

Good DRY:

```ts
parseJsonBody();
validateWithSchema();
writeAuditRow();
generateId();
getCurrentTimestamp();
```

Bad DRY:

```ts
handleProtocolObject();
advanceHandshakeThing();
approveOrReject();
```

Protocol objects deserve explicit names even if their code shapes are similar.

---

## 10. No hidden mutation

No function should mutate external systems unless it passes through a gateway-check path.

Allowed mutation functions should live only in gateway adapters:

```text
src/adapters/*/gateway.ts
```

Runtime wrappers propose contracts, not mutations:

```text
src/runtime/*/tool-wrapper.ts
```

Protocol policy areas decide, not mutate:

```text
src/protocol/policy-greenlight/
```

Protocol areas define meaning and transitions, not external mutation:

```text
src/protocol/
```

Required adapter signature pattern:

```ts
export async function deployPreview(input: {
  verifiedGate: VerifiedGatewayCheck;
  contract: PreviewDeployContract;
}): Promise<PreviewDeployResult> {
  // mutation happens here
}
```

Bad:

```ts
export async function deployPreview(branch: string) {
  // no verified gate
}
```

Rule:

```text
Only gateway adapters may call external mutation APIs.
Every mutation adapter must require a VerifiedGatewayCheck.
```

---

## 11. Gateway-gate checks must be structured

The gateway check is the enforcement point before consequence. It must not be advisory.

A gateway check should verify at least:

```text
contract hash matches
greenlight binds to contract
greenlight binds to gateway
greenlight binds to action family
greenlight binds to target resource
greenlight is unexpired
greenlight is unused
idempotency key matches
isolation state allows execution
policy decision is valid
gateway version is acceptable
```

Return structured results. Do not return bare booleans.

Preferred shape:

```ts
type GatewayCheckResult =
  | {
      type: "passed";
      verifiedGate: VerifiedGatewayCheck;
    }
  | {
      type: "failed";
      reason: GatewayCheckFailureReason;
    }
  | {
      type: "proof_gap";
      missingEvidence: string[];
    };
```

Bad:

```ts
if (await checkGate(greenlight)) {
  await mutate();
}
```

Good:

```ts
const gateResult = await verifyGatewayCheck(input);

if (gateResult.type !== "passed") {
  await recordGatewayRefusalOrProofGap(gateResult);
  return gateResult;
}

await mutateWithVerifiedGate(gateResult.verifiedGate);
```

---

## 12. Greenlights are one-time, exact, gateway-bound authority

A greenlight must not become reusable ambient permission.

Required checks:

```text
one contract
one gateway
one action family
one target
one attempt
one expiry
one idempotency key
one canonical hash
```

Bad:

```ts
const greenlight = await getGreenlightForSession(sessionId);
await deployPreview(greenlight, branchA);
await deployPreview(greenlight, branchB);
```

Good:

```ts
const contract = await proposeActionContract(previewDeployInput);
const decision = await evaluatePolicy(contract);
const greenlight = await issueGreenlight(contract, decision);
const gate = await verifyGatewayCheck({ contract, greenlight });

await deployPreview({ verifiedGate: gate.verifiedGate, contract });
```

Any attempted greenlight reuse must be rejected and recorded.

---

## 13. Proof gaps are first-class outcomes

Missing evidence is not a logging problem. It is a protocol outcome.

Bad:

```ts
try {
  await recordReceipt(result);
} catch {
  console.error("receipt failed");
}
```

Good:

```ts
if (!executionEvidence) {
  await recordProofGap({
    contractId,
    expectedEvidence: ["deployment_result"],
    knownFacts: gateResult,
    uncertainty: "gateway_check_passed_but_downstream_execution_unknown",
  });
}
```

Avoid language like:

```text
assume success
probably executed
best effort receipt
```

Unless uncertainty is explicitly recorded as a `ProofGap`.

---

## 14. Errors are part of the product

Errors must protect and teach the protocol.

Bad:

```text
Invalid request
Forbidden
Something went wrong
```

Good:

```text
GREENLIGHT_GATEWAY_MISMATCH:
This greenlight was issued for gateway preview-deploy:vercel,
but the gateway check was checked by gateway repo-write:github.
A greenlight authorizes exactly one gateway-bound mutation attempt.
```

Maintain stable error codes:

```ts
export const HandshakeErrorCode = {
  CONTRACT_SCHEMA_INVALID: "CONTRACT_SCHEMA_INVALID",
  CONTRACT_HASH_MISMATCH: "CONTRACT_HASH_MISMATCH",
  GREENLIGHT_EXPIRED: "GREENLIGHT_EXPIRED",
  GREENLIGHT_ALREADY_USED: "GREENLIGHT_ALREADY_USED",
  GREENLIGHT_GATEWAY_MISMATCH: "GREENLIGHT_GATEWAY_MISMATCH",
  GATEWAY_CHECK_REQUIRED: "GATEWAY_CHECK_REQUIRED",
  ISOLATION_ACTIVE: "ISOLATION_ACTIVE",
  PROOF_GAP_RECORDED: "PROOF_GAP_RECORDED",
} as const;
```

Every error should explain:

```text
what failed
which invariant was protected
which object was involved
what the developer should do next
```

---

## 15. Housekeeping: no junk drawers

Avoid generic directories:

```text
utils
helpers
common
misc
stuff
```

Prefer narrow directories:

```text
ids
time
json
canonicalization
state-machine
errors
validation
storage
```

Bad:

```text
src/utils/doStuff.ts
```

Good:

```text
src/canonicalization/canonicalize-action-contract.ts
src/greenlights/assert-greenlight-not-expired.ts
src/gateway-check/verify-gateway-binding.ts
```

A file should be named after the thing it exports.

Good:

```text
action-contract.schema.ts
action-contract.types.ts
canonicalize-action-contract.ts
policy-decision.schema.ts
verify-gateway-check.ts
record-proof-gap.ts
```

---

## 16. File and function size standards

Useful defaults:

```text
one file: ideally < 250 lines
one function: ideally < 50 lines
one route handler: ideally < 80 lines
one test file: can be longer if organized by invariant
```

These are pressure signals, not automatic refactor commands. A 300-line file
with one clear owner can be safer than six shallow files that hide a state
transition across imports.

When a file grows, split by owned responsibility inside the same area first.

Bad split:

```text
big-handler.ts
handler-utils.ts
more-utils.ts
```

Good split:

```text
action-contract/load-proposal-records.ts
action-contract/build-contract-binding.ts
gateway-gate/build-gate-records.ts
gateway-gate/commit-gateway-check.ts
recovery/build-status-change.ts
```

Do not create a new public module just because a private function got long. A
new public module must pass the deletion test and name the invariant it owns.

---

## 17. Hono route handlers should be thin

Route handlers should orchestrate. They should not contain protocol logic.

Good:

```ts
app.post("/v0/contracts", async (c) => {
  const body = await parseJson(c);
  const input = ActionContractProposalSchema.parse(body);

  const contract = await proposeActionContract({
    input,
    now: c.var.now,
    ids: c.var.ids,
  });

  await contractStore.insert(contract);

  return c.json({ contract }, 201);
});
```

Bad:

```ts
app.post("/v0/gateway-checks/check", async (c) => {
  // 200 lines of validation, policy, replay checks, mutation, receipt handling...
});
```

Preferred:

```ts
const result = await checkGatewayCheck({
  input,
  stores,
  now,
});
```

---

## 18. Storage names should mirror protocol objects

D1 tables should be boring and obvious:

```text
principals
agent_identities
operating_envelopes
intent_records
intent_compilations
action_contracts
policy_decisions
greenlights
gateway_check_attempts
receipts
refusals
proof_gaps
isolation_states
state_transitions
```

Avoid generic tables:

```text
events
logs
actions
requests
jobs
tasks
```

An append-only `events` table is acceptable as supplementary infrastructure, but it must not replace protocol-specific records.

---

## 19. Migrations are protocol history

Never casually edit old migrations.

Rules:

```text
every migration has a number, name, and purpose
never rewrite applied migrations
every protocol object table has created_at
every state-changing table has actor/source fields
every evidence-bearing row has hash/reference fields where appropriate
rollback exists only when rollback is genuinely safe
```

Example:

```text
0001_create_principals.sql
0002_create_operating_envelopes.sql
0003_create_action_contracts.sql
0004_create_policy_decisions.sql
0005_create_greenlights.sql
0006_create_gateway_check_attempts.sql
0007_create_receipts_refusals_and_proof_gaps.sql
0008_create_isolation_states.sql
```

---

## 20. Tests are invariant-based

Do not only test happy paths.

The most important test suite should be:

```text
tests/invariant/
```

Minimum invariant tests:

```text
cannot issue greenlight without action contract
cannot issue greenlight for non-canonical contract
cannot mutate without gateway check check
cannot reuse greenlight
cannot use expired greenlight
cannot use greenlight for wrong gateway
cannot use greenlight after isolation state is active
cannot treat operating envelope as mutation permission
cannot treat vague intent as mutation permission
cannot treat receipt as downstream execution proof
must record proof gap when evidence is missing
must preserve audit reconstruction chain
```

Test names should read like protocol rules:

```ts
test("a greenlight cannot be reused for a second gateway-checked attempt", async () => {});
test("an operating envelope authorizes attempts but not mutation", async () => {});
test("a receipt distinguishes gateway check from downstream execution", async () => {});
```

---

## 21. Adapters stay thin

Adapters should not invent policy or protocol semantics.

Good adapter responsibilities:

```text
accept VerifiedGatewayCheck
map verified contract parameters into one protected-surface mutation
execute mutation only after verified gate
return evidence for same-operation reconciliation
```

Bad adapter responsibilities:

```text
decide whether action is allowed
silently retry mutation
convert vague intent into approval
swallow missing evidence
issue greenlights
```

Adapters are bridges, not mini Handshake implementations.

---

## 22. Comments explain invariants, not obvious code

Bad:

```ts
// Check if greenlight is expired
if (greenlight.expiresAt < now) {
  ...
}
```

Good:

```ts
// A greenlight is one-time, time-bounded execution authority.
// Expired greenlights must fail at the gateway check even if policy once allowed the contract.
if (greenlight.expiresAt < now) {
  ...
}
```

The best comments explain why a sharp rule exists.

---

## 23. Use `unsafe` prefixes deliberately

If something bypasses a normal safety path for tests or local demos, mark it loudly.

```ts
unsafeCreateGreenlightForTest();
unsafeBypassGatewayCheckForFixture();
unsafeSeedReceiptWithoutMutation();
```

Rules:

```text
unsafe* functions must not be exported from production packages
unsafe* functions must only appear in tests, fixtures, or local demos
unsafe* functions require comments explaining why they exist
```

---

## 24. No ambient authority in config

Config should not quietly grant mutation power.

Bad:

```text
ALLOW_ALL_ACTIONS=true
```

Better:

```text
HANDSHAKE_DEV_MODE_ALLOW_REFERENCE_FIXTURE_GATEWAY=true
```

Production defaults must be conservative.

Recommended environment naming:

```text
HANDSHAKE_ENV=local | staging | production
HANDSHAKE_RECEIPT_STORE=d1
HANDSHAKE_ALLOW_UNVERIFIED_GATEWAY=false
```

Dangerous config must be impossible or noisy outside local development.

---

## 25. Dependencies must be boring

Because Handshake is a protocol product, dependencies should be conservative.

Rules:

```text
prefer small, well-maintained dependencies
avoid dependencies in protocol core unless necessary
avoid packages that affect canonicalization unpredictably
avoid deep framework coupling inside protocol
pin critical dependencies
review transitive dependencies for adapter packages
```

Suggested dependency boundaries:

```text
protocol: zod, minimal crypto/canonical JSON helpers
http: hono, cloudflare worker types
storage: D1-specific code isolated behind interfaces
runtime/adapters: concrete integration dependencies only when needed
```

`src/protocol` must not depend on Hono, D1, React, or Cloudflare-specific
runtime APIs.

---

## 26. Documentation lives beside code

Every protocol object should have documentation close to its implementation.

Example:

```text
src/protocol/action-contract/
  schemas.ts
  inputs.ts
  guards.ts
  transitions.ts
  index.ts
test/kernel.test.ts
```

`action-contract.md` should explain:

```text
what it is
what it is not
required fields
lifecycle
examples
common mistakes
```

This keeps protocol meaning from becoming tribal knowledge.

---

## 27. The no-theatre rule

Handshake must not imply enforcement it does not provide.

Avoid names that overclaim:

```text
ensureSafeExecution()
guaranteeDeployment()
proveExecution()
trustedAgent()
secureApproval()
```

Prefer exact names:

```text
verifyGatewayCheck()
recordExecutionAttempt()
recordProofGap()
issueGreenlight()
evaluatePolicyDecision()
```

Product and code must preserve these distinctions:

```text
vague intent is not permission
operating envelope is not mutation authority
action contract is not execution authority
greenlight is not gateway acceptance
receipt is not automatic downstream execution proof
runtime enforcement is not gateway enforcement
```

If the gateway does not enforce the gateway check, the system is advisory, not Handshake.

---

## 28. Lintable rules to enforce

Encode as many standards as possible mechanically.

Recommended rules:

```text
no explicit any in protocol packages
no default exports in protocol packages
no circular dependencies
no imports from http/sdk/runtime/adapters/storage implementation into protocol
no imports from storage into protocol primitive modules
no root protocol schema/input compatibility imports from protocol internals, storage, runtime, or adapters
no mutation API calls outside adapters
no unsafe* exports from production entrypoints
consistent type imports
strict TypeScript
exact optional property types
no unchecked indexed access
max function complexity
```

Architecture rules should fail CI, not depend on memory.

---

## 29. Pull request checklist

Every PR must answer the protocol question.

Use this checklist in the PR template:

```md
## Protocol impact

Which protocol object does this touch?

- [ ] Principal
- [ ] AgentIdentity
- [ ] OperatingEnvelope
- [ ] IntentRecord
- [ ] IntentCompilation
- [ ] ActionContract
- [ ] PolicyDecision
- [ ] Greenlight
- [ ] GatewayCheck
- [ ] Receipt
- [ ] Refusal
- [ ] ProofGap
- [ ] IsolationState
- [ ] None

## Invariant protected

What invariant does this preserve or strengthen?

## Mutation boundary

Can this code cause or enable consequential mutation?

- [ ] No
- [ ] Yes, and it passes through gateway check verification

## Evidence

What receipt, refusal, transition, or proof gap is recorded?

## Tests

Which invariant test was added or updated?

## Product claim safety

Does this PR imply more enforcement than the protocol actually provides?

- [ ] No
- [ ] Yes, and the language/design was corrected
```

---

## 30. Merge quality bar

Before merging, ask:

```text
Does this preserve exact protocol language?
Does this make mutation harder to perform accidentally?
Does this keep gateway enforcement clear?
Does this improve reconstruction?
Does this record refusal or proof gap honestly?
Does this keep the first wedge sharper?
Does this avoid fake safety?
```

If the answer is no, cut or redesign.

---

## 31. Code smell checklist

Investigate any code that contains:

```text
approve
permission
authenticated = authorized
logAction
runTask
executeWithoutGate
bestEffort
assumeSuccess
allowAll
skipVerification
trustedAgent
handleThing
payload: any
metadata: any
status =
```

These are not automatically wrong, but they are suspicious in a protocol repo.

---

## 32. The standard

A Handshake code path is good when a future maintainer can answer:

```text
Which principal was represented?
Which agent/runtime acted?
Which operating envelope applied?
Which exact action contract was proposed?
Which policy decision was made?
Was a greenlight issued?
Which gateway check checked it?
Did mutation occur?
What receipt, refusal, or proof gap remains?
Can this be reconstructed later?
```

If the code cannot help answer those questions, it is not yet Handshake-quality code.
