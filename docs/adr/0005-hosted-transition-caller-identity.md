# ADR 0005: Hosted Transition Caller Identity

Status: Accepted
Date: 2026-05-18
Owner: Protocol owner
Implementation owner: [`04-plan-eng-review-hosted-caller-identity.md`](../plans/04-plan-eng-review-hosted-caller-identity.md)
Narrows: [`0001-kernel-evidence-boundaries.md`](./0001-kernel-evidence-boundaries.md)
Blocks: hosted or multi-tenant deployment claims

## Invariant At Stake

Caller custody is not principal authority.

The current local HTTP surface uses static role bearer tokens for
`control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
Those tokens prove only that a caller knows a local transition-lane secret. They
do not prove tenant membership, organization membership, principal authority,
agent identity, reviewer authority, gateway ownership, or permission to mutate a
protected surface.

In a hosted or multi-tenant deployment, accepting transition bodies based only on
static lane tokens would let any holder of a lane token write records for any
`tenantId` and `organizationId` they put in the body.

That is caller custody laundering into org authority.

## Decision

Before any hosted or multi-tenant claim, Handshake must replace static
transition bearer-token-only admission with a server-verified
`TransitionCallerIdentity` check at the HTTP boundary.

The hosted transition boundary is:

```text
HTTP request
  -> authenticate caller through hosted identity provider or gateway-held service credential
  -> derive TransitionCallerIdentity on the server
  -> verify route custody role
  -> verify tenant/org scope before body can commit records
  -> parse and validate request body
  -> verify body tenantId/organizationId match allowed caller scope
  -> commit TransitionRequestContext with caller identity digest/ref
  -> invoke exactly one kernel transition
```

`TransitionCallerIdentity` is entrypoint authorization for transition APIs. It
is not mutation authority.

The exact mutation authority path remains:

```text
ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt
```

## Primitive

The primitive is an immutable hosted caller assertion reduced to scope and role:

```text
TransitionCallerIdentity
  callerIdentityRef
  callerSubjectDigest
  tenantId
  organizationId
  custodyRoles[]
  authProviderRef
  authSessionDigest | serviceCredentialDigest
  issuedAt
  expiresAt
  revocationEpochRef
  claimsDigest
