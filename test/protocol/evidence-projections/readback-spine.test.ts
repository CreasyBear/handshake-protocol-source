import { describe, expect, it } from "bun:test";
import { evidenceOperationReadbackCliView, OPERATION_READBACK_STAGE_ORDER } from "../../../src/cli/evidence/operation-readback-view";
import { evidenceReadRouteDefinitions } from "../../../src/http/routes/evidence-read-route-registry";
import {
  assembleAgentTransactionEnvelope,
  projectOperationCorrelationIndex,
  projectOperationReadback,
} from "../../../src/protocol/evidence-projections";
import {
  OperationCorrelationIndexSchema,
  OperationReadbackProjectionSchema,
  OperationReadbackStageSchema,
} from "../../../src/protocol/evidence-projections/schemas";
import type { HandshakeFetch } from "../../../src/sdk/client";
import { EvidenceClient } from "../../../src/sdk/surface-clients/evidence-client";
import { createGreenlitContract } from "../../support/fixtures";
import { sampleOperationReadbackProjection } from "../../support/operation-readback-fixture";

describe("operation readback spine (05-08)", () => {
  it("includes compilation stages before action_contract in stage order (D-57)", () => {
    const stages = OperationReadbackStageSchema.options;
    expect(stages.indexOf("intent_compilation")).toBeLessThan(stages.indexOf("action_contract"));
    expect(stages.indexOf("candidate_action")).toBeLessThan(stages.indexOf("action_contract"));
    expect([...OPERATION_READBACK_STAGE_ORDER]).toEqual(stages);
  });

  it("keeps readback authority flags non-creating (D-57)", () => {
    const projection = sampleOperationReadbackProjection();
    expect(OperationReadbackProjectionSchema.parse(projection)).toMatchObject({
      authorityCreatedByReadback: false,
      greenlightCreatedByReadback: false,
      gatewayCheckPerformedByReadback: false,
      mutationAttemptedByReadback: false,
      receiptExportCreatedByReadback: false,
    });
  });

  it("aligns correlation index refs with readback assembly (D-58)", async () => {
    const fixture = await createGreenlitContract();
    const assembly = await assembleAgentTransactionEnvelope(fixture.store, fixture.contract);
    const readback = await projectOperationReadback(assembly.input);
    const correlation = projectOperationCorrelationIndex(assembly.input);

    expect(OperationCorrelationIndexSchema.parse(correlation)).toMatchObject({
      authorityCreatedByProjection: false,
      greenlightCreatedByReadback: false,
      gatewayCheckPerformedByReadback: false,
      mutationAttemptedByReadback: false,
    });
    expect(correlation.actionContractRef).toBe(fixture.contract.actionContractId);
    expect(correlation.policyDecisionRef).toBe(readback.policyDecisionRef);
    expect(correlation.greenlightRef).toBe(readback.greenlightRef);
    expect(correlation.gateAttemptRef).toBe(readback.gateAttemptRef);
    expect(correlation.receiptRef).toBe(readback.receiptRef);
    expect(correlation.intentCompilationRef).toBe(fixture.contract.intentCompilationId);
    expect(correlation.candidateActionRef).toBe(fixture.contract.candidateActionId);
  });

  it("registers readback and correlation GET routes with evidence read roles (D-58)", () => {
    const readback = evidenceReadRouteDefinitions.find((row) => row.routeId === "getOperationReadbackProjection");
    const correlation = evidenceReadRouteDefinitions.find((row) => row.routeId === "getOperationCorrelationIndex");
    expect(readback?.honoPath).toBe("/v0.2/evidence/operations/:actionContractId/readback");
    expect(correlation?.honoPath).toBe("/v0.2/evidence/operations/:actionContractId/correlation");
    expect(readback?.roles).toEqual(correlation?.roles);
  });

  it("uses canonical /correlation suffix on EvidenceClient (D-58)", async () => {
    const calls: string[] = [];
    const original = globalThis.fetch;
    const mockFetch: HandshakeFetch = async (input) => {
      calls.push(String(input));
      return new Response(
        JSON.stringify(
          OperationCorrelationIndexSchema.parse({
            schemaVersion: "handshake.operation-correlation.v0.1",
            actionContractRef: "act_corr_demo",
            sourceAuthority: "protocol_store_projection",
            authorityCreatedByProjection: false,
            greenlightCreatedByReadback: false,
            gatewayCheckPerformedByReadback: false,
            mutationAttemptedByReadback: false,
            intentCompilationRef: null,
            candidateActionRef: null,
            policyDecisionRef: "policy_demo",
            greenlightRef: null,
            gateAttemptRef: null,
            mutationAttemptRef: null,
            receiptRef: null,
            proofGapRefs: [],
            refusalRefs: [],
            recoveryRefs: [],
            isolationRefs: [],
            authorityCertificateRefs: [],
            redactionProfileRef: "operation-correlation:v0.1-redacted",
            omittedFields: [],
          }),
        ),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    globalThis.fetch = mockFetch as typeof fetch;
    try {
      const client = new EvidenceClient("https://handshake.example", {
        roleCredential: "review-token",
        readRole: "review_custody",
      });
      await client.getOperationCorrelationIndex("act_corr_demo");
      expect(calls).toEqual([
        "https://handshake.example/v0.2/evidence/operations/act_corr_demo/correlation",
      ]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("does not claim greenlight issuance in CLI readback view copy", () => {
    const view = evidenceOperationReadbackCliView(sampleOperationReadbackProjection());
    const serialized = JSON.stringify(view);
    expect(serialized.toLowerCase()).not.toContain("greenlight issued");
    expect(view.nonClaims).toContain("Readback does not issue greenlights");
    expect(view.stageOrder).toContain("intent_compilation");
    expect(view.stageOrder).toContain("candidate_action");
  });
});
