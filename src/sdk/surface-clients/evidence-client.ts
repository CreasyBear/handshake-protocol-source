import type {
  AgentTransactionEnvelopeProjection,
  AuthorityCertificateTrustMaterial,
  ContractEvidenceProjection,
  GeneratedGraphEvidenceProjection,
  IdempotencyRecoveryProjection,
  ProtectedPathInstallHealthProjection,
  ReceiptTimelineProjection,
} from "../../protocol/public/schemas";
import {
  verifyAuthorityCertificate,
  type VerifyAuthorityCertificateResult,
} from "../../protocol/areas/authority-certificate/verify";
import type { TransitionCallerRole } from "../../http/admission/caller-auth";
import type { HandshakeFetch } from "../client";
import { RoleScopedTransport, type RoleScopedClientOptions } from "./transport";

export type EvidenceClientRole = Extract<TransitionCallerRole, "review_custody" | "runtime_evidence">;

export type EvidenceClientOptions = RoleScopedClientOptions & {
  readRole?: EvidenceClientRole;
};

export class EvidenceClient {
  private readonly transport: RoleScopedTransport;

  constructor(baseUrl: string, options: EvidenceClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(
      baseUrl,
      { ...options, role: options.readRole ?? "review_custody" },
      fetchImpl,
    );
  }

  getGeneratedGraphEvidenceProjection(generatedExecutionGraphId: string): Promise<GeneratedGraphEvidenceProjection> {
    return this.transport.get(
      `/v0.2/evidence/generated-execution-graphs/${encodeURIComponent(generatedExecutionGraphId)}`,
    );
  }

  getContractEvidenceProjection(actionContractId: string): Promise<ContractEvidenceProjection> {
    return this.transport.get(`/v0.2/evidence/contracts/${encodeURIComponent(actionContractId)}`);
  }

  getAgentTransactionEnvelopeProjection(actionContractId: string): Promise<AgentTransactionEnvelopeProjection> {
    return this.transport.get(`/v0.2/evidence/agent-transactions/${encodeURIComponent(actionContractId)}`);
  }

  getIdempotencyRecoveryProjection(actionContractId: string): Promise<IdempotencyRecoveryProjection> {
    return this.transport.get(`/v0.2/evidence/idempotency-recovery/${encodeURIComponent(actionContractId)}`);
  }

  getReceiptTimelineProjection(receiptId: string): Promise<ReceiptTimelineProjection> {
    return this.transport.get(`/v0.2/evidence/receipts/${encodeURIComponent(receiptId)}/timeline`);
  }

  getProtectedPathInstallHealthProjection(actionContractId: string): Promise<ProtectedPathInstallHealthProjection> {
    return this.transport.get(`/v0.2/evidence/protected-path-install-health/${encodeURIComponent(actionContractId)}`);
  }

  verifyAuthorityCertificate(
    certificate: unknown,
    trustMaterial: AuthorityCertificateTrustMaterial,
  ): Promise<VerifyAuthorityCertificateResult> {
    return verifyAuthorityCertificate(certificate, trustMaterial);
  }
}