```

It may be recorded directly as a protocol evidence object later, or captured as
digest/ref fields on `TransitionRequestContext` first. The implementation plan
owns that storage choice.

It must never store:

- raw JWTs;
- OAuth refresh tokens;
- session cookies;
- API keys;
- SSO assertions;
- raw email addresses or human-readable principal identifiers unless separately
  redacted and approved for storage.

## Boundary

`TransitionCallerIdentity` may authorize:

- entering a specific transition route;
- using a specific custody role;
- writing transition records only for an allowed tenant/org scope;
- producing audit evidence that a hosted caller invoked the transition.

It must not authorize:

- issuing an `ActionContract`;
- greenlighting an action;
- reusing a greenlight;
- bypassing gateway checks;
- changing the principal named in an `OperatingEnvelope`;
- proving that the principal understood or approved the consequence;
- proving that an agent/runtime identity is trustworthy;
- proving reviewer authority for review decisions;
- proving gateway ownership or provider-side enforcement.

Those require separate protocol objects or policy checks.

## Relationship To Existing Identity-Like Fields

Current fields stay in their lanes:

| Field or Object | Meaning | Authority Boundary |
|---|---|---|
| Static transition bearer token | Local single-tenant custody secret for a transition lane. | Local/testing only; not hosted org authority. |
| `X-Handshake-Request-Identity` | Opaque request correlation token. | Audit/correlation only. |
| `X-Handshake-Originating-Identity` | Optional digest/ref of upstream origin. | Audit evidence only; never auth. |
| `callerCustodyRole` | Transition lane used for the request. | Route admission only. |
| `tenantId` / `organizationId` in body | Claimed target scope. | Must match hosted caller scope before commit. |
| `principalId` in body | Protocol subject/principal being represented. | Not trusted from caller identity alone. |
| Future `AuthorityGrant` | Principal/org delegation snapshot. | Policy and gateway input, not route auth. |
| Future `AgentIdentity` | Runtime/run identity assertion. | Compilation/policy/gateway input, not route auth. |

Do not collapse these into one `identity` field.

## Hosted Enforcement Rules

Hosted transition routes must fail closed when:

1. caller identity is missing or unauthenticated;
2. caller identity is expired or revoked;
3. caller lacks the custody role required by the route registry;
4. caller tenant/org scope does not match the body scope;
5. body attempts cross-tenant or cross-organization writes;
6. request identity or originating identity is used as a substitute for caller
   identity;
7. raw identity provider tokens would be stored in protocol records, events,
   receipts, exports, or errors.

Failures must occur before any protocol record commits.

## Local Alpha Compatibility

Static role bearer tokens remain acceptable for local alpha and single-tenant
fixtures only when the deployment does not claim hosted, multi-tenant,
organization-scoped, SSO-backed, or public control-plane authority.

Local alpha docs and SDK examples may keep `transitionToken` and
`transitionTokens` as fixture custody helpers, but must label them as local
custody. They must not present them as org auth, principal auth, or production
access control.

## Non-Claims

- This ADR does not implement hosted auth.
- This ADR does not choose an identity provider.
- This ADR does not add SSO, SCIM, RBAC administration, user management, or
  billing roles.
- This ADR does not create `AuthorityGrant` or `AgentIdentity`.
- This ADR does not make hosted caller identity into mutation permission.
- This ADR does not expose public raw record reads.
- This ADR does not change the local v0.2.3 transition-token behavior.

## Rejected Alternatives

### Keep Static Per-Role Tokens For Hosted

Rejected. Role tokens alone have no tenant/org binding. They are acceptable for
local custody, but hosted use would let the token holder self-assert record scope
through request bodies.

### Treat `X-Handshake-Originating-Identity` As Caller Auth

Rejected. That header is supplied by the caller. It is useful as digest/ref audit
evidence, but if it becomes authority, any runtime can claim to be an admin.

### Implement Full Principal Authority Now

Rejected for this follow-up. `AuthorityGrant` and `AgentIdentity` are real future
objects, but the hosted caller-auth blocker is narrower: route entry and
tenant/org scope. Pulling the full delegation model into this ADR would block
Plan 03 local graph work on a broader identity platform.

### Bind Caller Identity Directly Into Greenlights

Rejected. Greenlights bind exact action contracts, policy decisions, gateway
registry entries, protected surfaces, params digests, and isolation snapshots.
Hosted caller identity may be policy input later, but it cannot replace the
principal/agent/gateway authority objects the action path needs.

## Consequences

Good:

- Hosted transition writes cannot self-assert tenant/org scope.
- Static transition tokens remain explicitly local fixture custody.
- Request identity and originating identity stay audit evidence.
- Future principal authority and agent identity work remains separate and
  smaller.

Cost:

- Hosted deployment needs an auth boundary before it can claim org-scoped use.
- Tests must cover pre-body-parse failure, wrong-role failure, wrong-org failure,
  expired/revoked caller failure, and raw-token non-persistence.
- Public SDK docs need separate local-token and hosted-auth language.

## Proof Plan

A future hosted-caller-identity implementation plan must prove:

1. transition route auth still runs before body parsing;
2. hosted caller identity is derived server-side, not read from a caller-supplied
   authority header;
3. role claims are checked against the route registry;
4. tenant/org claims are checked before any body-scoped transition record commits;
5. wrong tenant/org requests commit no protocol records;
6. request identity and originating identity cannot satisfy caller auth;
7. `TransitionRequestContext` records only caller identity digest/ref evidence;
8. raw provider tokens, raw sessions, raw JWTs, and raw emails do not appear in
   records, events, receipts, exports, docs examples, or public errors;
9. local static-token tests still pass as local fixture custody;
10. hosted/multi-tenant docs refuse to claim support until these tests pass.

Smallest next mechanism: implement the Plan 04 red test showing a valid local
custody token cannot write a hosted transition for an unmatched tenant/org scope,
and that the rejection commits zero protocol records.
