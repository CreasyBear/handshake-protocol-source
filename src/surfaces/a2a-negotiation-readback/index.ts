import { z } from "zod";

const DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

const ReadbackStatusSchema = z.enum([
  "agreement_evidence_only",
  "policy_greenlit",
  "gateway_checked_downstream_unknown",
  "downstream_succeeded",
  "refused",
  "proof_gap",
  "readback_assembly_failed",
]);

const NonClaimSchema = z.enum([
  "marketplace_operation",
  "legal_contract_formation",
  "escrow",
  "settlement_finality",
  "reputation",
  "cross_org_trust",
  "provider_custody",
  "reusable_authority",
  "native_host_containment",
]);

const AuthorityBoundarySchema = z.strictObject({
  agreementAcceptanceCreatedAuthority: z.literal(false),
  obligationBindingCreatedAuthority: z.literal(false),
  policyMayCreateOneUseGreenlight: z.boolean(),
  gatewayCheckRemainsFinalEnforcementPoint: z.literal(true),
  downstreamSuccessClaimedByAgreement: z.literal(false),
});

const RedactionSchema = z.strictObject({
  rawTranscriptIncluded: z.literal(false),
  rawOfferTermsIncluded: z.literal(false),
  paymentPayloadIncluded: z.literal(false),
  paymentSignatureIncluded: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
});

export const A2ANegotiationReadbackInputSchema = z.strictObject({
  packetKind: z.literal("a2a_negotiation_support_packet"),
  actionContractId: z.string().min(1),
  actionContractDigest: DigestSchema,
  paramsDigest: DigestSchema,
  actionClass: z.string().min(1),
  resourceRef: z.string().min(1),
  agreement: z
    .strictObject({
      linkedAgreementId: z.string().min(1),
      agreementDigest: DigestSchema,
      agreementStatus: z.string().min(1),
      obligationRef: z.string().min(1).nullable(),
      counterpartyRef: z.string().min(1),
      evidencePosture: z.literal("local_evidence_only"),
    })
    .nullable(),
  obligationBinding: z
    .strictObject({
      agreementObligationBindingId: z.string().min(1),
      obligationRef: z.string().min(1),
      actionContractDigest: DigestSchema,
      paramsDigest: DigestSchema,
      counterpartyRef: z.string().min(1),
    })
    .nullable(),
  negotiation: z
    .strictObject({
      negotiationSessionId: z.string().min(1),
      acceptedOfferVersionId: z.string().min(1),
      acceptedNegotiationDecisionId: z.string().min(1),
      acceptedOfferContentDigest: DigestSchema,
      partyRefs: z.array(z.string().min(1)),
    })
    .nullable(),
  lifecycle: z.strictObject({
    assemblyStatus: z.enum(["assembled", "failed"]),
    assemblyReasonCode: z.string().min(1).nullable(),
    assemblyReason: z.string().min(1).nullable(),
    policyDecisionId: z.string().min(1).nullable(),
    policyDecision: z.string().min(1).nullable(),
    greenlightId: z.string().min(1).nullable(),
    gatewayCheckAttemptId: z.string().min(1).nullable(),
    mutationAttemptId: z.string().min(1).nullable(),
    receiptId: z.string().min(1).nullable(),
    downstreamFinalityStatus: z.string().min(1).nullable(),
    proofGapIds: z.array(z.string().min(1)),
    refusalIds: z.array(z.string().min(1)),
  }),
  authorityBoundary: AuthorityBoundarySchema,
  redaction: RedactionSchema,
});

