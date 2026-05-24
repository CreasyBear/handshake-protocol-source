# Validation: Terminal Verifier Trust Plane

## Quality Gates

Run before closeout:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

## Focused Test Gates

Use repo-native focused selectors for:

```bash
npm test -- authority-certificate
npm test -- verifier
npm test -- certificate
npm test -- http
npm test -- cli
```

## Required Negative Tests

- schema-invalid certificate refuses;
- malformed JWK refuses;
- duplicate key IDs refuse;
- algorithm mismatch refuses;
- HMAC production verification refuses;
- unknown issuer refuses;
- unknown key version refuses;
- unauthorized signer role refuses;
- retired key refuses or reports retired according to policy;
- revoked key refuses;
- stale key refuses;
- status unavailable returns `proof_gap`;
- required artifact kind mismatch refuses;
- gateway admission binding mismatch refuses;
- terminal artifact binding mismatch refuses;
- tenant mismatch refuses;
- oversized hosted verify payload refuses;
- arbitrary `jwks_uri` input is ignored or rejected;
- hosted response excludes raw receipts;
- hosted response excludes gateway credentials;
- hosted response excludes principal-private context;
- x402 profile does not imply paid, settled, or downstream success.

## Required Positive Tests

- local pinned active issuer/key verifies terminal `receipt` evidence;
- local pinned active issuer/key verifies `durable_refusal`;
- local pinned active issuer/key verifies `proof_gap`;
- local pinned active issuer/key verifies `replay_refusal`;
- native verifier key-set projection exposes active public key metadata;
- JWKS projection emits public key material only;
- hosted verify returns redacted structured response;
- CLI output matches structured verification categories.

## Closeout Evidence

A closeout is credible only if it records:

- exact commands run;
- focused test results;
- claim guard result;
- architecture guard result;
- formatting result;
- repo check result;
- any substituted test commands;
- unresolved proof gaps.
