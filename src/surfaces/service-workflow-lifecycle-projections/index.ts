import {
  actionAttemptLifecycleEntry,
  type ActionAttemptLifecycleEntry,
  type ActionAttemptLifecycleKey,
} from "../../protocol/areas/action-attempt-lifecycle";
import type { ProtocolTransitionId, TransitionOutcomeClass } from "../../protocol/navigation";

export const serviceWorkflowCorrelationFieldNames = [
  "passportPackageDigest",
  "passportPresentationId",
  "admissionId",
  "serviceWorkflowHandleId",
  "serviceWorkflowHandleDigest",
] as const;

export type ServiceWorkflowCorrelationFieldName = (typeof serviceWorkflowCorrelationFieldNames)[number];

export type ServiceWorkflowCorrelationFieldBoundary = {
  readonly fieldName: ServiceWorkflowCorrelationFieldName;
  readonly allowedUse: string;
  readonly forbiddenInterpretation: string;
  readonly createsAuthority: false;
};

export const serviceWorkflowCorrelationFieldBoundaries = [
  {
    fieldName: "passportPackageDigest",
    allowedUse: "content-addressed correlation with the evidence bundle the agent presented",
    forbiddenInterpretation: "identity, trust, permission, or reusable auth",
    createsAuthority: false,
  },
  {
    fieldName: "passportPresentationId",
    allowedUse: "unique correlation for one service intake or presentation event",
    forbiddenInterpretation: "principal approval, spend approval, or gateway admission",
    createsAuthority: false,
  },
  {
    fieldName: "admissionId",
    allowedUse: "service-side readback reference for accepted, refused, stale, proof-gap, or quarantined intake",
    forbiddenInterpretation: "policy decision, greenlight, gateway check, receipt, or mutation permission",
    createsAuthority: false,
  },
  {
    fieldName: "serviceWorkflowHandleId",
    allowedUse: "workflow context correlation for later proposal/readback",
    forbiddenInterpretation: "bearer token, tool permission, retry permission, credential, or payment approval",
    createsAuthority: false,
  },
  {
    fieldName: "serviceWorkflowHandleDigest",
    allowedUse: "content-addressed reconstruction reference for the non-authority handle",
    forbiddenInterpretation: "proof of authorization, proof of gateway acceptance, or proof of execution",
    createsAuthority: false,
  },
] as const satisfies readonly ServiceWorkflowCorrelationFieldBoundary[];

export const serviceWorkflowProjectionKinds = [
  "passport",
  "service_workflow_admission",
  "service_workflow_handle",
  "clearance",
  "outcome",
  "authority_certificate",
] as const;

export type ServiceWorkflowProjectionKind = (typeof serviceWorkflowProjectionKinds)[number];

export type ServiceWorkflowProjection = {
  readonly projectionKind: ServiceWorkflowProjectionKind;
  readonly productNoun: string;
  readonly sourceAuthorityStage:
    | "pre_contract_evidence_context"
    | "fresh_protected_action_path"
    | "terminal_readback"
    | "terminal_evidence_projection";
  readonly allowedUse: string;
  readonly forbiddenInterpretations: readonly string[];
  readonly createsAuthority: false;
  readonly lifecycleKeys: readonly ActionAttemptLifecycleKey[];
  readonly preContractContextRefs: readonly string[];
};

const noLifecycleKeys = [] as const satisfies readonly ActionAttemptLifecycleKey[];

