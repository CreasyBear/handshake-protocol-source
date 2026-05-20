import { projectAgentTransactionEnvelope } from "../../evidence-projections/projections";
import { CANONICALIZER_VERSION } from "../../foundation/canonical";
import { HandshakeProtocolError } from "../../foundation/errors";
import { createId, nowIso } from "../../foundation/ids";
import type { ProtocolRecorder } from "../../events/records";
import { actionLifecycleStreamRefs } from "../../events/chains";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import type { ActionContract } from "../action-contract";
import type { GatewayCheckAttempt, MutationAttempt } from "../gateway-gate";
import type { PolicyDecision, Greenlight } from "../policy-greenlight";
import type { ProofGap } from "../proof-gap";
import { protocolObjectRef, type Refusal } from "../refusal";
import type { Receipt } from "../receipt-export";
import {
  authorityCertificateSigningInputDigest,
  buildAuthorityCertificateSigningInput,
  signAuthorityCertificateSigningInput,
} from "./signing";
import {
  AuthorityCertificateSchema,
  CreateAuthorityCertificateInputSchema,
  PROTOCOL_VERSION,
  type AuthorityCertificate,
  type AuthorityCertificateArtifact,
  type AuthorityCertificateArtifactKind,
  type CreateAuthorityCertificateInput,
  type AuthorityCertificateSignerRole,
  type AuthorityCertificateTerminalKind,
} from "./types";

type ParsedCreateAuthorityCertificateInput = ReturnType<typeof CreateAuthorityCertificateInputSchema.parse>;

type CertificateTerminalContext = {
  terminalKind: AuthorityCertificateTerminalKind;
  terminalObjectRef: string;
  terminalizedAt: string;
  contractRecord: StoredProtocolRecord<ActionContract>;
  policyDecisionRecord: StoredProtocolRecord<PolicyDecision>;
  greenlightRecord: StoredProtocolRecord<Greenlight> | null;
  gateAttemptRecord: StoredProtocolRecord<GatewayCheckAttempt> | null;
  mutationAttemptRecord: StoredProtocolRecord<MutationAttempt> | null;
  receiptRecord: StoredProtocolRecord<Receipt> | null;
  proofGapRecords: StoredProtocolRecord<ProofGap>[];
  refusalRecords: StoredProtocolRecord<Refusal>[];
  terminalRecord: StoredProtocolRecord;
};

export async function createAuthorityCertificate(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: CreateAuthorityCertificateInput,
): Promise<AuthorityCertificate> {
  const input = CreateAuthorityCertificateInputSchema.parse(inputValue);
  const context = await loadTerminalContext(store, recorder, input);
  const certificate = await buildAuthorityCertificate(context, input);
  await recorder.commitRecordsWithEvents(
    [{ objectType: "authority_certificate", payload: certificate }],
    [
      {
        source: certificate,
        eventType: "authority_certificate_emitted",
        objectRefs: [
          certificate.authorityCertificateId,
          certificate.terminal.terminalObjectRef,
          certificate.terminal.actionContractId,
        ],
        streamRefs: actionLifecycleStreamRefs(context.contractRecord.payload),
        payload: {
          terminalKind: certificate.terminal.terminalKind,
          signingInputDigest: certificate.signingInputDigest,
        },
      },
    ],
  );
  return certificate;
}

async function buildAuthorityCertificate(
  context: CertificateTerminalContext,
  input: ParsedCreateAuthorityCertificateInput,
): Promise<AuthorityCertificate> {
  const contract = context.contractRecord.payload;
  const receipt = context.receiptRecord?.payload ?? null;
  const envelope = await projectAgentTransactionEnvelope({
    contract,
    policyDecision: context.policyDecisionRecord.payload,
    greenlight: context.greenlightRecord?.payload ?? null,
    gateAttempt: context.gateAttemptRecord?.payload ?? null,
    mutationAttempt: context.mutationAttemptRecord?.payload ?? null,
    receipt,
    proofGaps: context.proofGapRecords.map((record) => record.payload),
    refusals: context.refusalRecords.map((record) => record.payload),
    ledger: null,
  });
  const artifacts = artifactsForContext(context);
  const gatewayAdmissionRequired = Boolean(context.gateAttemptRecord);
  const certificateSeed = {
    schemaVersion: PROTOCOL_VERSION as typeof PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt: nowIso(),
    authorityCertificateId: createId("cert"),
    authorityCertificateVersion: "1.0.0" as const,
    canonicalizerVersion: CANONICALIZER_VERSION,
    terminalizedAt: context.terminalizedAt,
    terminal: {
      terminalKind: context.terminalKind,
      terminalObjectRef: context.terminalObjectRef,
      actionContractId: contract.actionContractId,
      policyDecisionId: context.policyDecisionRecord.payload.policyDecisionId,
      greenlightId: context.greenlightRecord?.payload.greenlightId ?? null,
      gatewayId: contract.gatewayId,
    },
    envelope,
    envelopeDigest: envelope.envelopeDigest,
    artifacts,
    verificationPolicy: {
      verificationPolicyId: `authority-cert:${context.terminalKind}:v1`,
      terminalKind: context.terminalKind,
      actionClass: contract.actionClass,
      gatewayAdmissionRequired,
      requiredSignerRoles: requiredSignerRoles(gatewayAdmissionRequired),
      requiredArtifactKinds: requiredArtifactKinds(artifacts),
    },
    signatures: [],
    consumerBindings: input.consumerBindings,
    extensions: input.extensions,
    emittedAt: nowIso(),
    signingInputDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000" as const,
  };
  const signingInputDigest = await authorityCertificateSigningInputDigest(certificateSeed);
  const signingInput = buildAuthorityCertificateSigningInput(certificateSeed);
  const signatures = await Promise.all(
    input.signers.map((signer) => signAuthorityCertificateSigningInput(signingInput, signingInputDigest, signer)),
  );
  return AuthorityCertificateSchema.parse({
    ...certificateSeed,
    signatures,
    signingInputDigest,
  });
}

