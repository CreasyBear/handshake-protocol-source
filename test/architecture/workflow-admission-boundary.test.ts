import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  PrincipalAgentLinkSchema,
  ServiceWorkflowAdmissionSchema,
  ServiceWorkflowContextRefsSchema,
  ServiceWorkflowHandleSchema,
  serviceWorkflowContextEvidenceRefs,
  serviceWorkflowContextRefFromHandle,
  serviceWorkflowNonAuthorityBoundary,
} from "../../src/surfaces/service-workflow-admission";

const digest = `sha256:${"a".repeat(64)}`;
const secondDigest = `sha256:${"b".repeat(64)}`;
const thirdDigest = `sha256:${"c".repeat(64)}`;
const fourthDigest = `sha256:${"d".repeat(64)}`;
const fifthDigest = `sha256:${"e".repeat(64)}`;
const sixthDigest = `sha256:${"f".repeat(64)}`;

const forbiddenAuthorityRoots = ["src/protocol/areas", "src/adapters", "src/runtime/ingress", "src/mcp"];
const workflowSurfaceNames = [
  "ServiceWorkflowAdmission",
  "ServiceWorkflowHandle",
  "PrincipalAgentLink",
  "ServiceWorkflowContextRefs",
  "serviceWorkflowHandleId",
  "serviceWorkflowHandleDigest",
  "passportPackageDigest",
  "passportPresentationId",
  "admissionId",
] as const;
const forbiddenMaterialFields = [
  "PaymentPayload",
  "PAYMENT-SIGNATURE",
  "rawCredentialMaterial",
  "privateKey",
  "signer",
  "receiptExport",
  "authorityCertificateMint",
] as const;

