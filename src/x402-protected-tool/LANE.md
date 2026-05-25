# X402 Protected Tool Lane

## Authority owner

The x402 protected tool lane is owned by the public package surface for the first normal-agent-tool protected action.

## Current proof claim

The lane exposes the `handshake.actions.x402_payment.propose` facade, a source-owned protected-tool readiness contract, a source-owned production acceptance matrix, host-profile descriptors for Codex, Claude Code, Hermes, OpenClaw, and generic MCP, and Codex-local, Claude Code managed-MCP, Hermes tool-packet, OpenClaw tool-packet, and generic MCP stdio activation artifacts. It can prepare proposal/runtime evidence, profile artifacts, and source-owned host-specific bypass proof packets only after a bound trusted-readiness proof is present. That proof binds install digest, probe posture digest, gateway registration, wallet-signer credential-ref digest/custody, redacted gateway custody proof packet digest/claim level/external-verification posture/expiry, policy version, gateway registry entry, operating envelope, selected payment requirement digest, raw sibling posture, and expiry. It carries explicit non-authority flags and does not create policy decisions, greenlights, gateway checks, credential resolution, signer use, payment material, mutations, receipt exports, terminal certificates, settlement, provider custody, hosted operation, live user host mutation, native host certification, or host-wide containment.

## Use cases

- Import the runtime-neutral protected x402 proposal facade from the package.
- Inspect the production acceptance matrix for the first x402 protected-tool path.
- Build host profile descriptors for Codex, Claude Code, Hermes, OpenClaw, or generic MCP.
- Build a Codex-local activation artifact that binds the MCP server config target, command, wrapper/config digest, tool-list digest, source-observed gateway/one-use evidence, and named raw sibling probes.
- Build a Claude Code managed-MCP activation artifact that binds `.mcp.json`, command, wrapper/config digest, tool-list digest, source-observed gateway/one-use evidence, unmanaged-MCP sibling posture, and named raw sibling probes.
- Build a Hermes tool-packet activation artifact that binds `hermes.tool-packet.json`, command, wrapper/config digest, tool-list digest, source-observed gateway/one-use evidence, unmanaged-tool-packet posture, native-host non-claims, and named raw sibling probes.
- Build an OpenClaw tool-packet activation artifact that binds `openclaw.tool-packet.json`, command, wrapper/config digest, tool-list digest, source-observed gateway/one-use evidence, unmanaged-tool-packet posture, native-host non-claims, and named raw sibling probes.
- Build a generic MCP stdio activation artifact that binds `mcp.json`, command, wrapper/config digest, tool-list digest, source-observed gateway/one-use evidence, unmanaged-MCP-server posture, native-host non-claims, and named raw sibling probes.
- Check a bound trusted gateway readiness proof before preparing a runtime dispatch block.
- Bind the readiness proof as pre-contract posture with raw sibling posture and explicit non-authority flags.
- Preserve raw sibling and host-wide containment non-claims in adapter-pack outputs.

## Constraints and assumptions

- The package subpath is a distribution surface for a protected tool, not the gateway.
- Trusted readiness is pre-contract posture, not permission, and facade/profile inputs must bind to the same readiness and gateway custody proof.
- Runtime dispatch preparation remains proposal-only.
- Gateway-held signer use remains in the gateway adapter after `VerifiedGatewayCheck`.
- Hermes and OpenClaw native host behavior are still not certified by the source-owned tool-packet activation artifacts.

## Core components

