export type RuntimeIngressFamilyId = "package_install" | "x402_payment" | "auth_md_protected_api_call";

export type RuntimeIngressFamilyDescriptor = {
  familyId: RuntimeIngressFamilyId;
  configKey: "packageInstall" | "x402Payment" | "authMdProtectedApiCall";
  dispatchKindSuffix: `_${string}`;
  grammarVersion: string;
  authorityPosture: "proposal_only";
  compileInputAuthority: "candidate_only";
  rawBypassPosture: "bypass_evidence_only";
};

export const runtimeIngressFamilyRegistry = [
  {
    familyId: "package_install",
    configKey: "packageInstall",
    dispatchKindSuffix: "_package_install",
    grammarVersion: "runtime-dispatch-package-install-0.1",
    authorityPosture: "proposal_only",
    compileInputAuthority: "candidate_only",
    rawBypassPosture: "bypass_evidence_only",
  },
  {
    familyId: "x402_payment",
    configKey: "x402Payment",
    dispatchKindSuffix: "_x402_payment",
    grammarVersion: "runtime-dispatch-x402-payment-0.1",
    authorityPosture: "proposal_only",
    compileInputAuthority: "candidate_only",
    rawBypassPosture: "bypass_evidence_only",
  },
  {
    familyId: "auth_md_protected_api_call",
    configKey: "authMdProtectedApiCall",
    dispatchKindSuffix: "_auth_md_protected_api_call",
    grammarVersion: "runtime-dispatch-auth-md-protected-api-call-0.1",
    authorityPosture: "proposal_only",
    compileInputAuthority: "candidate_only",
    rawBypassPosture: "bypass_evidence_only",
  },
] as const satisfies readonly RuntimeIngressFamilyDescriptor[];

export function runtimeIngressFamilyDescriptorForDispatchKind(
  dispatchKind: string,
): RuntimeIngressFamilyDescriptor | null {
  return runtimeIngressFamilyRegistry.find((family) => dispatchKind.endsWith(family.dispatchKindSuffix)) ?? null;
}

export function runtimeIngressFamilyIdForDispatchKind(dispatchKind: string): RuntimeIngressFamilyId | null {
  return runtimeIngressFamilyDescriptorForDispatchKind(dispatchKind)?.familyId ?? null;
}

export function runtimeIngressGrammarVersionForFamilySet(families: ReadonlySet<RuntimeIngressFamilyId>): string {
  if (families.size > 1) return "runtime-dispatch-mixed-0.1";
  const familyId = families.values().next().value;
  const descriptor = familyId
    ? runtimeIngressFamilyRegistry.find((candidate) => candidate.familyId === familyId)
    : undefined;
  if (!descriptor) throw new Error("Runtime ingress dispatch family registry cannot resolve grammar version.");
  return descriptor.grammarVersion;
}
