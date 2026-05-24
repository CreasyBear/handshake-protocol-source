# ADOPTION Perspective

## Invariant At Stake

Mutation authority stays in the gateway. The adapter pack may propose, explain, diagnose, and report, but it must not make CLI/MCP/runtime surfaces feel like enforcement.

## Recommended First Adapter Pack

Make the first concrete expansion a Package Install Adapter Pack.

Do not promote preview deploy and repo write alongside it yet. Package install is narrow enough to prove modularity, evidence capture, lockfile grounding, registry identity checks, replay/idempotency posture, and gateway-bound mutation without implying Handshake controls the whole runtime.

x402 exact remains the first protected-action wedge. Package install becomes the first buyer-legible adapter proof that the same control primitive generalizes.

## Operator/Developer Adoption Path

1. Read-only inventory.
   Detect package manager, workspace root, lockfile, package manifests, registry config, and install command posture.
   Output what Handshake can observe, not what it can enforce.

2. Proposal mode.
   Agent/runtime/CLI/MCP can propose `package.install` candidates.
   Candidate includes package spec, manager, workspace, expected manifest targets, expected lockfile effect, lifecycle-script posture, registry source, and required gateway.

3. Evidence preview.
   Show npm provenance/signature/material identity evidence where available.
   Show Bun lockfile as local material evidence.
   Say explicitly: provenance/signatures support identity/source/build posture, not package safety.

4. Gateway-bound greenlight.
   Policy evaluates the exact canonical package-install contract.
   Gateway verifies one-use greenlight before running the install.
   No CLI or MCP command can mutate without the gateway check.

5. Receipt/report.
   Record proposal, canonical contract, policy decision, gateway check, execution result, lockfile/package manifest delta, evidence sources, and proof gaps.

## Command And Report Affordances

Developer-facing commands should feel boring and composable:

```bash
handshake adapters list
handshake adapters inspect package-install
handshake package-install scan
handshake package-install propose bun add zod@3.25.0
handshake package-install report --latest
handshake package-install diagnose --receipt <id>
```

Gateway mutation must be visibly separate:

```bash
handshake gateway execute <greenlight-id>
```

Avoid commands like:

```bash
handshake install zod
handshake approve install
handshake run agent safely
```

Those blur proposal, approval, and enforcement.

## Buyer-Readable Proof Report Shape

A useful report should fit on one page first, with expandable evidence.

Sections:

1. Action.
   Install package `zod@3.25.0` in workspace `apps/web` using `bun`.

2. Authority.
   Principal, runtime, policy version, greenlight id, gateway id.
   State clearly whether the gateway enforced before mutation.

3. Exact Contract.
   Canonical action type, package name/version/range, registry, package manager, workspace, expected manifest/lockfile targets, idempotency key, one-use greenlight binding.

4. Evidence.
   npm provenance/signature status if available, registry metadata captured, Bun lockfile before/after material delta, package manifest delta, lifecycle scripts detected or absent.

5. Outcome.
   Executed, refused, quarantined, halted, or proof gap.
   Downstream install success is not the same as package safety.

6. Proof Gaps.
   Missing provenance, unverified signature, registry metadata unavailable, lockfile changed outside expected package closure, lifecycle script posture uncertain.

7. Reconstruction.
   Receipt id, contract hash, greenlight hash, gateway-check record, evidence artifact ids.

## Error Model

Errors should name the violated boundary, not just the failed command.

Examples:

- `CONTRACT_REQUIRED`: runtime attempted a package mutation without a canonical package-install contract.
- `GREENLIGHT_MISSING`: gateway received a mutation request without an exact one-use greenlight.
- `GREENLIGHT_SCOPE_MISMATCH`: greenlight was for a different package, workspace, manager, registry, or lockfile target.
- `GREENLIGHT_ALREADY_USED`: replayed authority attempt.
- `LOCKFILE_DELTA_UNEXPECTED`: install changed more than the declared dependency closure.
- `PROVENANCE_UNAVAILABLE`: evidence gap, not failure unless policy requires it.
- `LIFECYCLE_SCRIPT_REQUIRES_REVIEW`: package install includes script execution posture that policy will not auto-greenlight.
- `READ_ONLY_SURFACE`: CLI/MCP can propose or report, but cannot mutate.

## Diagnostics And Anti-Frustration Details

- Always show the exact field that prevented greenlight.
- Provide a copyable corrected proposal command.
- Distinguish policy refused from gateway could not verify.
- Distinguish package identity evidence missing from package unsafe.
- Show lockfile delta in human terms, not only hash terms.
- Explain why a reused greenlight failed.
- Let teams run read-only scan/report commands without gateway setup.
- Provide fixture/demo mode using known package installs, but label it non-production evidence.
- Keep preview deploy and repo write visible as available lanes, not default promoted adapters.

## 10-Star Product Bar

The first adapter pack is excellent when a skeptical engineering lead can say:

- I can add this to one repo without migrating my runtime.
- I understand exactly which package install was contracted.
- I can see where authority was enforced.
- I can prove CLI/MCP did not hold mutation authority.
- I can reconstruct the action six months later.
- I can explain provenance/signatures without pretending they prove safety.
- I can see lockfile evidence as local material proof.
- I can diagnose refusal without reading source code.
- I can pilot this on package installs before trusting broader protected actions.
- I do not feel sold a universal agent-control platform.

## Brutal Verdict

Keep package install as the first adapter pack. Cut simultaneous promotion of preview deploy and repo write. Narrow CLI/MCP to proposal, evidence, diagnostics, and read-only reporting. Buyer trust comes from exact gateway-bound mutation evidence, not from claiming runtime control.

Smallest next mechanism to build: a package-install proof report schema that binds canonical contract, policy decision, gateway check, lockfile delta, npm provenance/signature evidence, and explicit proof gaps.
