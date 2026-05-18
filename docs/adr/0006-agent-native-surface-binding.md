# ADR 0006: Agent-Native Surface Binding

Status: Accepted
Date: 2026-05-19
Owner: Product and protocol owner
Implementation owner: future cross-surface protected-action plan
Extends: [`../product/agent-native-surface-binding.md`](../product/agent-native-surface-binding.md)
Informed by: [`../reference/agentic-repo-source-study-2026-05-19.md`](../reference/agentic-repo-source-study-2026-05-19.md)
Blocks: agent-native, multi-surface, extension, or broad runtime-support claims

## Invariant At Stake

Surface parity is not authority parity.

Agent-native systems increasingly expose the same application action through
human UI, agent chat, HTTP, MCP, A2A, CLI, extensions, background jobs, generated
code, and hosted runtime APIs. If each surface carries its own authority model,
then the safest-looking surface becomes irrelevant because the next surface can
mutate the same protected resource differently.

One logical protected action must not have multiple authority paths.

## Decision

Handshake will treat every surface that can originate a consequential action as
an origin that must bind to the same contract boundary before authority exists.

The required shape is:

```text
origin surface
  -> SurfaceBindingRecord
  -> context snapshot when context affects compilation
  -> CandidateAction or compiler refusal
  -> exact ActionContract
  -> PolicyDecision
  -> one-use Greenlight or refusal/review/halt/quarantine
  -> GatewayCheckAttempt before mutation
```

The surface may improve ergonomics. It may not become a separate permission
system.

## Primitive

Future implementation plans must define a `SurfaceBindingRecord` or equivalent
protocol object before claiming cross-surface support.

The record must capture at least:

```text
originSurface
originSurfaceInstance
callerIdentityRef
principalScopeRef
runtimeIdentityRef
operatingEnvelopeRef
actionCatalogRef
toolCatalogRef
gatewayRegistryRef
actionName
requestedResourceRef
paramsDigest
contextSnapshotRef
generatedArtifactRef
remoteTaskRef
continuationRef
callabilityPosture
credentialPosture
bypassPosture
policyContextRef
createdAt
```

The first implementation may add these fields to existing runtime/compilation
evidence instead of introducing a new table. It must still preserve the semantic
boundary.

## Boundary Rules

1. UI, HTTP, MCP, CLI, A2A, extension, generated-code, and job origins that try
   the same protected action must enter the same action catalog boundary.
2. The same logical action with the same caller scope, runtime scope, resource,
   parameters, context snapshot, catalog snapshot, and gateway registry snapshot
   must produce the same canonical contract digest.
3. If a surface changes caller scope, runtime scope, context, resource, or
   credential posture, the contract digest must change and policy must see the
   difference.
4. A review renderer, dashboard button, iframe, extension, or generated UI must
   be bound to the contract digest it displays or it is review theatre.
5. Context-aware UI state such as selected text, active project, current screen,
   workspace, or navigation state is evidence only. If it affects the contract,
   it needs snapshot identity, freshness, and stale-context refusal rules.
6. Extensions and generated app surfaces are untrusted call sites by default.
   They cannot spend viewer authority unless explicit callability and credential
   posture rules allow it.
7. A raw sibling route for the same resource is bypass risk unless removed,
   blocked, or honestly labeled advisory/proof-gapped.

## Non-Claims

- This ADR does not implement `SurfaceBindingRecord`.
- This ADR does not claim Handshake controls all agent-native app surfaces.
- This ADR does not turn UI auth, MCP auth, A2A auth, extension sandboxing, or
  CLI installation into mutation authority.
- This ADR does not allow a rendered review screen to authorize mutation.
- This ADR does not make shared app state safe by itself.

## Rejected Alternatives

### Trust The Surface That Looks First-Party

Rejected. A first-party UI can be stale, an extension can spend viewer
credentials, a CLI can carry different caller context, and an HTTP route can
bypass action catalog binding. The surface being first-party does not prove the
exact protected mutation is authorized.

### Treat Action Registry Exposure As Authorization

Rejected. Agent-Native-style action registries are useful callability catalogs.
Tool availability is not tool authorization. A callable action becomes
Handshake-controlled only when it reduces to a contract and gateway check.

### Add Surfaces Before The Golden Path Works

Rejected. Shipping thin UI, MCP, HTTP, CLI, and dashboard variants before one
gateway-checked receipt exists creates product theatre and multiplies bypass
paths.

## Proof Plan

The future cross-surface implementation plan must prove:

1. The same protected action through two origins produces the same canonical
   contract digest when caller/resource/params/context match.
2. Different caller or context scope changes the digest and is visible to policy.
3. Missing or stale context snapshot refuses before contract proposal.
4. Extension-originated attempts require explicit callability posture.
5. A raw sibling route for the same resource is detected as bypass-risk or
   blocked.

Smallest next mechanism: build a fixture where MCP proposal origin and CLI
proposal origin bind to the same `ActionContract` digest, plus one stale-context
refusal.
