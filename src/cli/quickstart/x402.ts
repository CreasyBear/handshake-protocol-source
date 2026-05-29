import { defaultX402BootstrapInstallInput } from "../service-operator/bootstrap";
import { installX402PaymentCommand, x402PaymentConformanceCommand } from "../x402";
import { cliNonClaims, cliOutput } from "../output";

export type QuickstartStepEnvelope = {
  stepId: string;
  command: string;
  ok: boolean;
  reasonCodes: readonly string[];
  evidenceRefs: readonly string[];
  authorityCreated: false;
  greenlightCreated: false;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
};

function defaultConformancePosture() {
  return {
    signerCustodyStatus: "fixture_gateway_held" as const,
    rawPrivateKeyEnvStatus: "absent" as const,
    directCoreClientSigningStatus: "blocked" as const,
    paidFetchClientStatus: "blocked" as const,
    paidAxiosClientStatus: "blocked" as const,
    rawPaymentSignatureHeaderStatus: "blocked" as const,
    siblingX402WrapperStatus: "blocked" as const,
    mcpDirectPaymentStatus: "blocked" as const,
    tokenPassthroughStatus: "blocked" as const,
    wrapperDriftStatus: "absent" as const,
    failureClosedStatus: "passed" as const,
  };
}

export async function runX402Quickstart(input: { cwd: string; installInputPath?: string | null }) {
  const compileStep = await installX402PaymentCommand({
    cwd: input.cwd,
    inputValue: defaultX402BootstrapInstallInput(),
    recordLocal: false,
  });
  const steps: QuickstartStepEnvelope[] = [
    stepEnvelope("compile_install_proposal", "install x402-payment", compileStep),
  ];

  const conformanceStep = await x402PaymentConformanceCommand(defaultConformancePosture());
  steps.push(stepEnvelope("conformance_posture", "conformance x402-payment", conformanceStep));

  const ok = steps.every((step) => step.ok);
  return cliOutput({
    command: "quickstart x402",
    plane: "operator",
    ok,
    reasonCodes: steps.flatMap((step) => step.reasonCodes),
    nextAction: ok ? "read_result" : "fix_install",
    retryability: ok ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-quickstart-x402:v1-redacted",
    nonClaims: [...cliNonClaims, "live control-plane registration", "signer use"],
    warnings: [
      "Quickstart compiles local x402 install posture and runs conformance classification.",
      "No greenlight, gateway check, wallet mutation, or live registration was performed.",
    ],
    result: { steps },
  });
}

function stepEnvelope(
  stepId: string,
  command: string,
  output: { ok: boolean; reasonCodes: readonly string[]; evidenceRefs: readonly string[] },
): QuickstartStepEnvelope {
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
