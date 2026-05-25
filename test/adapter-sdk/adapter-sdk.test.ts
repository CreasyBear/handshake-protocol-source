import { describe, expect, it } from "bun:test";
import {
  AdapterSdkAuthorityBoundarySchema,
  AdapterSdkDefinitionSchema,
  adapterSdkAuthorityBoundary,
  adapterSdkRequiredNonClaims,
  assertAdapterSdkInstallProposal,
  defineAdapterInstallCompiler,
  defineProtectedActionAdapterPack,
  projectAdapterSdkDefinitionReport,
  projectAdapterSdkInstallProposalReport,
  type AdapterSdkDefinitionInput,
} from "../../src/adapter-sdk";
import { PROTOCOL_VERSION } from "../../src/protocol/foundation/schema-core";

type ProposalInput = Parameters<typeof projectAdapterSdkInstallProposalReport>[1];

const digest = `sha256:${"a".repeat(64)}`;

const adapterPack: AdapterSdkDefinitionInput["adapterPack"] = {
  adapterPackId: "adapter_demo_exact",
  adapterPackVersion: "0.1.0",
  actionFamily: "demo.protected_action",
  protectedSurfaceKind: "demo.protected_surface",
  parameterSchemaRef: "schema:demo:parameters",
  endpointEvidenceSchemaRef: "schema:demo:endpoint-evidence",
  installCompilerRef: "compiler:demo-install",
  policyRulePackRef: "policy:demo-rules",
  gatewayObservedParameterValidatorRef: "validator:demo-observed-parameters",
  receiptEvidenceMapperRef: "mapper:demo-receipt-evidence",
  bypassProbeKinds: ["credential_custody", "raw_sibling_blocking"],
  hostileFixtureRefs: ["fixture:demo-hostile"],
};

const definitionInput = {
  adapterPack,
  installCompilerContract: {
    installCompilerRef: adapterPack.installCompilerRef,
    inputSchemaRef: "schema:demo-install-input",
    outputSchemaRef: "handshake.install_proposal",
    refusalBoundaryRef: "refusal:demo-install",
    statusIntegrityRequired: true,
  },
  protectedPathContract: {
    protectedPathContractRef: "protected-path:demo",
    observedParameterValidatorRef: adapterPack.gatewayObservedParameterValidatorRef,
    receiptEvidenceMapperRef: adapterPack.receiptEvidenceMapperRef,
    bypassProbeKinds: ["raw_sibling_blocking", "credential_custody"],
  },
  conformanceExpectations: [
    {
      expectationId: "expectation:no-ungated-mutation",
      title: "No mutation without verified gate evidence",
      evidenceRef: "conformance:demo:no-ungated-mutation",
      required: true,
    },
  ],
} satisfies AdapterSdkDefinitionInput;

describe("adapter SDK", () => {
  it("defines adapter packs as definition-only authoring surfaces", () => {
    const definition = defineProtectedActionAdapterPack(definitionInput);

    expect(definition.runtimeIngressBindingStatus).toBe("definition_only");
    expect(definition.protectedPathBindingStatus).toBe("definition_only");
    expect(definition.authorityBoundary).toEqual(adapterSdkAuthorityBoundary);
    expect(definition.nonClaims).toEqual(expect.arrayContaining([...adapterSdkRequiredNonClaims]));
  });

  it("rejects authority claims inside adapter SDK definitions", () => {
    expect(() =>
      AdapterSdkAuthorityBoundarySchema.parse({
        ...adapterSdkAuthorityBoundary,
        mutationAttempted: true,
      }),
    ).toThrow();
  });

  it("rejects direct schema parses that omit required non-claims", () => {
    expect(() =>
      AdapterSdkDefinitionSchema.parse({
        ...definitionInput,
        runtimeIngressBindingStatus: "definition_only",
        protectedPathBindingStatus: "definition_only",
        authorityBoundary: adapterSdkAuthorityBoundary,
        nonClaims: [...adapterSdkRequiredNonClaims.slice(1), "custom_non_claim"],
      }),
    ).toThrow();
  });

  it("reports cross-contract drift before source review", () => {
    const report = projectAdapterSdkDefinitionReport({
      ...definitionInput,
      protectedPathContract: {
        ...definitionInput.protectedPathContract,
        observedParameterValidatorRef: "validator:other",
      },
    });

    expect(report.status).toBe("invalid_definition");
    expect(report.issueCodes).toEqual(["observed_parameter_validator_ref_mismatch"]);
  });

  it("validates refused install proposals without converting them into authority", () => {
    const proposal = installProposal();
    const report = projectAdapterSdkInstallProposalReport(definitionInput, proposal);

    expect(report.status).toBe("valid_proposal_shape");
    expect(report.authorityBoundary).toEqual(adapterSdkAuthorityBoundary);
    expect(report.compiledRecordsIncluded).toBe(false);
    expect(assertAdapterSdkInstallProposal(definitionInput, proposal)).toEqual(proposal);
  });

  it("rejects ready install proposals that omit compiled kernel records", () => {
    const report = projectAdapterSdkInstallProposalReport(
      definitionInput,
      installProposal({
        status: "ready_to_install",
        refusalReasonCodes: [],
      }),
    );

    expect(report.status).toBe("invalid_proposal_shape");
    expect(report.issueCodes).toEqual(["ready_install_requires_compiled_records"]);
  });

  it("rejects refused install proposals without refusal reason codes", () => {
    const report = projectAdapterSdkInstallProposalReport(
      definitionInput,
      installProposal({
        refusalReasonCodes: [],
      }),
    );

    expect(report.status).toBe("invalid_proposal_shape");
    expect(report.issueCodes).toEqual(["refusal_requires_reason_codes"]);
  });

  it("defines install compilers as proposal compilers only", async () => {
    const compiler = defineAdapterInstallCompiler({
      installCompilerRef: adapterPack.installCompilerRef,
      compileInstallProposal: () => installProposal(),
    });

    await expect(compiler.compileInstallProposal({})).resolves.toMatchObject({
      status: "refused",
      compiledRecords: null,
    });
  });
});

function installProposal(overrides: Partial<ProposalInput> = {}): ProposalInput {
  return {
    installProposalId: "install_demo_1",
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "ten_demo",
    organizationId: "org_demo",
    createdAt: "2026-05-24T00:00:00.000Z",
    adapterPackId: adapterPack.adapterPackId,
    adapterPackVersion: adapterPack.adapterPackVersion,
    actionFamily: adapterPack.actionFamily,
    protectedSurfaceKind: adapterPack.protectedSurfaceKind,
    resourceRef: "resource:demo",
    status: "refused",
    humanSummary: "Demo install proposal refused for fixture coverage.",
    refusalReasonCodes: ["demo_refusal"],
    compiledRecords: null,
    policyPackRef: adapterPack.policyRulePackRef,
    policyPackVersion: "0.1.0",
    bypassProbePlan: [
      {
        probeKind: "credential_custody",
        requiredSourceAuthority: "conformance_fixture",
        mustPassBeforeGatewayCheckedPosture: true,
      },
    ],
    receiptExpectationRefs: ["receipt:demo"],
    installDigest: digest,
    ...overrides,
  };
}
