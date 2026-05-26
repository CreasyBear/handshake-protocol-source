import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { runNegotiatedX402Room } from "../../test/support/x402-negotiation-fixture";

const outputPath = join(import.meta.dir, "latest.json");
const markdownOutputPath = join(import.meta.dir, "latest.md");

const room = await runNegotiatedX402Room();
const output = {
  generatedAt: new Date().toISOString(),
  fixtureKind: "a2a_negotiated_x402_room",
  contract: {
    actionContractId: room.contract.actionContractId,
    actionContractDigest: room.contract.actionContractDigest,
    paramsDigest: room.contract.paramsDigest,
    actionClass: room.contract.actionClass,
    resourceRef: room.contract.resourceRef,
    clearingEvidenceRefs: room.contract.clearingEvidenceRefs,
  },
  authorityBoundary: {
    acceptedAgreementCreatedPolicyDecision: false,
    acceptedAgreementCreatedGreenlight: false,
    acceptedAgreementPerformedGatewayCheck: false,
    acceptedAgreementAttemptedMutation: false,
    signerInvokedBeforeGatewayCheck: false,
    gatewayCheckRemainsFinalEnforcementPoint: true,
  },
  policy: {
    decision: room.policy.decision.decision,
    decisionReasonCode: room.policy.decision.decisionReasonCode,
    greenlightId: room.greenlight.greenlightId,
    greenlightMaxUses: room.greenlight.maxUses,
  },
  gateway: {
    firstOutcome: room.gatewayResult.outcome,
    firstGateDecision: room.gatewayResult.gatewayCheck.gateAttempt.gateDecision,
    firstMutationAttempted: room.gatewayResult.gatewayCheck.mutationAttempt !== null,
    replayOutcome: room.replay.outcome,
    replayReasonCode: room.replay.gatewayCheck.gateAttempt.gateDecisionReasonCode,
    signerInvocationCount: room.surface.signatureCount(),
  },
  supportPacket: room.supportPacket,
};

await mkdir(dirname(outputPath), { recursive: true });
await Bun.write(outputPath, JSON.stringify(output, null, 2) + "\n");
await Bun.write(
  markdownOutputPath,
  [
    "# A2A Negotiated x402 Room",
    "",
    "This fixture is local/reference evidence only. It does not claim marketplace operation, legal contract formation, escrow, settlement finality, reputation, cross-org trust, provider custody, or reusable authority.",
    "",
    `- Action contract: ${room.contract.actionContractId}`,
    `- Agreement created authority: ${output.authorityBoundary.acceptedAgreementCreatedGreenlight}`,
    `- Policy decision: ${room.policy.decision.decision}`,
    `- Greenlight max uses: ${room.greenlight.maxUses}`,
    `- First gateway decision: ${room.gatewayResult.gatewayCheck.gateAttempt.gateDecision}`,
    `- Replay refusal reason: ${room.replay.gatewayCheck.gateAttempt.gateDecisionReasonCode}`,
    `- Signer invocation count: ${room.surface.signatureCount()}`,
    `- Downstream finality: ${room.supportPacket.lifecycle.downstreamFinalityStatus ?? "unknown"}`,
    "",
  ].join("\n"),
);
console.log(outputPath);
