# Service Operator Golden Path Example

Thin wrapper around the canonical service workflow admission demo. Source of
truth: [service-operator-golden-path.md](../../docs/internal/service-operator-golden-path.md).

## Run

```bash
bun run examples/service-operator-golden-path/run.ts
```

Or from repo root:

```bash
npm run demo:service-operator-golden-path
```

(if wired in package.json — otherwise use `bun run` above)

## What this does

1. Prints links to golden path and developer experience index
2. Runs `npm run demo:service-workflow-admission`
3. Writes `output/latest.json` summary with `nextCommands` including future
   `handshake service bootstrap`

Non-authority only — no kernel transitions beyond the admission demo.