async function loadTerminalContext(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  input: ParsedCreateAuthorityCertificateInput,
): Promise<CertificateTerminalContext> {
  const terminalRef = parseTerminalObjectRef(input.terminalObjectRef);
  if (terminalRef.objectType === "receipt") {
    const receiptRecord = await recorder.requiredRecord<Receipt>("receipt", terminalRef.objectId, "receipt_missing");
    return loadReceiptTerminalContext(store, recorder, receiptRecord);
  }
  if (terminalRef.objectType === "refusal") {
    const refusalRecord = await recorder.requiredRecord<Refusal>("refusal", terminalRef.objectId, "refusal_missing");
    return loadRefusalTerminalContext(store, recorder, refusalRecord);
  }
  if (terminalRef.objectType === "proof_gap") {
    const proofGapRecord = await recorder.requiredRecord<ProofGap>(
      "proof_gap",
      terminalRef.objectId,
      "proof_gap_missing",
    );
    return loadProofGapTerminalContext(store, recorder, proofGapRecord);
  }
  throw new HandshakeProtocolError(
    "invalid_authority_certificate_terminal",
    "AuthorityCertificate may be minted only for receipt, refusal, proof_gap, or replay receipt terminals.",
    409,
  );
}

async function loadReceiptTerminalContext(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  receiptRecord: StoredProtocolRecord<Receipt>,
): Promise<CertificateTerminalContext> {
  const receipt = receiptRecord.payload;
  const contractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    receipt.actionContractId,
    "contract_missing",
  );
  const policyDecisionRecord = await recorder.requiredRecord<PolicyDecision>(
    "policy_decision",
    receipt.policyDecisionId,
    "policy_decision_missing",
  );
  const greenlightRecord = receipt.greenlightId
    ? await recorder.requiredRecord<Greenlight>("greenlight", receipt.greenlightId, "greenlight_missing")
    : null;
  const gateAttemptRecord = receipt.gateAttemptId
    ? await recorder.requiredRecord<GatewayCheckAttempt>(
        "gateway_check_attempt",
        receipt.gateAttemptId,
        "gateway_check_attempt_missing",
      )
    : null;
  const mutationAttemptRecord = receipt.mutationAttemptId
    ? await recorder.requiredRecord<MutationAttempt>(
        "mutation_attempt",
        receipt.mutationAttemptId,
        "mutation_attempt_missing",
      )
    : null;
  const proofGapRecords = await loadProofGapRecords(recorder, receipt.proofGapIds);
  const refusalRecords = await scopedRefusals(store, contractRecord.payload);
  return {
    terminalKind: receipt.greenlightConsumptionStatus === "replayed" ? "replay_refusal" : "receipt",
    terminalObjectRef: protocolObjectRef("receipt", receipt.receiptId),
    terminalizedAt: receipt.emittedAt,
    contractRecord,
    policyDecisionRecord,
    greenlightRecord,
    gateAttemptRecord,
    mutationAttemptRecord,
    receiptRecord,
    proofGapRecords,
    refusalRecords,
    terminalRecord: receiptRecord,
  };
}

async function loadRefusalTerminalContext(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  refusalRecord: StoredProtocolRecord<Refusal>,
): Promise<CertificateTerminalContext> {
  const refusal = refusalRecord.payload;
  if (!refusal.actionContractId || !refusal.policyDecisionId) {
    throw new HandshakeProtocolError(
      "invalid_authority_certificate_terminal",
      "Durable refusal certificates require an action contract and policy decision.",
      409,
    );
  }
  const contractRecord = await recorder.requiredRecord<ActionContract>(
    "action_contract",
    refusal.actionContractId,
    "contract_missing",
  );
  const policyDecisionRecord = await recorder.requiredRecord<PolicyDecision>(
    "policy_decision",
    refusal.policyDecisionId,
    "policy_decision_missing",
  );
  const greenlightRecord = refusal.greenlightId
    ? await recorder.requiredRecord<Greenlight>("greenlight", refusal.greenlightId, "greenlight_missing")
    : null;
  const gateAttemptRecord = refusal.gateAttemptId
    ? await recorder.requiredRecord<GatewayCheckAttempt>(
        "gateway_check_attempt",
        refusal.gateAttemptId,
        "gateway_check_attempt_missing",
      )
    : null;
  return {
    terminalKind: "durable_refusal",
    terminalObjectRef: protocolObjectRef("refusal", refusal.refusalId),
    terminalizedAt: refusal.refusedAt,
    contractRecord,
    policyDecisionRecord,
    greenlightRecord,
    gateAttemptRecord,
    mutationAttemptRecord: null,
    receiptRecord: null,
    proofGapRecords: [],
    refusalRecords: [refusalRecord],
    terminalRecord: refusalRecord,
  };
}

