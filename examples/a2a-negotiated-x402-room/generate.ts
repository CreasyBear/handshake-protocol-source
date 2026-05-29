import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { format } from "prettier";
import {
  projectA2ANegotiationProductReadback,
  renderA2ANegotiationAgentHandoff,
  renderA2ANegotiationCustomerReadback,
} from "../../src/surfaces/a2a-negotiation-readback";
import { localReferenceGeneratedAt, runNegotiatedX402Room } from "./local-reference-room";

const outputPath = join(import.meta.dir, "latest.json");
const markdownOutputPath = join(import.meta.dir, "latest.md");
const agentHandoffOutputPath = join(import.meta.dir, "agent-handoff.md");

export async function buildA2ANegotiatedX402RoomOutput() {
  const room = await runNegotiatedX402Room();
  const productReadback = projectA2ANegotiationProductReadback(room.supportPacket);
  return {
    generatedAt: localReferenceGeneratedAt,
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
}

export async function writeA2ANegotiatedX402RoomOutput() {
  const output = await buildA2ANegotiatedX402RoomOutput();
  const customerReadback = renderA2ANegotiationCustomerReadback(output.productReadback);
  const agentHandoff = renderA2ANegotiationAgentHandoff(output.productReadback);
  await mkdir(dirname(outputPath), { recursive: true });
  await Bun.write(outputPath, await format(JSON.stringify(output), { parser: "json" }));
  await Bun.write(markdownOutputPath, await format(customerReadback, { parser: "markdown" }));
  await Bun.write(agentHandoffOutputPath, await format(agentHandoff, { parser: "markdown" }));
  return outputPath;
}

if (import.meta.main) {
  console.log(await writeA2ANegotiatedX402RoomOutput());
}
