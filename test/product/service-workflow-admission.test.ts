import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ServiceWorkflowAdmissionSchema,
  ServiceWorkflowHandleSchema,
} from "../../src/surfaces/service-workflow-admission";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputJsonPath = `${repoRoot}/examples/service-workflow-admission/output/latest.json`;
const outputMarkdownPath = `${repoRoot}/examples/service-workflow-admission/output/latest.md`;

describe("service workflow admission example", () => {
  it("emits admission/readback context separately from fresh x402 clearance", async () => {
    const { output, markdown, source, stdout } = await runServiceWorkflowAdmissionDemo();

    expect(stdout).toContain("# Service Workflow Admission Example");
    expect(stdout).toContain("Wrote: examples/service-workflow-admission/output/latest.md");
    expect(stdout).toContain("Wrote: examples/service-workflow-admission/output/latest.json");

    const admission = ServiceWorkflowAdmissionSchema.parse(output.admissionPacket);
    const handle = ServiceWorkflowHandleSchema.parse(output.workflowHandle);

    expect(output).toMatchObject({
      schemaVersion: "handshake.demo.service-workflow-admission.v1",
      command: "npm run demo:service-workflow-admission",
      proofBoundary: "local_source_owned_product_surface",
      admissionReadback: {
        policyDecisionRef: null,
        greenlightRef: null,
        gatewayCheckRef: null,
        mutationAttemptRef: null,
        receiptRef: null,
        authorityCertificateRef: null,
        nextActionRequirement: "fresh_action_contract_required",
      },
      freshClearanceRequest: {
        actionClass: "x402_payment.exact",
        contextAuthorityCreated: false,
        freshActionContractRequired: true,
      },
      freshClearanceAuthorityPath: {
        actionClass: "x402_payment.exact",
        policyDecision: "greenlight",
        gateDecision: "passed",
        replayDecision: "refused",
        replayReasonCode: "already_consumed",
        changedParameterDecision: "refused",
        changedParameterReasonCode: "params_mismatch",
      },
    });
    expect(admission.authorityBoundary).toMatchObject({
      createsAuthority: false,
      createsPolicyDecision: false,
      createsGreenlight: false,
      performsGatewayCheck: false,
      permitsMutation: false,
      exportsReceipt: false,
      mintsTerminalCertificate: false,
      containsCredentialMaterial: false,
      containsPaymentMaterial: false,
      freshActionContractRequired: true,
    });
    expect(handle.authorityBoundary).toEqual(admission.authorityBoundary);
    expect(handle.allowedUse).toBe("correlation_and_readback_context_only");
    expect(handle.nextProtectedActionRequirement).toBe("fresh_action_contract_required");

    const admissionAndHandleText = JSON.stringify({
      admissionPacket: output.admissionPacket,
      admissionReadback: output.admissionReadback,
      workflowHandle: output.workflowHandle,
    });
    for (const forbidden of ["PaymentPayload", "PAYMENT-SIGNATURE", "rawCredentialMaterial", "privateKey"]) {
      expect(admissionAndHandleText).not.toContain(forbidden);
    }
    expect(output.evidenceSeparation.admissionEvidenceRefs).toEqual(["evidence:passport-package:x402-demo-agent"]);
    expect(output.evidenceSeparation.protectedActionOutcomeRefs.length).toBeGreaterThan(0);
    expect(output.evidenceSeparation.protectedActionRefusalRefs.length).toBeGreaterThan(0);

    for (const nonClaim of [
      "hosted operation",
      "provider custody",
      "settlement finality",
      "broad x402 compatibility",
      "host-wide containment",
      "reusable passport authority",
      "handle-as-permission",
    ]) {
      expect(output.nonClaims).toContain(nonClaim);
      expect(markdown).toContain(nonClaim);
    }
    expect(markdown.toLowerCase()).toContain("admission readback is not receipt evidence");
    expect(markdown).toContain("The handle is not permission");
    expect(markdown).toContain("ActionContract -> PolicyDecision ->");
    expect(source).not.toContain("HandshakeKernel");
    expect(source).not.toContain("PolicyClient");
    expect(source).not.toContain("runX402WalletGateway");
    expect(source).not.toContain('from "../../src/runtime"');
  });

  it("keeps workflow handles unusable as protected-action authority under generated-agent misuse shapes", async () => {
    const { output, markdown } = await runServiceWorkflowAdmissionDemo();
    const admission = ServiceWorkflowAdmissionSchema.parse(output.admissionPacket);
    const handle = ServiceWorkflowHandleSchema.parse(output.workflowHandle);

    expect(handle.allowedUse).toBe("correlation_and_readback_context_only");
    expect(handle.nextProtectedActionRequirement).toBe("fresh_action_contract_required");
    expect(handle.authorityBoundary).toMatchObject({
      createsAuthority: false,
      createsPolicyDecision: false,
      createsGreenlight: false,
      performsGatewayCheck: false,
      permitsMutation: false,
      exportsReceipt: false,
      mintsTerminalCertificate: false,
      isReusableAuth: false,
      isGatewayBinding: false,
      freshActionContractRequired: true,
    });
    expect(output.freshClearanceRequest).toMatchObject({
      contextAuthorityCreated: false,
      freshActionContractRequired: true,
    });
    expect(Object.keys(output.freshClearanceRequest.contextRefs).sort()).toEqual(
      [
        "admissionId",
        "passportPackageDigest",
        "passportPresentationId",
        "serviceWorkflowHandleDigest",
        "serviceWorkflowHandleId",
      ].sort(),
    );

    const admissionAndHandleText = JSON.stringify({
      admissionPacket: output.admissionPacket,
      workflowHandle: output.workflowHandle,
    });
    for (const authorityField of [
      "policyDecisionRef",
      "greenlightRef",
      "gatewayCheckRef",
      "mutationAttemptRef",
      "receiptRef",
      "authorityCertificateRef",
      "signerRef",
      "credentialRef",
      "PaymentPayload",
      "PAYMENT-SIGNATURE",
      "gatewayCredentialBinding",
      "delegatedAuthorityBinding",
      "reusableClearance",
    ]) {
      expect(admissionAndHandleText).not.toContain(authorityField);
    }

    for (const protectedActionAuthorityRef of [
      output.freshClearanceAuthorityPath.actionContractId,
      output.freshClearanceAuthorityPath.policyDecisionId,
      output.freshClearanceAuthorityPath.greenlightId,
      output.freshClearanceAuthorityPath.gateAttemptId,
      output.freshClearanceAuthorityPath.receiptId,
    ]) {
      expect(admissionAndHandleText).not.toContain(protectedActionAuthorityRef);
    }

    expect(admission.runtimePosture).toEqual([
      expect.objectContaining({
        rawSiblingBypassPostureRef: "bypass-posture:x402-raw-sibling",
        nativeContainmentClaimed: false,
        proofGapRefs: ["proof-gap:host-wide-containment"],
      }),
    ]);
    expect(output.admissionReadback).toMatchObject({
      policyDecisionRef: null,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
      receiptRef: null,
      authorityCertificateRef: null,
      nextActionRequirement: "fresh_action_contract_required",
    });

    expect(output.generatedAgentMisusePosture).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scenario: "handle_reuse_in_loop",
          expectedBoundary: "fresh_action_contract_required",
          acceptedAsAuthority: false,
        }),
        expect.objectContaining({
          scenario: "retry_after_changed_parameters",
          expectedBoundary: "fresh_action_contract_required",
          acceptedAsAuthority: false,
        }),
        expect.objectContaining({
          scenario: "dynamic_tool_construction",
          expectedBoundary: "runtime_refusal_or_proof_gap",
          acceptedAsAuthority: false,
        }),
        expect.objectContaining({
          scenario: "stale_rendered_review",
          expectedBoundary: "fresh_action_contract_required",
          acceptedAsAuthority: false,
        }),
        expect.objectContaining({
          scenario: "raw_sibling_x402_bypass",
          expectedBoundary: "bypass_evidence_only",
          acceptedAsAuthority: false,
        }),
        expect.objectContaining({
          scenario: "replay_after_greenlight",
          expectedBoundary: "one_use_greenlight_only",
          acceptedAsAuthority: false,
        }),
        expect.objectContaining({
          scenario: "admission_proof_gap",
          expectedBoundary: "proof_gap_not_authority",
          acceptedAsAuthority: false,
        }),
      ]),
    );
    for (const item of output.generatedAgentMisusePosture) {
      expect(item.acceptedAsAuthority).toBe(false);
    }
    expect(markdown).toContain("Generated-Agent Misuse Posture");
    expect(markdown).toContain("dynamic_tool_construction");
    expect(markdown).toContain("raw_sibling_x402_bypass");
  });

  it("gates the x402 fixture behind fresh clearance without leaking payment or auth.md authority", async () => {
    const { output, markdown } = await runServiceWorkflowAdmissionDemo();
    const admission = ServiceWorkflowAdmissionSchema.parse(output.admissionPacket);
    const handle = ServiceWorkflowHandleSchema.parse(output.workflowHandle);

    expect(output.protectedActionFixtureGate).toMatchObject({
      serviceWorkflowContextRole: "correlation_context_only",
      contextAuthorityCreated: false,
      freshActionContractRequired: true,
      freshActionContractId: output.freshClearanceAuthorityPath.actionContractId,
      policyDecisionId: output.freshClearanceAuthorityPath.policyDecisionId,
      greenlightId: output.freshClearanceAuthorityPath.greenlightId,
      gatewayCheckAttemptId: output.freshClearanceAuthorityPath.gateAttemptId,
      receiptId: output.freshClearanceAuthorityPath.receiptId,
      admissionReadbackReceiptRef: null,
      paymentMaterialBoundary: {
        admissionOrHandlePaymentMaterialIncluded: false,
        runtimeCredentialMaterialVisible: "absent",
        signedRetryCountBeforeGateway: 0,
        signerInvocationBoundary: "after_verified_gateway_check_only",
        paymentMaterialCreatedOnlyAfterVerifiedGatewayCheck: true,
      },
      authMdBoundary: {
        includedInFixture: false,
        posture: "provenance_or_proof_gap_only",
        compositeAuthorityCreated: false,
        proofGapRef: "proof-gap:auth-md-not-composed-into-t2-04",
      },
    });
    expect(output.protectedActionFixtureGate.paymentMaterialBoundary.paymentSignatureHeaderRef).toStartWith(
      "credential:x402-payment-signature:",
    );
    expect(output.protectedActionFixtureGate.paymentMaterialBoundary.paymentPayloadRef).toStartWith(
      "credential:x402-payment-payload:",
    );
    expect(output.authMdPosture).toEqual({
      includedInProtectedActionFixture: false,
      authorityPosture: "provenance_or_proof_gap_only",
      compositeAuthorityCreated: false,
      separateProtectedActionRequired:
        "auth_md_protected_api_call.exact_requires_fresh_action_contract_policy_greenlight_gateway_check",
      proofGapRefs: ["proof-gap:auth-md-not-composed-into-t2-04"],
    });

    const admissionHandleAndReadbackText = JSON.stringify({
      admission,
      handle,
      admissionReadback: output.admissionReadback,
      freshClearanceRequest: output.freshClearanceRequest,
    });
    for (const forbidden of [
      output.protectedActionFixtureGate.paymentMaterialBoundary.paymentSignatureHeaderRef,
      output.protectedActionFixtureGate.paymentMaterialBoundary.paymentPayloadRef,
      "PaymentPayload",
      "PAYMENT-SIGNATURE",
      "auth_md_access_token",
      "rawCredentialMaterial",
      "privateKey",
    ]) {
      expect(admissionHandleAndReadbackText).not.toContain(forbidden);
    }
    const authMdPostureText = JSON.stringify(output.authMdPosture);
    for (const forbidden of [
      "credentialRef",
      "gatewayCredentialRefId",
      "policyDecisionRef",
      "greenlightRef",
      "gatewayCheckRef",
      "receiptRef",
      "rawCredentialMaterial",
    ]) {
      expect(authMdPostureText).not.toContain(forbidden);
    }
    expect(output.freshClearanceRequest.contextRefs).toEqual({
      passportPackageDigest: handle.passportPackageDigest,
      passportPresentationId: handle.passportPresentationId,
      admissionId: handle.admissionId,
      serviceWorkflowHandleId: handle.serviceWorkflowHandleId,
      serviceWorkflowHandleDigest: handle.serviceWorkflowHandleDigest,
    });
    expect(output.freshClearanceAuthorityPath).toMatchObject({
      actionClass: "x402_payment.exact",
      policyDecision: "greenlight",
      gateDecision: "passed",
      changedParameterDecision: "refused",
      changedParameterReasonCode: "params_mismatch",
      replayDecision: "refused",
      replayReasonCode: "already_consumed",
    });
    expect(markdown).toContain("Protected-Action Fixture Gate");
    expect(markdown).toContain("auth.md composite authority created");
  });
});

async function runServiceWorkflowAdmissionDemo() {
  const proc = Bun.spawn([process.execPath, "run", "./examples/service-workflow-admission/run.ts"], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdoutPromise = proc.stdout ? new Response(proc.stdout).text() : Promise.resolve("");
  const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
  const exitCode = await proc.exited;
  const stdout = await stdoutPromise;
  const stderr = await stderrPromise;

  expect(stderr).toBe("");
  expect(exitCode).toBe(0);

  return {
    stdout,
    output: await Bun.file(outputJsonPath).json(),
    markdown: await Bun.file(outputMarkdownPath).text(),
    source: readFileSync(`${repoRoot}/examples/service-workflow-admission/run.ts`, "utf8"),
  };
}
