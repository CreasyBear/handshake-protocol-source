# Archived A1-domain conformance vectors

This directory holds **point-in-time** fixtures emitted from the upstream MIT-licensed
[A1](https://github.com/dyologician/A1) Rust example `emit_handshake_fixtures` using
original `a1::dyolo::` domain separators.

**Not a CI gate.** Live tests use Handshake-domain vectors in `test/fixtures/a1-evidence/*.json`,
regenerated via `bun scripts/a1-evidence/generate-vectors.ts`.

## Regenerating archive vectors (optional)

From a checkout of A1 at `/tmp/A1-src` (or set `A1_SRC`):

```bash
cd /tmp/A1-src
HANDSHAKE_FIXTURE_DIR="$(pwd)/../path-to-repo/test/fixtures/a1-evidence/archive/a1-domain-vectors" \
  cargo run --example emit_handshake_fixtures --features wire
```

## Cross-check (one-time, not CI)

Compare upstream Rust ground truth against a verifier configured with A1 domains if
re-validating fidelity after major crypto changes. Handshake production verify uses
`handshake::delegation::*::v1` only.