export const serviceWorkflowLifecycleProjections = [
  {
    projectionKind: "passport",
    productNoun: "Passport",
    sourceAuthorityStage: "pre_contract_evidence_context",
    allowedUse: "present an evidence package for service intake and reconstruction",
    forbiddenInterpretations: ["identity", "trust", "permission", "spend approval", "signer access", "reusable auth"],
    createsAuthority: false,
    lifecycleKeys: noLifecycleKeys,
    preContractContextRefs: [
      "participant_identity_binding:evidence_only",
      "gateway_custody_packet:evidence_only",
      "protected_path_posture:evidence_only",
    ],
  },
  {
    projectionKind: "service_workflow_admission",
    productNoun: "ServiceWorkflowAdmission",
    sourceAuthorityStage: "pre_contract_evidence_context",
    allowedUse: "record service-side accepted, refused, stale, proof-gap, or quarantined intake readback",
    forbiddenInterpretations: [
      "policy decision",
      "greenlight",
      "gateway check",
      "receipt",
      "certificate",
      "mutation permission",
    ],
    createsAuthority: false,
    lifecycleKeys: noLifecycleKeys,
    preContractContextRefs: ["passportPackageDigest", "passportPresentationId", "admissionId"],
  },
  {
    projectionKind: "service_workflow_handle",
    productNoun: "ServiceWorkflowHandle",
    sourceAuthorityStage: "pre_contract_evidence_context",
    allowedUse: "carry correlation and readback context into later fresh proposals",
    forbiddenInterpretations: [
      "badge-as-bearer-token",
      "tool permission",
      "retry permission",
      "x402 payment approval",
      "auth.md credential",
      "gateway pass",
    ],
    createsAuthority: false,
    lifecycleKeys: noLifecycleKeys,
    preContractContextRefs: ["serviceWorkflowHandleId", "serviceWorkflowHandleDigest"],
  },
  {
    projectionKind: "clearance",
    productNoun: "Clearance",
    sourceAuthorityStage: "fresh_protected_action_path",
    allowedUse: "name the fresh exact protected-action path for one event",
    forbiddenInterpretations: ["workflow-level permission", "reusable auth", "aggregate spend approval"],
    createsAuthority: false,
    lifecycleKeys: [
      "proposeActionContract:recorded",
      "proposeActionContract:refusal",
      "proposeActionContract:conflict",
      "evaluatePolicy:greenlight",
      "evaluatePolicy:refusal",
      "evaluatePolicy:review_required",
      "evaluatePolicy:proof_gap",
      "evaluatePolicy:conflict",
      "gatewayCheck:recorded",
      "gatewayCheck:proof_gap",
      "gatewayCheck:replay_refusal",
      "gatewayCheck:conflict",
    ],
    preContractContextRefs: [],
  },
  {
    projectionKind: "outcome",
    productNoun: "Outcome",
    sourceAuthorityStage: "terminal_readback",
    allowedUse: "read receipt, refusal, replay refusal, proof gap, downstream uncertainty, or recovery posture",
    forbiddenInterpretations: [
      "downstream business success",
      "future permission",
      "new greenlight",
      "receipt substitute",
    ],
    createsAuthority: false,
    lifecycleKeys: [
      "evaluatePolicy:refusal",
      "evaluatePolicy:proof_gap",
      "gatewayCheck:recorded",
      "gatewayCheck:proof_gap",
      "gatewayCheck:replay_refusal",
      "gatewayCheck:conflict",
      "reconcileSurfaceOperation:recorded",
      "reconcileSurfaceOperation:proof_gap",
      "reconcileSurfaceOperation:recovery",
      "createReceiptExport:exported",
      "createReceiptExport:refusal",
      "createRecoveryRecommendation:recovery",
      "createRecoveryRecommendation:refusal",
    ],
    preContractContextRefs: [],
  },
  {
    projectionKind: "authority_certificate",
    productNoun: "AuthorityCertificate",
    sourceAuthorityStage: "terminal_evidence_projection",
    allowedUse: "sign existing terminal evidence for one event",
    forbiddenInterpretations: ["permission", "identity", "settlement", "hosted trust", "reusable auth"],
    createsAuthority: false,
    lifecycleKeys: ["createAuthorityCertificate:exported"],
    preContractContextRefs: [],
  },
] as const satisfies readonly ServiceWorkflowProjection[];

export const forbiddenServiceWorkflowAuthorityNouns = ["Badge"] as const;

export function serviceWorkflowProjectionByKind(
  projectionKind: ServiceWorkflowProjectionKind,
): ServiceWorkflowProjection {
  const projection = serviceWorkflowLifecycleProjections.find((entry) => entry.projectionKind === projectionKind);
  if (!projection) throw new Error(`Unknown service workflow projection kind: ${projectionKind}`);
  return projection;
}

export function serviceWorkflowLifecycleEntriesFor(
  projectionKind: ServiceWorkflowProjectionKind,
): ActionAttemptLifecycleEntry[] {
  return serviceWorkflowProjectionByKind(projectionKind).lifecycleKeys.map(actionAttemptLifecycleEntryForKey);
}

function actionAttemptLifecycleEntryForKey(key: ActionAttemptLifecycleKey): ActionAttemptLifecycleEntry {
  const [transitionId, outcomeClass] = key.split(":") as [ProtocolTransitionId, TransitionOutcomeClass];
  return actionAttemptLifecycleEntry(transitionId, outcomeClass);
}
