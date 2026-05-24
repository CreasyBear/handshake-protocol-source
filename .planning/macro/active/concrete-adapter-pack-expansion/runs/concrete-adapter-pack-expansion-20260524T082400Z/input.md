# GSD Macro Input: Concrete Adapter Pack Expansion

Run id: `concrete-adapter-pack-expansion-20260524T082400Z`
Date: 2026-05-24

## Hard Frame

Handshake is protected actions for automated decision making, not an engineering-agent-only product.

x402 exact per-call protected spend is the first wedge. It must remain one adapter proof pack, not the protocol center and not a payment-management product.

Concrete adapter pack expansion must prove the Tier 1 spine generalizes:

```text
exact action contract
-> policy decision
-> one-use gateway-bound greenlight/refusal
-> customer-owned gateway check before mutation
-> receipt/refusal/proof gap
-> redacted reconstruction
```

No new adapter may invent shortcut authority because the mutation seems simpler than x402.

## Current Source State

Existing source already contains:

- `ProtectedActionAdapterPackSchema` in `src/install/protected-action-adapter-pack/index.ts` with pack id/version, action family, protected surface kind, parameter schema ref, endpoint evidence schema ref, install compiler ref, policy rule pack ref, gateway observed parameter validator ref, receipt mapper ref, bypass probe kinds, and hostile fixture refs.
- Generic install proposals in `src/install/install-proposal/index.ts`.
- x402 install proposal and gateway signer path.
- Package install runtime proposal compiler in `src/runtime/package-install/action-proposal.ts`.
- Package install gateway in `src/adapters/package-install/gateway.ts`.
- Preview deploy runtime proposal compiler in `src/runtime/preview-deploy/action-proposal.ts`.
- Preview deploy gateway in `src/adapters/preview-deploy/gateway.ts`.
- Repo write runtime proposal compiler in `src/runtime/repo-write/action-proposal.ts`.
- Repo write gateway in `src/adapters/repo-write/gateway.ts`.
- Tests for package-install gateway, package-install runtime, package-install end-to-end, preview-deploy gateway, repo-write gateway, repo-write D1/HTTP, and support flows.

Current `.planning/codebase/CONCERNS.md` says:

- Runtime ingress is a 1,014-line cross-family module hardcoding package install, x402 payment, and auth.md dispatches.
- Each new protected-action family increases risk of missed refusal fields, cross-family parameter drift, and accidental authority language in the public runtime subpath.
- New family conversion should move behind source-owned family adapters or registry.
- Runtime ingress creates proposal evidence only: no policy decisions, greenlights, gateway checks, mutation attempts, receipts, or authority certificates.
- Package install is currently a regression lane until external package-manager material attestation is source-owned and tested.
- Broad runtime/host interception is not proven.

Current `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` recommends first candidates:

1. package-manager material attestation, because package install already exists as a regression lane;
2. preview deploy, because it is a common automated/generative execution mutation with visible downstream consequence;
3. repo write with protected branch or release consequence, because it exercises generated-code inspection and gateway path binding.

Mechanisms required per adapter:

- install proposal compiler;
- action type and gateway registry entry;
- exact parameter canonicalization;
- gateway observed-parameter validator;
- custody/bypass probes;
- receipt/proof-gap mapper;
- conformance fixture;
- buyer-readable report.

## External Source Constraints

For package-manager material attestation:

- npm provenance lets consumers verify where/how a package was published and validate authorized publisher posture; `npm audit signatures` verifies registry signatures and provenance attestations when dependencies were installed with npm CLI support.
- npm provenance is not proof of benign code; it is a verifiable link to source/build instructions and transparency log evidence.
- npm registry signatures bind package name, version, and tarball integrity.
- Trusted publishing can automatically generate provenance when public packages are published via supported OIDC workflows, but account/repository/workflow correctness remains external configuration.
- Bun creates a `bun.lock` lockfile and recommends committing it; Bun lock evidence is local material evidence, not npm provenance verification by itself.

Source links used:

- https://docs.npmjs.com/viewing-package-provenance/
- https://docs.npmjs.com/about-registry-signatures/
- https://docs.npmjs.com/generating-provenance-statements/
- https://docs.npmjs.com/trusted-publishers/
- https://bun.com/docs/pm/lockfile

## Planning Question

Create a macro plan for concrete adapter pack expansion. Decide the first adapter pack to promote, the sequencing for preview deploy and repo write, and the mechanism that keeps adapter packs modular without weakening Tier 1 or making x402 the protocol.

The likely answer should be: promote package-manager material attestation first, because package install already has runtime/gateway/regression lanes and external provenance standards can be bound as evidence. But challenge that if another candidate is materially stronger.

## Required Output Properties

The plan must include:

- selected first adapter pack and why;
- explicit non-goals and cut lines;
- adapter pack manifest contract;
- parameter canonicalization and observed-parameter validation;
- material/provenance evidence posture;
- gateway custody and bypass probes;
- conformance fixtures;
- runtime/MCP/CLI exposure boundary;
- buyer-readable proof report;
- validation gates and closeout commands;
- architecture/import posture and no-god-registry constraints;
- success criteria and 10-star product bar.

Do not implement source changes in this run.
