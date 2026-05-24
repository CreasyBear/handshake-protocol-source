# Decisions

## D1 Owns Structured Evidence

D1 is the authoritative store for structured evidence indexes and records in this plan. KV may be used only for non-authoritative acceleration, references, cache posture, or derived read support with explicit consistency/audit limitations.

## Hosted Is Admission And Read Plane Only

Hosted mode may perform route admission and redacted evidence reads. It does not hold general hosted mutation authority, payment-management authority, settlement authority, provider custody, or compliance certification authority.

## Deployment Mode Is Mandatory

Hosted behavior must declare deployment mode: `local-dev`, `test`, `preview`, or `production`. Promoted hosted behavior cannot run from inferred defaults.

## Admission Roles Are Not Read Entitlements

Transition admission identity and evidence read entitlement are separate. A caller admitted to submit a protected transition is not automatically entitled to read evidence.

## Redacted Evidence Is The Default Read Surface

The default hosted read path returns redacted evidence only. Raw evidence is unavailable, disabled, gated, or allowed according to explicit `rawReadPosture`.

## Raw Reads Require Strong Posture

Raw evidence access, if ever allowed, requires explicit role, scope, purpose, time bounds, tenant/org/project entitlement, and audit evidence. Convention-only raw access is forbidden.

## Readiness Is Posture, Not Liveness

Hosted readiness reports enforcement and configuration posture: mode, bindings, secrets presence, vars, migrations, schema, verifier, redaction, retention, export, and unsupported capabilities. It is not a production-readiness badge.

## Secret Values Are Never Evidence

Secret names and presence may be reported. Secret values must not appear in readiness, logs, receipts, evidence records, exports, or support bundles.

## Claim Guard Is A Product Control

Docs, scripts, and repo-facing claims must not imply hosted operation, production readiness, compliance audit, payment management, settlement, custody, or hosted mutation authority unless enforcement gates exist.
