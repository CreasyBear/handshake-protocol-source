import { describe, expect, it } from "bun:test";
import {
  PRODUCT_COMPLETION_GATE_IDS,
  PRODUCT_COMPLETION_PACK_CHECK_EXPECT_STATUS,
  PRODUCT_COMPLETION_READBACK_KIND,
  PRODUCT_COMPLETION_STATUSES,
  projectProductCompletionReadback,
} from "../../src/surfaces/proof-packets";

describe("product completion projector/script parity", () => {
  it("exports gate ids and statuses consumed by check-product-completion.mjs", () => {
    expect(PRODUCT_COMPLETION_READBACK_KIND).toBe("product_completion_readback");
    expect(PRODUCT_COMPLETION_STATUSES).toEqual(["completed", "closed_with_hard_blocks", "incomplete"]);
    expect(PRODUCT_COMPLETION_PACK_CHECK_EXPECT_STATUS).toBe("incomplete");
    expect(PRODUCT_COMPLETION_GATE_IDS).toHaveLength(5);
    expect(PRODUCT_COMPLETION_GATE_IDS).toContain("dual_enforcement_posture");
  });

  it("projects the same gate ids the pack:check script asserts", () => {
    const proof = projectProductCompletionReadback({
      generatedAt: "2026-05-26T00:00:00.000Z",
      commandRefs: ["node scripts/check-product-completion.mjs"],
      qualityGate: {
        command: "npm run check:repo",
        passed: false,
        evidenceRef: "quality-gate:not-passed",
      },
      gates: {
        codexLocalHostActivation: {
          status: "blocked",
          artifactVersion: "0.0.0",
          artifactSha256: null,
          observesHostToolInvocation: false,
          authorityCreated: false,
          evidenceRefs: [],
        },
        publicDistributionAndRegistry: {
          status: "blocked",
          localVersion: "0.0.0",
          npmLatestVersion: null,
          currentSurfacePublished: false,
          mcpRegistryAccepted: false,
          mcpRegistryDiscoverable: false,
          provenanceAttempted: false,
          provenanceSupported: null,
          proofGapReasonCodes: ["npm_latest_readback_failed"],
          evidenceRefs: [],
        },
        customerGatewayLiveX402PaidProof: {
          status: "blocked",
          customerGatewayCustodyPresent: false,
          livePaidRetryPerformed: false,
          terminalReadbackPresent: false,
          signerInvocationPosture: "not_observed",
          proofGapReasonCodes: ["customer_gateway_custody_packet_absent"],
          evidenceRefs: [],
        },
        authMdX402AdmissionPacket: {
          packetVersion: "v0",
          packetProjectorPresent: false,
          refusalFirstTestsPassed: false,
          redactedReadbackTestsPassed: false,
          createsAuthority: false,
          evidenceRefs: [],
        },
        dualEnforcementPosture: {
          dualEnforcementPostureTestPassed: false,
          mutationManifestGatingTestPassed: false,
          evidenceRefs: [],
        },
      },
    });

    expect(proof.proofKind).toBe(PRODUCT_COMPLETION_READBACK_KIND);
    expect(proof.status).toBe("incomplete");
    expect(proof.gates.map((gate) => gate.gateId)).toEqual([...PRODUCT_COMPLETION_GATE_IDS]);
    const dualGate = proof.gates.find((gate) => gate.gateId === "dual_enforcement_posture");
    expect(dualGate?.status).toBe("incomplete");
    expect(proof.authorityBoundary.createsAuthority).toBe(false);
  });
});
