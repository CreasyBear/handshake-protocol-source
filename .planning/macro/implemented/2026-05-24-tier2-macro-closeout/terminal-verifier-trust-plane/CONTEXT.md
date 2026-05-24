# Context: Terminal Verifier Trust Plane

## Invariant At Stake

`AuthorityCertificate` is terminal evidence. It is not permission, identity, settlement, approval, actor trust, certification, compliance, or downstream business success.

## Product Frame

Handshake is protected actions for automated decision making. Engineering-agent workflows are stress and adoption context, not the product boundary.

The first wedge is x402 exact per-call paid HTTP because it creates a crisp protected-action evidence question: did this exact per-call action produce terminal evidence that can be verified without trusting the caller's narrative?

## Current Source State

- Certificate minting is limited to terminal evidence kinds: `receipt`, `durable_refusal`, `proof_gap`, `replay_refusal`.
- Verification already checks schema, digests, signed-over binding, algorithm prefix, pinned trust keys, signer roles, artifact kinds, gateway admission binding, and terminal binding.
- Production rejects HMAC.
- Trust material is local/pinned with active/retired keys.
- CLI verification is non-mutating and evidence-plane only.

## Missing Trust Plane

The current verifier has enough local mechanics to become portable, but lacks:

- issuer read model;
- key version read model;
- role/status/time-window model;
- status/revocation records;
- native verifier key-set projection;
- JWKS projection;
- hosted verifier;
- redacted verification response;
- explicit status unavailable and revoked failure model;
- claim guard around validity semantics.

## Plane Separation

Evidence plane:

- `AuthorityCertificate`;
- terminal artifact kind;
- signed-over binding;
- gateway admission binding;
- terminal binding;
- receipt/refusal/proof-gap/replay evidence.

Discovery plane:

- metadata;
- native verifier key-set;
- JWKS projection;
- status endpoint address;
- hosted verifier endpoint address.

Trust decision plane:

- pinned issuer/key acceptance;
- signer role acceptance;
- key version status;
- revocation/status record interpretation;
- caller-owned decision about whether a verifier is trusted.

JWKS sits in discovery. It does not create trust.
