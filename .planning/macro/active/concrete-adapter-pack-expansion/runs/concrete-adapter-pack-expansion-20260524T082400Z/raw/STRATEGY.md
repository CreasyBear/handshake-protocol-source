# STRATEGY Perspective

## Invariant At Stake

A protected action must reduce an automated decision into an exact, gateway-checkable contract with reconstructable evidence. The next adapter pack must prove Handshake is not payments, not deploy approvals, not agent auth, and not a hosted workflow product.

## Choice

Promote package-manager material attestation first.

Not package install approval. That is too weak and too engineering-agent-coded. Promote the adapter as material attestation for automated dependency decisions.

This is the cleanest next proof that the Tier 1 spine generalizes from x402 exact per-call to non-payment protected actions:

- exact action contract;
- one-use greenlight;
- gateway check before consequence;
- refusal/proof-gap path;
- reconstructable material evidence;
- narrow adapter-owned semantics.

Preview deploy is useful, but it pulls the product toward hosted operations. Repo write is foundational, but it is too broad and likely to become an intent/compiler swamp before the adapter spine is proven.

## Strategic Sequencing

1. Package-manager material attestation.
   First promoted adapter pack. Use it to prove Handshake can gate an automated decision based on material evidence rather than payment state.

2. Preview deploy.
   Second. Use it to prove the same spine controls externally visible hosted consequences, but only after the adapter-pack boundary is already clean.

3. Repo write.
   Third. Use it when the compiler/canonicalizer boundary is stronger. Repo write touches too many protected surfaces and will otherwise blur action contract, diff intent, branch policy, CI side effects, and downstream deploy consequence.

## Product Claim Boundary

Say:

> Handshake can gate automated dependency actions on exact package material evidence, policy, and gateway-bound execution authority.

Do not say:

- Handshake proves package code is safe.
- Handshake replaces npm audit.
- Handshake guarantees dependency security.
- Handshake verifies Bun provenance.
- Handshake knows whether a package is benign.
- Handshake is package-manager auth.
- Handshake broadly secures software supply chains.

The exact claim is narrower and stronger:

> For a declared package-manager action, Handshake records the proposed package mutation, evaluates required material evidence, greenlights or refuses one exact attempt, checks that greenlight at the gateway, and records the resulting evidence or proof gap.

## 10-Star Bar

The promoted adapter pack is not 10-star unless it has all of this:

1. Adapter-owned contract schema.
   Package name, version/range, resolved version, registry, package manager, lockfile posture, install command shape, workspace path, expected mutation class, and idempotency key are first-class fields.

2. Canonicalization before policy.
   The same proposed install/update must canonicalize deterministically. No policy decision over raw command strings.

3. Material evidence model.
   npm provenance/signature evidence is represented separately from local lockfile evidence. Bun lockfiles can support local reconstruction, but cannot masquerade as npm provenance verification.

4. Explicit non-benign-code boundary.
   The adapter must state that signatures/provenance/tarball integrity are material posture, not proof of harmless code.

5. Gateway-side check.
   The install path must verify the exact greenlight before mutation. If the runtime compiler proposes but raw install can bypass, that bypass must be recorded or blocked.

6. Refusal as product output.
   Missing signature, unsupported registry, unverifiable package manager, stale lockfile, unresolved package, or mismatched tarball must produce structured refusal or proof gap.

7. Evidence receipt separation.
   Receipt must distinguish proposal, policy decision, gateway check, install execution, signature/provenance verification, lockfile delta, and downstream audit uncertainty.

8. No god registry.
   Runtime ingress must not absorb package-manager semantics. The adapter pack owns package-manager canonicalization and evidence interpretation behind a narrow interface.

9. Regression lane converted into source-owned adapter.
   Existing package install fixtures/tests stop being only regression coverage. They become canonical adapter examples with named doctrine.

10. Cross-manager honesty.
   npm gets provenance/signature verification where supported. Bun gets local lockfile/material evidence only unless an actual provenance verification mechanism is wired. No fake parity.

## Cut Lines

Cut package install as permission. The product is not "agent asked to install lodash and user approved." That is approval theatre unless the gateway binds the exact resolved artifact and attempt.

Cut broad supply-chain security. Handshake does not decide benignness. It controls whether an automated dependency mutation may proceed under declared material evidence requirements.

Cut Bun provenance claims unless wired to a real verification mechanism. Bun lockfiles are useful reconstruction evidence, not npm provenance attestation.

Cut runtime-ingress centralization. Runtime ingress should normalize proposal intake and route to adapter packs. It must not become the global registry for every protected action family.

Cut MCP/CLI as authority surfaces. MCP/CLI can propose, inspect, and emit evidence. They do not become the authority holder unless the gateway check is actually enforced there.

Cut preview deploy as first generalization proof. It is compelling, but it reinforces hosted operation control. Use it after package-manager attestation proves the spine works on material evidence.

Cut repo write as first generalization proof. It is too large. Without stronger compiler boundaries, repo write will collapse into vague intent, diff review, branch policy, CI consequence, and deploy adjacency.

## Brutal Verdict

Promote package-manager material attestation first.

It is the smallest adapter pack that breaks the payment-center narrative while preserving exact per-action discipline. It forces Handshake to say what evidence proves, what it does not prove, and where gateway authority actually lives.

Smallest next mechanism to build: a source-owned package-manager material attestation adapter contract with npm signature/provenance evidence, Bun lockfile-only evidence, structured refusal/proof-gap receipts, and one gateway fixture proving exact greenlight binding before install.
