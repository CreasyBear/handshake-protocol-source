import type { EvaluatePolicyInput } from "../../protocol/public/inputs";
import type { Greenlight, PolicyDecision } from "../../protocol/public/schemas";
import type { HandshakeFetch } from "../client";
import { RoleScopedTransport, type RoleScopedClientOptions } from "./transport";

export type PolicyClientOptions = RoleScopedClientOptions;

export type PolicyClientEvaluationResult = {
  decision: PolicyDecision;
  greenlight: Greenlight | null;
  authorityCreated: boolean;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
  policyDecisionRef: string;
  greenlightRef: string | null;
  refusalRef: string | null;
  refusalReasonCode: string | null;
  reviewRequired: boolean;
  nextAction: "use_greenlight_at_gateway" | "read_evidence" | "request_review";
  retryability: "not_retryable";
  evidenceRefs: string[];
};

export class PolicyClient {
  private readonly transport: RoleScopedTransport;

  constructor(baseUrl: string, options: PolicyClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "control_plane" }, fetchImpl);
  }

  evaluatePolicy(input: EvaluatePolicyInput): Promise<PolicyClientEvaluationResult> {
    return this.transport.post("/v0.2/policy-decisions", input);
  }
}
