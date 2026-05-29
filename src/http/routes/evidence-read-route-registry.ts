import type { ZodType } from "zod";
import {
  AgentTransactionEnvelopeProjectionSchema,
  ContractEvidenceProjectionSchema,
  GeneratedGraphEvidenceProjectionSchema,
  IdempotencyRecoveryProjectionSchema,
  OperationCorrelationIndexSchema,
  OperationReadbackProjectionSchema,
  ProtectedPathInstallHealthProjectionSchema,
  ReceiptTimelineProjectionSchema,
} from "../../protocol/public/schemas";
import type { TransitionCallerRole } from "../admission/caller-auth";

export type EvidenceReadRouteId =
  | "getGeneratedGraphEvidenceProjection"
  | "getContractEvidenceProjection"
  | "getAgentTransactionEnvelopeProjection"
  | "getOperationReadbackProjection"
  | "getOperationCorrelationIndex"
  | "getIdempotencyRecoveryProjection"
  | "getReceiptTimelineProjection"
  | "getProtectedPathInstallHealthProjection";

export type EvidenceReadRouteDefinition = {
  routeId: EvidenceReadRouteId;
  honoPath: `/v0.2/${string}`;
  openApiPath: `/v0.2/${string}`;
  roles: readonly TransitionCallerRole[];
  summary: string;
  responseDescription: string;
  responseSchema: ZodType;
  pathParameters: readonly EvidenceReadPathParameter[];
};

const evidenceReadRoles = ["review_custody", "runtime_evidence"] as const satisfies readonly TransitionCallerRole[];

export type EvidenceReadPathParameter = {
  name: string;
  description: string;
};

export const evidenceReadRouteDefinitions = [
  {
    routeId: "getGeneratedGraphEvidenceProjection",
    honoPath: "/v0.2/evidence/generated-execution-graphs/:generatedExecutionGraphId",
    openApiPath: "/v0.2/evidence/generated-execution-graphs/{generatedExecutionGraphId}",
    roles: evidenceReadRoles,
    summary: "Read redacted generated execution graph evidence for diagnostics only",
    responseDescription:
      "Generated execution graph evidence projection. Inspection evidence only; not authority and not execution proof.",
    responseSchema: GeneratedGraphEvidenceProjectionSchema,
    pathParameters: [
      {
        name: "generatedExecutionGraphId",
        description: "Generated execution graph identifier.",
      },
    ],
  },
  {
    routeId: "getContractEvidenceProjection",
    honoPath: "/v0.2/evidence/contracts/:actionContractId",
    openApiPath: "/v0.2/evidence/contracts/{actionContractId}",
    roles: evidenceReadRoles,
    summary: "Read a redacted action contract view for diagnostics only",
    responseDescription:
      "Redacted action contract projection. Inspection evidence only; not authority and not execution proof.",
    responseSchema: ContractEvidenceProjectionSchema,
    pathParameters: [
      {
        name: "actionContractId",
        description: "Action contract identifier.",
      },
    ],
  },
  {
    routeId: "getAgentTransactionEnvelopeProjection",
    honoPath: "/v0.2/evidence/agent-transactions/:actionContractId",
    openApiPath: "/v0.2/evidence/agent-transactions/{actionContractId}",
    roles: evidenceReadRoles,
    summary: "Read a redacted agent transaction envelope for diagnostics only",
    responseDescription:
      "Redacted agent transaction envelope projection. Inspection evidence only; not authority, not receipt export, and not downstream business proof.",
    responseSchema: AgentTransactionEnvelopeProjectionSchema,
    pathParameters: [
      {
        name: "actionContractId",
        description: "Action contract identifier used to assemble the redacted transaction envelope.",
      },
    ],
  },
  {
    routeId: "getOperationReadbackProjection",
    honoPath: "/v0.2/evidence/operations/:actionContractId/readback",
    openApiPath: "/v0.2/evidence/operations/{actionContractId}/readback",
    roles: evidenceReadRoles,
    summary: "Read redacted operation readback for diagnostics only",
    responseDescription:
      "Operation readback projection with compilation provenance stages. Inspection evidence only; does not create authority or greenlights.",
    responseSchema: OperationReadbackProjectionSchema,
    pathParameters: [
      {
        name: "actionContractId",
        description: "Action contract identifier for operation readback assembly.",
      },
    ],
  },
  {
    routeId: "getOperationCorrelationIndex",
    honoPath: "/v0.2/evidence/operations/:actionContractId/correlation",
    openApiPath: "/v0.2/evidence/operations/{actionContractId}/correlation",
    roles: evidenceReadRoles,
    summary: "Read linked operation correlation refs for diagnostics only",
    responseDescription:
      "Read-only correlation index over existing evidence refs. No mutation routes and no authority creation.",
    responseSchema: OperationCorrelationIndexSchema,
    pathParameters: [
      {
        name: "actionContractId",
        description: "Action contract identifier for correlation index assembly.",
      },
    ],
  },
  {
    routeId: "getIdempotencyRecoveryProjection",
    honoPath: "/v0.2/evidence/idempotency-recovery/:actionContractId",
    openApiPath: "/v0.2/evidence/idempotency-recovery/{actionContractId}",
    roles: evidenceReadRoles,
    summary: "Read redacted idempotency reuse and recovery state for diagnostics only",
    responseDescription:
      "Redacted idempotency recovery projection. Evidence only; same-key reads do not create fresh authority.",
    responseSchema: IdempotencyRecoveryProjectionSchema,
    pathParameters: [
      {
        name: "actionContractId",
        description: "Action contract identifier used to derive the idempotency scope.",
      },
    ],
  },
  {
    routeId: "getReceiptTimelineProjection",
    honoPath: "/v0.2/evidence/receipts/:receiptId/timeline",
    openApiPath: "/v0.2/evidence/receipts/{receiptId}/timeline",
    roles: evidenceReadRoles,
    summary: "Read a redacted receipt event timeline for diagnostics only",
    responseDescription:
      "Redacted receipt timeline projection. Inspection evidence only; not authority and not downstream business proof.",
    responseSchema: ReceiptTimelineProjectionSchema,
    pathParameters: [
      {
        name: "receiptId",
        description: "Receipt identifier.",
      },
    ],
  },
  {
    routeId: "getProtectedPathInstallHealthProjection",
    honoPath: "/v0.2/evidence/protected-path-install-health/:actionContractId",
    openApiPath: "/v0.2/evidence/protected-path-install-health/{actionContractId}",
    roles: evidenceReadRoles,
    summary: "Read redacted package-install protected-path health for diagnostics only",
    responseDescription:
      "Redacted protected-path install health projection. Inspection evidence only; not gateway authority.",
    responseSchema: ProtectedPathInstallHealthProjectionSchema,
    pathParameters: [
      {
        name: "actionContractId",
        description: "Action contract identifier used to derive the protected-path scope.",
      },
    ],
  },
] as const satisfies readonly EvidenceReadRouteDefinition[];