export const A2ANegotiationProductReadbackSchema = z.strictObject({
  readbackKind: z.literal("a2a_negotiation_product_readback"),
  schemaVersion: z.literal("a2a.negotiation.readback.v1"),
  status: ReadbackStatusSchema,
  actionContractId: z.string().min(1),
  actionContractDigest: DigestSchema,
  paramsDigest: DigestSchema,
  actionClass: z.string().min(1),
  resourceRef: z.string().min(1),
  negotiatedEvidence: z.strictObject({
    linkedAgreementId: z.string().min(1).nullable(),
    agreementStatus: z.string().min(1).nullable(),
    obligationRef: z.string().min(1).nullable(),
    counterpartyRef: z.string().min(1).nullable(),
    evidencePosture: z.literal("local_evidence_only").nullable(),
  }),
  protectedAction: z.strictObject({
    policyDecisionId: z.string().min(1).nullable(),
    policyDecision: z.string().min(1).nullable(),
    greenlightId: z.string().min(1).nullable(),
    gatewayCheckAttemptId: z.string().min(1).nullable(),
    mutationAttemptId: z.string().min(1).nullable(),
    receiptId: z.string().min(1).nullable(),
    downstreamFinalityStatus: z.string().min(1).nullable(),
  }),
  developerExperience: z.strictObject({
    targetTimeToHelloWorldMinutes: z.literal(5),
    runCommand: z.literal("bun examples/a2a-negotiated-x402-room/generate.ts"),
    expectedOutputFiles: z.tuple([z.literal("latest.json"), z.literal("latest.md"), z.literal("agent-handoff.md")]),
    inspectFirst: z.array(z.string().min(1)),
    failureModes: z.array(z.string().min(1)),
  }),
  agentExperience: z.strictObject({
    runtimeProfiles: z.array(z.enum(["codex", "mcp", "x402", "generic"])),
    sourceBoundary: z.array(z.string().min(1)),
    toolContract: z.array(z.string().min(1)),
    stopConditions: z.array(z.string().min(1)),
    recoveryPath: z.array(z.string().min(1)),
    evalPath: z.array(z.string().min(1)),
  }),
  customerExperience: z.strictObject({
    headline: z.string().min(1),
    verified: z.array(z.string().min(1)),
    unknown: z.array(z.string().min(1)),
    nextActions: z.array(z.string().min(1)),
  }),
  authorityBoundary: AuthorityBoundarySchema,
  redaction: RedactionSchema,
  nonClaims: z.array(NonClaimSchema),
});

export type A2ANegotiationReadbackInput = z.infer<typeof A2ANegotiationReadbackInputSchema>;
export type A2ANegotiationProductReadback = z.infer<typeof A2ANegotiationProductReadbackSchema>;
export type A2ANegotiationReadbackStatus = z.infer<typeof ReadbackStatusSchema>;
export type A2ANegotiationNonClaim = z.infer<typeof NonClaimSchema>;

export const a2aNegotiationReadbackNonClaims: readonly A2ANegotiationNonClaim[] = [
  "marketplace_operation",
  "legal_contract_formation",
  "escrow",
  "settlement_finality",
  "reputation",
  "cross_org_trust",
  "provider_custody",
  "reusable_authority",
  "native_host_containment",
] as const;

