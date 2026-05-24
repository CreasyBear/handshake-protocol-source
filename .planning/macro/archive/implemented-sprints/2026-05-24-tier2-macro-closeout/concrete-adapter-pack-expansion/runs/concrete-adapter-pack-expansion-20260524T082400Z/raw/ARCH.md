# ARCHITECTURE Perspective

## Invariant At Stake

Adapter expansion must not create shortcut authority. Every adapter can only describe how to compile, canonicalize, validate, map evidence, probe bypass, and test hostile cases for a protected action family. It must never mint permission, widen a greenlight, or treat external provenance as proof of safety.

## Architectural Plan

### 1. Adapter-Pack Manifest Contract

`ProtectedActionAdapterPackSchema` should become the only accepted manifest shape for adapter expansion.

Each adapter pack should declare:

- `adapterPackId`: stable, namespaced, versioned identifier.
- `actionFamily`: package install, preview deploy, repo write, etc.
- `supportedRuntimes`: runtime proposal surfaces only, not authority holders.
- `installCompilerRef`: turns runtime intent into proposed contracts.
- `policyPackRef`: family-specific policy rules and refusal reasons.
- `gatewayObservedParameterValidatorRef`: validates actual gateway-side parameters.
- `receiptMapperRef`: maps proposal, policy, gateway, execution, proof-gap, and bypass evidence.
- `bypassProbeRefs`: detects raw or sibling mutation paths.
- `hostileFixtureRefs`: conformance fixtures for overreach, stale policy, replay, parameter drift, and hidden mutation.
- `materialEvidenceFields`: family-specific evidence that may help reconstruction.
- `provenanceEvidenceFields`: attestations such as npm provenance/signatures or Bun lockfile facts.
- `redactionPolicyRef`: field-level reconstruction rules.

The manifest is not executable authority. It is a signed or hash-addressed declaration of which family-specific components Handshake is allowed to load for proposal and evidence handling.

### 2. Source Ownership

Keep adapter ownership split by control primitive, not by runtime.

Recommended ownership shape:

- Protocol-owned schemas: canonical action contract, adapter-pack manifest, evidence envelopes, refusal/proof-gap enums.
- Family-owned adapter packs: package install, preview deploy, repo write.
- Runtime-owned proposal compilers: Codex, MCP, CLI, browser, CI, etc.
- Gateway-owned validators: observed parameter validation and greenlight binding.
- Receipt-owned mappers: durable evidence shape and redaction posture.
- Test-owned conformance suites: hostile fixtures and bypass probes.

Do not let runtime ingress own adapter-family logic. Runtime ingress should select a proposal compiler by declared runtime and action family, then hand the candidate into canonical protocol flow. Cross-family hardcoding in ingress is architectural debt because it makes runtime adapters quietly become policy routers.

### 3. Registry Shape

Use small registries with typed refs, not one global registry.

Required registries:

- `AdapterPackRegistry`: resolves manifest refs by adapter pack id and version.
- `ActionCatalogRegistry`: maps known consequential action families to schemas.
- `CompilerRegistry`: maps runtime plus action family to proposal compiler.
- `PolicyPackRegistry`: maps action family plus policy version to evaluator.
- `GatewayValidatorRegistry`: maps action family plus gateway id to observed-parameter validator.
- `ReceiptMapperRegistry`: maps action family to evidence mapper.
- `FixtureRegistry`: maps adapter pack to conformance and hostile fixtures.

Registry lookup must be deterministic and version-pinned. No runtime-selected dynamic imports from model output. No fallback to generic adapter for protected mutations unless the result is refusal or proof gap.

### 4. Parameter Canonicalization

Canonicalization is the contract boundary.

Each adapter pack must define a deterministic canonical parameter shape:

- normalized package manager command, package names, versions, registry, lockfile intent;
- normalized preview deploy target, project, branch, environment, provider, commit;
- normalized repo write path set, operation type, diff hash, branch, external consequence marker.

Canonicalization must reject ambiguity. It should not best-guess package aliases, deploy targets, branch names, environment names, or write scopes.

Canonical output should include:

- `canonicalActionHash`;
- `protectedSurfaceId`;
- `idempotencyKey`;
- `sequencingDependencies`;
- `materialParameters`;
- `uncertaintyMarkers`;
- `redactionHints`.

The compiler may produce candidates. The canonicalizer decides whether the candidate is exact enough to evaluate. If not, refusal or review, not permission.

### 5. Observed-Parameter Validation

Gateway observed-parameter validation is the adapter's most important expansion point.

