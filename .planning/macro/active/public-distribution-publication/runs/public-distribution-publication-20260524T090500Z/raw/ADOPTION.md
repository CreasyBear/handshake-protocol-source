# ADOPTION: Public Distribution And Publication

## Invariant At Stake

Public distribution must not convert a proposal/evidence surface into an authority claim. If npm, CLI, MCP, README, or support output implies enforcement without a blocking gateway check, this is advisory, not Handshake.

## First Install/Test-Drive Flow

### npm user

The first-run path should prove three things fast:

1. The package installs by public name.
2. The CLI/bin exports work on the supported Node runtime.
3. A user can generate or inspect an exact protected-action proposal without believing mutation is enforced.

Recommended flow:

```bash
npm install <package-name>
npx <bin> --version
npx <bin> doctor
npx <bin> demo x402
npx <bin> support-bundle --dry-run
```

The demo should show:

- exact per-call action contract;
- policy decision shape;
- evidence/receipt shape;
- explicit statement that no real mutation occurred;
- explicit statement that enforcement requires a gateway integration.

Do not make the first demo depend on hosted accounts, secrets, payment credentials, or real x402 traffic.

### MCP user

The MCP path should prove stdio startup and read/proposal capability only:

```json
{
  "mcpServers": {
    "handshake": {
      "command": "npx",
      "args": ["<package-name>", "mcp"]
    }
  }
}
```

Expected first MCP actions:

- `handshake.readiness`;
- `handshake.describeCatalog`;
- `handshake.proposeAction`;
- `handshake.renderEvidence`;
- `handshake.supportBundle`.

Avoid MCP tools named as if they execute protected work unless they really perform gateway-blocked enforcement. Prefer `propose*`, `inspect*`, `explain*`, `read*`, `render*`.

## README/Quickstart Posture

The README should open with a tight boundary:

> Handshake turns consequential automated actions into exact proposed action contracts, policy decisions, gateway checks, and reconstructable evidence. This package provides public SDK, CLI, MCP, and readiness surfaces. Enforcement exists only where a blocking gateway check is integrated before mutation.

The quickstart should separate:

- **Proposal/read mode:** CLI, MCP, SDK can form contracts and evidence.
- **Gateway mode:** protected mutation is blocked unless an exact greenlight is checked at the gateway.
- **Preview status:** package is public/preview; enforcement coverage is intentionally narrow.

The x402 wedge should be framed as the first proof path:

> The first packaged wedge is exact per-call x402 authorization evidence. Handshake is not x402-only; x402 is the first narrow protected-action surface used to prove contract binding, one-use greenlights, and receipt evidence.

## CLI/MCP Expectations And Non-Claims

### CLI may claim

- creates exact action proposals;
- canonicalizes known action contracts;
- runs readiness checks;
- emits support bundles;
- validates package/MCP metadata;
- demonstrates x402 per-call contract/evidence flow;
- shows whether a gateway is configured.

### CLI must not claim

- "protects your agents" by itself;
- "enforces MCP tools" broadly;
- "secures payments" generally;
- "manages x402 payments";
- "approves actions" unless policy decision semantics are exact;
- "blocks mutation" unless the command is paired with a real gateway check.

### MCP may claim

- exposes proposal/read/evidence tools to MCP clients;
- lets an agent inspect catalog, policy posture, and receipts;
- can participate in review flows.

### MCP must not claim

- that stdio itself is the enforcement boundary;
- that MCP registration protects tools;
- that an agent cannot bypass it;
- that all CLI/MCP actions are protected;
- that a rendered plan is permission.

If MCP can propose but not block, say so directly:

> This MCP server is a proposal and evidence surface. It does not enforce protected mutation unless the downstream gateway checks the exact greenlight before consequence.

## Support Bundle/Readiness Report

The support bundle should be boring, local, and redacted by default.

It should include:

