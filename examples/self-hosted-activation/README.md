# Self-Hosted Activation

This example is the source-owned local activation packet for the self-hosted product loop.

Run:

```bash
npm run demo:self-hosted
```

The command writes:

- `examples/self-hosted-activation/output/latest.md`
- `examples/self-hosted-activation/output/latest.json`

It composes the existing x402 protected-spend proof, CLI evidence readbacks, the MCP reference transcript, and a real local MCP stdio process proof.

This packet is still local reference evidence. It does not claim hosted operation, provider custody, customer custody, cross-org certificate trust, aggregate spend-window enforcement, WorkOS/auth.md attestation, clearing-house readiness, or broad MCP/browser/shell/network/package-manager protection.