- `ProtectedX402ToolFacadeInputSchema`
- `prepareProtectedX402ToolDispatch`
- `X402_PROTECTED_TOOL_NAME`
- `X402_PROTECTED_TOOL_ACCEPTANCE_VERSION`
- `x402ProtectedToolAcceptanceMatrix`
- `x402ProtectedToolForbiddenProductionClaims`
- `x402ProtectedToolReleaseBlockers`
- `X402_PROTECTED_TOOL_READINESS_VERSION`
- `X402ProtectedToolReadinessSnapshotSchema`
- `X402ProtectedToolReadinessAuthorityBoundarySchema`
- `X402ProtectedToolReadinessRawSiblingPostureSchema`
- `x402ProtectedToolReadinessAuthorityBoundary`
- `ClaudeCodeX402ProtectedToolActivationInputSchema`
- `ClaudeCodeX402ProtectedToolActivationArtifactSchema`
- `buildClaudeCodeX402ProtectedToolActivation`
- `CodexX402ProtectedToolActivationInputSchema`
- `CodexX402ProtectedToolActivationArtifactSchema`
- `buildCodexX402ProtectedToolActivation`
- `HermesX402ProtectedToolActivationInputSchema`
- `HermesX402ProtectedToolActivationArtifactSchema`
- `buildHermesX402ProtectedToolActivation`
- `OpenClawX402ProtectedToolActivationInputSchema`
- `OpenClawX402ProtectedToolActivationArtifactSchema`
- `buildOpenClawX402ProtectedToolActivation`
- `GenericMcpX402ProtectedToolActivationInputSchema`
- `GenericMcpX402ProtectedToolActivationArtifactSchema`
- `buildGenericMcpX402ProtectedToolActivation`
- `X402ProtectedToolGatewayReadinessSnapshotSchema`
- `X402ProtectedToolHostProfileDescriptorSchema`
- `buildProtectedX402ToolHostProfile`
- `x402ProtectedToolHostProfileAuthorityBoundary`

## Failure and scale posture

Invalid or authority-shaped input fails as a structured facade challenge before runtime dispatch preparation. Stale metadata, missing trusted gateway readiness, readiness-proof drift, missing/unverified/stale custody proof, offline gateway posture, unsupported request-body posture, unsafe credential custody, and non-local provider posture fail closed without creating authority. The lane scales by keeping runtime packaging shared and leaving all signer, gateway, policy, receipt, and storage behavior outside this package surface.

## Future package target

This lane is published through `handshake-protocol-kernel/x402-protected-tool`.

## Allowed imports

- `src/adapters/x402-payment/protected-tool-readiness`
- `src/adapters/x402-payment/protected-tool-facade`
- `src/adapters/x402-payment/protected-tool-profile`
- `src/adapters/x402-payment/protected-tool-profile/claude-code-activation`
- `src/adapters/x402-payment/protected-tool-profile/codex-activation`
- `src/adapters/x402-payment/protected-tool-profile/generic-mcp-activation`
- `src/adapters/x402-payment/protected-tool-profile/hermes-activation`
- `src/adapters/x402-payment/protected-tool-profile/openclaw-activation`
- `src/surfaces/x402-protected-tool-acceptance`

## Forbidden imports

- protocol kernel behavior
- policy evaluators
- greenlight transitions
- gateway gate internals
- wallet gateway or signer factories
- storage adapters
- CLI process runners
- MCP server process runners
- experimental adapter runners

## Guarding tests

- `test/runtime/x402-protected-tool-facade.test.ts`
- `test/adapters/x402-protected-tool-profile.test.ts`
- `test/adapters/x402-protected-tool-claude-code-activation.test.ts`
- `test/adapters/x402-protected-tool-codex-activation.test.ts`
- `test/adapters/x402-protected-tool-generic-mcp-activation.test.ts`
- `test/adapters/x402-protected-tool-hermes-activation.test.ts`
- `test/adapters/x402-protected-tool-openclaw-activation.test.ts`
- `test/product/x402-protected-tool-acceptance.test.ts`
- `test/product/x402-protected-tool-profiles.test.ts`
- `test/architecture/package-surface.test.ts`
- `test/architecture/root-exports.test.ts`
- `test/architecture/surface-boundary-posture.test.ts`
- `test/architecture/import-posture.test.ts`

## Public surface

The public surface is the `./x402-protected-tool` package subpath. The package root must not re-export the protected tool facade or host profile helpers.

## Extraction trigger

Extract only when the x402 protected tool profile needs independent runtime-specific package release cadence, host marketplace submission, and live-host smoke infrastructure.

## Scope boundary

This lane is protected-tool proposal and host-profile distribution. It can require redacted custody proof packet evidence, but it is not gateway custody, signer custody, policy authority, gateway authority, mutation execution, receipt export, settlement, provider custody, hosted operation, marketplace certification, generic x402 compatibility, or broad runtime containment.
