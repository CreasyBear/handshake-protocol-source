# RISK Perspective

## Invariant At Stake

A new adapter pack must not convert protected actions into polite wrappers. Every package install, preview deploy, and repo write still needs an exact action contract, one-use greenlight, gateway-side check, receipt/refusal/proof-gap evidence, and bypass posture. If the adapter merely proposes or reports, it is advisory, not Handshake.

## Risk Stance

First adapter pack should be narrow: package-install, preview-deploy, and repo-write only.

Do not center x402. Do not claim broad host interception. Do not claim CLI/MCP enforcement unless the gateway actually blocks mutation. CLI/MCP can emit proposals and evidence, but they are not authority holders unless paired with a blocking gateway.

## Threat Model

Protected actions:

- Install or update dependencies.
- Trigger preview deploys.
- Write repo files with consequential downstream effects.
- Invoke CLI/MCP tools that may mutate through sibling paths.
- Use credentials needed by package managers, deploy systems, repos, or cloud APIs.

Trust boundaries:

- Agent runtime to Handshake proposal boundary.
- Handshake policy to gateway enforcement boundary.
- Gateway to external system mutation boundary.
- Package manager to registry/provenance/lockfile boundary.
- CLI/MCP adapter to raw host tools boundary.
- Receipt evidence to downstream business-success claims.

Primary adversary is generated code with loops, retries, stale plans, dynamic tool names, lifecycle script execution, env access, credential leakage, and vague intent compiled into excessive scope.

## Premortem

| Risk | Failure Mode | Required Mechanism |
| --- | --- | --- |
| Shortcut authority | Adapter pack treats approved install/deploy/write as reusable permission. | One exact contract per mutation attempt; greenlight nonce bound to adapter, target, args, policy version, idempotency key, and expiry. |
| Supply-chain evidence laundering | npm provenance/signature is shown as proof the package is safe. | Receipt must distinguish registry provenance verified from benign code proven. |
| Package-manager side effects | Install runs lifecycle scripts, postinstall downloads, binary builds, env reads, or transitive mutations. | Package-install contract must declare lifecycle posture: blocked, sandboxed, or explicitly allowed with evidence. |
| Lifecycle scripts | Generated code only installs a package but install executes arbitrary package code. | Default should be ignore-scripts unless lifecycle scripts are separately contracted. |
| Lockfile drift | Lockfile changes differ from proposed dependency delta, or Bun lockfile is treated as npm provenance. | Canonical lockfile diff must be receipted; Bun lockfile proof cannot stand in for npm registry provenance. |
| Raw sibling bypass | Agent calls npm, bun, git, deploy CLI, or MCP raw path outside the adapter. | Explicit bypass tests; isolation state set on detected raw sibling mutation. |
| Runtime/MCP overclaim | CLI/MCP emits proposals/evidence but product claims enforcement. | Label CLI/MCP as proposal/evidence only until paired with a blocking gateway. |
| Credential custody | Adapter holds broad tokens and becomes ambient authority. | Gateway-owned scoped credentials; per-action credential reference; no runtime-held deploy/package/repo mutation secrets. |
| Report theatre | Adapter generates a clean report without proving gateway check or downstream result. | Receipts must separate proposal, policy decision, gateway check, attempted mutation, external response, and proof gap. |
| Import posture | Imported adapter lessons, package attestations, or external claims become canon without enforcement proof. | Imports are advisory notes unless backed by local contract/gateway/receipt fixtures. |

## Hard Validation Gates

1. Contract gate.
   Each adapter action must canonicalize to a deterministic contract with protected surface, exact target, args, idempotency key, policy version, credential ref, expected evidence, and bypass posture.

2. One-use greenlight gate.
   A greenlight must fail on replay, mutation drift, expired policy, changed args, changed target, changed credential ref, or second use.

3. Gateway enforcement gate.
   Mutation must be impossible without the gateway check. If the raw tool can still mutate the same surface from the same runtime path, the adapter is not enforcement.

4. Package-install evidence gate.
   Package install receipts must separately record registry metadata, signature/provenance status, lockfile delta, lifecycle-script posture, package-manager version, and proof gaps.

5. Lifecycle gate.
   Lifecycle scripts default blocked. Allowing them requires a separate exact contract and evidence record.

6. Bypass gate.
   Tests must attempt raw npm/bun, raw deploy CLI, raw git write, and MCP sibling mutation. Any successful uncontracted mutation sets isolation state and blocks expansion.

7. Runtime ingress gate.
   Runtime family hardcoding must be removed or explicitly bounded. Adapter pack cannot assume one runtime family maps to authority semantics.

8. Credential gate.
   Runtime cannot possess broad mutation credentials. Gateway must hold or broker scoped credentials, and receipts must identify which credential reference was used.

9. Receipt gate.
   Receipts must reconstruct proposal, policy decision, gateway check, external attempt, result, refusal, proof gap, and bypass detection independently of chat logs.

10. Claim gate.
    README/docs/product language must not claim host-wide interception, MCP enforcement, package safety, or x402-centered authority unless implemented and tested.

## Stop Conditions

Stop adapter expansion if any of these are true:

- A greenlight can authorize more than one mutation.
- A raw sibling path can mutate the protected surface.
- CLI/MCP is described as enforcement while only producing proposals or evidence.
- Package install evidence treats provenance, signatures, or lockfiles as proof of benign code.
- Lifecycle scripts can run without a separate contracted decision.
- Runtime ingress logic depends on hardcoded runtime families for authority.
- Gateway check and downstream execution are collapsed into one receipt field.
- Credentials are available to the agent runtime instead of the gateway boundary.
- Docs claim broad host interception before bypass tests prove it.
- x402 becomes the center of the protocol story instead of a protected-spend adapter case.

## Brutal Verdict

Keep the adapter pack only if it is framed as three concrete protected-action adapters with blocking gateway checks and hostile bypass tests.

Cut any marketable language that says adapter support, MCP enforcement, safe installs, or runtime protection without exact gateway blocking.

Narrow package install hardest. It is the riskiest because package managers execute code, mutate lockfiles, resolve transitive graphs, and produce evidence that is easy to launder into false confidence.

Smallest next mechanism to build: a package-install contract fixture that records lifecycle posture, registry provenance status, lockfile delta, credential ref, one-use greenlight, gateway check, and explicit proof gaps.
