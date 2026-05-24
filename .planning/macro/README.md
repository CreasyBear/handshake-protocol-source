# Macro Planning Workspace

Invariant: this folder is scratch coordination for macro work. It must not become repo-facing canon, package surface, command naming, or product claim evidence.

## Active

- `DEFERRED-INTEGRATE-ELIMINATE.md`: current integrate/eliminate register and critical path.
- `active/x402-product-evaluation-20260524/`: not fully implemented. The activation/productization plan still names blocked work around a local verification command and first-use packet shape.

## Implemented

- `implemented/2026-05-22-tier2-sdk-cli-mcp-surfaces/`: SDK, CLI, and MCP first-slice surfaces closed under explicit cut lines.
- `implemented/2026-05-23-auth-md-integration/`: auth.md adapter integration plan closed with source-backed implementation status and gates.
- `implemented/2026-05-23-pre-hosted-tier2-telemetry/`: response and telemetry posture hardening closed.
- `implemented/2026-05-23-tier2-surface-hardening/`: Tier 2 surface hardening closed.
- `implemented/2026-05-24-cli-mcp-publish-readiness/`: CLI/MCP package-readiness source gates closed; actual external publication remains owner-held.
- `implemented/2026-05-24-tier2-x402-sandbox/`: local x402 sandbox proof closed under local/reference non-claims.
- `implemented/2026-05-24-concerns-elimination/`: codebase concern elimination plan and validation closed.
- `implemented/2026-05-24-tier2-macro-closeout/`: seven active macro plans source-closed with audit, review, GSD remap, and explicit external proof gaps.

## Archive

- `archive/strategy-studies/`: historical macro state, clearing-house, gbrain, and next-decision studies.
- `archive/source-comparisons/`: source comparison studies such as Infisical/auth and vault adapter planning.
- `archive/system-junk/`: moved local filesystem artifacts.

## Placement Rule

- Move source-closed plans to `implemented/<date-slug>/`.
- Move superseded or historical studies to `archive/<category>/`.
- Keep unresolved implementation plans in `active/<slug>/` or the root active register.
- Do not use `.planning/` content as canonical truth unless a later source/doc change promotes and validates it.
