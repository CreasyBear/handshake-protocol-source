import { describe, expect, it } from "bun:test";
import { OPERATION_LIFECYCLE_MATRIX, operationLifecycleFor } from "../../src/protocol/areas/operation-lifecycle";

describe("operation lifecycle matrix", () => {
  it("covers every downstream observation branch with claim, receipt, finality, and proof-gap behavior", () => {
    expect(Object.keys(OPERATION_LIFECYCLE_MATRIX).sort()).toEqual([
      "failed",
      "pending",
      "refused",
      "succeeded",
      "unknown",
    ]);

    expect(operationLifecycleFor("pending")).toMatchObject({
      reconciliationStatus: "pending",
      finalityStatus: "pending",
      claimState: "active",
      receiptDownstreamExecutionStatus: "pending",
      proofGapReasonCode: null,
      keepClaimBlocking: true,
    });
    expect(operationLifecycleFor("succeeded")).toMatchObject({
      reconciliationStatus: "resolved",
      finalityStatus: "final",
      claimState: "terminal_succeeded",
      receiptDownstreamExecutionStatus: "succeeded",
      proofGapReasonCode: null,
      keepClaimBlocking: false,
    });
    expect(operationLifecycleFor("refused")).toMatchObject({
      reconciliationStatus: "resolved",
      finalityStatus: "suspect",
      claimState: "terminal_refused",
      receiptDownstreamExecutionStatus: "refused",
      proofGapReasonCode: null,
      keepClaimBlocking: false,
    });
    expect(operationLifecycleFor("failed")).toMatchObject({
      reconciliationStatus: "failed",
      finalityStatus: "suspect",
      claimState: "terminal_failed",
      receiptDownstreamExecutionStatus: "failed",
      proofGapReasonCode: null,
      keepClaimBlocking: false,
    });
    expect(operationLifecycleFor("unknown")).toMatchObject({
      reconciliationStatus: "still_unknown",
      finalityStatus: "unknown",
      claimState: "terminal_unknown",
      receiptDownstreamExecutionStatus: "unknown",
      proofGapReasonCode: "orphan_mitigation_required",
      keepClaimBlocking: true,
      createIsolation: true,
    });
  });
});
