import { describe, expect, it } from "bun:test";
import { ContractStreamEventSchema } from "../../src/protocol/events/schemas";

const digest = `sha256:${"a".repeat(64)}`;

const negotiationRecordedEvents = [
  "negotiation_session_recorded",
  "negotiation_offer_recorded",
  "negotiation_decision_recorded",
  "linked_agreement_recorded",
  "agreement_obligation_binding_recorded",
  "agreement_status_transition_recorded",
] as const;

const authorityShapedEventNames = [
  "negotiation_authorized",
  "negotiation_greenlit",
  "negotiation_session_opened",
  "agreement_obligation_bound",
  "agreement_status_changed",
  "agreement_executed",
  "agreement_settled",
  "agreement_certified",
] as const;

describe("negotiation stream events", () => {
  it("accepts recorded-only negotiation events", () => {
    for (const eventType of negotiationRecordedEvents) {
      expect(ContractStreamEventSchema.parse(validEvent(eventType))).toMatchObject({
        eventType,
        streamScope: "run",
        objectRefs: ["negotiation_session:negotiation_session_demo"],
      });
    }
  });

  it("rejects authority-shaped negotiation events", () => {
    for (const eventType of authorityShapedEventNames) {
      expect(ContractStreamEventSchema.safeParse(validEvent(eventType)).success).toBe(false);
    }
  });

  it("keeps the existing stream scopes unchanged for this schema-only phase", () => {
    const streamScopeOptions = ContractStreamEventSchema.shape.streamScope.options;

    expect([...streamScopeOptions].sort()).toEqual(["organization", "protected_surface_resource", "run", "tenant"]);
  });
});

function validEvent(eventType: string) {
  return {
    schemaVersion: "0.2.4",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: "2026-05-26T00:00:00.000Z",
    streamEventId: `event:${eventType}`,
    streamId: "stream:negotiation-demo",
    streamScope: "run",
    offset: 0,
    partitionKey: "tenant_demo:run_demo",
    eventType,
    eventTime: "2026-05-26T00:00:00.000Z",
    producerRef: "protocol:negotiation-test",
    objectRefs: ["negotiation_session:negotiation_session_demo"],
    previousEventDigest: null,
    eventDigest: digest,
    payload: {
      negotiationSessionId: "negotiation_session_demo",
      evidencePosture: "recorded_only",
    },
  };
}
