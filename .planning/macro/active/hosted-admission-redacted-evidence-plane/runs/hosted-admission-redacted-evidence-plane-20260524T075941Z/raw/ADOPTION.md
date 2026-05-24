# ADOPTION Perspective

## Invariant At Stake

Hosted operation must not imply hosted authority. The product may expose admission status and redacted evidence reads, but CLI/SDK/MCP surfaces must not become mutation paths unless separately contracted, promoted, and gateway-enforced.

## Adoption / DevEx Position

The adoption wedge should be: "I can install the hosted evidence plane, run one readiness command, and know exactly what Handshake is enforcing, what it is only observing, and what evidence is redacted, unavailable, retained, or exportable."

Do not sell this as hosted Handshake execution yet. Sell it as hosted admission plus evidence-read posture.

## Operator Setup

The operator path should be boring and explicit:

1. Provision hosted admission endpoint.
2. Bind D1 database.
3. Apply migrations.
4. Register role/scope policy.
5. Configure secrets.
6. Configure evidence redaction policy.
7. Configure raw-read posture.
8. Configure retention/export posture.
9. Run readiness.
10. Only then expose read clients.

Setup should produce a machine-readable readiness document and a human-readable report. Every setup step must say whether it is:

- active
- configured_but_unverified
- missing
- disabled
- read_only
- not_promoted

The most important DevEx rule: never make operators infer posture from successful deploy logs.

## SDK / CLI Read Clients

CLI, SDK, and MCP clients should be evidence/read-only by default.

Required client affordances:

- handshake evidence status
- handshake evidence readiness
- handshake evidence get <receipt-id>
- handshake evidence search --redacted
- handshake evidence export --redacted
- handshake admission status
- handshake raw-read posture
- handshake retention status

Every command should visibly label its authority class:

```text
Authority: read-only evidence surface
Mutation: none
Gateway authority: not held by this client
Raw evidence access: disabled / unavailable / separately configured
```

SDK methods should mirror that posture. No method names like approve, greenlight, admit, mutate, execute, or grant unless the surface has been separately promoted into an enforcement path.

## Readiness Output

Readiness is the adoption centerpiece. It should answer: "What exactly is active?"

Minimum readiness fields:

```json
{
  "hostedAdmission": {
    "status": "active",
    "endpoint": "configured",
    "operationClaim": "not_claimed"
  },
  "roleScopeChecks": {
    "status": "active",
    "lastVerifiedAt": "timestamp",
    "failureMode": "deny"
  },
  "d1": {
    "binding": "active",
    "migrations": "applied",
    "schemaVersion": "..."
  },
  "secretPosture": {
    "status": "configured",
    "rawValuesExposed": false,
    "rotationEvidence": "missing|present"
  },
  "redactedReads": {
    "status": "active",
    "policyVersion": "...",
    "sampleCheck": "passed"
  },
  "rawReads": {
    "status": "disabled",
    "reason": "not_promoted"
  },
  "retentionExport": {
    "retention": "configured",
    "redactedExport": "active",
    "rawExport": "disabled"
  },
  "readiness": {
    "status": "ready_for_evidence_reads",
    "notReadyFor": ["hosted_execution_claim", "mutation_authority"]
  }
}
```

The key product move: readiness should name what is not true. That prevents hosted evidence from being laundered into hosted operation.

## Error Affordances

Errors should be posture-revealing, not generic.

Examples:

- D1_BINDING_MISSING: "Evidence reads cannot be reconstructed because no D1 binding is active."
- MIGRATION_NOT_APPLIED: "Evidence store exists but schema version is not admitted."
- SECRET_POSTURE_UNVERIFIED: "Hosted admission cannot prove secret handling posture."
- RAW_READ_NOT_PROMOTED: "Raw reads are disabled. This client only exposes redacted evidence."
- ROLE_SCOPE_DENIED: "Caller is authenticated but does not hold the required evidence-read scope."
- HOSTED_OPERATION_NOT_CLAIMED: "This deployment supports hosted admission/evidence reads, not hosted execution authority."

Every error should include:

- failed check
- expected state
- observed state
- whether the system failed closed
- next operator action
- audit receipt or readiness event id, if available

## Support / Audit Workflow

Support should never require raw secret access or privileged mutation.

A good support bundle should include:

- readiness report
- schema version
- D1 binding status, not credentials
- policy version
- redaction policy version
- role/scope decision trace
- failed check ids
- retention/export posture
- sampled redacted receipt ids
- explicit raw-read posture
- timestamped environment identity

Support workflow:

1. Operator runs handshake evidence support-bundle --redacted.
2. Bundle excludes raw secrets and raw evidence by default.
3. Bundle includes enough posture evidence to prove whether the failure is setup, policy, read authorization, migration, or product limitation.
4. Raw-read escalation is a separate audited path, not a support convenience.

## What A 10-Star Product Feels Like

The operator can tell, within five minutes, whether hosted Handshake is actually doing anything consequential.

A 10-star experience feels like:

- the first readiness report is brutally clear;
- every command says whether it is read-only or authority-bearing;
- no dashboard copy overclaims hosted execution;
- redacted evidence reads are useful without exposing raw sensitive payloads;
- broken D1, stale migrations, missing scopes, and disabled raw reads are diagnosed directly;
- support can debug posture without asking for secrets;
- audit can reconstruct why a caller saw redacted evidence and why they could not see raw evidence;
- the system repeatedly says "not promoted" where a weaker product would imply "coming soon" or silently expose capability.

## Cut Lines

Cut from this plan:

- hosted execution claims;
- mutation commands in CLI/SDK/MCP;
- approval or greenlight APIs;
- raw evidence reads by default;
- dashboards that summarize posture without exact readiness fields;
- support workflows that require secrets;
- "secure by default" language without concrete checks;
- retention/export claims without verifiable config;
- MCP tools that can mutate admission, policy, retention, migration, or redaction state.

## Adoption Risks

The main adoption risk is that users will interpret "hosted admission" as "hosted Handshake operation." The product must fight that confusion in command names, readiness output, docs, errors, and dashboard labels.

The second risk is frustration if redacted reads are too thin. The answer is not raw access by default. The answer is better redacted evidence shape, clearer proof gaps, and explicit raw-read escalation posture.

## Validation Gates

Before this plan is executable, require:

- readiness output proves admission without claiming operation;
- CLI/SDK/MCP commands are read-only by inspection and tests;
- redaction tests prove sensitive fields are removed;
- raw-read posture is explicit and disabled unless configured;
- D1 migration failure produces a clear not-ready state;
- role/scope denial is distinguishable from missing auth;
- retention/export status appears in readiness and support bundles;
- support bundle contains no secrets or raw evidence.

## Brutal Verdict

Keep, but narrow.

The adoption product is not "hosted Handshake." It is "hosted admission readiness plus redacted evidence reads." That is a useful wedge because it gives operators proof without prematurely creating a new authority surface.

Smallest next mechanism to build: a single readiness contract that enumerates admission, D1, migration, role/scope, secret posture, redaction, raw-read posture, retention/export, and explicitly says hosted_operation_claim: false.
