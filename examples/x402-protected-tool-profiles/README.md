# X402 Protected Tool Profiles

This example renders source-owned Codex, Claude Code, Hermes, and OpenClaw
profile artifacts for the x402 protected tool facade.

```bash
npm run demo:x402-tool-profiles
```

The output is:

```text
examples/x402-protected-tool-profiles/output/latest.md
examples/x402-protected-tool-profiles/output/latest.json
```

These artifacts are install/profile guidance and source-owned smoke evidence.
They require a bound trusted-readiness proof before a dispatch block can be
prepared: install digest, probe posture digest, gateway registration,
wallet-signer credential-ref digest/custody, redacted gateway custody proof
packet digest/claim level/external-verification posture/expiry, policy version,
gateway registry entry, operating envelope, and expiry. The Codex-local, Claude
Code managed-MCP, Hermes tool-packet, and OpenClaw tool-packet outputs also
include host-specific activation proof packets that bind the config target,
command, wrapper/config digest, tool-list digest, source-observed gateway/one-use
evidence, and named raw sibling probes. That readiness proof is pre-contract
posture, not permission. The artifacts do not prove live user host mutation,
native Hermes/OpenClaw host certification, host-wide containment, policy
authority, gateway checks, signer use, payment material creation, settlement,
hosted operation, provider custody, marketplace certification, or cross-org
trust.

`latest.json` also includes schema-derived sample inputs for safe host-profile
preparation, unsafe provider posture, and proof-gap readiness. They are emitted
by the demo from current source helpers and validated by product tests against
`ProtectedX402ToolHostProfileInputSchema`; do not hand-copy stale JSON snippets
into docs.

The selected runtime transcript is Codex-local by source-owned default for this
checkout. It shows proposal/readback compatibility and raw sibling posture for
the configured `handshake-mcp` path, but it does not mutate `~/.codex/config.toml`
or prove live Codex host containment. Claude Code, Hermes, OpenClaw, and generic
MCP remain parity artifacts until one is explicitly selected and verified.