export function projectA2ANegotiationProductReadback(
  inputValue: A2ANegotiationReadbackInput,
): A2ANegotiationProductReadback {
  const input = A2ANegotiationReadbackInputSchema.parse(inputValue);
  return A2ANegotiationProductReadbackSchema.parse({
    readbackKind: "a2a_negotiation_product_readback",
    schemaVersion: "a2a.negotiation.readback.v1",
    status: readbackStatus(input),
    actionContractId: input.actionContractId,
    actionContractDigest: input.actionContractDigest,
    paramsDigest: input.paramsDigest,
    actionClass: input.actionClass,
    resourceRef: input.resourceRef,
    negotiatedEvidence: {
      linkedAgreementId: input.agreement?.linkedAgreementId ?? null,
      agreementStatus: input.agreement?.agreementStatus ?? null,
      obligationRef: input.agreement?.obligationRef ?? input.obligationBinding?.obligationRef ?? null,
      counterpartyRef: input.agreement?.counterpartyRef ?? input.obligationBinding?.counterpartyRef ?? null,
      evidencePosture: input.agreement?.evidencePosture ?? null,
    },
    protectedAction: {
      policyDecisionId: input.lifecycle.policyDecisionId,
      policyDecision: input.lifecycle.policyDecision,
      greenlightId: input.lifecycle.greenlightId,
      gatewayCheckAttemptId: input.lifecycle.gatewayCheckAttemptId,
      mutationAttemptId: input.lifecycle.mutationAttemptId,
      receiptId: input.lifecycle.receiptId,
      downstreamFinalityStatus: input.lifecycle.downstreamFinalityStatus,
    },
    developerExperience: {
      targetTimeToHelloWorldMinutes: 5,
      runCommand: "bun examples/a2a-negotiated-x402-room/generate.ts",
      expectedOutputFiles: ["latest.json", "latest.md", "agent-handoff.md"],
      inspectFirst: [
        "authorityBoundary.agreementAcceptanceCreatedAuthority",
        "protectedAction.gatewayCheckAttemptId",
        "protectedAction.downstreamFinalityStatus",
        "customerExperience.nextActions",
      ],
      failureModes: [
        "missing agreement obligation binding becomes a proof gap",
        "stale negotiation evidence is refused before greenlight",
        "changed payment parameters are refused at the gateway before signer use",
        "downstream finality unknown remains unknown, not success",
      ],
    },
    agentExperience: {
      runtimeProfiles: ["codex", "mcp", "x402", "generic"],
      sourceBoundary: [
        "Use this readback packet as evidence only.",
        "Do not infer authority from an accepted agreement.",
        "Bind future mutations to a fresh exact ActionContract and gateway check.",
      ],
      toolContract: [
        "Read support packet fields and public readback fields.",
        "Do not request raw payment payloads, payment signatures, or credential material.",
        "Do not call signer or mutation tools unless a verified gateway check is present.",
      ],
      stopConditions: [
        "Stop on missing obligation binding.",
        "Stop on agreement, params, selected payment requirement, endpoint, amount, or counterparty drift.",
        "Stop on readback assembly failure.",
        "Record downstream unknown as a proof gap or next action, not success.",
      ],
      recoveryPath: [
        "Re-run the readback generator to refresh local evidence.",
        "Inspect proofGapIds and refusalIds before retrying.",
        "Create a new exact ActionContract for any new mutation attempt.",
      ],
      evalPath: [
        "bun test test/product/a2a-negotiated-x402-room.test.ts",
        "bun examples/a2a-negotiated-x402-room/generate.ts",
        "npm run quality:claims",
        "npm run quality:architecture",
      ],
    },
    customerExperience: customerExperience(input),
    authorityBoundary: input.authorityBoundary,
    redaction: input.redaction,
    nonClaims: a2aNegotiationReadbackNonClaims,
  });
}

export function renderA2ANegotiationCustomerReadback(readback: A2ANegotiationProductReadback): string {
  const packet = A2ANegotiationProductReadbackSchema.parse(readback);
  return [
    "# A2A Negotiated Protected Action Readback",
    "",
    packet.customerExperience.headline,
    "",
    "## Verified",
    "",
    ...packet.customerExperience.verified.map((item) => `- ${item}`),
    "",
    "## Unknown",
    "",
    ...packet.customerExperience.unknown.map((item) => `- ${item}`),
    "",
    "## Next Actions",
    "",
    ...packet.customerExperience.nextActions.map((item) => `- ${item}`),
    "",
    "## Non-Claims",
    "",
    ...packet.nonClaims.map((item) => `- ${nonClaimLabel(item)} (${item})`),
    "",
  ].join("\n");
}

export function renderA2ANegotiationAgentHandoff(readback: A2ANegotiationProductReadback): string {
  const packet = A2ANegotiationProductReadbackSchema.parse(readback);
  return [
    "# Agent Handoff",
    "",
    "## Objective",
    "",
    `Inspect A2A protected-action readback for ${packet.actionContractId} without creating authority.`,
    "",
    "## Runtime Profile",
    "",
    packet.agentExperience.runtimeProfiles.join(", "),
    "",
    "## Source Boundary",
    "",
    ...packet.agentExperience.sourceBoundary.map((item) => `- ${item}`),
    "",
    "## Tool Contract",
    "",
    ...packet.agentExperience.toolContract.map((item) => `- ${item}`),
    "",
    "## Protected-Action Boundary",
    "",
    `Agreement acceptance created authority: ${packet.authorityBoundary.agreementAcceptanceCreatedAuthority}`,
    `Gateway check remains final enforcement point: ${packet.authorityBoundary.gatewayCheckRemainsFinalEnforcementPoint}`,
    `Downstream finality: ${packet.protectedAction.downstreamFinalityStatus ?? "unknown"}`,
    "",
    "## Stop Conditions",
    "",
    ...packet.agentExperience.stopConditions.map((item) => `- ${item}`),
    "",
    "## Evaluation Path",
    "",
    ...packet.agentExperience.evalPath.map((item) => `- ${item}`),
    "",
    "## Non-Claims",
    "",
    ...packet.nonClaims.map((item) => `- ${nonClaimLabel(item)} (${item})`),
    "",
    "## Next Agent Step",
    "",
    packet.customerExperience.nextActions[0] ?? "Read the support packet before proposing any follow-up action.",
    "",
  ].join("\n");
}

