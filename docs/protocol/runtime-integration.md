# Runtime Integration

Status: Canonical public alpha
Version: v0.2.1
Audience: Agent-runtime builders, plugin authors, MCP/tool adapter owners
Implementation status: Reference package-install runtime wrapper, codemode multi-action wrapper, recovery-linked follow-up validation, and Hono/D1 gateway-checked package-install flow exist; full runtime plugins are target work
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Invariant At Stake

The runtime is where generated orchestration first tries to cause consequence. It is not the final enforcement boundary.

Runtime integration exists to detect, classify, block, and contract consequential action attempts before they reach gateways through declared or protected action paths.

It is not a 24/7 observer. If an agent keeps raw mutation credentials or reaches an unwrapped gateway path, Handshake may record visible bypass evidence, but it cannot claim gateway-checked control over that action.

## Required Runtime Posture

A runtime integration should:

- inspect declared tools, MCP servers, skills, scheduled jobs, terminal backends, file writers, browser tools, and other wrapped or declared capability surfaces;
- classify read-only, ambiguous, and consequential capabilities;
- require explicit allowlists for protected consequential tools;
- emit catalog-bound action candidates instead of raw tool calls;
- fail closed when Handshake cannot classify or contract a consequential action;
- surface structured refusals to the agent loop;
- record enough runtime context for reconstruction without leaking secrets or raw transcripts.

The runtime plugin may stop a local tool dispatch. That is useful. It is still not gateway-checked mutation authority.

## Integration Modes

Handshake supports four practical runtime integration modes. They differ in developer experience, not in where authority is enforced.

| Mode | Best fit | Runtime responsibility | Enforcement reality |
|---|---|---|---|
| Hook-assisted | OpenClaw-style runtimes with reliable before-tool-call hooks | Classify calls early, block obvious unsafe dispatch, route consequential calls through Handshake | Useful for UX, but still advisory unless the gateway check refuses before mutation |
| Protected capability | Codex, Claude Code, MCP, and CLI-shaped workflows | Expose only protected MCP/CLI tools for guarded action families | Practical default when raw gateway credentials are removed from the agent |
| Codemode block | Hermes-style generated programs and long-running tool scripts | Declare allowed tools, gateways, retry limits, branch bounds, and evidence expectations | Generated code may orchestrate; every consequential branch still needs an exact contract |
| Gateway-only | Thin or hostile runtimes with little observable context | Provide whatever issuer evidence is available | Preserves the invariant only because the gateway refuses anything without a current exact greenlight |

## Raw Credential Rule

If the agent can mutate the gateway directly, Handshake does not control that action.

The product setup must therefore remove raw mutation authority from the agent and expose a protected Handshake capability instead. The gateway adapter should own the credential that can mutate the gateway, and that adapter must call the gateway check before mutation.

Examples that are outside Handshake control until wrapped:

- raw deployment tokens used by `vercel deploy`, `wrangler deploy`, or similar CLIs;
- GitHub tokens that can push, tag, release, or change Actions outside the protected adapter;
- package manager writes outside the package-install gateway;
- cloud, database, or browser automation credentials that bypass the gateway check.

If one of these paths remains available, the correct receipt state is bypass evidence or proof gap when evidence exists, not a control claim.

## Flow

```text
agent runtime calls tool
  -> runtime hook sees tool name and arguments
  -> hook classifies the action
  -> read-only action passes through
  -> consequential action becomes a contract candidate
  -> Handshake validates the candidate, records compilation evidence, and emits/refuses a contract
  -> policy greenlights or refuses
  -> gateway check checks before consequence
  -> runtime receives structured result and can retry or recover
```

## Target CLI/MCP Surface

The next runtime-facing slice is the Handshake CLI/MCP protected action surface, not a fixture runner and not a GitHub-only product.

Runtime owner obligations:

- expose protected MCP/CLI capabilities such as `handshake.contract.propose` and `handshake.repo.propose_write_to_pr`;
- remove raw mutation credentials from the agent environment for guarded gateways;
- remove or deny raw sibling mutation tools for guarded gateways where feasible;
- pass principal intent refs and generated code/spec refs into the proposal;
- receive structured refusal, review, proof-gap, or contract references from Handshake;
- never call `gatewayCheck(...)`, issue a greenlight, or hold the gateway mutation credential.

MCP is the adoption and catalog surface. The CLI is the setup, inspection, and conformance surface. Neither is the enforcement boundary. Enforcement begins only when the credential-owning gateway adapter refuses before using its mutation credential.

## Legacy Research To Reuse

The old Hermes and OpenClaw research is useful because it names real runtime surfaces:

- tool dispatch hooks;
- MCP mutation tools;
- terminal commands;
- scheduled jobs;
- skills as capability expansion;
- local review modes;
- runtime inspection;
- retry loops after structured denial.