- package name/version;
- Node version and platform;
- binary resolution;
- export resolution;
- package files included;
- `server.json` presence and parse result;
- MCP stdio smoke result;
- namespace/auth status where relevant;
- provenance status;
- preview/GA status;
- configured gateway status;
- action catalog version;
- x402 demo readiness;
- last readiness failure code;
- redaction summary.

It should not include:

- secrets;
- raw env vars;
- payment credentials;
- private keys;
- full filesystem listings;
- hosted account tokens;
- mutation payloads unless explicitly redacted.

Readiness status should be explicit:

- `ready:proposal-mode`
- `ready:gateway-mode`
- `blocked:metadata`
- `blocked:runtime`
- `blocked:mcp-stdio`
- `blocked:package-contents`
- `blocked:namespace-auth`
- `blocked:provenance`
- `preview:unsupported-enforcement`

## Error Message Guidance

| Failure | Message Shape |
|---|---|
| Namespace auth | `Namespace authorization failed for <package-name>. Publish/install identity could not be verified. This blocks public distribution readiness, not local proposal-mode use.` |
| Metadata | `Package metadata is incomplete: missing <field>. npm/MCP users need stable name, version, bin, exports, files, and preview status before public install can be trusted.` |
| Provenance | `Package provenance is missing or unverifiable. Public publication can proceed only as preview if this is intentional; otherwise fix provenance before release.` |
| Package contents | `Published files do not include required runtime assets: <paths>. The package may install but cannot provide the documented CLI/MCP surface.` |
| Node runtime | `Unsupported Node runtime: detected <version>, requires <range>. Handshake cannot guarantee CLI/MCP behavior on this runtime.` |
| MCP metadata/server.json | `MCP Registry metadata is invalid: <reason>. This blocks registry readiness, not npm install by name.` |
| MCP stdio smoke | `MCP stdio smoke failed before capability registration: <reason>. The server is not ready for MCP clients.` |
| Gateway missing | `No blocking gateway configured. CLI/MCP/SDK are available in proposal/evidence mode only.` |
| x402 demo unavailable | `x402 per-call demo is unavailable: <reason>. This does not mean Handshake is x402-only; it means the first public proof wedge is not ready.` |

Error messages should say what is blocked and what is still usable. Do not collapse metadata failure, enforcement failure, and demo failure into one vague "setup failed."

## 10-Star First Public Package Experience

A 10-star first package experience looks like this:

- `npm install` works by name without private registry assumptions.
- `npx <bin> doctor` gives a crisp readiness report in under a few seconds.
- MCP users can paste one config block and get a successful stdio smoke.
- The first demo produces an exact x402 per-call proposal/evidence artifact without requiring real money movement.
- Every screen distinguishes proposal, policy decision, gateway check, execution result, refusal, and proof gap.
- README tells users exactly what is enforced today and what is only preview/proposal mode.
- Package contents match docs: bins, exports, server metadata, examples, and support command all work.
- Failure messages are actionable and scoped.
- No hosted operation is implied.
- No broad "agent security" claim appears before gateway enforcement exists.

## What To Avoid

Avoid:

- naming commands `approve`, `execute`, `protect`, or `enforce` unless they actually bind to gateway checks;
- presenting MCP as the enforcement point;
- making x402 read as the whole product;
- making Handshake sound like payment management;
- claiming engineering-agent-only scope in public positioning;
- implying hosted control plane dependency;
- using "trust," "secure," "policy," or "approval" without exact mechanism;
- showing a review UI that is not bound to the exact action contract;
- letting support output imply downstream business success;
- hiding preview limitations behind friendly onboarding copy.

## Brutal Verdict

Keep public distribution narrow. The package should make Handshake feel easy to try, but hard to misunderstand. Public DevEx wins only if users can install, inspect, propose, and verify readiness while clearly seeing that real protection begins at the gateway check.

Smallest next mechanism to build: a single `doctor`/readiness contract that reports `proposal-mode` versus `gateway-mode` and drives the README, CLI, MCP smoke, and support bundle from the same status vocabulary.
