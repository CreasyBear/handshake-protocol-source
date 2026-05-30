import { z } from "zod";
import { verifySignedChain } from "../../integrations/a1-evidence/verify-chain.js";
import { toHexLower } from "../../integrations/a1-evidence/hex.js";
import { parseSignedChain } from "../../integrations/a1-evidence/wire-types.js";
import { mcpNonContractOutcome, mcpToolResult, type McpToolResult } from "../output.js";
import { surfaceOutcomeBase } from "../../surfaces/outcome.js";

export const MCP_DELEGATION_VERIFY_TOOL = "handshake.evidence.delegation.verify" as const;

const MerkleSiblingSchema = z.strictObject({
  hash: z.string().min(1).max(128),
  isLeft: z.boolean(),
});

export const McpDelegationVerifyInputSchema = z.strictObject({
  signedChain: z.unknown(),
  executorPk: z.string().min(1).max(128),
  intentHash: z.string().min(1).max(128),
  merkleProof: z.strictObject({
    siblings: z.array(MerkleSiblingSchema).max(64),
  }),
  nowUnix: z.number().int().nonnegative().optional(),
  driftToleranceSecs: z.number().int().nonnegative().max(3600).optional(),
});

export type McpDelegationVerifyInput = z.infer<typeof McpDelegationVerifyInputSchema>;

function chainFingerprintEvidenceRef(fingerprint: Uint8Array): string {
  return `evidence:a1-chain-fingerprint:${toHexLower(fingerprint)}`;
}

export function verifyMcpDelegationEvidence(inputValue: McpDelegationVerifyInput): McpToolResult {
  const parsed = McpDelegationVerifyInputSchema.safeParse(inputValue);
  if (!parsed.success) {
    return mcpNonContractOutcome(
      {
        outcome: "tool_execution_error",
        phase: "tool_execution",
        reasonCodes: ["delegation_evidence_verify:malformed_input"],
        nextAction: "recraft_request",
      },
      true,
    );
  }

  const input = parsed.data;
  let signedChain;
  try {
    signedChain = parseSignedChain(input.signedChain);
  } catch {
    return mcpNonContractOutcome(
      {
        outcome: "tool_execution_error",
        phase: "tool_execution",
        reasonCodes: ["delegation_evidence_verify:malformed_wire"],
        nextAction: "recraft_request",
      },
      true,
    );
  }

  const outcome = verifySignedChain({
    signedChain,
    executorPk: input.executorPk,
    intentHash: input.intentHash,
    merkleProof: input.merkleProof,
    ...(input.nowUnix !== undefined ? { nowUnix: input.nowUnix } : {}),
    ...(input.driftToleranceSecs !== undefined ? { driftToleranceSecs: input.driftToleranceSecs } : {}),
  });

  if (!outcome.valid) {
    return mcpNonContractOutcome(
      {
        outcome: "refused",
        phase: "evidence",
        reasonCodes: outcome.reasonCodes,
        nextAction: "recraft_request",
        evidenceRefs: [],
      },
      false,
    );
  }

  const evidenceRefs = [
    chainFingerprintEvidenceRef(outcome.chainFingerprint),
    ...outcome.certFingerprints.map((fp) => `evidence:a1-cert-fingerprint:${toHexLower(fp)}`),
  ];

  return mcpToolResult(
    surfaceOutcomeBase({
      outcome: "proof_gap",
      phase: "evidence",
      reasonCodes: ["delegation_evidence_verified_non_authoritative"],
      nextAction: "read_evidence",
      evidenceRefs,
    }),
    false,
  );
}
