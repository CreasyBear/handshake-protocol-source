import { describe, expect, it } from "bun:test";
import { buildRefusal } from "../../src/protocol/areas/refusal";
import { ProtocolRecorder } from "../../src/protocol/events/records";
import { PROTOCOL_VERSION, RefusalSchema, type Refusal } from "../../src/protocol/public/schemas";
import { InMemoryProtocolStore } from "../../src/storage/memory";

describe("refusal format", () => {
  it("represents compiler refusal before any action contract exists", () => {
    const refusal = RefusalSchema.parse({
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: "2026-05-19T00:00:00.000Z",
      refusalId: "ref_compilation_dynamic_tool",
      phase: "compilation",
      actionContractId: null,
      policyDecisionId: null,
      greenlightId: null,
      gateAttemptId: null,
      refusedObjectRef: "runtime_execution:run_demo",
      reasonCode: "dynamic_tool_construction",
      reason: "Generated execution constructed a consequential tool name dynamically.",
      mutationAttempted: false,
      authorityCreated: false,
      evidenceRefs: ["evidence:generated-graph"],
      refusedAt: "2026-05-19T00:00:00.000Z",
    });

    expect(refusal.actionContractId).toBeNull();
    expect(refusal.mutationAttempted).toBe(false);
    expect(refusal.authorityCreated).toBe(false);
  });

  it("represents policy refusal without minting a greenlight", () => {
    const refusal = RefusalSchema.parse({
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: "2026-05-19T00:00:00.000Z",
      refusalId: "ref_policy_resource_scope",
      phase: "policy",
      actionContractId: "act_demo",
      policyDecisionId: "pol_demo",
      greenlightId: null,
      gateAttemptId: null,
      refusedObjectRef: "policy_decision:pol_demo",
      reasonCode: "resource_not_allowed",
      reason: "The exact action contract targeted a resource outside the operating envelope.",
      mutationAttempted: false,
      authorityCreated: false,
      evidenceRefs: ["policy_input:sha256-demo"],
      refusedAt: "2026-05-19T00:00:00.000Z",
    });

    expect(refusal.policyDecisionId).toBe("pol_demo");
    expect(refusal.greenlightId).toBeNull();
  });

  it("represents gateway refusal before mutation", () => {
    const refusal = RefusalSchema.parse({
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: "2026-05-19T00:00:00.000Z",
      refusalId: "ref_gateway_params",
      phase: "gateway",
      actionContractId: "act_demo",
      policyDecisionId: "pol_demo",
      greenlightId: "grn_demo",
      gateAttemptId: "gate_demo",
      refusedObjectRef: "gateway_check_attempt:gate_demo",
      reasonCode: "params_mismatch",
      reason: "Gateway observed parameters that did not match the exact action contract.",
      mutationAttempted: false,
      authorityCreated: false,
      evidenceRefs: ["gate_attempt:gate_demo"],
      refusedAt: "2026-05-19T00:00:00.000Z",
    });

    expect(refusal.gateAttemptId).toBe("gate_demo");
    expect(refusal.mutationAttempted).toBe(false);
  });

  it("persists refusal as a first-class protocol object", async () => {
    const store = new InMemoryProtocolStore();
    const recorder = new ProtocolRecorder(store);
    const refusal = await buildRefusal({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: "2026-05-19T00:00:00.000Z",
      phase: "gateway",
      actionContractId: "act_demo",
      policyDecisionId: "pol_demo",
      greenlightId: "grn_demo",
      gateAttemptId: "gat_demo",
      refusedObjectRef: "gateway_check_attempt:gat_demo",
      reasonCode: "already_consumed",
      reason: "Gateway refused a replayed greenlight before mutation.",
      evidenceRefs: ["greenlight:grn_demo", "gateway_check_attempt:gat_demo"],
      refusedAt: "2026-05-19T00:00:00.000Z",
    });

    await recorder.persistRecord({ objectType: "refusal", payload: refusal });

    const records = await store.listRecordsByType<Refusal>("refusal");
    expect(records).toHaveLength(1);
    expect(records[0]?.objectId).toBe(refusal.refusalId);
    expect(records[0]?.payload).toMatchObject({
      refusalId: refusal.refusalId,
      phase: "gateway",
      gateAttemptId: "gat_demo",
      mutationAttempted: false,
      authorityCreated: false,
    });
  });

  it("derives stable refusal ids from denial context", async () => {
    const input = {
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: "2026-05-19T00:00:00.000Z",
      phase: "policy" as const,
      actionContractId: "act_demo",
      policyDecisionId: "pol_demo",
      greenlightId: null,
      gateAttemptId: null,
      refusedObjectRef: "policy_decision:pol_demo",
      reasonCode: "resource_outside_envelope",
      reason: "Policy refused an action outside the operating envelope.",
      evidenceRefs: ["policy_decision:pol_demo"],
      refusedAt: "2026-05-19T00:00:00.000Z",
    };

    const first = await buildRefusal(input);
    const second = await buildRefusal(input);

    expect(first.refusalId).toBe(second.refusalId);
  });
});
