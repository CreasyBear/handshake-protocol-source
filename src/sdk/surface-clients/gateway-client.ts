import type {
  BypassProbe,
  CredentialResolutionEvidence,
  GatewayCheckAttempt,
  GatewayCredentialRef,
  GatewayCustodyProofPacket,
  MutationAttempt,
  ProofGap,
  ProtectedPathPosture,
  Receipt,
  SurfaceOperationReconciliation,
} from "../../protocol/public/schemas";
import type {
  CreateBypassProbeInput,
  CreateProtectedPathPostureInput,
  GatewayCheckInput,
  ReconcileSurfaceOperationInput,
  RecordCredentialResolutionEvidenceInput,
  RecordGatewayCustodyProofPacketInput,
  RegisterGatewayCredentialRefInput,
} from "../../protocol/public/inputs";
import type { HandshakeFetch } from "../client";
import { RoleScopedTransport, type RoleScopedClientOptions } from "./transport";

export type GatewayClientOptions = RoleScopedClientOptions;

export type GatewayClientCheckResult = {
  gateAttempt: GatewayCheckAttempt;
  mutationAttempt: MutationAttempt | null;
  receipt: Receipt;
  proofGap: ProofGap | null;
};

export type GatewayClientReconciliationResult = {
  reconciliation: SurfaceOperationReconciliation;
  resolvedProofGaps: ProofGap[];
  createdProofGap: ProofGap | null;
};

export class GatewayClient {
  private readonly transport: RoleScopedTransport;

  constructor(baseUrl: string, options: GatewayClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "gateway_custody" }, fetchImpl);
  }

  registerGatewayCredentialRef(input: RegisterGatewayCredentialRefInput): Promise<GatewayCredentialRef> {
    return this.transport.post("/v0.2/gateway-credential-refs", input);
  }

  recordGatewayCustodyProofPacket(input: RecordGatewayCustodyProofPacketInput): Promise<GatewayCustodyProofPacket> {
    return this.transport.post("/v0.2/gateway-custody-proof-packets", input);
  }

  createBypassProbe(input: CreateBypassProbeInput): Promise<BypassProbe> {
    return this.transport.post("/v0.2/bypass-probes", input);
  }

  createProtectedPathPosture(input: CreateProtectedPathPostureInput): Promise<ProtectedPathPosture> {
    return this.transport.post("/v0.2/protected-path-postures", input);
  }

  gatewayCheck(input: GatewayCheckInput): Promise<GatewayClientCheckResult> {
    return this.transport.post("/v0.2/gateway-check-attempts", input);
  }

  recordCredentialResolutionEvidence(
    input: RecordCredentialResolutionEvidenceInput,
  ): Promise<CredentialResolutionEvidence> {
    return this.transport.post("/v0.2/credential-resolution-evidence", input);
  }

  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<GatewayClientReconciliationResult> {
    return this.transport.post("/v0.2/surface-operation-reconciliations", input);
  }
}