function readbackStatus(input: A2ANegotiationReadbackInput): A2ANegotiationReadbackStatus {
  if (input.lifecycle.assemblyStatus === "failed") return "readback_assembly_failed";
  if (input.lifecycle.downstreamFinalityStatus === "succeeded") return "downstream_succeeded";
  if (input.lifecycle.gatewayCheckAttemptId) return "gateway_checked_downstream_unknown";
  if (input.lifecycle.refusalIds.length > 0) return "refused";
  if (input.lifecycle.proofGapIds.length > 0) return "proof_gap";
  if (input.lifecycle.greenlightId) return "policy_greenlit";
  return "agreement_evidence_only";
}

function customerExperience(input: A2ANegotiationReadbackInput): A2ANegotiationProductReadback["customerExperience"] {
  const verified = [
    input.agreement
      ? `Agreement evidence ${input.agreement.linkedAgreementId} is recorded with status ${input.agreement.agreementStatus}.`
      : "No linked agreement evidence is present.",
    input.obligationBinding
      ? `Obligation binding ${input.obligationBinding.agreementObligationBindingId} pins the exact action contract digest.`
      : "No exact obligation binding is present.",
    input.lifecycle.greenlightId
      ? `Policy created one-use greenlight ${input.lifecycle.greenlightId}.`
      : "Policy did not create a greenlight.",
    input.lifecycle.gatewayCheckAttemptId
      ? `Gateway check ${input.lifecycle.gatewayCheckAttemptId} is recorded before mutation evidence.`
      : "No gateway check is recorded.",
  ];
  const unknown = [
    input.lifecycle.downstreamFinalityStatus && input.lifecycle.downstreamFinalityStatus !== "unknown"
      ? `Downstream finality is ${input.lifecycle.downstreamFinalityStatus}.`
      : "Downstream business finality is unknown.",
    input.lifecycle.proofGapIds.length > 0
      ? `Proof gaps remain: ${input.lifecycle.proofGapIds.join(", ")}.`
      : "No proof gap ids are present in this readback.",
    input.redaction.paymentSignatureIncluded
      ? "Payment signature material is unexpectedly included."
      : "Payment signature material is redacted from the readback.",
  ];
  const nextActions = input.lifecycle.gatewayCheckAttemptId
    ? ["Resolve or preserve proof gaps before claiming success.", "Do not retry payment with the same greenlight."]
    : input.lifecycle.refusalIds.length
      ? [
          "Inspect refusal ids before retrying.",
          "Create a fresh exact ActionContract for any changed protected action.",
        ]
      : input.lifecycle.proofGapIds.length
        ? ["Resolve or preserve proof gaps before claiming success.", "Do not retry payment with the same greenlight."]
        : ["Use this as readback evidence only.", "Create a fresh exact ActionContract for any new protected action."];

  return {
    headline:
      "A negotiated agreement was linked to one exact protected action; authority came only from policy and gateway checks.",
    verified,
    unknown,
    nextActions,
  };
}

function nonClaimLabel(nonClaim: A2ANegotiationNonClaim): string {
  switch (nonClaim) {
    case "marketplace_operation":
      return "marketplace operation";
    case "legal_contract_formation":
      return "legal contract formation";
    case "escrow":
      return "escrow";
    case "settlement_finality":
      return "settlement finality";
    case "reputation":
      return "reputation";
    case "cross_org_trust":
      return "cross-org trust";
    case "provider_custody":
      return "provider custody";
    case "reusable_authority":
      return "reusable authority";
    case "native_host_containment":
      return "native host containment";
  }
}
