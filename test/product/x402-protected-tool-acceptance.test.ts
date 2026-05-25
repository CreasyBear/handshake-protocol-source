import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import {
  X402_PROTECTED_TOOL_ACCEPTANCE_VERSION,
  x402ProtectedToolAcceptanceMatrix,
  x402ProtectedToolForbiddenProductionClaims,
  x402ProtectedToolReleaseBlockers,
} from "../../src/x402-protected-tool";

const expectedStepIds = [
  "package_install",
  "init_doctor",
  "install_x402_payment",
  "local_probes",
  "register_gateway_readiness",
  "install_health",
  "host_profile_generation",
  "protected_tool_proposal",
  "policy_decision",
  "gateway_check_signer",
  "redacted_readback_support",
] as const;

const expectedStepFields = [
  "surfaceOwner",
  "authorityPosture",
  "inputEvidence",
  "outputRecord",
  "requiredNonAuthorityFlags",
  "bypassPosture",
  "proofGaps",
  "validationGate",
  "stopCondition",
] as const;

describe("x402 protected tool acceptance contract", () => {
  it("keeps a source-owned production path from package install through readback", () => {
    expect(X402_PROTECTED_TOOL_ACCEPTANCE_VERSION).toBe("handshake.product.x402-protected-tool-acceptance.v1");
    expect(x402ProtectedToolAcceptanceMatrix.map((step) => step.id)).toEqual([...expectedStepIds]);

    for (const step of x402ProtectedToolAcceptanceMatrix) {
      for (const field of expectedStepFields) {
        expect(step[field]).toBeDefined();
      }

      expect(step.surfaceOwner.length).toBeGreaterThan(0);
      expect(step.inputEvidence.length).toBeGreaterThan(0);
      expect(step.outputRecord.length).toBeGreaterThan(0);
      expect(step.requiredNonAuthorityFlags.length).toBeGreaterThan(0);
      expect(step.bypassPosture.length).toBeGreaterThan(0);
      expect(step.proofGaps.length).toBeGreaterThan(0);
      expect(step.validationGate.length).toBeGreaterThan(0);
      expect(step.stopCondition.length).toBeGreaterThan(0);
    }
  });

  it("marks readiness and profile work as non-authority before policy and gateway", () => {
    const readiness = x402ProtectedToolAcceptanceMatrix.find((step) => step.id === "register_gateway_readiness");
    const health = x402ProtectedToolAcceptanceMatrix.find((step) => step.id === "install_health");
    const profile = x402ProtectedToolAcceptanceMatrix.find((step) => step.id === "host_profile_generation");
    const proposal = x402ProtectedToolAcceptanceMatrix.find((step) => step.id === "protected_tool_proposal");

    expect(readiness?.authorityPosture).toBe("pre_contract_readiness");
    expect(readiness?.requiredNonAuthorityFlags).toEqual(
      expect.arrayContaining([
        "readiness_scope_is_pre_contract",
        "readiness_creates_no_authority",
        "does_not_create_policy_decision",
        "does_not_perform_gateway_check",
        "does_not_invoke_signer",
      ]),
    );
    expect(readiness?.stopCondition).toContain("trusted_gateway_ready alone");
    expect(health?.authorityPosture).toBe("health_read_only");
    expect(profile?.authorityPosture).toBe("host_profile_only");
    expect(proposal?.authorityPosture).toBe("proposal_only");

    for (const step of [health, profile, proposal]) {
      expect(step?.requiredNonAuthorityFlags).toEqual(
        expect.arrayContaining(["does_not_create_greenlight", "does_not_perform_gateway_check", "does_not_mutate"]),
      );
    }
  });

  it("isolates the only authority steps to policy and gateway boundaries", () => {
    const authoritySteps = x402ProtectedToolAcceptanceMatrix.filter((step) =>
      step.authorityPosture.endsWith("_authority"),
    );

    expect(authoritySteps.map((step) => step.id)).toEqual(["policy_decision", "gateway_check_signer"]);
    expect(authoritySteps[0]).toMatchObject({
      authorityPosture: "policy_authority",
      outputRecord: expect.stringContaining("PolicyDecision"),
    });
    expect(authoritySteps[0]?.requiredNonAuthorityFlags).toEqual(
      expect.arrayContaining(["does_not_perform_gateway_check", "does_not_invoke_signer", "does_not_mutate"]),
    );
    expect(authoritySteps[1]).toMatchObject({
      authorityPosture: "gateway_authority",
      outputRecord: expect.stringContaining("VerifiedGatewayCheck"),
    });
    expect(authoritySteps[1]?.validationGate).toContain(
      "signer/payment material appears only after VerifiedGatewayCheck",
    );
  });

  it("keeps forbidden production claims and release blockers explicit", () => {
    expect(x402ProtectedToolForbiddenProductionClaims).toEqual(
      expect.arrayContaining([
        "readiness_is_permission",
        "mcp_tool_visibility_is_authorization",
        "host_profile_is_host_wide_containment",
        "certificate_is_permission_or_settlement",
        "per_call_bound_is_aggregate_spend_enforcement",
        "auth_md_is_authority_without_gateway_contract",
      ]),
    );
    expect(x402ProtectedToolReleaseBlockers).toEqual(
      expect.arrayContaining([
        "signer_invocation_before_verified_gateway_check",
        "reusable_greenlight_or_changed_params_after_greenlight",
        "trusted_readiness_used_as_mutation_permission",
        "receipt_or_support_bundle_cannot_distinguish_gateway_check_from_downstream_finality",
      ]),
    );
  });

  it("keeps the acceptance matrix documented in canonical internal docs", () => {
    const readme = readFileSync("README.md", "utf8");
    const decisions = readFileSync("docs/internal/decisions.md", "utf8");
    const protocolNotes = readFileSync("docs/internal/protocol-notes.md", "utf8");

    for (const doc of [decisions, protocolNotes]) {
      expect(doc).toContain("src/surfaces/x402-protected-tool-acceptance.ts");
      expect(doc).toContain("surface owner");
      expect(doc).toContain("authority posture");
      expect(doc).toMatch(/validation\s+gate/);
      expect(doc).toContain("stop condition");
      expect(doc).toContain("pre_contract");
    }

    expect(readme).toContain("Installed x402 first-use ladder");
    expect(readme).toContain("handshake install x402-payment");
    expect(readme).toContain("handshake probes x402-payment");
    expect(readme).toContain("handshake.actions.x402_payment.propose");
    expect(readme).toContain("do not create policy decisions");
    expect(readme).toContain("Reason-code runbook");
    expect(readme).toContain("create new contract");
    expect(readme).toContain("source-owned demos and schemas");
    expect(protocolNotes).toContain("First-use reason codes route to mechanisms, not retries");
    expect(protocolNotes).toContain("installed first-use guide in `README.md`");
    expect(protocolNotes).toContain("support bundle into retry permission");
    expect(protocolNotes).toContain("Schema-shaped samples should come from");
  });
});
