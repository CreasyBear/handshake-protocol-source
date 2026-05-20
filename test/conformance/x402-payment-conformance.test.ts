import { describe, expect, it } from "bun:test";
import { assertX402PaymentInstallConformance, checkX402PaymentInstallConformance } from "../../src/conformance";

describe("x402 payment install conformance", () => {
  it("passes only when signer custody and bypass probes close the raw x402 path", () => {
    const result = checkX402PaymentInstallConformance({
      signerCustodyStatus: "fixture_gateway_held",
      rawPrivateKeyEnvStatus: "absent",
      siblingX402WrapperStatus: "blocked",
      mcpDirectPaymentStatus: "blocked",
      tokenPassthroughStatus: "blocked",
      wrapperDriftStatus: "absent",
      failureClosedStatus: "passed",
    });

    expect(result.passed).toBe(true);
    expect(result.reasonCodes).toEqual([]);
  });

  it("fails when a raw signer or sibling x402 wrapper remains reachable", () => {
    const result = checkX402PaymentInstallConformance({
      signerCustodyStatus: "agent_exposed",
      rawPrivateKeyEnvStatus: "present",
      siblingX402WrapperStatus: "present",
      mcpDirectPaymentStatus: "blocked",
      tokenPassthroughStatus: "blocked",
      wrapperDriftStatus: "absent",
      failureClosedStatus: "passed",
    });

    expect(result.passed).toBe(false);
    expect(result.reasonCodes).toEqual([
      "x402_raw_private_key_env_not_absent",
      "x402_sibling_wrapper_not_blocked",
      "x402_signer_not_gateway_held",
    ]);
  });

  it("throws assertion errors with the failing conformance reasons", () => {
    expect(() =>
      assertX402PaymentInstallConformance({
        signerCustodyStatus: "fixture_gateway_held",
        rawPrivateKeyEnvStatus: "absent",
        siblingX402WrapperStatus: "blocked",
        mcpDirectPaymentStatus: "present",
        tokenPassthroughStatus: "unknown",
        wrapperDriftStatus: "present",
        failureClosedStatus: "failed",
      }),
    ).toThrow("x402 payment install conformance failed");
  });
});
