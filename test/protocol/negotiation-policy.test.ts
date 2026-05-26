import { describe, expect, it } from "bun:test";
import { ProtocolRecorder } from "../../src/protocol/events/records";
import { makeKernelFixture, registerFixtureObjects } from "../support/fixtures";
import {
  agreementBindingForContract,
  agreementStatusTransition,
  alternateNegotiationDigest,
  createNegotiatedPackageContract,
  linkedAgreement,
  negotiationDecision,
  negotiationOffer,
  negotiationSession,
  recordAcceptedAgreement,
} from "../support/negotiation-fixtures";

describe("policy evaluation for agreement-backed obligations", () => {
  it("records a proof gap when an ActionContract declares an obligation without exact binding evidence", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("proof_gap");
    expect(policy.proofGapReasonCode).toBe("agreement_obligation_binding_missing");
    expect(policy.greenlight).toBeNull();
    expect(policy.authorityCreated).toBe(false);
  });

  it("allows normal policy greenlight only after an active agreement obligation is exact-bound", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await recordAcceptedAgreement(fixture.kernel);
    await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("greenlight");
    expect(policy.greenlight).toMatchObject({ actionContractId: contract.actionContractId, maxUses: 1 });
    expect(policy.authorityCreated).toBe(true);
    expect(policy.gatewayCheckPerformed).toBe(false);
    expect(policy.mutationAttempted).toBe(false);
  });

  it("refuses agreement-backed policy while current isolation is active", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await recordAcceptedAgreement(fixture.kernel);
    await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));
    await fixture.kernel.createIsolationState({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      scopeType: "agent",
      scopeId: "agent_demo",
      state: "quarantined",
      reasonCode: "breaker_trip",
      reasonSummary: "Agent cannot receive fresh agreement-backed authority.",
      sourceDecisionRef: "breaker:a2a-policy",
    });

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("quarantine");
    expect(policy.decision.decisionReasonCode).toBe("isolation_quarantined");
    expect(policy.greenlight).toBeNull();
  });

  it.each([
    ["withdrawn", "agreement_withdrawn"],
    ["disputed", "agreement_disputed"],
    ["superseded", "agreement_superseded"],
    ["expired", "agreement_expired"],
  ] as const)("refuses %s agreement-backed contracts before greenlight", async (toStatus, reasonCode) => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await recordAcceptedAgreement(fixture.kernel);
    await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));
    await fixture.kernel.transitionAgreementStatus(
      agreementStatusTransition({ toStatus, reasonCodes: [`agreement_${toStatus}`] }),
    );

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe(reasonCode);
    expect(policy.greenlight).toBeNull();
    expect(policy.authorityCreated).toBe(false);
  });

  it("refuses agreement-backed contracts whose binding params digest drifted", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await recordAcceptedAgreement(fixture.kernel);
    const binding = await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));
    const recorder = new ProtocolRecorder(fixture.store);
    await fixture.store.putRecord(
      await recorder.buildRecord({
        objectType: "agreement_obligation_binding",
        payload: {
          ...binding,
          paramsDigest: alternateNegotiationDigest,
        },
      }),
    );

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("agreement_obligation_params_mismatch");
    expect(policy.greenlight).toBeNull();
  });

  it("records duplicate-authority refusal when an agreement-backed greenlight is replayed", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await recordAcceptedAgreement(fixture.kernel);
    await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));
    const first = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    const replay = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(first.decision.decision).toBe("greenlight");
    expect(replay.decision.decision).toBe("refuse");
    expect(replay.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");
    expect(replay.greenlight).toBeNull();
  });

  it("refuses already-expired linked agreements even when no status transition was recorded", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await fixture.kernel.recordNegotiationSession(negotiationSession());
    await fixture.kernel.recordNegotiationOffer(negotiationOffer());
    await fixture.kernel.recordNegotiationDecision(negotiationDecision());
    await fixture.kernel.recordLinkedAgreement(linkedAgreement({ expiresAt: "2026-01-01T00:00:00.000Z" }));
    await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("agreement_expired");
    expect(policy.greenlight).toBeNull();
  });

  it.each([
    ["negotiation_session", "negotiation_session_expired"],
    ["negotiation_offer", "negotiation_offer_expired"],
  ] as const)("refuses stale %s evidence at policy evaluation", async (objectType, reasonCode) => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    const agreement = await recordAcceptedAgreement(fixture.kernel);
    await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));
    const recorder = new ProtocolRecorder(fixture.store);
    if (objectType === "negotiation_session") {
      await fixture.store.putRecord(
        await recorder.buildRecord({
          objectType,
          payload: { ...agreement.session, expiresAt: "2026-01-01T00:00:00.000Z" },
        }),
      );
    } else {
      await fixture.store.putRecord(
        await recorder.buildRecord({
          objectType,
          payload: { ...agreement.offer, expiresAt: "2026-01-01T00:00:00.000Z" },
        }),
      );
    }

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe(reasonCode);
    expect(policy.greenlight).toBeNull();
  });
});
