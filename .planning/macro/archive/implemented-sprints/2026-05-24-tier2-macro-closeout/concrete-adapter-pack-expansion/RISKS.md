# Risks

| ID | Risk | Failure Mode | Mitigation | Stop Condition |
| --- | --- | --- | --- | --- |
| R1 | Shortcut authority | Runtime ingress, CLI, MCP, or reports are treated as authorization. | State that only gateway observed-parameter validation enforces before consequence. | Any docs or implementation path claims ingress/CLI/MCP enforcement without gateway binding. |
| R2 | God registry | Cross-family hardcoding becomes one ambient authority registry. | Use small typed registries by concern. | Runtime ingress owns policy, gateway validation, or receipt mapping authority. |
| R3 | Provenance laundering | npm provenance/signatures are described as package safety. | Limit claim to source/build/publisher posture and registry/tarball integrity. | Report claims benign code, safe package, or supply-chain security. |
| R4 | npm audit replacement claim | Adapter sounds like a vulnerability or audit replacement. | Say material attestation complements policy; it is not vulnerability detection. | Product copy claims audit replacement. |
| R5 | Bun provenance confusion | Bun lockfile is treated as npm provenance verification. | Treat Bun lockfile as local reconstruction and drift evidence only. | Receipt says Bun verified npm provenance. |
| R6 | Lifecycle script escape | Package install runs consequential code under install authority. | Block lifecycle scripts by default unless separately contracted. | Lifecycle scripts execute without a separate exact contract. |
| R7 | Lockfile drift | Observed install differs from canonical contract or expected material. | Gateway validator rejects drift or records proof gap before consequence where rejection is impossible. | Drift is accepted silently. |
| R8 | Raw sibling bypass | Generated code invokes package manager outside the gateway. | Require bypass probes and block promotion if bypass posture is advisory only. | Bypass cannot be detected, isolated, or treated as blocking. |
| R9 | Credential custody ambiguity | Registry credentials or CI identity mutate outside declared authority. | Receipt and manifest name custody boundary and proof gaps. | Credential source cannot be reconstructed. |
| R10 | Report theatre | Buyer report summarizes action without exact binding. | Report must include action, authority, exact contract, evidence, outcome, proof gaps, reconstruction. | Report cannot tie back to contract id/hash and receipt evidence. |
| R11 | Stale policy | Gateway check uses a decision made against stale policy or stale contract. | Gateway validator checks exact greenlight binding, one-use state, and policy/contract identity. | Reused or stale greenlight can pass. |
| R12 | Expansion overreach | Preview deploy or repo write borrows package-install authority pattern without hostile fixtures. | Keep expansion order gated by conformance. | Second/third pack starts before package-install conformance closes. |
