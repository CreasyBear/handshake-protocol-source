# Assumptions

## Release Assumptions

- The package remains public npm package `handshake-protocol-kernel`.
- The version for this macro starts from current source version `0.2.4`, but implementation must verify whether that version is publishable, already published, or needs incrementing.
- `package.json` remains the source of npm package identity.
- `server.json` remains the source of MCP Registry metadata.
- MCP Registry publication is separate from npm publication.
- Clean install verification must run against the public package artifact, not the local checkout.

## Authority Assumptions

- Publication is not an authority path.
- Installation is not authorization.
- MCP discoverability is not trust.
- Registry namespace verification is not policy authorization.
- Package provenance is artifact provenance, not runtime enforcement proof.
- CLI/MCP successful startup is runtime availability proof, not mutation proof.
- x402 exact per-call proves a narrow protected-action pattern, not all protected actions.

## Operational Assumptions

- Trusted publishing/OIDC is preferred over long-lived npm tokens.
- Any token path requires explicit 2FA and bypass-risk posture.
- Provenance may be available under supported npm trusted publishing conditions.
- Missing provenance support is a proof gap unless release policy explicitly blocks publication.
- MCP Registry preview instability may require blocking or recording preview proof gaps.

## Documentation Assumptions

- Public docs must describe Handshake as protected actions for automated decision making.
- Engineering-agent language may be retained only as a domain example or first wedge.
- Public docs must state that publication distributes package and metadata surfaces only.
- Public docs must not imply hosted operation, marketplace review, settlement, payment management, custody, trust, or host-wide enforcement.

## Proof Gap Assumptions

The following are proof gaps until evidenced:

- npm account ownership posture
- namespace ownership posture
- 2FA/token posture
- OIDC/trusted publishing posture
- provenance availability
- actual npm publication for exact version
- clean install from public npm
- MCP Registry namespace auth
- MCP Registry metadata acceptance
- post-registry discoverability
- rollback/deprecation readiness
