# STRATEGY: Host-Specific Bypass Harnesses

## Invariant At Stake

A bypass harness must prove only this: a configured installed protected-action path resisted a named bypass route in a named host/runtime environment. Anything broader becomes evidence theatre.

## Strategic Sequencing

1. **Package-manager host harness first**

   Choose local package-manager host after package-install conformance.

   This is the right first host target because package installs are already a protected automated-decision action in the current adapter context, they produce material side effects, and the next adapter plan already wants package-manager material attestation. The host surface is narrow enough to test honestly: `npm`/`pnpm`/`bun` invocation path, wrapper path, raw sibling path, lifecycle script posture, registry/custody source, lockfile/package manifest mutation, and failure-closed behavior.

2. **x402-hostile harness second**

   x402 hostile probes already exist, so this should become the calibration harness, not the first strategic host claim.

   Use it to prove the harness model can express named bypasses cleanly: raw sibling, MCP direct, token passthrough, wrapper drift, custody source authority, failure closed. But do not let x402 become the category center. x402 exact is a wedge; Handshake is protected actions for automated decision making.

3. **MCP-host harness third**

   MCP-host comes after the harness contract is boring and repeatable.

   MCP is strategically important, but first MCP harness claims will be easy to overstate. "Protected against MCP bypass" is too broad. The acceptable first MCP claim is closer to: this configured MCP server/tool route denied direct invocation of this protected action unless the gateway-bound contract and one-use greenlight matched.

## Claim Boundary

Acceptable claim:

> In environment `E`, with host `H`, adapter version `A`, gateway policy `P`, and protected action type `T`, Handshake resisted named bypass route `B` and recorded receipt/refusal/proof-gap evidence `R`.

Unacceptable claim:

> Handshake protects package managers, MCP, shell, browser, network, or hosts generally.

For the first package-manager harness, the claim should be:

> Handshake proves that a configured package-install path cannot mutate the declared package-manager material surface through the named raw/wrapper/sibling bypass routes without exact contract canonicalization, policy decision, one-use greenlight, gateway check, and receipt/proof-gap evidence.

## 10-Star Bar

A 10-star host harness has to satisfy all of this:

1. Names the host, version, OS/runtime, adapter, gateway registry, and protected action type.
2. Defines the protected material surface before execution.
3. Declares every tested bypass route by name.
4. Separates read-only package inspection from package-install mutation.
5. Verifies exact contract canonicalization before policy.
6. Verifies one-use greenlight binding at gateway check.
7. Proves wrapper drift fails closed.
8. Proves raw sibling invocation cannot silently mutate the protected surface.
9. Records refusal, bypass detection, proof gap, or execution receipt distinctly.
10. Emits reconstruction evidence sufficient to replay the decision chain six months later.

For package-manager specifically, "material surface" should include at minimum: manifest, lockfile, installed artifact tree, lifecycle script execution posture, registry/source/custody metadata, package-manager binary path, and gateway decision/receipt linkage.

## Cut Lines

Cut any claim that says "host-wide protection."

Cut any harness that only tests the happy adapter path.

Cut any bypass result that says "pass" without distinguishing refusal, gateway denial, quarantine, proof gap, or no-op.

Cut any test where the package manager can mutate through a raw shell path and Handshake merely notices afterward. That is advisory, not Handshake.

Cut any x402-first sequencing that makes the company look like an x402 compliance/protocol tool.

Cut any MCP-first sequencing that claims MCP protection before proving one named MCP tool route in one named runtime.

Cut any "browser/shell/network/package-manager protection" language unless each is a named host harness with bounded environment evidence.

## Brutal Verdict

Keep package-manager host first.

Use x402-hostile as the proving-ground for harness semantics, not as the category anchor.

Defer MCP-host until the harness contract can resist overclaiming.

Smallest next mechanism to build: define the package-manager host harness contract: `HostEnvironment`, `ProtectedMaterialSurface`, `BypassRoute`, `ExpectedGatewayDecision`, and `ReceiptOrProofGapEvidence`.
