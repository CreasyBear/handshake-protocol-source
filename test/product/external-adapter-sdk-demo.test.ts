import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputJsonPath = `${repoRoot}/examples/external-adapter-sdk/output/latest.json`;
const outputMarkdownPath = `${repoRoot}/examples/external-adapter-sdk/output/latest.md`;

describe("external adapter SDK demo", () => {
  it("emits a definition-only adapter authoring packet", async () => {
    const proc = Bun.spawn([process.execPath, "run", "./examples/external-adapter-sdk/run.ts"], {
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
    expect(stdout).toContain("# External Adapter SDK Example");
    expect(stdout).toContain("Wrote: examples/external-adapter-sdk/output/latest.md");

    const output = await Bun.file(outputJsonPath).json();
    expect(output).toMatchObject({
      schemaVersion: "handshake.demo.external-adapter-sdk.v1",
      command: "npm run demo:adapter-sdk",
      installedPackageImport: "handshake-protocol-kernel/adapter-sdk",
      adapterPackId: "adapter_pack_example_issue_tracker_ticket_create",
      actionFamily: "issue_tracker.ticket_create",
      protectedSurfaceKind: "issue_tracker_api",
      runtimeIngressBindingStatus: "definition_only",
      protectedPathBindingStatus: "definition_only",
      definitionReport: {
        status: "ready_for_source_review",
        issueCodes: [],
      },
      refusedProposalReport: {
        status: "valid_proposal_shape",
        proposalStatus: "refused",
        compiledRecordsIncluded: false,
        refusalReasonCodes: [
          "external_adapter_scope_not_source_reviewed",
          "external_adapter_gateway_binding_not_source_owned",
        ],
      },
      readyProposalReport: {
        status: "valid_proposal_shape",
        proposalStatus: "ready_to_install",
        compiledRecordsIncluded: true,
        refusalReasonCodes: [],
      },
      exampleAudit: {
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        receiptExportCreated: false,
        providerCustodyClaimed: false,
        marketplaceCertificationClaimed: false,
      },
    });
    expect(output.nonClaims).toEqual(
      expect.arrayContaining([
        "adapter_sdk_does_not_create_authority",
        "adapter_sdk_does_not_evaluate_policy",
        "adapter_sdk_does_not_create_greenlights",
        "adapter_sdk_does_not_perform_gateway_checks",
        "adapter_sdk_does_not_attempt_mutations",
        "adapter_sdk_does_not_export_receipts",
        "adapter_sdk_does_not_hold_provider_custody",
        "adapter_sdk_does_not_certify_adapters",
        "adapter_sdk_does_not_register_marketplace_listings",
        "adapter_sdk_runtime_ingress_binding_is_source_owned",
      ]),
    );
    expect(output.proofGaps).toEqual([
      "runtime_ingress_not_registered_by_adapter_sdk",
      "gateway_binding_not_created_by_adapter_sdk",
      "conformance_fixture_execution_not_included_in_authoring_demo",
    ]);

    const serialized = JSON.stringify(output);
    expect(serialized).not.toContain("PaymentPayload");
    expect(serialized).not.toContain("PAYMENT-SIGNATURE");
    expect(serialized).not.toContain("privateKey");
    expect(serialized).not.toContain("HandshakeKernel");

    const markdown = await Bun.file(outputMarkdownPath).text();
    expect(markdown).toContain("## Authority Boundary");
    expect(markdown).toContain("Gateway check performed: `false`");
    expect(markdown).toContain("Marketplace certification claimed: `false`");

    const demoSource = await Bun.file(`${repoRoot}/examples/external-adapter-sdk/run.ts`).text();
    expect(demoSource).toContain("../../src/adapter-sdk");
    expect(demoSource).not.toContain("HandshakeClient");
    expect(demoSource).not.toContain("HandshakeKernel");
    expect(demoSource).not.toContain("proposeRuntimeIngressActionContracts");
    expect(demoSource).not.toMatch(/run[A-Z].*Gateway/);

    const readme = await Bun.file(`${repoRoot}/README.md`).text();
    expect(readme).toContain("npm run demo:adapter-sdk");
    expect(readme).toContain("examples/external-adapter-sdk/output/latest.md");
    expect(readme).toContain("not policy evaluation");
    expect(readme).toContain("not gateway check");
    expect(readme).toContain("not mutation");
  });
});
