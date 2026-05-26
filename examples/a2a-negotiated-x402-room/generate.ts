import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  projectA2ANegotiationProductReadback,
  renderA2ANegotiationAgentHandoff,
  renderA2ANegotiationCustomerReadback,
} from "../../src/surfaces/a2a-negotiation-readback";
import { runNegotiatedX402Room } from "./local-reference-room";

const outputPath = join(import.meta.dir, "latest.json");
const markdownOutputPath = join(import.meta.dir, "latest.md");
const agentHandoffOutputPath = join(import.meta.dir, "agent-handoff.md");

const room = await runNegotiatedX402Room();
const productReadback = projectA2ANegotiationProductReadback(room.supportPacket);
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
  productReadback,
};

await mkdir(dirname(outputPath), { recursive: true });
await Bun.write(outputPath, JSON.stringify(output, null, 2) + "\n");
await Bun.write(markdownOutputPath, renderA2ANegotiationCustomerReadback(productReadback));
await Bun.write(agentHandoffOutputPath, renderA2ANegotiationAgentHandoff(productReadback));
console.log(outputPath);
