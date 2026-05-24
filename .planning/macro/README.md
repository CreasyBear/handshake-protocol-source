# Macro Planning Workspace

Invariant: this folder is scratch coordination for macro work. It must not become repo-facing canon, package surface, command naming, or product claim evidence.

## Active

- `DEFERRED-INTEGRATE-ELIMINATE.md`: current integrate/eliminate register and critical path.
- `active/x402-product-evaluation-20260524/`: not fully implemented. The activation/productization plan still names blocked work around a local verification command and first-use packet shape.
- `active/auth-md-x402-interlock-20260524/`: active macro refresh. Plans a fail-first `auth_md_x402_interlock_packet.v0` before any composite auth.md/x402 execution surface.

## Implemented

Closed implementation sprint artifacts have been moved out of the active
workspace. Historical sprint packets live under
`archive/implemented-sprints/`; historical macro run packets live under
`archive/implemented-runs/`.

## Archive

- `archive/strategy-studies/`: historical macro state, clearing-house, gbrain, and next-decision studies.
- `archive/source-comparisons/`: source comparison studies such as Infisical/auth and vault adapter planning.
- `archive/implemented-sprints/`: source-closed implementation sprint packets.
- `archive/implemented-runs/`: closed macro run packets.
- `archive/system-junk/`: moved local filesystem artifacts.

## Placement Rule

- Move source-closed plans to `implemented/<date-slug>/` while they are being
  validated, then archive them under `archive/implemented-sprints/` during
  housekeeping.
- Move superseded or historical studies to `archive/<category>/`.
- Keep unresolved implementation plans in `active/<slug>/` or the root active register.
- Do not use `.planning/` content as canonical truth unless a later source/doc change promotes and validates it.
