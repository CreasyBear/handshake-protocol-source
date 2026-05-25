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
    expect(stdout).toContain("# Service Workflow Admission Example");
    expect(stdout).toContain("Wrote: examples/service-workflow-admission/output/latest.md");
    expect(stdout).toContain("Wrote: examples/service-workflow-admission/output/latest.json");

    const output = await Bun.file(outputJsonPath).json();
    const markdown = await Bun.file(outputMarkdownPath).text();
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

    const source = readFileSync(`${repoRoot}/examples/service-workflow-admission/run.ts`, "utf8");
    expect(source).not.toContain("HandshakeKernel");
    expect(source).not.toContain("PolicyClient");
    expect(source).not.toContain("runX402WalletGateway");
    expect(source).not.toContain('from "../../src/runtime"');
  });
});
