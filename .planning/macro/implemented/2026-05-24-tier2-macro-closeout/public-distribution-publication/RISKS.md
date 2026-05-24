# Risks

| ID | Risk | Failure Mode | Mitigation | Stop Condition |
| --- | --- | --- | --- | --- |
| R-001 | Package leakage | Pack includes scratch plans, secrets, internal junk, or unintended source | Keep `npm pack --dry-run --json` as hard gate with required and forbidden path checks | Any forbidden path appears |
| R-002 | Dist/source mismatch | Local source passes but installed package fails | Clean install exact package/version after publish | Installed bins or exports fail |
| R-003 | Export overexposure | Public `exports` expose authority internals or unstable control surfaces | Review exports as public API and block arbitrary entrypoints | Export implies enforceable authority without gateway |
| R-004 | Bin overclaim | CLI or MCP bin language implies mutation or enforcement | Smoke installed bins for proposal/evidence/read posture | Bin says or implies publication-created authority |
| R-005 | Registry trust laundering | MCP Registry listing is described as certification or trust | Constrain registry language to metadata and discoverability | Metadata implies trust, certification, or security review |
| R-006 | Token/2FA weakness | Publish relies on risky long-lived or bypass-2FA credentials | Prefer OIDC trusted publishing; record credential posture | Account posture unknown or risky path unaccepted |
| R-007 | Missing provenance | Artifact provenance cannot be shown | Use trusted publishing where supported; otherwise record proof gap | Release policy requires provenance and proof is missing |
| R-008 | Namespace mismatch | `package.json#mcpName` and `server.json#name` drift | Keep sync check hard-gated | Names differ |
| R-009 | Metadata drift | README, package metadata, server metadata, and docs contradict | Add/reuse checks and manual release review | Public text reverts to engineering-agent-only center |
| R-010 | Install-script/dependency surprise | Package install runs unexpected lifecycle behavior or pulls broad dependencies | Inspect scripts/dependencies before publish | Unexpected mutation-capable install behavior appears |
| R-011 | Rollback fantasy | Bad release cannot be erased from consumers | Predefine deprecate/correction path | No rollback/deprecation posture exists |
| R-012 | MCP preview instability | Registry behavior changes or acceptance is unavailable | Treat registry as optional discoverability with proof gaps | Registry instability blocks reliable metadata receipt |
| R-013 | x402 center drift | Package language makes x402 the protocol center | Keep x402 as first proof wedge only | Public docs overfit Handshake to x402 |
| R-014 | Evidence theatre | Receipt conflates local checks, publish operation, registry metadata, and runtime success | Use separate proof sections and state transitions | Receipt cannot reconstruct state chain |
