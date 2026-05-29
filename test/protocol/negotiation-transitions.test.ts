import { describe, expect, it } from "bun:test";
import type { ContractStreamEvent } from "../../src/protocol/events/schemas";
import type { ProtocolObjectType } from "../../src/protocol/store/port";
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

describe("negotiation lifecycle transitions", () => {
  it("records accepted agreement evidence without creating authority records", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);

    await recordAcceptedAgreement(fixture.kernel);
    const binding = await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract));

    expect(binding).toMatchObject({
      actionContractId: contract.actionContractId,
      obligationRef: "obligation:a2a-demo",
      counterpartyRef: "agent:seller",
    });
    expect(await countRecords(fixture.store, "policy_decision")).toBe(0);
    expect(await countRecords(fixture.store, "greenlight")).toBe(0);
    expect(await countRecords(fixture.store, "gateway_check_attempt")).toBe(0);
    expect(await countRecords(fixture.store, "mutation_attempt")).toBe(0);
    const events = await fixture.store.listRecordsByType<ContractStreamEvent>("contract_stream_event");
    expect(
      events
        .map((event) => event.payload.eventType)
        .filter((eventType) => eventType.includes("negotiation") || eventType.includes("agreement")),
    ).toEqual([
      "negotiation_session_recorded",
      "negotiation_offer_recorded",
      "negotiation_decision_recorded",
      "linked_agreement_recorded",
      "agreement_obligation_binding_recorded",
    ]);
  });

  it("refuses accepting a stale offer version", async () => {
    const fixture = makeKernelFixture();
    await fixture.kernel.recordNegotiationSession(negotiationSession());
    await fixture.kernel.recordNegotiationOffer(negotiationOffer());
    await fixture.kernel.recordNegotiationOffer(
      negotiationOffer({
        negotiationOfferId: "negotiation_offer_v2",
        offerVersionId: "offer_version_2",
        offerSequence: 2,
        previousOfferVersionId: "offer_version_1",
        supersedesOfferVersionId: "offer_version_1",
        offerContentDigest: alternateNegotiationDigest,
        offerObjectRefs: ["object:offer:v2"],
        offerContentRefs: ["content:offer:v2"],
      }),
    );

    await expect(fixture.kernel.recordNegotiationDecision(negotiationDecision())).rejects.toThrow(
      "Accept decisions must bind the current offer",
    );
  });

  it("refuses expired sessions and offers before agreement evidence can be bound", async () => {
    const fixture = makeKernelFixture();

    await fixture.kernel.recordNegotiationSession(negotiationSession({ expiresAt: "2026-01-01T00:00:00.000Z" }));
    await expect(fixture.kernel.recordNegotiationOffer(negotiationOffer())).rejects.toThrow(
      "Negotiation session expired before offer recording",
    );

    const fresh = makeKernelFixture();
    await fresh.kernel.recordNegotiationSession(negotiationSession());
    await fresh.kernel.recordNegotiationOffer(negotiationOffer({ expiresAt: "2026-01-01T00:00:00.000Z" }));
    await expect(fresh.kernel.recordNegotiationDecision(negotiationDecision())).rejects.toThrow(
      "Negotiation offer expired before decision recording",
    );
  });

  it("refuses negotiation evidence from a different tenant or organization scope", async () => {
    const fixture = makeKernelFixture();
    await fixture.kernel.recordNegotiationSession(negotiationSession());

    await expect(
      fixture.kernel.recordNegotiationOffer(
        negotiationOffer({
          organizationId: "org_other",
        }),
      ),
    ).rejects.toThrow("Negotiation evidence cannot cross tenant or organization scope");
  });

  it("refuses linked agreements that drift from the accepted offer digest", async () => {
    const fixture = makeKernelFixture();
    await fixture.kernel.recordNegotiationSession(negotiationSession());
    await fixture.kernel.recordNegotiationOffer(negotiationOffer());
    await fixture.kernel.recordNegotiationDecision(negotiationDecision());

    await expect(
      fixture.kernel.recordLinkedAgreement(
        linkedAgreement({
          acceptedOfferContentDigest: alternateNegotiationDigest,
        }),
      ),
    ).rejects.toThrow("Linked agreement must pin the accepted offer content digest");
  });

  it("refuses obligation bindings that do not match the exact action contract", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await recordAcceptedAgreement(fixture.kernel);

    await expect(
      fixture.kernel.recordAgreementObligationBinding(
        agreementBindingForContract(contract, {
          paramsDigest: alternateNegotiationDigest,
        }),
      ),
    ).rejects.toThrow("Agreement obligation binding must pin the exact action contract params digest");
  });

  it("refuses reusing one agreement obligation for multiple action contracts", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const firstContract = await createNegotiatedPackageContract(fixture);
    const secondContract = await createNegotiatedPackageContract(fixture, {
      idempotencyKey: "idem_negotiated_package_hono_second",
    });
    await recordAcceptedAgreement(fixture.kernel);
    await fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(firstContract));

    await expect(
      fixture.kernel.recordAgreementObligationBinding(
        agreementBindingForContract(secondContract, {
          agreementObligationBindingId: "agreement_obligation_binding_second",
        }),
      ),
    ).rejects.toThrow("Each linked agreement obligation may bind only one action contract");
  });

  it("tracks agreement lifecycle monotonically before future bindings", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const contract = await createNegotiatedPackageContract(fixture);
    await recordAcceptedAgreement(fixture.kernel);
    await fixture.kernel.transitionAgreementStatus(agreementStatusTransition({ toStatus: "withdrawn" }));

    await expect(
      fixture.kernel.recordAgreementObligationBinding(agreementBindingForContract(contract)),
    ).rejects.toThrow("Only active linked agreements may be bound to an action contract");

    await expect(
      fixture.kernel.transitionAgreementStatus(
        agreementStatusTransition({
          agreementStatusTransitionId: "agreement_status_transition_stale",
          fromStatus: "active",
          toStatus: "disputed",
        }),
      ),
    ).rejects.toThrow("Agreement status transition must start from the current status");
  });
});

async function countRecords(
  store: ReturnType<typeof makeKernelFixture>["store"],
  objectType: ProtocolObjectType,
): Promise<number> {
  return (await store.listRecordsByType(objectType)).length;
}
