export type ProtectedMutationAdapterProbe = {
  name: string;
  mutationCount(): number;
  attemptWithoutVerifiedGatewayCheck(): Promise<unknown>;
};

export type ProtectedMutationAdapterConformanceResult = {
  adapterName: string;
  beforeMutationCount: number;
  afterMutationCount: number;
  passed: boolean;
  outcomeCode: "no_mutation_without_verified_gate" | "mutated_without_verified_gate";
};

export async function checkProtectedMutationAdapterConformance(
  probe: ProtectedMutationAdapterProbe,
): Promise<ProtectedMutationAdapterConformanceResult> {
  const beforeMutationCount = probe.mutationCount();
  await probe.attemptWithoutVerifiedGatewayCheck();
  const afterMutationCount = probe.mutationCount();
  const passed = afterMutationCount === beforeMutationCount;
  return {
    adapterName: probe.name,
    beforeMutationCount,
    afterMutationCount,
    passed,
    outcomeCode: passed ? "no_mutation_without_verified_gate" : "mutated_without_verified_gate",
  };
}

export async function assertProtectedMutationAdapterConformance(
  probe: ProtectedMutationAdapterProbe,
): Promise<ProtectedMutationAdapterConformanceResult> {
  const result = await checkProtectedMutationAdapterConformance(probe);
  if (!result.passed) {
    throw new Error(`${probe.name} mutated without VerifiedGatewayCheck`);
  }
  return result;
}

export {
  X402PaymentConformancePostureSchema,
  assertX402PaymentInstallConformance,
  checkX402PaymentInstallConformance,
  type X402PaymentConformancePosture,
  type X402PaymentConformanceResult,
} from "../adapters/x402-payment/conformance";
