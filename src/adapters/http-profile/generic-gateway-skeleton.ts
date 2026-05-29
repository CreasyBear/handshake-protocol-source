import { z } from "zod";
import { canonicalizeHttpProfile } from "./canonicalize";
import { HttpProtectedMutationProfileSchema } from "./schemas";

export const GENERIC_HTTP_PROFILE_GATEWAY_POSTURE = "definition_only" as const;

export type GenericHttpProfileGatewaySkeletonResult = {
  posture: typeof GENERIC_HTTP_PROFILE_GATEWAY_POSTURE;
  proofGapCode: "generic_http_profile_live_mutation_forbidden";
  message: string;
};

export function runGenericHttpProfileGatewaySkeleton(
  input: unknown,
): GenericHttpProfileGatewaySkeletonResult {
  const profile = canonicalizeHttpProfile(HttpProtectedMutationProfileSchema.parse(input));
  void profile;
  return {
    posture: GENERIC_HTTP_PROFILE_GATEWAY_POSTURE,
    proofGapCode: "generic_http_profile_live_mutation_forbidden",
    message:
      "Generic HTTP profile skeleton validates transport shape only. Family adapters must perform gateway-checked mutation; external PEP is glue, not a substitute for adapter re-check.",
  };
}