describe("service workflow admission boundary", () => {
  it("defines admission and handle as explicit non-authority surfaces", () => {
    const admission = ServiceWorkflowAdmissionSchema.parse(validAdmission());

    expect(admission.authorityBoundary).toEqual(serviceWorkflowNonAuthorityBoundary());
    expect(admission.serviceWorkflowHandle.authorityBoundary).toEqual(serviceWorkflowNonAuthorityBoundary());
    expect(admission.nextActionRequirement).toBe("fresh_action_contract_required");
    expect(admission.clearanceBoundary).toBe("fresh_action_contract_required_for_each_protected_action");
    expect(admission.readbackBoundary).toBe("admission_readback_is_not_receipt_evidence");
    expect(admission.serviceWorkflowHandle.allowedUse).toBe("correlation_and_readback_context_only");
    expect(admission.runtimePosture[0]?.nativeContainmentClaimed).toBe(false);
  });

  it("defines service workflow context refs as exact proposal metadata, not authority", () => {
    const admission = ServiceWorkflowAdmissionSchema.parse(validAdmission());
    const contextRefs = ServiceWorkflowContextRefsSchema.parse(
      serviceWorkflowContextRefFromHandle(admission.serviceWorkflowHandle),
    );

    expect(Object.keys(contextRefs).sort()).toEqual(
      [
        "admissionId",
        "passportPackageDigest",
        "passportPresentationId",
        "serviceWorkflowHandleDigest",
        "serviceWorkflowHandleId",
      ].sort(),
    );
    expect(contextRefs).toEqual({
      passportPackageDigest: admission.passportPackageDigest,
      passportPresentationId: admission.passportPresentationId,
      admissionId: admission.admissionId,
      serviceWorkflowHandleId: admission.serviceWorkflowHandle.serviceWorkflowHandleId,
      serviceWorkflowHandleDigest: admission.serviceWorkflowHandle.serviceWorkflowHandleDigest,
    });
    expect(serviceWorkflowContextEvidenceRefs(contextRefs)).toEqual([
      `service-workflow-context:passport-package:${admission.passportPackageDigest}`,
      `service-workflow-context:presentation:${admission.passportPresentationId}`,
      `service-workflow-context:admission:${admission.admissionId}`,
      `service-workflow-context:handle:${admission.serviceWorkflowHandle.serviceWorkflowHandleId}`,
      `service-workflow-context:handle-digest:${admission.serviceWorkflowHandle.serviceWorkflowHandleDigest}`,
    ]);

    for (const authorityField of [
      "policyDecisionRef",
      "greenlightRef",
      "gatewayCheckRef",
      "receiptRef",
      "authorityCertificateRef",
      "gatewayCredentialRef",
      "paymentPayloadRef",
    ]) {
      expect(ServiceWorkflowContextRefsSchema.safeParse({ ...contextRefs, [authorityField]: "x" }).success).toBe(false);
    }
  });

  it("defines principal-agent links as scoped evidence, not reusable auth", () => {
    const link = PrincipalAgentLinkSchema.parse(validPrincipalAgentLink());

    expect(link).toMatchObject({
      principalAgentLinkId: "principal-agent-link-1",
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      projectId: "project_demo",
      workspaceId: "workspace_demo",
      principalId: "principal_demo",
      agentId: "agent_demo",
      authorityBoundary: serviceWorkflowNonAuthorityBoundary(),
      allowedUse: "scoped_evidence_for_envelope_setup_and_readback_only",
      freshActionContractRequired: true,
    });
    expect(link.createsAuthority).toBe(false);
    expect(link.isReusableAuth).toBe(false);

    for (const authorityField of [
      "policyDecisionRef",
      "greenlightRef",
      "gatewayCheckRef",
      "receiptRef",
      "gatewayCredentialRef",
      "paymentApprovalRef",
    ]) {
      expect(PrincipalAgentLinkSchema.safeParse({ ...link, [authorityField]: "x" }).success).toBe(false);
    }
    expect(PrincipalAgentLinkSchema.safeParse({ ...link, createsAuthority: true }).success).toBe(false);
    expect(PrincipalAgentLinkSchema.safeParse({ ...link, isReusableAuth: true }).success).toBe(false);
  });

  it("rejects attempts to turn admission or handle fields into authority", () => {
    const admission = validAdmission();

    expect(() =>
      ServiceWorkflowAdmissionSchema.parse({
        ...admission,
        authorityBoundary: { ...admission.authorityBoundary, createsAuthority: true },
      }),
    ).toThrow();
    expect(() =>
      ServiceWorkflowHandleSchema.parse({
        ...admission.serviceWorkflowHandle,
        authorityBoundary: { ...admission.serviceWorkflowHandle.authorityBoundary, performsGatewayCheck: true },
      }),
    ).toThrow();
    expect(() =>
      ServiceWorkflowHandleSchema.parse({
        ...admission.serviceWorkflowHandle,
        nextProtectedActionRequirement: "handle_is_permission",
      }),
    ).toThrow();
  });

  it("keeps raw credential, payment, receipt, and certificate material out of the surface output", () => {
    const text = JSON.stringify(ServiceWorkflowAdmissionSchema.parse(validAdmission()));
    const violations = forbiddenMaterialFields.filter((field) => text.includes(field));

    expect(violations).toEqual([]);
  });

  it("keeps workflow admission nouns out of authority-bearing source roots", () => {
    const violations: string[] = [];
    for (const root of forbiddenAuthorityRoots) {
      for (const file of walkTs(root)) {
        const text = readFileSync(file, "utf8");
        for (const name of workflowSurfaceNames) {
          if (name === "ServiceWorkflowContextRefs" && relative(process.cwd(), file) === "src/mcp/x402-proposal.ts") {
            continue;
          }
          if (text.includes(name)) violations.push(`${relative(process.cwd(), file)} mentions ${name}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps service workflow context schemas off SDK, HTTP, runtime, root, and protocol-public surfaces", () => {
    const guardedRoots = ["src/http", "src/sdk", "src/runtime", "src/protocol/public", "src/index.ts", "package.json"];
    const schemaNames = [
      "PrincipalAgentLinkSchema",
      "ServiceWorkflowContextRefsSchema",
      "serviceWorkflowContextRefFromHandle",
      "serviceWorkflowContextEvidenceRefs",
      "serviceWorkflowContextCorrelationRef",
    ];
    const violations: string[] = [];

    for (const root of guardedRoots) {
      for (const file of walkTsOrConfig(root)) {
        const text = readFileSync(file, "utf8");
        for (const name of schemaNames) {
          if (text.includes(name)) violations.push(`${relative(process.cwd(), file)} mentions ${name}`);
        }
      }
    }

    expect(violations.sort()).toEqual([]);
  });
});

function validAdmission() {
  const authorityBoundary = serviceWorkflowNonAuthorityBoundary();
  return {
    schemaVersion: "handshake.service-workflow-admission.v0.1",
    passportPackageDigest: digest,
    passportPresentationId: "passport-presentation-1",
    admissionId: "service-workflow-admission-1",
    admissionDigest: secondDigest,
    serviceRef: "service:example",
    presentedAt: "2026-05-25T09:00:00.000Z",
    evaluatedAt: "2026-05-25T09:00:01.000Z",
    claimResults: [
      {
        claimRef: "participant-identity-binding:agent",
        claimDigest: thirdDigest,
        status: "accepted",
        reasonCodes: ["recognized_standing_evidence"],
        evidenceRefs: ["evidence:participant-identity-binding"],
        proofGapRefs: [],
      },
      {
        claimRef: "provider-custody:live",
        claimDigest: null,
        status: "proof_gap",
        reasonCodes: ["provider_custody_unverified"],
        evidenceRefs: [],
        proofGapRefs: ["proof-gap:provider-custody"],
      },
    ],
    runtimePosture: [
      {
        runtimeRef: "runtime:codex-local",
        hostProfileEvidenceRef: "host-profile:codex-local",
        rawSiblingBypassPostureRef: "bypass-posture:x402-raw-sibling",
        nativeContainmentClaimed: false,
        proofGapRefs: ["proof-gap:host-wide-containment"],
      },
    ],
    serviceWorkflowHandle: {
      schemaVersion: "handshake.service-workflow-admission.v0.1",
      passportPackageDigest: digest,
      passportPresentationId: "passport-presentation-1",
      admissionId: "service-workflow-admission-1",
      serviceWorkflowHandleId: "service-workflow-handle-1",
      serviceWorkflowHandleDigest: fourthDigest,
      issuedAt: "2026-05-25T09:00:01.000Z",
      expiresAt: "2026-05-25T10:00:01.000Z",
      workflowBoundsDigest: fifthDigest,
      sourceAdmissionDigest: secondDigest,
      runtimePostureDigest: sixthDigest,
      authorityBoundary,
      nextProtectedActionRequirement: "fresh_action_contract_required",
      allowedUse: "correlation_and_readback_context_only",
    },
    authorityBoundary,
    nextActionRequirement: "fresh_action_contract_required",
    clearanceBoundary: "fresh_action_contract_required_for_each_protected_action",
    readbackBoundary: "admission_readback_is_not_receipt_evidence",
  };
}

function validPrincipalAgentLink() {
  return {
    schemaVersion: "handshake.principal-agent-link.v0.1",
    principalAgentLinkId: "principal-agent-link-1",
    principalAgentLinkDigest: sixthDigest,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    projectId: "project_demo",
    workspaceId: "workspace_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    principalSubjectDigest: digest,
    agentSubjectDigest: secondDigest,
    authProviderRef: "auth-provider:clerk",
    linkEvidenceRefs: ["evidence:principal-agent-link:setup"],
    scopeRefs: ["scope:org:project:workspace"],
    issuedAt: "2026-05-25T09:00:00.000Z",
    expiresAt: "2026-05-25T10:00:00.000Z",
    revokedAt: null,
    authorityBoundary: serviceWorkflowNonAuthorityBoundary(),
    createsAuthority: false,
    createsPolicyDecision: false,
    createsGreenlight: false,
    performsGatewayCheck: false,
    permitsMutation: false,
    exportsReceipt: false,
    mintsTerminalCertificate: false,
    containsCredentialMaterial: false,
    containsPaymentMaterial: false,
    widensOperatingEnvelope: false,
    isReusableAuth: false,
    isGatewayBinding: false,
    freshActionContractRequired: true,
    allowedUse: "scoped_evidence_for_envelope_setup_and_readback_only",
  };
}

function walkTs(root: string): string[] {
  if (!existsSync(root)) return [];
  const stat = statSync(root);
  if (stat.isFile()) return root.endsWith(".ts") ? [root] : [];
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const entryStat = statSync(full);
    if (entryStat.isDirectory()) {
      files.push(...walkTs(full));
      continue;
    }
    if (entry.endsWith(".ts")) files.push(full);
  }
  return files;
}

function walkTsOrConfig(root: string): string[] {
  if (!existsSync(root)) return [];
  const stat = statSync(root);
  if (stat.isFile()) return /\.(ts|json)$/.test(root) ? [root] : [];
  return walkTs(root);
}
