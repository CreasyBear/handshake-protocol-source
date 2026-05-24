# Context: Public Distribution And Publication

## Invariant At Stake

Public distribution must not launder publication into authority.

Handshake is protected actions for automated decision making. Publication can distribute package artifacts, proposal/evidence/read surfaces, and source-owned metadata. It cannot create permission, policy, greenlights, gateway checks, mutation authority, custody, settlement, payment handling, certification, trust, hosted operation, or host-wide enforcement.

## Macro Item

Public Distribution And Publication

## Run

`public-distribution-publication-20260524T090500Z`

## Current Package Surface

The current package is `handshake-protocol-kernel` at version `0.2.4`.

The package declares MCP name `io.github.joelchan/handshake-protocol-kernel`.

Public exports currently include root, conformance, runtime, SDK, role clients, CLI, MCP, experimental, and package metadata surfaces.

Installed commands currently include:

- `handshake`
- `handshake-mcp`
- package-name bin pointing to the MCP server

Packaged files currently include bin/source/dist/server metadata/readme/quality/structure/internal docs.

## Current Registry Surface

`server.json` targets MCP Registry schema `2025-12-11`.

It describes npm stdio package metadata and must remain non-authority.

MCP Registry is preview metadata infrastructure. It does not host npm artifacts and does not make security, trust, enforcement, marketplace, payment, or custody guarantees.

## Current Check Surface

Existing scripts already verify parts of the release boundary:

- package pack shape
- required files
- forbidden paths
- `private: false`
- MCP name sync
- bin shebangs
- CLI schema non-authority smoke
- MCP stdio official client smoke
- no raw `PaymentPayload` or `SIGNATURE` leakage

These checks are necessary but not complete. They do not by themselves prove account posture, actual npm publication, clean install from the public registry, provenance, MCP Registry acceptance, or post-registry discoverability.

## Canon Drift To Resolve Later

README/docs already describe package entrypoints and MCP metadata, but some canon still uses older engineering-agent phrasing.

That drift is a release blocker for this macro item because the hard invariant is broader: protected actions for automated decision making. Engineering-agent actions may remain a first domain or wedge, but cannot be the product center.

## Strategy Boundary

Do not use the cleanest proof surface as a first-market claim.

x402 exact per-call is the first proof wedge because it is narrow, per-call, inspectable, and easy to test. It is not the protocol center. The protocol center is exact contract, one-use greenlight, gateway check, receipt/refusal/proof-gap, isolation, and bypass posture for protected actions.
