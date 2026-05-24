# STRATEGY: Public Distribution And Publication

## Invariant At Stake

Public distribution must not launder installability into authority. A published package, MCP listing, CLI, SDK, or metadata file can make Handshake easier to inspect and install. It cannot prove enforcement, gateway custody, hosted operation, certification, marketplace trust, settlement, or host-wide control.

## Strategic Posture

This macro item succeeds only if publication makes the protocol kernel legible, installable, inspectable, and verifiable without overstating what has been enforced.

Handshake should be presented as:

> protected actions for automated decision making, with exact per-call x402 as the first proof wedge.

Not:

> agent auth, a payment network, a hosted enforcement layer, an MCP trust system, or a certification authority.

x402 is the proof wedge because it gives a concrete, high-signal surface: exact per-call consequence, declared contract, explicit evidence, and verifiable refusal/proof-gap posture. It is not the protocol center.

## Ready-To-Publish vs Actually Published

**Ready-to-publish** means the repo can prove the package shape locally:

- `handshake-protocol-kernel` has correct `name`, `version`, `exports`, `bin`, `files`, `server.json`, and `mcpName`.
- `npm pack --dry-run` contents match the intended public surface.
- Published entrypoints resolve from the packed artifact, not just local source.
- CLI/MCP/SDK entrypoints work from the package artifact.
- `server.json#name` and `package.json#mcpName` match MCP Registry requirements.
- README and public docs describe distribution as distribution, not enforcement.
- Security posture is documented: trusted publishing/OIDC preferred, npm 2FA/token posture explicit.
- No planning scratch, internal labels, stale claims, or non-public dependency assumptions leak into the package.

**Actually published** means external systems now carry the public surface:

- npm package version is published and installable by name.
- Fresh install from npm works in a clean environment.
- CLI bin executes from installed package.
- SDK/package exports resolve from installed package.
- MCP server metadata is accepted by the preview registry using public install methods.
- Post-publish evidence confirms npm contents and registry metadata match source-owned metadata.
- Docs distinguish "listed/installable" from "trusted/enforced/certified."

Ready-to-publish is a local evidence state. Actually published is an external distribution state. Do not collapse them.

## Sequencing

1. **Local Package Contract**
   Freeze the intended public package shape: `package.json`, `exports`, `bin`, `files`, `server.json`, `mcpName`, README install commands, and public claim language.

2. **Pack Evidence**
   Run pack dry-run and artifact-level entrypoint checks. The question is not "does the repo build?" The question is "does the artifact contain only the intended public surface and still work when consumed externally?"

3. **Security Posture**
   Decide and document publish auth: trusted publishing/OIDC preferred; if not available, npm 2FA/token posture must be explicit. Long-lived token publishing should be treated as a risk exception, not normal posture.

4. **npm Publish**
   Publish `handshake-protocol-kernel` by exact version. npm is the artifact distribution authority for package installability, not a Handshake authority boundary.

5. **Clean Install Verification**
   Verify install by package name from npm. Check imports, bins, package metadata, and any published entrypoint behavior from a clean project.

6. **MCP Registry Submission**
   Submit metadata only after npm install works. MCP Registry hosts metadata, not package artifacts. Its preview status and namespace checks do not certify code or enforcement.

7. **Post-Publish Evidence**
   Capture the public install commands, resolved version, npm package contents, registry metadata, and known limitations. This becomes the publication receipt.

## Product Claim Boundaries

Allowed claims:

- Public protocol kernel package.
- Installable CLI/MCP/SDK distribution surface.
- Source-owned metadata for npm and MCP Registry.
- Exact per-call x402 proof wedge.
- Public read surfaces for proposal, evidence, and protocol inspection.
- Metadata and artifact checks that make the package reconstructable.

Forbidden or unsafe claims:

- "Handshake enforces protected actions" unless a gateway check actually enforces.
- "MCP Registry trust" or "certified server."
- "Marketplace trust."
- "Hosted Handshake."
- "Payment management."
- "Settlement."
- "Host-wide enforcement."
- "Secure by MCP listing."
- "Agent auth."
- "Approval system."
- "Auditable" unless the published artifact includes enough source-owned evidence to reconstruct the chain being claimed.

## 10-Star Publication Surface

A 10-star publication surface is boring, exact, and hard to misread:

- One npm package with clear package name, version, exports, bins, and files.
- One `server.json` whose identity matches `package.json#mcpName`.
- README install path that starts from npm install by name.
- Public examples that exercise exact protected-action proposal/evidence/read surfaces.
- CLI help text that does not imply gateway custody.
- SDK exports that expose kernel primitives, not hosted authority.
- MCP metadata that points to public install methods only.
- Security section covering trusted publishing/OIDC, npm 2FA, token posture, and registry-preview limitations.
- Post-publish verification notes showing clean install and entrypoint checks.
- Claim boundary section saying explicitly what publication does not provide.

The public surface should make the narrow wedge look inevitable because it is precise, not because it sounds broad.

## What To Cut

Cut anything that implies authority where there is only distribution:

- Hosted enforcement language.
- "Trust," "secure," or "certified" phrasing tied to npm or MCP Registry.
- Marketplace positioning.
- Payment network or settlement language.
- Claims that CLI/MCP/SDK publication means gateway enforcement.
- Internal planning-stage names in public package shape.
- Scratch `.planning/` references.
- Demo copy that makes x402 sound like the whole protocol.
- Any registry language that treats metadata validation as code validation.
- Any "agent infrastructure" framing that narrows the category back to engineering agents only.

## Success Criteria

The macro item is complete when:

- Local package artifact is inspectable and matches intended public files.
- npm published version is installable by package name.
- Published exports and bins work from clean install.
- MCP Registry metadata is accepted or, if blocked by preview constraints, the blocker is recorded as an external distribution proof gap.
- Public docs state exact claim boundaries.
- x402 is presented as first proof wedge, not protocol center.
- Post-publish evidence records artifact, metadata, install, entrypoint, and limitation checks.
- No public surface claims gateway enforcement, hosted custody, certification, marketplace trust, settlement, or host-wide authority unless that mechanism actually exists.

## End Criteria

End the macro when there is a publication receipt with:

- package name and version;
- npm install verification;
- pack contents verification;
- published entrypoint verification;
- MCP Registry submission or proof-gap status;
- public docs claim-boundary check;
- security posture note;
- list of intentionally unsupported claims.

If any one of those is missing, the item is not done. It may be ready-to-publish, partially published, or blocked, but not complete.

## Antipatterns

- Treating `npm publish` as product validation.
- Treating MCP Registry acceptance as trust.
- Publishing before clean artifact checks.
- Publishing metadata that points to non-public install methods.
- Letting README language outrun the package's actual authority boundary.
- Using x402 as brand center instead of proof wedge.
- Calling CLI/MCP/SDK publication "enforcement."
- Hiding npm token or 2FA posture as operational detail.
- Shipping broad category language without a narrow reconstructable proof surface.
- Letting package exports expose unstable internals because "it is just distribution."

## Brutal Verdict

Keep the macro item, but narrow it hard.

This is not "launch Handshake."
This is not "stand up enforcement."
This is not "become trusted infrastructure."

This is publication of the protocol kernel's proposal/evidence/read surface, with x402 exact per-call as the first proof wedge, through npm artifact distribution and MCP metadata distribution.

Smallest next mechanism to build: a publication receipt checklist that separates `ready_to_publish`, `npm_published`, `mcp_registry_listed`, and `post_publish_verified`, with explicit proof gaps for anything not externally verified.
