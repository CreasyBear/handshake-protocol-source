# Adoption And DevEx Perspective

## Invariant At Stake

Terminal evidence can be portable only if verification remains non-mutating and evidence-plane only. If valid certificate starts meaning permission, identity, settlement, compliance approval, or business success, the verifier becomes authority theatre.

## Adoption Thesis

The first wedge is not agent safety. It is verifiable evidence for exact protected paid HTTP actions, starting with x402 per-call payment receipts/refusals/proof gaps as terminal artifacts.

Customer value should read as:

> Given this terminal event, can I independently verify that it was signed by a trusted issuer, bound to the exact admitted protected action, not revoked, and safe to project into audit/reporting systems?

That is narrower, buyable, and easier to integrate than trust infrastructure for agents.

## Usage Shape

### CLI

Primary DevEx loop:

```bash
handshake cert verify receipt.json \
  --trust-bundle ./handshake-trust.json \
  --status-url https://verifier.example.com/status \
  --required-kind receipt \
  --format json
```

Expected outputs:

- `verified`
- `refused`
- `revoked`
- `stale`
- `status_unavailable`
- `untrusted_issuer`
- `unsupported_algorithm`
- `artifact_kind_mismatch`
- `gateway_binding_mismatch`
- `terminal_binding_mismatch`

The CLI must never imply mutation authority. No approve, authorize, settle, certify, or clear verbs.

### SDK

SDK should expose one boring call:

```ts
const result = await verifier.verifyAuthorityCertificate({
  certificate,
  trustBundle,
  requiredArtifactKinds: ["receipt"],
  statusPolicy: "fail_closed",
});
```

Result shape must separate:

- cryptographic validity;
- trusted signer status;
- key version/status;
- artifact kind match;
- gateway admission binding;
- terminal evidence binding;
- revocation/status result;
- audit-safe projection.

No boolean-only `isValid()`. That invites product misuse.

### MCP

MCP tool should be read-only:

```text
verify_authority_certificate
```

It returns structured verification evidence. It must not expose mutation, payment retry, settlement, or permission actions. MCP integration is for hosts that need portable terminal evidence inside workflows, not for granting authority.

### Hosted Verifier

Hosted route:

```http
POST /verify
GET /.well-known/handshake-verifier
GET /jwks.json
GET /status/{certificateId}
```

The hosted verifier returns an audit-safe projection, not the full sensitive certificate by default. It should redact principal/runtime/environment details unless explicitly configured.

## Customer Integration Sequence

1. Local verification first: customer pins a local trust bundle and verifies sample terminal artifacts from x402 protected calls.
2. Key-set projection: customer consumes issuer/verifier metadata and JWKS-style public keys without learning private trust material.
3. Status checks: customer enables fail-closed revocation/status checks for production audit paths.
4. Hosted verifier: customer points downstream audit/reporting systems at a hosted non-mutating verifier endpoint.
5. Report projection: customer exports redacted verification summaries into finance, risk, support, or compliance systems.

This sequence avoids boiling the ocean. No runtime replacement, no identity migration, no payment clearing-house posture.

## Trust Bundle And Key-Set Ergonomics

Trust bundle needs a human-readable read model:

```json
{
  "issuer": "acme-handshake",
  "environment": "production",
  "keys": [
    {
      "kid": "2026-05-prod-ed25519-01",
      "status": "active",
      "roles": ["authority_certificate_signer"],
      "notBefore": "2026-05-01T00:00:00Z",
      "notAfter": "2026-08-01T00:00:00Z"
    }
  ]
}
```

JWKS projection should expose public key material and key IDs only. It must not expose policy, private authority, settlement state, or customer-sensitive certificate internals.

Developer affordances needed:

- `handshake trust inspect`
- `handshake trust diff`
- `handshake trust pin`
- `handshake cert explain`
- `handshake cert verify --why`

Why failed is mandatory. A cryptographic verifier without explainability will become support debt immediately.

## Revocation And Status Errors

Status affordances must be explicit and fail-closed by default for production:

| Condition | Meaning | Default |
| --- | --- | --- |
| `revoked` | certificate/key/artifact is no longer acceptable evidence | fail |
| `stale` | status freshness exceeded verifier policy | fail |
| `status_unavailable` | verifier cannot determine current status | fail in prod, warn in dev |
| `unknown_kid` | key not in pinned or fetched trust set | fail |
| `retired_key` | key was valid historically but not active now | configurable historical verify |
| `issuer_mismatch` | certificate issuer not in trust bundle | fail |
| `role_mismatch` | signer lacks required certificate-signing role | fail |

Do not copy RFC 7009 semantics into certificates. Use only the security lesson: revocation/status checks are active controls and must not leak sensitive state casually.

## Docs And Report Shape

Docs should be built around evidence questions:

- What artifact am I verifying?
- Who signed it?
- Which key version signed it?
- What role was the signer allowed to perform?
- What terminal event kind is bound?
- What gateway admission is bound?
- Is the certificate current, stale, revoked, or unverifiable?
- What can I safely project into audit systems?
- What must I not infer?

Report shape:

```json
{
  "verification": {
    "outcome": "verified",
    "verifiedAt": "2026-05-24T00:00:00Z",
    "evidencePlaneOnly": true
  },
  "certificate": {
    "artifactKind": "receipt",
    "issuer": "example",
    "kid": "2026-05-prod-ed25519-01"
  },
  "bindings": {
    "gatewayAdmission": "matched",
    "terminalEvidence": "matched",
    "envelopeDigest": "matched"
  },
  "status": {
    "state": "active",
    "checkedAt": "2026-05-24T00:00:00Z"
  },
  "projection": {
    "safeForAudit": true,
    "redactionsApplied": true
  }
}
```

## Cut Lines

Cut:

- certified payment;
- trusted agent;
- authorized action;
- settlement proof;
- identity verification;
- compliance approval;
- clearing network;
- valid means safe.

Keep:

- terminal evidence verified;
- issuer key trusted;
- status checked;
- gateway binding matched;
- audit-safe projection;
- non-mutating verifier.

## 10-Star Bar

A 10-star DevEx means a skeptical customer can do this in under 30 minutes:

1. Verify one sample certificate locally.
2. Inspect why it passed.
3. Break one field and see the exact failure.
4. Rotate/pin a trust key.
5. See stale/revoked/status-unavailable behavior.
6. Call the hosted verifier.
7. Export a redacted audit projection.
8. Explain internally what the verifier does not mean.

If they cannot explain the non-goals after using it, product language failed.

## Recommended Plan Shape

1. Read model and wording guard: issuer/signer role/key version projection and claim guards around valid certificate.
2. Trust bundle and JWKS projection: public key-set projection with pinned/local trust ergonomics.
3. Status and revocation: status records, freshness policy, revoked/stale/status-unavailable outcomes.
4. Hosted verifier: non-mutating verify, metadata, JWKS, and status routes.
5. Audit projection: redacted report objects for downstream systems.

## Smallest Next Mechanism

Build a structured verification response type with issuer, key id, signer role, status outcome, binding checks, and an `evidencePlaneOnly: true` projection flag.
