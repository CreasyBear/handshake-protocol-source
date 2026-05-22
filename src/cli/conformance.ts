import { checkX402PaymentInstallConformance } from "../conformance";
import { cliOutput } from "./output";

const protectedSpendConformancePosture = {
  signerCustodyStatus: "gateway_held",
  rawPrivateKeyEnvStatus: "absent",
  directCoreClientSigningStatus: "blocked",
  paidFetchClientStatus: "blocked",
  paidAxiosClientStatus: "absent",
  rawPaymentSignatureHeaderStatus: "blocked",
  siblingX402WrapperStatus: "blocked",
  mcpDirectPaymentStatus: "blocked",
  tokenPassthroughStatus: "blocked",
  wrapperDriftStatus: "absent",
  failureClosedStatus: "passed",
} as const;

export function x402PaymentConformanceCommand() {
  const result = checkX402PaymentInstallConformance(protectedSpendConformancePosture);
  return cliOutput({
    command: "conformance x402-payment",
    plane: "operator",
    ok: result.passed,
    result: {
      profile: "protected-spend",
      adapterPackId: result.adapterPackId,
      passed: result.passed,
      requiredProbeKinds: result.requiredProbeKinds,
      reasonCodes: result.reasonCodes,
    },
  });
}