async function loadProofGapTerminalContext(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  proofGapRecord: StoredProtocolRecord<ProofGap>,
): Promise<CertificateTerminalContext> {
  const proofGap = proofGapRecord.payload;
  if (!proofGap.receiptId) {
    throw new HandshakeProtocolError(
      "invalid_authority_certificate_terminal",
      "Proof-gap certificates require a terminal receipt reference for offline reconstruction.",
      409,
    );
  }
  const receiptRecord = await recorder.requiredRecord<Receipt>("receipt", proofGap.receiptId, "receipt_missing");
  const context = await loadReceiptTerminalContext(store, recorder, receiptRecord);
  const proofGapRecords = [proofGapRecord, ...context.proofGapRecords].filter(uniqueRecordById);
  return {
    ...context,
    terminalKind: "proof_gap",
    terminalObjectRef: protocolObjectRef("proof_gap", proofGap.proofGapId),
    terminalizedAt: proofGap.createdAt,
    proofGapRecords,
    terminalRecord: proofGapRecord,
  };
}

function artifactsForContext(context: CertificateTerminalContext): AuthorityCertificateArtifact[] {
  return [
    artifactForRecord(context.contractRecord, "action_contract"),
    artifactForRecord(context.policyDecisionRecord, "policy_decision"),
    context.greenlightRecord ? artifactForRecord(context.greenlightRecord, "greenlight") : null,
    context.gateAttemptRecord ? artifactForRecord(context.gateAttemptRecord, "gateway_check_attempt") : null,
    context.mutationAttemptRecord ? artifactForRecord(context.mutationAttemptRecord, "mutation_attempt") : null,
    context.receiptRecord ? artifactForRecord(context.receiptRecord, "receipt") : null,
    ...context.proofGapRecords.map((record) => artifactForRecord(record, "proof_gap")),
    ...context.refusalRecords.map((record) => artifactForRecord(record, "refusal")),
    artifactForRecord(context.terminalRecord, context.terminalRecord.objectType as AuthorityCertificateArtifactKind),
  ]
    .filter((artifact): artifact is AuthorityCertificateArtifact => artifact !== null)
    .filter(uniqueArtifact);
}

function artifactForRecord(
  record: StoredProtocolRecord,
  kind: AuthorityCertificateArtifactKind,
): AuthorityCertificateArtifact {
  return {
    kind,
    objectRef: protocolObjectRef(record.objectType, record.objectId),
    digest: record.canonicalDigest,
  };
}

function requiredSignerRoles(gatewayAdmissionRequired: boolean): AuthorityCertificateSignerRole[] {
  return gatewayAdmissionRequired ? ["operator_policy", "gateway"] : ["operator_policy"];
}

function requiredArtifactKinds(artifacts: AuthorityCertificateArtifact[]): AuthorityCertificateArtifactKind[] {
  return artifacts.map((artifact) => artifact.kind).filter((kind, index, values) => values.indexOf(kind) === index);
}

async function loadProofGapRecords(
  recorder: ProtocolRecorder,
  proofGapIds: string[],
): Promise<StoredProtocolRecord<ProofGap>[]> {
  return Promise.all(
    proofGapIds.map((proofGapId) => recorder.requiredRecord<ProofGap>("proof_gap", proofGapId, "proof_gap_missing")),
  );
}

async function scopedRefusals(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<StoredProtocolRecord<Refusal>[]> {
  const refusals = await store.listRecordsByType<Refusal>("refusal", {
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
  });
  return refusals.filter((record) => record.payload.actionContractId === contract.actionContractId);
}

function parseTerminalObjectRef(ref: string): { objectType: string; objectId: string } {
  const separatorIndex = ref.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex === ref.length - 1) {
    throw new HandshakeProtocolError(
      "invalid_authority_certificate_terminal_ref",
      "AuthorityCertificate terminalObjectRef must use object_type:object_id form.",
      409,
    );
  }
  return { objectType: ref.slice(0, separatorIndex), objectId: ref.slice(separatorIndex + 1) };
}

function uniqueArtifact(
  artifact: AuthorityCertificateArtifact,
  index: number,
  artifacts: AuthorityCertificateArtifact[],
): boolean {
  return artifacts.findIndex((candidate) => candidate.objectRef === artifact.objectRef) === index;
}

function uniqueRecordById<T>(
  record: StoredProtocolRecord<T>,
  index: number,
  records: StoredProtocolRecord<T>[],
): boolean {
  return records.findIndex((candidate) => candidate.objectId === record.objectId) === index;
}
