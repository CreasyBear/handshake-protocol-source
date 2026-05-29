import { hostDoctorCommand } from "../host/doctor";
import { cliNonClaims, cliOutput } from "../output";
import { simulateX402PaymentCommand } from "../simulate/x402-payment";
import { runX402Quickstart, type QuickstartStepEnvelope } from "./x402";

export type AgentSpineStepEnvelope = QuickstartStepEnvelope;

export async function runAgentSpineQuickstart(input: { cwd: string }) {
  const doctorOutput = await hostDoctorCommand({ cwd: input.cwd });
  const steps: AgentSpineStepEnvelope[] = [
    stepEnvelope("host_doctor", "host doctor", doctorOutput),
  ];

  if (doctorOutput.ok) {
    const x402Output = await runX402Quickstart({ cwd: input.cwd });
    const x402Steps =
      x402Output.result && typeof x402Output.result === "object" && "steps" in x402Output.result
        ? (x402Output.result as { steps: QuickstartStepEnvelope[] }).steps
        : [];
    for (const step of x402Steps) {
      steps.push(step);
    }
    if (x402Output.ok) {
      const simulateOutput = await simulateX402PaymentCommand({ cwd: input.cwd });
      steps.push(stepEnvelope("simulate_x402_payment", "simulate x402-payment", simulateOutput));
    }
  }

  const ok = steps.every((step) => step.ok);
  return cliOutput({
    command: "quickstart agent-spine",
    plane: "operator",
    ok,
    reasonCodes: steps.flatMap((step) => step.reasonCodes),
    nextAction: ok ? "read_result" : "fix_install",
    retryability: ok ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-quickstart-agent-spine:v1-redacted",
    nonClaims: [
      ...cliNonClaims,
      "bundled execute API",
      "greenlight reuse",
      "live wallet mutation",
      "authority creation",
    ],
    warnings: [
      "Convenience sequencer only — equivalent to host doctor, quickstart x402, then simulate x402-payment in order.",
      "No greenlight, gateway check, signer use, or protected mutation was performed.",
    ],
    result: {
      recommendedConvenience: true,
      canonicalDiscreteCommands: ["host doctor", "quickstart x402", "simulate x402-payment"],
      steps,
    },
  });
}

function stepEnvelope(
  stepId: string,
  command: string,
  output: {
    ok: boolean;
    reasonCodes: readonly string[];
    evidenceRefs: readonly string[];
    authorityCreated: false;
    greenlightCreated: false;
    gatewayCheckPerformed: false;
    mutationAttempted: false;
  },
): AgentSpineStepEnvelope {
  return {
    stepId,
    command,
    ok: output.ok,
    reasonCodes: output.reasonCodes,
    evidenceRefs: output.evidenceRefs,
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  };
}
