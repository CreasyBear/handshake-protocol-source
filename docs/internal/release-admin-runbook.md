# Release Admin Runbook

## Invariant

Release administration must prove the source-to-artifact boundary from a clean
checkout before any artifact push, GitHub release, repository metadata edit, or
launch claim.

The source checkout, package-artifact repository, npm publication, GitHub
release object, and MCP Registry discoverability are separate boundaries.
Passing one boundary does not create authority in another.

## Failure That Created This Rule

Local `npm run check:repo` passed while the workspace already had `dist/`
output. GitHub Actions then failed from a clean checkout because package subpath
imports depended on generated declarations and bundles. A partial fix built only
declarations, but demo and package-export tests also needed bundled `.mjs`
entrypoints.

The process failure was treating remote CI failures as whack-a-mole feedback
instead of first defining the release-admin state machine.

## Required State Machine

Run this before launch-admin work:

```bash
npm run release:admin:check
```

That gate performs:

1. Require a clean source worktree.
2. Clone the source repo into a temporary clean checkout.
3. Install dependencies from the lockfile.
4. Run `npm run check:repo` in the clean checkout.
5. Project the package-artifact repository.
6. Verify the artifact allowlist, manifest non-authority posture, and pinned
   Trusted Publishing workflow.
7. Smoke artifact package imports.
8. Smoke the artifact CLI.

After source and artifact pushes, run:

```bash
npm run release:admin:check:remote
```

That repeats the clean gate and verifies remote source/artifact refs.

## First-Time npm Maintainer Practices

- Treat every published `package@version` as permanent. Publish a new patch
  version for fixes; do not plan on reusing a version after publication.
- Use a non-default distribution tag such as `next` for uncertain releases.
  Promote to `latest` only after registry readback, clean install, CLI/import
  smoke, and public README claim review have passed for the exact artifact.
- Treat npm download counts as distribution noise until they bind to external
  evidence: an issue, support thread, external repository, host transcript,
  recorded integration, or named consumer.
- Keep package claims limited to distribution, local proposal/evidence,
  conformance, and install readiness. npm availability must not imply hosted
  operation, policy authority, gateway enforcement, broad MCP protection,
  x402-provider compatibility, package safety proof, or production certification.
- Keep npm account and package settings outside the source tree but inside the
  release checklist: two-factor authentication, token restrictions, minimal
  maintainers, and Trusted Publishing configured only for the artifact
  repository boundary.
- Treat each new root export, subpath export, binary, runtime dependency, or
  lifecycle script as a public contract expansion. Add package-surface coverage
  and claim-boundary review before release.
- Avoid install-time lifecycle scripts unless the package truly needs them.
  A proposal/evidence package should not execute hidden work during consumer
  install.
- For a bad release, prefer a deprecation warning plus a fixed patch release.
  Use unpublish only for accidental exposure while npm policy still permits it,
  then add the missed precondition to `check:repo`, `pack:check`, or this
  release-admin gate.

## Three-Month High-Activity Readiness

The package may aim for high npm activity, but raw download count is the weakest
signal. The activity ladder is:

1. npm tarball downloads.
2. repeat installs after the publish burst settles.
3. external issues, discussions, or support threads.
4. external repositories, lockfiles, or host configs naming the package.
5. MCP host transcripts or integration reports that show proposal/evidence
   readback.
6. protected-action events whose gateway, receipt, refusal, or proof-gap chain is
   reconstructable.

Only levels 3 through 6 count as adoption evidence. Levels 1 and 2 are
distribution telemetry and may be mirrors, scanners, CI, or package indexers.

High activity is allowed only if the default install path stays boring:

- no install-time telemetry, phone-home behavior, hidden postinstall work, or
  usage beacons;
- no package expansion to hosted policy evaluation, gateway custody, signer
  custody, mutation execution, certificate minting, or broad MCP protection;
- no new root export, subpath export, binary, runtime dependency, or lifecycle
  script without package-surface tests and claim-boundary review;
- no `latest` promotion until the exact artifact has passed registry readback,
  clean install, CLI/import smoke, README claim review, and post-publish
  deprecation/recovery readiness;
- no breaking change to CLI command output, MCP tool/resource names, `server.json`
  identity, public exports, or role-scoped SDK behavior outside a semver-major
  or explicitly tagged prerelease.

Support intake should classify every public report before fixing it:

- install or engine failure;
- import, export, or type declaration failure;
- CLI or MCP host activation failure;
- documentation or first-use confusion;
- authority-boundary confusion;
- security or dependency concern;
- feature request that would widen the package contract.

The response rule is to convert repeated support confusion into a smaller
mechanism: a clearer CLI error, a tighter README sentence, a conformance fixture,
a package-surface test, or a claim-boundary test. Do not answer support pressure
by making npm itself the hosted product boundary.

For a security or broken-release incident:

1. stop promotion and remove misleading launch claims;
2. classify whether the issue is package content, package metadata, dependency,
   Trusted Publishing, CLI/MCP activation, or authority-claim drift;
3. deprecate the affected version when users need a warning;
4. publish a fixed patch version under a non-default tag first;
5. add the missed precondition to the smallest failing gate;
6. promote only after remote readback proves the exact fixed artifact.

## npm Maintainer Posture Command

Run the local maintainer posture check before release review:

```bash
npm run release:npm:posture
```

That command verifies the local package identity, release scripts, `pack:check`
binding, absence of install-time lifecycle scripts, package file allowlist,
README non-authority claims, and high-activity runbook posture. It is also part
of `npm run pack:check`.

After npm publication, dist-tag changes, deprecations, or artifact-repository
publish workflow changes, run:

```bash
npm run release:npm:posture:remote
```

Remote posture readback verifies public npm registry availability, `latest`
dist-tag alignment, registry signature metadata, provenance metadata, and
download telemetry classification. It still cannot verify private npm account
settings, long-lived token absence, package maintainer list intent, Trusted
Publishing UI configuration, support-channel monitoring, or whether downloads
represent real users. Those remain manual external checks and must not be
smoothed into "green" local proof.

## Forbidden Shortcuts

- Do not treat a local green gate as release proof when `dist/` or
  `node_modules/` already exists.
- Do not create GitHub releases, edit repository metadata, or make launch claims
  before the release-admin gate passes.
- Do not put npm Trusted Publishing in the source repository.
- Do not treat package artifact projection as npm publication.
- Do not treat npm availability as policy authority, gateway enforcement,
  hosted operation, MCP Registry discoverability, or cross-org trust.
- Do not use the package README for source release-admin guidance.

## Authority Boundary

`npm run release:admin:check` and `npm run release:admin:check:remote` do not
publish to npm, create GitHub releases, change repository metadata, create
policy decisions, issue greenlights, perform gateway checks, mutate protected
surfaces, mint certificates, or register MCP discoverability.

They only prove that release administration can move from source truth to a
bounded artifact repository without hidden local state.

## Recovery

If GitHub CI fails after the gate passed locally, first compare the failing
stage against the gate state machine. Patch the missing precondition into the
gate or `check:repo`; do not patch only the observed CI symptom.

If the package-artifact repo diverges, regenerate it from source with
`scripts/project-release-repository.js`, smoke it, and commit the artifact
change separately from source changes.
