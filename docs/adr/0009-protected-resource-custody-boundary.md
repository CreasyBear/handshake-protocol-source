# ADR 0009: Protected Resource Custody Boundary

Status: Accepted
Date: 2026-05-19
Owner: Product and protocol owner
Implementation owner: future resource-custody protected-action plan
Depends on: [`0002-generated-execution-graph-coverage.md`](./0002-generated-execution-graph-coverage.md), [`0006-agent-native-surface-binding.md`](./0006-agent-native-surface-binding.md)
Informed by: [`../reference/agentic-repo-source-study-2026-05-19.md`](../reference/agentic-repo-source-study-2026-05-19.md)
Blocks: secret onboarding, key minting, budget spend, generated-artifact promotion, and concurrent multi-action claims

## Invariant At Stake

Not every consequence looks like a domain-object mutation.

Agents can spend money, mint API keys, connect OAuth accounts, sync browser
profiles, rotate secrets, consume GPU time, create launchers, generate datasets,
write workflow files, submit benchmark variants, and run concurrent branches.
Those actions may not mutate the obvious product database, but they still create
real-world consequence.

Handshake must classify resource custody as protected consequence before agents
normalize it as setup work.

## Decision

Handshake will treat these resource classes as protected action families when
they can enable, spend, or later cause consequential mutation:

- secret onboarding;
- API-key minting;
- OAuth connection and provider-account grants;
- token rotation;
- browser profile or cookie sync;
- budget, quota, paid API, GPU, proxy, captcha, or external generation spend;
- generated artifact promotion;
- workflow/script/launcher promotion;
- dataset/model/config promotion;
- concurrent or repeated mutation attempts against the same protected resource.

The exact action catalog can add these families incrementally. The authority
rule is immediate: an agent may not treat them as unguarded setup details when
they enable protected consequence.

## Primitive

Future implementation plans must define protected resource custody records or
action contract fields equivalent to:

```text
ResourceCustodyBoundary
  resourceClass
  resourceRef
  credentialHolder
  spendLimitRef?
  artifactDigest?
  promotionTarget?
  idempotencyKey?
  serializationKey?
  leaseRef?
  retryPolicyRef?
  revocationRef?
  gatewayAuthorityHolder
```

Concurrency is part of resource custody. It is not a performance optimization
left to adapters.

## Boundary Rules

1. A secret or API key that enables future mutation must be onboarded, minted, or
   rotated through a protected action.
2. OAuth connection and browser-profile sync are credential transfer events. They
   require explicit scope, destination, expiry, and revocation evidence.
3. Budget and quota spend are protected consequences even when no app object is
   mutated.
4. Generated artifacts are inert evidence until promoted. Promotion to workflow,
   dataset, deployment, PR, provider call, or benchmark submission is protected.
5. A generated file cannot become authority merely because it exists in the repo.
6. Parallel tool calls against the same protected resource require idempotency
   and serialization semantics.
7. One greenlight cannot authorize repeated, competing, or forked mutations.
8. Raw credential access by an agent remains bypass-risk even if a later receipt
   exists for a separate protected path.

## Non-Claims

- This ADR does not implement secrets, vault, OAuth, billing, budget, browser
  profile, artifact custody, or workflow promotion.
- This ADR does not claim Handshake is a wallet, spend-management system,
  identity provider, CI platform, model registry, or secrets manager.
- This ADR does not require all resource classes before the first Tier 2 path.
- This ADR does not let a setup wizard mint authority outside a contract.

## Rejected Alternatives

### Treat Setup As Non-Consequence

Rejected. "Connect the API," "sync my browser profile," "rotate the token," and
"increase the GPU budget" can enable later mutation or spend. They are protected
actions when performed by or for an autonomous agent path.

### Let Generated Artifacts Promote Themselves

Rejected. Agents increasingly generate scripts, configs, launchers, datasets,
and workflow files. Promotion is where those artifacts become consequential.

### Leave Concurrency To Adapter Internals

Rejected. Concurrency can turn exact authority into ambient authority when the
same greenlight, credential, or idempotency key is reused across branches or
retries.

## Proof Plan

The future plan must prove:

1. Secret onboarding and key minting can be represented as protected action
   contracts.
2. Budget/quota spend has explicit bounds and refusal behavior.
3. Generated artifact promotion pins artifact digest and promotion target.
4. Two concurrent attempts against the same protected resource cannot share one
   consumed greenlight.
5. Retry behavior preserves idempotency and refusal semantics.

Smallest next mechanism: add a generated-artifact promotion fixture where a
script exists in the repo but cannot run or promote until contracted.
