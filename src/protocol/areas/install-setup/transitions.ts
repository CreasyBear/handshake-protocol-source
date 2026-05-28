import {
  InstallProposalSchema,
  type InstallProposal,
  type InstallProposalCompiledKernelRecords,
} from "../../../install";
import type { EventDescriptor } from "../../events/chains";
import type { ProtocolRecorder } from "../../events/records";
import { HandshakeProtocolError } from "../../foundation/errors";
import { createId, nowIso } from "../../foundation/ids";
import type { ProtocolStore } from "../../store/port";
import { guardCatalogRegistration } from "../catalog-envelope";
import type { ProtocolRecord } from "../object-registry";
import { RefusalSchema, type Refusal } from "../refusal";
import { InstallSetupResultSchema, type InstallSetupResult } from "./types";

const installSetupAuthorityBoundary = {
  authorityCreated: false,
  authorityCertificateMinted: false,
  credentialMaterialIncluded: false,
  gatewayCheckPerformed: false,
  greenlightCreated: false,
  mutationAttempted: false,
  mutationCommandIncluded: false,
  rawInternalRecordIncluded: false,
  receiptExportCreated: false,
} as const;

export async function registerInstallProposalCompiledRecords(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: unknown,
): Promise<InstallSetupResult> {
  const proposal = InstallProposalSchema.parse(inputValue);
  if (proposal.status !== "ready_to_install" || proposal.compiledRecords === null) {
    return recordInstallProposalRefusal(recorder, proposal);
  }
  if (!proposal.compiledRecords.gatewayRegistryEntry) {
    return recordInstallProposalRefusal(recorder, {
      ...proposal,
      refusalReasonCodes: ["install_orphan_catalog_missing_gateway"],
    });
  }

  const records = installProposalCatalogRecords(proposal.compiledRecords);
  for (const record of records) {
    const guard = guardCatalogRegistration(record);
    if (!guard.ok) throw new HandshakeProtocolError(guard.code, guard.message, guard.status);
  }
  await assertNoCatalogDigestConflict(store, recorder, records);
  await recorder.commitRecordsWithEvents(records, [installRegisteredEvent(proposal)], {
    recordConflictMode: "absent_or_same",
  });
  return InstallSetupResultSchema.parse({
    ...installSetupAuthorityBoundary,
    outcome: "compiled_records_registered",
    commitAtomicity: "server_store_commit",
    installProposalId: proposal.installProposalId,
    installDigest: proposal.installDigest,
    adapterPackId: proposal.adapterPackId,
    adapterPackVersion: proposal.adapterPackVersion,
    actionFamily: proposal.actionFamily,
    protectedSurfaceKind: proposal.protectedSurfaceKind,
    records: proposal.compiledRecords,
    recordRefs: recordRefsFor(proposal.compiledRecords),
    refusal: null,
  });
}

async function recordInstallProposalRefusal(
  recorder: ProtocolRecorder,
  proposal: InstallProposal,
): Promise<InstallSetupResult> {
  const refusedAt = nowIso();
  const refusal = RefusalSchema.parse({
    schemaVersion: proposal.schemaVersion,
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    createdAt: refusedAt,
    refusalId: createId("ref"),
    phase: "transition",
    actionContractId: null,
    policyDecisionId: null,
    greenlightId: null,
    gateAttemptId: null,
    refusedObjectRef: proposal.installProposalId,
    reasonCode: proposal.refusalReasonCodes[0] ?? "install_proposal_refused",
    reason: `Install proposal ${proposal.installProposalId} did not include ready compiled records.`,
    mutationAttempted: false,
    authorityCreated: false,
    evidenceRefs: [proposal.installDigest],
    refusedAt,
  });
  await recorder.commitRecordsWithEvents(
    [{ objectType: "refusal", payload: refusal }],
    [installRefusedEvent(proposal, refusal)],
  );
  return InstallSetupResultSchema.parse({
    ...installSetupAuthorityBoundary,
    outcome: "install_proposal_refused",
    commitAtomicity: "server_store_commit",
    installProposalId: proposal.installProposalId,
    installDigest: proposal.installDigest,
    adapterPackId: proposal.adapterPackId,
    adapterPackVersion: proposal.adapterPackVersion,
    actionFamily: proposal.actionFamily,
    protectedSurfaceKind: proposal.protectedSurfaceKind,
    reasonCodes: proposal.refusalReasonCodes,
    records: null,
    recordRefs: null,
    refusal,
  });
}

function installProposalCatalogRecords(records: InstallProposalCompiledKernelRecords): ProtocolRecord[] {
  if (!records.gatewayRegistryEntry) {
    throw new HandshakeProtocolError(
      "install_orphan_catalog_missing_gateway",
      "Install setup requires gateway registry entry in compiled catalog triplet.",
      422,
    );
  }
  return [
    { objectType: "tool_capability", payload: records.toolCapability },
    { objectType: "action_type", payload: records.actionType },
    { objectType: "gateway_registry_entry", payload: records.gatewayRegistryEntry },
    { objectType: "operating_envelope", payload: records.operatingEnvelope },
  ];
}

async function assertNoCatalogDigestConflict(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  records: ProtocolRecord[],
): Promise<void> {
  for (const record of records) {
    const nextRecord = await recorder.buildRecord(record);
    const existing = await store.getRecord(record.objectType, nextRecord.objectId);
    if (existing && existing.canonicalDigest !== nextRecord.canonicalDigest) {
      throw new HandshakeProtocolError(
        "bootstrap_record_digest_conflict",
        "Install setup cannot replace existing catalog or envelope records with a different canonical digest.",
        409,
      );
    }
  }
}

function installRegisteredEvent(proposal: InstallProposal): EventDescriptor {
  const records = proposal.compiledRecords;
  if (!records) throw new Error("install registered event requires compiled records");
  return {
    source: proposal,
    eventType: "install_setup_recorded",
    objectRefs: [proposal.installProposalId, proposal.installDigest, ...Object.values(recordRefsFor(records))],
    payload: {
      installProposalId: proposal.installProposalId,
      installDigest: proposal.installDigest,
      adapterPackId: proposal.adapterPackId,
      actionFamily: proposal.actionFamily,
      protectedSurfaceKind: proposal.protectedSurfaceKind,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    },
  };
}

function installRefusedEvent(proposal: InstallProposal, refusal: Refusal): EventDescriptor {
  return {
    source: refusal,
    eventType: "install_setup_refused",
    objectRefs: [refusal.refusalId, proposal.installProposalId, proposal.installDigest],
    payload: {
      installProposalId: proposal.installProposalId,
      installDigest: proposal.installDigest,
      adapterPackId: proposal.adapterPackId,
      actionFamily: proposal.actionFamily,
      protectedSurfaceKind: proposal.protectedSurfaceKind,
      reasonCode: refusal.reasonCode,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    },
  };
}

function recordRefsFor(records: InstallProposalCompiledKernelRecords) {
  const gatewayRegistryEntryId = records.gatewayRegistryEntry?.gatewayRegistryEntryId;
  if (!gatewayRegistryEntryId) {
    throw new Error("record refs require gateway registry entry");
  }
  return {
    toolCapabilityId: records.toolCapability.toolCapabilityId,
    actionTypeId: records.actionType.actionTypeId,
    gatewayRegistryEntryId,
    operatingEnvelopeId: records.operatingEnvelope.envelopeId,
  };
}
