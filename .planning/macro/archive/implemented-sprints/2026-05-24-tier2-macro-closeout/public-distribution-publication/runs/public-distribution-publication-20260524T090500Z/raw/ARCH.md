# ARCH: Public Distribution And Publication

## Invariant At Stake

Publication must never be confused with authority.

Public Distribution And Publication is a distribution/read surface for proposal, evidence, metadata, and installability. It must not create policy, greenlights, gateway checks, mutation rights, custody, hosted operation, marketplace certification, or broad enforcement claims. If publication can be interpreted as "installed equals authorized," the architecture has already failed.

## Architecture Guidance

### Package Release Proof Object

Define a durable `PackageReleaseProof` as a receipt bundle, not a trust badge.

```ts
type PackageReleaseProof = {
  proofId: string;
  releaseId: string;
  packageName: string;
  version: string;
  packageManager: "npm";
  createdAt: string;

  packageShapeProof: PackageShapeProof;
  accountNamespaceProof: AccountNamespaceProof;
  publishOperationProof: PublishOperationProof;
  provenanceProof: ProvenanceProof;
  registryDiscoverabilityProof: RegistryDiscoverabilityProof;
  runtimeSmokeProof: RuntimeSmokeProof;

  releaseManifestDigest: string;
  postPublishVerificationDigest?: string;

  authorityBoundary: {
    createsPolicy: false;
    createsGreenlight: false;
    createsGatewayCheck: false;
    performsMutation: false;
    holdsCustody: false;
    certifiesThirdParty: false;
  };

  proofGaps: ProofGap[];
};
```

This object proves only that a package was shaped, published, discoverable, and smoke-tested under declared constraints. It does not prove that any downstream protected action is authorized or safe.

### Split Proofs

Do not collapse release evidence into one "published successfully" flag. That is evidence theatre.

Use separate proofs:

- `PackageShapeProof`: npm dry-run pack JSON, files included, exports, bins, package name, version, `mcpName`, `server.json`, license/readme presence, no undeclared source leakage.
- `AccountNamespaceProof`: npm org/user ownership, MCP namespace authorization, `mcpName` matching registry server name, explicit account/2FA/token posture.
- `PublishOperationProof`: exact package/version attempted, actor, CI run, command class, environment, dry-run predecessor, publish result, package digest.
- `ProvenanceProof`: OIDC/trusted publishing status, provenance bundle URL/digest, CI provider identity, source commit, build workflow identity.
- `RegistryDiscoverabilityProof`: MCP Registry preview metadata accepted, `server.json` present, public install method valid, namespace/auth checks passed, metadata not artifact-hosting.
- `RuntimeSmokeProof`: installed-from-packed or installed-from-registry package executes CLI/MCP in non-authority mode only.

Each proof must carry `verifiedAt`, `source`, `digest`, `result`, and `proofGaps`.

### Release Manifest

Create a release manifest that is generated before publish and immutable after publish.

It should bind:

- source commit;
- package name/version;
- npm package shape;
- packed tarball digest;
- export map;
- bin map;
- MCP server metadata;
- `server.json` digest;
- expected public install command;
- expected non-authority smoke commands;
- intended registry namespace/name;
- explicit authority boundary.

The manifest is not a greenlight. It is the expected release contract for publication evidence.

### Post-Publish Verification Receipts

After publish, create a separate receipt comparing public reality against the release manifest.

It should verify:

- npm package exists at exact version;
- installed package digest or contents match expected release shape;
- CLI bins resolve and run non-authority commands;
- SDK exports expose only allowed public APIs;
- MCP metadata resolves and advertises only proposal/evidence/read tools;
- registry metadata points to npm install method;
- provenance is present or a proof gap is recorded;
- deprecation status is correct;
- no hidden publish-time files appeared.

If the manifest and public package diverge, record a proof gap or quarantine release status. Do not silently "fix docs."

### CLI / MCP / SDK Boundaries

Public package surfaces must be boring and non-authoritative.

Allowed:

- inspect release metadata;
- validate local config;
- render proposal/evidence/read surfaces;
- emit candidate action contracts;
- verify receipts;
- run smoke checks;
- explain authority boundaries.

Forbidden unless gateway-bound:

- mutate protected surfaces;
- create greenlights;
- evaluate policy as final authority;
- perform gateway checks;
- hold secrets for downstream mutation;
- execute protected actions directly;
- imply certification or marketplace approval.

CLI bins should have names that do not imply hosted authority. MCP tools must be classified as `read`, `validate`, `propose`, or `receipt`. If a tool can mutate, it does not belong in this publication package unless it is a gateway adapter with exact greenlight verification.

### Metadata Validation

Metadata validation should be treated as release blocking.

Validate:

- `package.json` `name`, `version`, `files`, `exports`, `bin`;
- `mcpName` presence and match to MCP Registry server name;
- `server.json` schema and install method;
- npm pack dry-run JSON against allowlist;
- registry namespace ownership;
- public install command;
- README claims against authority boundary;
- no package metadata says or implies "approval," "enforcement," "certified," or "trusted" unless the mechanism exists.

Metadata is not marketing. Metadata is an install-time contract surface.

### Provenance And Secret Posture

Preferred path: trusted publishing with OIDC and provenance.

Architecture posture:

- publish from CI, not a local machine;
- no long-lived npm token when trusted publishing is available;
- if token publishing is used, record token class, 2FA posture, expiry, storage boundary, and rotation plan;
- provenance absence is a proof gap, not a warning buried in logs;
- package digest must bind to source commit and release manifest;
- CI identity must be explicit.

A package published with an opaque token and no provenance can still be distributed, but it cannot carry strong release proof.

### Rollback, Deprecation, Versioning

Do not design rollback as "delete the bad version." npm publication is append-heavy in practice and unpublish has constraints.

Use:

- immutable version receipts;
- deprecation receipts for bad versions;
- replacement version receipts;
- registry metadata update receipts;
- release status: `active`, `deprecated`, `quarantined`, `superseded`;
- semver policy separating public API changes from metadata-only corrections;
- documented refusal to reuse versions.

A rollback is a new evidence event. It does not erase the bad release.

### Import / Export Guard Architecture

Guard the package boundary like an authority boundary.

Use checks that install or inspect the packed artifact, not just source paths.

Guard against:

- exporting internal policy/gateway modules;
- exporting mutation-capable adapters by accident;
- bins reaching private source paths;
- wildcard exports;
- package files including `.planning`, internal reports, secrets, fixtures with credentials, or unpublished authority code;
- MCP tools exposing hidden mutation handlers;
- SDK import paths bypassing intended public APIs.

The test posture should be: "Can an external consumer import or invoke anything that sounds like authority?" If yes, block release.

## Brutal Verdict

Keep the publication macro item, but narrow it hard.

This is not the "public Handshake platform." It is release evidence for public package distribution and registry discoverability. The first wedge is x402 exact per-call because it gives a clean proof surface, not because x402 is the protocol center. The product remains protected actions for automated decision making.

Smallest next mechanism to build: a release manifest plus post-publish verification receipt that proves package shape, metadata, provenance posture, registry discoverability, and non-authority runtime behavior for one exact package version.