Use that research for integration mechanics. Do not import its old product vocabulary without mapping it to v0.2 protocol objects.

## Reference Package-Install Runtime Wrapper

`src/runtime/package-install/tool-wrapper.ts` is the first runtime hook.

It accepts one generated package-install tool call and a fixed runtime/catalog configuration. Its Interface exposes only:

- `compileIntent(...)`;
- `proposeActionContract(...)`.

It cannot call `gatewayCheck(...)`, cannot issue a greenlight, and cannot mutate the package manager.

The wrapper sequence is:

```text
generated package-install tool call
  -> PackageInstallToolCallSchema
  -> compileIntent(...)
  -> if uncertainty or overreach exists: return structured refusal
  -> proposeActionContract(...)
  -> return exact ActionContract
```

The refusal path is not a thrown-away validation error. It persists an `IntentCompilationRecord` with uncertainty or overreach markers so the failed compilation is reconstructable.

The wrapper does not convert vague intent into authority. The agent or runtime drafts the package-install candidate; `compileIntent(...)` validates it against catalogs, records assumptions and uncertainty, and gives the kernel enough evidence to canonicalize or refuse the exact contract.

The end-to-end reference tests bind this wrapper to deterministic policy evaluation and the package-install gateway adapter. The manifest surface remains unchanged after proposal and changes only after the gateway check consumes the exact greenlight. The same wrapper runs through `HandshakeClient` against the Hono/D1 protocol surface, so the runtime seam is not coupled to the in-process kernel facade.

## Reference Repo-Write Runtime Wrapper

`src/runtime/repo-write/tool-wrapper.ts` is the second runtime hook and proves the runtime seam is not package-manager-specific.

It accepts generated repository, file path, and content. It does not put raw content into the `ActionContract`. Instead it contracts:

- `repositoryRef`;
- `filePath`;
- `contentDigest`;
- `contentByteLength`.

The gateway adapter recomputes the digest from the actual content before calling `gatewayCheck(...)`. If generated code changes the content after proposal, the observed parameter digest no longer matches the contract and the gateway records a refusal before file mutation.

## Reference Codemode Multi-Action Wrapper

`src/runtime/codemode-multi-action/wrapper.ts` models generated code that orchestrates more than one consequential action.

It accepts an ordered generated program containing package-install and repo-write candidates. For each candidate it calls only:

- `compileIntent(...)`;
- `proposeActionContract(...)`.

It emits ordered per-candidate results with `sequenceNumber` preserved on the resulting `ActionContract`. Later contracts carry `requiredPriorActionContractIds` for the contracts already proposed in the same generated program. It does not evaluate policy, does not issue greenlights, does not call `gatewayCheck(...)`, and does not mutate either gateway.

If one candidate is refused, the wrapper records that candidate's `IntentCompilationRecord` and refusal reason codes. Refusal does not become hidden authority for other candidates; any proposed contracts are still only proposed commitments until policy and gateway checks run. Policy refuses a later contract while any declared predecessor is missing, refused, or not greenlit. The gateway check refuses a later mutation while any declared predecessor lacks a final passed receipt.

Recovery after a refusal or proof gap is a separate protocol record, not a runtime retry. `RecoveryRecommendation` may tell the runtime which narrower action classes and new evidence are acceptable for a future proposal, but any future mutation still starts at a fresh `ActionContract`. When the runtime supplies `recoveryRecommendationId`, the kernel checks recommendation scope, timing, later sequence number, allowed action class, and required new evidence before recording the proposal. A linked proposal supersedes the recommendation through a durable `RecoveryRecommendationStatusTransition` and a one-row terminal claim, so concurrent generated follow-ups cannot both consume the same recovery path. A losing follow-up gets `recovery_terminal_conflict`; the kernel records a recovery-phase `ProofGap` and no `ActionContract`. After the runtime observes the winning terminal transition, it may ask the kernel to resolve that proof gap, but resolution only sets `resolvedByRef` on the gap and emits `proof_gap_resolved`.

## Non-Negotiables

- No dynamic tool-name construction that bypasses the wrapper.
- No plugin-only claim of enforcement for gateway-owned consequence.
- No raw gateway credentials in the agent context for a guarded action family.
- No hidden mutation after a rendered review surface goes stale.
- No raw secrets in contracts, receipts, or runtime inspection.
- No treating standing, identity, or local operator preference as mutation authority.

Active next mechanism: define the Handshake CLI/MCP protected action surface: `handshake mcp start`, generic contract/receipt tools, action-family proposal tools, and install posture checks that prove raw gateway credentials are absent or explicitly marked as bypass risk. `handshake.repo.propose_write_to_pr` and the GitHub App-backed `repo_write_gateway` are the first adapter-backed action, not the whole product. Existing package-install, repo-write, and codemode wrapper proofs remain reference and conformance evidence.
