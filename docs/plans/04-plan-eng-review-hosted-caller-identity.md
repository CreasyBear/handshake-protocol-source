# Plan 04: Hosted Transition Caller Identity

Status: Proposed implementation plan
Date: 2026-05-18
Owner: Protocol owner
References:

- [`../adr/0001-kernel-evidence-boundaries.md`](../adr/0001-kernel-evidence-boundaries.md)
- [`../adr/0005-hosted-transition-caller-identity.md`](../adr/0005-hosted-transition-caller-identity.md)
- [`./02b-plan-eng-review-module-boundaries.md`](./02b-plan-eng-review-module-boundaries.md)
- [`./02c-plan-eng-review-protocol-spec-alignment.md`](./02c-plan-eng-review-protocol-spec-alignment.md)
- [`../plans/adr-follow-ups.md`](./adr-follow-ups.md)
- [OpenClaw gateway protocol](https://docs.openclaw.ai/gateway/protocol)
- [x402 SIWX](https://docs.x402.org/extensions/sign-in-with-x)
- [Agent Identity AID](https://agentids.org/)
- [Cloudflare Agentic Inbox](https://github.com/cloudflare/agentic-inbox)
- [Hermes Agent security policy](https://github.com/NousResearch/hermes-agent/security)
- [AgentCash how it works](https://agentcash.dev/docs/how-it-works)

## Invariant At Stake

Caller proof is not mutation authority.

Hosted Handshake must know which caller is allowed to enter a transition route
and write records for a tenant/org scope. That caller identity must not become
principal authority, agent authority, reviewer authority, gateway ownership,
greenlight authority, or execution proof.

The exact mutation authority path remains:

```text
ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt
```

## Summary

Implement ADR 0005 with a narrow hosted admission seam.

The local alpha path keeps existing role bearer tokens as fixture custody. Hosted
mode adds a server-side `TransitionCallerIdentity` verifier before transition
records can commit. The verifier reduces whatever upstream mechanism is used
later, such as Cloudflare Access JWT, service credential, mTLS, SIWX, or AID
token, into one narrow protocol-facing shape:

```text
TransitionCallerIdentity
  callerIdentityRef
  callerSubjectDigest
  tenantId
  organizationId
  custodyRoles[]
  authProviderRef
  authSessionDigest | serviceCredentialDigest | deviceProofDigest
  issuedAt
  expiresAt
  revocationEpochRef
  claimsDigest
```

The implementation does not choose a hosted identity provider. It creates the
boundary that makes provider choice replaceable and testable.

## Plan-Eng Review Step 0

### What Already Exists

| Existing Piece | Reuse |
|---|---|
| `src/http/caller-auth.ts` | Keep for local alpha role-token custody. Do not widen it into hosted org auth. |
| `src/http/transition-route-registry.ts` | Reuse route metadata as the source of required custody role. |
| `src/http/transition-request-context.ts` | Extend so accepted hosted requests record only caller identity digest/ref. |
| `src/protocol/transition-request-context-schemas.ts` | Add digest/ref fields; do not persist raw provider tokens or raw human identifiers. |
| `HandshakeKernel` request-context injection | Reuse existing commit coupling: request context commits only when the transition commits. |
| 02b OpenAPI/security parity tests | Extend for hosted mode only if hosted routes are exposed. |
| 02c request-context rejected-request tests | Extend for hosted identity failures committing zero protocol records. |

### Minimum Scope

The minimum complete slice is:

1. Add a hosted caller verifier interface.
2. Add a hosted mode to HTTP app options and Worker bindings.
3. Derive `TransitionCallerIdentity` before body parsing.
4. Check route custody role before body parsing.
5. Parse body.
6. Extract `tenantId` and `organizationId` from the already-validated body.
7. Verify body scope matches caller scope before kernel invocation.
8. Commit `TransitionRequestContext` with caller identity digest/ref only when
   the transition is accepted.
9. Add hosted rejection tests proving zero protocol records are committed.

Do not implement SSO administration, SCIM, RBAC UI, principal delegation,
`AuthorityGrant`, `AgentIdentity`, public record reads, or provider-side deploy
enforcement in this slice.

### Complexity Check

Expected touched files:

- `src/http/app.ts`
- `src/http/caller-auth.ts`
- `src/http/hosted-caller-identity.ts`
- `src/http/transition-request-context.ts`
- `src/protocol/transition-request-context-schemas.ts`
- `src/protocol/transition-request-contexts.ts`
- `test/http.test.ts`
- `test/d1-http.test.ts`
- `docs/adr/0005-hosted-transition-caller-identity.md`
- `docs/plans/adr-follow-ups.md`

This is near the 8-file smell threshold, but the scope is still a boilable lake:
one transport seam, one protocol record extension, and tests. Avoid a broader
auth subsystem.

### Search Check

| Source | Finding | Handshake Rule |
|---|---|---|
| OpenClaw | Gateway connect uses challenge, role, scopes, device public key/signature, and server-side allowlists; node capabilities are claims. | Use challenge/proof/scope as input pattern, but derive a narrow caller identity server-side. |
| x402 SIWX | Wallet proof is bound to route/domain/URI/nonce/expiry and can gate access. | Challenge-bound proof is useful; key control is not principal authority. |
| AID | Agent key proof can exchange for scoped JWTs after admin registration. | Useful future `AgentIdentity` source; not ADR 0005 route admission by itself. |
| Cloudflare Agentic Inbox | Shared Access policy is the only trust boundary and there is no per-mailbox authorization. | Hosted Handshake must not ship a shared-access-only tenant boundary. |
| Hermes Agent | Session IDs are routing handles, adapters require allowlists, and all authorized callers inside one adapter are equally trusted. | Local allowlists and session IDs are not hosted capability separation. |
| AgentCash | Agents discover API schemas/pricing and retry after 402 with signed payment proof. | Discoverable routes and retry flows help DX, but retries must not reuse greenlights or become authority. |

EUREKA: the standard "agent identity" frame is too broad. The first hosted
problem is not "who is the agent?" It is "which server-verified caller may write
transition evidence for this tenant/org lane?" Keep that smaller.

## Architecture

```text
HTTP request
  |
  v
Hosted admission mode?
  |
  +-- local alpha -----------------------------+
  |                                            |
  |  static role bearer token                  |
  |    -> route custody role                   |
  |                                            |
  +-- hosted ----------------------------------+
       upstream auth material
         -> HostedCallerVerifier
         -> TransitionCallerIdentity
         -> route custody role check
         -> tenant/org caller scope available
  |
  v
protocol version + request identity headers
  |
  v
parse body with route schema
  |
  v
extract body tenantId + organizationId
  |
  v
body scope must match caller scope in hosted mode
  |
  v
build TransitionRequestContext
  callerIdentityRef/digest only
  no raw JWT / session / email / service key
  |
  v
HandshakeKernel transition
  |
  v
request context commits only with accepted transition
```

The hosted verifier is transport-only. It must not import protocol primitive
internals beyond the public request-context shape. It must not call policy,
create contracts, consume greenlights, or inspect gateway receipts.

## Module Seams

| Module | Responsibility | Must Not Do |
|---|---|---|
| `src/http/hosted-caller-identity.ts` | Define `TransitionCallerIdentity`, verifier interface, scope/role checks, digest-only evidence conversion, and test fake verifier. | Choose provider, store raw tokens, decide mutation policy, or call kernel transitions. |
| `src/http/caller-auth.ts` | Continue local static role-token custody. | Pretend static tokens are hosted org authority. |
| `src/http/app.ts` | Select local vs hosted admission, enforce auth before body parse, enforce body scope before kernel invocation. | Parse hosted authority from caller-supplied identity headers. |
| `src/http/transition-request-context.ts` | Capture accepted request metadata and caller digest/ref evidence. | Persist raw auth artifacts or create request context on rejected requests. |
| `src/protocol/transition-request-contexts.ts` | Build digest-bound context object from accepted transition request. | Decide route admission or tenant authorization. |

Deletion test: if `hosted-caller-identity.ts` is deleted, server-derived caller
proof, role checks, tenant/org checks, raw-token redaction, and hosted-mode
failure mapping should not reappear across route handlers.

## Data Model

Extend `TransitionRequestContext` with nullable hosted evidence fields:

```text
callerIdentityRef
callerSubjectDigest
callerTenantId
callerOrganizationId
callerIdentityClaimsDigest
authProviderRef
authSessionDigest
serviceCredentialDigest
deviceProofDigest
revocationEpochRef
callerIdentityIssuedAt
callerIdentityExpiresAt
```

Do not persist:

- raw JWTs;
- raw OAuth tokens;
- raw service credentials;
- raw session cookies;
- raw emails;
- raw human-readable user IDs unless separately redacted and approved;
- SIWX signed messages or wallet addresses except as digest/ref evidence;
- AID access tokens except as digest/ref evidence.

## Failure Modes

| Failure | Expected Behavior | Test |
|---|---|---|
| Hosted verifier missing in hosted mode | `503` before body parse, zero records. | yes |
| Missing hosted credential | `401` or provider-specific mapped auth failure before body parse, zero records. | yes |
| Expired/revoked caller identity | `403` or `412`, zero records. | yes |
| Caller lacks route custody role | `403` before body parse, zero records. | yes |
| Body tenant/org mismatch | `403` after schema parse but before kernel invocation, zero records. | yes |
| Caller-supplied request/originating identity attempts auth | rejected or ignored as authority, zero records on missing real caller identity. | yes |
| Raw token appears in records/errors | test fails by scanning records and response bodies. | yes |
| Local alpha route without hosted mode | existing static-token behavior still passes. | yes |

Critical gap if skipped: wrong-tenant requests could commit believable protocol
records. That would be caller custody laundering into org authority.

## Test Diagram

```text
POST /v0.2/*
  |
  +-- local mode
  |     +-- missing role token -> 401, no records
  |     +-- wrong role token   -> 403, no records
  |     +-- valid role token   -> header validation -> body parse -> transition
  |
  +-- hosted mode
        +-- no verifier              -> 503, no records
        +-- no credential            -> 401, no records
        +-- expired/revoked identity -> 403/412, no records
        +-- wrong route role         -> 403, no records, body not parsed
        +-- valid route role
              -> body parse
              -> tenant/org mismatch -> 403, no kernel call, no records
              -> tenant/org match
                    -> request context with digest/ref caller evidence
                    -> exactly one kernel transition
                    -> response echoes request identity
```

Required tests:

- hosted mode refuses a valid local custody token when no hosted identity is
  present;
- hosted mode derives caller identity server-side, not from
  `X-Handshake-Request-Identity` or `X-Handshake-Originating-Identity`;
- hosted missing credential commits zero records;
- hosted wrong role commits zero records and does not parse body;
- hosted wrong tenant/org commits zero records;
- accepted hosted transition commits request context with caller digest/ref;
- accepted hosted transition stores no raw provider token, email, session, or
  wallet/token material;
- local static-token tests remain unchanged;
- OpenAPI/docs do not claim hosted support until hosted mode tests pass.

## Performance Review

This path runs once per transition request. The important performance risks are
provider verification latency and revocation checks.

Rules:

- keep provider verification outside the protocol kernel;
- cache only provider public keys or revocation epochs, never caller decisions
  that would let a revoked identity through;
- include timeout mapping in the hosted verifier so provider slowness fails
  closed before records commit;
- do not add database lookups to every local-alpha transition.

## Quality Contract

| Lens | Applies | Target | Hard Stops | Evidence Required | Closeout |
|---|---|---|---|---|---|
| Domain invariant | yes | Caller proof stays route admission only; mutation authority remains exact contract -> policy -> one-use greenlight -> gateway check. | Any caller identity field can issue, reuse, bypass, or replace greenlight/gateway authority. | Hosted rejection tests, accepted context digest/ref test, authority-path scan. | Not started. |
| Product / CEO | yes | Hosted claims become honest: route admission can be claimed only after tenant/org scoped caller identity exists. | Docs claim hosted org auth before tests pass, or identity is marketed as agent trust. | ADR README citation rule, follow-up register, hosted non-claim scan. | Not started. |
| Engineering | yes | One small HTTP admission seam plus request-context extension; kernel primitive behavior remains untouched. | Provider-specific auth logic spreads across route handlers or protocol modules. | Import posture review, focused HTTP tests, `git diff --check`. | Not started. |
| Security / CSO | yes | Fail closed before records commit for missing, expired, revoked, wrong-role, wrong-scope, or raw-token-leaking identity. | Wrong-tenant request commits a record; raw JWT/session/service key appears in record/error/export. | Zero-record rejection tests, raw-secret scan, hosted verifier timeout test. | Not started. |
| DevEx | yes | Local alpha token flow still works; hosted mode has clear errors and a fake verifier for tests. | Local examples silently become hosted auth examples, or SDK headers imply authority. | Existing local HTTP tests, hosted fake-verifier fixture, docs wording scan. | Not started. |
| Design | conditional | No UI or review renderer in this slice; future UI must render caller identity as admission evidence only. | UI presents caller identity as approval, principal authority, or execution proof. | Non-scope statement and future review-renderer acceptance note. | Not started. |
| Architecture | yes | Provider choice is replaceable; `TransitionCallerIdentity` is source-agnostic and digest/ref only. | Identity-provider SDKs leak into kernel or protocol primitive modules. | Module seam review and import scan. | Not started. |

## Not In Scope

- Full hosted auth provider integration.
- SSO, SCIM, RBAC administration, billing roles, user management, or org admin UI.
- `AuthorityGrant`.
- `AgentIdentity`.
- Public redacted evidence/read API.
- Provider-side preview deploy enforcement.
- Agent-to-agent negotiation or transaction authority.
- Review renderer, dashboard, browser interception, MCP expansion, or CLI hosted login.

## TODO Candidates

No vague TODOs should be added. The only active follow-up is
`ADR-FU-0001-A`, now owned by this plan.

Deferred work remains separate:

- `AuthorityGrant` for principal/org delegation snapshots.
- `AgentIdentity` for runtime/agent proof.
- Redacted evidence/read API for public record access.
- Provider-specific hosted auth integration once a deployment target exists.

## Completion Summary

- Step 0: Scope Challenge - scope accepted as narrow hosted admission seam.
- Architecture Review: 1 issue found and resolved by separating hosted route
  admission from mutation authority.
- Code Quality Review: 1 issue found and resolved by requiring one
  `hosted-caller-identity.ts` seam instead of spreading provider checks through
  route handlers.
- Test Review: diagram produced, 0 accepted silent-failure gaps if required
  tests are implemented.
- Performance Review: 1 issue found and resolved by keeping provider
  verification outside the kernel and fail-closed on timeout.
- NOT in scope: written.
- What already exists: written.
- TODOs.md updates: 0 proposed; update `ADR-FU-0001-A` instead.
- Failure modes: 0 critical gaps after this plan's tests.
- Lake Score: 3/3 recommendations chose complete option.

Smallest next mechanism: add the red hosted HTTP test proving a valid local
custody token cannot write a hosted transition for an unmatched tenant/org
scope, and that the rejection commits zero protocol records.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | not run | Not required for this implementation-only hosted admission seam. |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | not run | Not run for this docs capture pass. |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 7 | clear | 3 issues, 0 critical gaps; scope kept to hosted admission seam. |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | not run | No UI scope. |

- **UNRESOLVED:** 0.
- **VERDICT:** ENG CLEARED for planning; implementation still required before hosted claims.