At mutation time, the gateway must compare:

- canonical contract parameters;
- one-use greenlight binding;
- actual observed gateway parameters;
- policy version;
- adapter pack version;
- gateway registry version;
- isolation state.

Mismatch means refusal or proof gap, not degraded execution.

Validation must catch:

- package manager changed package/version/registry/flags;
- Bun/npm lockfile drift after approval;
- preview deploy target changed branch/environment/provider/project;
- repo write touched paths outside approved diff;
- runtime retried with mutated parameters;
- sibling/raw tool path bypassed the adapter;
- stale review surface approved an older contract.

A greenlight is valid for exactly one observed mutation attempt.

### 6. Material And Provenance Evidence Posture

Material evidence helps reconstruction. It is not authority.

For package managers, evidence fields may include:

- npm provenance attestation presence;
- npm signature verification result;
- registry URL;
- resolved package tarball integrity;
- lockfile digest;
- Bun lockfile digest;
- package manager version;
- install command digest;
- dependency graph delta.

These fields prove what was attempted or observed. They do not prove the code is benign. Treating provenance as safety proof is evidence theatre.

For preview deploys:

- provider;
- project;
- environment;
- commit SHA;
- build config digest;
- deployment URL;
- provider request id;
- gateway decision id.

For repo writes:

- path allowlist;
- diff hash;
- commit hash if committed;
- working tree state;
- external consequence marker;
- bypass probe result.

Receipts must distinguish proposal, policy decision, gateway check, execution result, downstream uncertainty, refusal, and proof gap.

### 7. Conformance Fixtures

Every adapter pack must ship hostile fixtures before it is accepted.

Minimum fixture families:

- overbroad vague intent compiled into excessive scope;
- generated code loop retries after refusal;
- greenlight replay attempt;
- stale policy version at gateway check;
- stale rendered review artifact;
- parameter drift between proposal and gateway;
- hidden secondary mutation;
- raw tool bypass;
- sibling adapter bypass;
- missing material evidence;
- missing provenance evidence;
- provenance present but malicious or unknown package behavior;
- receipt mapper unable to distinguish gateway check from execution result.

The fixture suite should prove the adapter preserves the global Handshake chain:

```text
proposal -> canonical contract -> policy -> greenlight/refusal -> gateway check -> receipt/proof gap -> redacted reconstruction
```

### 8. Import / Export Posture

Adapter packs may be imported as declarative manifests plus versioned implementation refs. Import must validate schema, version, fixture coverage, and registry compatibility before activation.

Export should produce reconstruction bundles:

- adapter pack manifest digest;
- action contract;
- policy decision;
- gateway check record;
- observed parameters;
- evidence fields;
- redaction map;
- proof gaps;
- bypass probe results.

Exports must not leak secrets, tokens, raw environment values, or full unredacted lockfile content unless explicitly allowed by redaction policy. CLI and MCP exports remain proposal/evidence only.

### 9. No-God-Registry Constraints

Do not build a universal adapter registry that can decide everything.

Hard constraints:

- Registry resolves refs; it does not interpret policy.
- Runtime ingress selects compilers; it does not authorize.
- Adapter pack declares family behavior; it does not bypass canonical protocol schemas.
- Policy pack evaluates exact contracts; it does not execute.
- Gateway validator enforces exact binding; it does not infer intent.
- Receipt mapper records evidence; it does not smooth gaps.
- CLI/MCP propose and report evidence; they do not mint greenlights.

A god registry will become ambient authority with better metadata. Keep registries narrow, typed, version-pinned, and hostile-fixture-gated.

## Expansion Sequence

1. Promote adapter-pack manifest contract as the required activation boundary.
2. Split runtime ingress from action-family selection so compilers are looked up by runtime plus action family.
3. Define canonical parameter contracts for package install, preview deploy, and repo write.
4. Add gateway observed-parameter validators for those three families.
5. Attach material/provenance evidence fields without treating them as safety proof.
6. Require hostile fixture suites before any adapter pack is considered conformant.
7. Add redacted reconstruction export for one complete package-install receipt.
8. Only then add more adapter families.

## Brutal Verdict

Keep the adapter-pack expansion, but narrow its authority. The adapter pack is not a plugin permission model. It is a constrained evidence-and-contract module that must pass through the same Handshake primitive every time.

Smallest next mechanism to build: a versioned adapter-pack activation gate that validates manifest refs, fixture coverage, canonical parameter schema, and gateway observed-parameter validator presence before the pack can be used.
