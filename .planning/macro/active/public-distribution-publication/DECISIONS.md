# Decisions

## D-001: Publication Is Non-Authority

Publication distributes package artifacts, source-owned metadata, and proposal/evidence/read surfaces. It does not create authority, decisions, greenlights, gateway checks, mutations, custody, hosted operation, certification, settlement, payment management, trust, or host-wide enforcement.

## D-002: Protected Actions Are The Product Center

Handshake is protected actions for automated decision making. Engineering-agent actions are a first domain, not the full product definition.

## D-003: x402 Is First Proof Wedge Only

x402 exact per-call is the first proof wedge because it is narrow, per-call, and inspectable. It must not become the protocol center in package, registry, or README language.

## D-004: Release States Must Be Separate

The release lifecycle must distinguish:

- `ready_to_publish`
- `actually_published`
- `registry_discoverable`

No state can imply the next one.

## D-005: Release Proof Must Be Structured

The release must produce or update a source-owned `PackageReleaseProof` shape with package shape, account/namespace, publish operation, provenance, registry discoverability, runtime smoke, authority boundary, and proof gaps.

## D-006: Release Manifest Before Publish

A release manifest must exist before npm publish. It must identify exact package, version, tag, expected pack contents, public entrypoints, account posture, provenance posture, authority-boundary false fields, and stop conditions.

## D-007: Post-Publish Receipt After Publish

A post-publish verification receipt must exist after npm publish. It must prove clean install, installed bins, installed exports, non-authority behavior, and any proof gaps.

## D-008: MCP Registry Is Metadata Only

MCP Registry publication must be treated as metadata/discoverability. It is not artifact hosting, certification, trust establishment, policy enforcement, or marketplace approval.

## D-009: Public Claims Must Be Cut To Enforced Reality

Any claim that exceeds package metadata, installability, proposal/evidence/read surfaces, or source-owned checks must be removed or rewritten.

## D-010: Risky Publish Credentials Cannot Be Silent

Long-lived token publish, bypass-2FA token usage, missing 2FA, unavailable provenance, or unknown namespace auth must be explicit blocker/proof-gap states, not hidden release details.
