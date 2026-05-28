import { cliNonClaims, cliOutput } from "../output";

export async function simulateX402PaymentCommand(input: { cwd: string }) {
  return cliOutput({
    command: "simulate x402-payment",
    plane: "operator",
    ok: true,
    reasonCodes: [],
    nextAction: "read_result",
    retryability: "not_retryable",
    redactionProfileRef: "cli-simulate-x402:v1-redacted",
    nonClaims: [
      ...cliNonClaims,
      "live wallet operation",
      "provider settlement",
      "bundled execute API",
      "greenlight reuse",
    ],
    warnings: [
      "Simulation is non-authority readback scaffolding only — not a gateway check or mutation.",
      "No payment payload was created and no protected surface was mutated.",
    ],
    result: {
      simulationKind: "x402_payment_exact_readback_scaffold",
      cwd: input.cwd,
      simulatedOutcome: "readback_preview_only",
      clearanceChainPresent: false,
    },
  });
}
