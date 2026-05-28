export type ReasonCodeRemediationEntry = {
  code: string;
  docsUrl: string;
  requiresNewContract?: boolean;
};

const remediationEntries: readonly ReasonCodeRemediationEntry[] = [
  {
    code: "caller_auth_required",
    docsUrl: "https://handshake.dev/docs/http/caller-auth",
  },
  {
    code: "caller_auth_forbidden",
    docsUrl: "https://handshake.dev/docs/http/caller-auth",
  },
  {
    code: "hosted_caller_auth_required",
    docsUrl: "https://handshake.dev/docs/http/hosted-admission",
  },
  {
    code: "hosted_caller_identity_stale",
    docsUrl: "https://handshake.dev/docs/http/hosted-admission",
    requiresNewContract: true,
  },
  {
    code: "credential_resolution_replay_refused",
    docsUrl: "https://handshake.dev/docs/protocol/replay-refusal",
    requiresNewContract: true,
  },
  {
    code: "idempotency_duplicate_authority",
    docsUrl: "https://handshake.dev/docs/protocol/replay-refusal",
    requiresNewContract: true,
  },
  {
    code: "agreement_missing",
    docsUrl: "https://handshake.dev/docs/protocol/proof-gap",
  },
] as const;

const remediationByCode = new Map(remediationEntries.map((entry) => [entry.code, entry]));

export function reasonCodeRemediationForCode(code: string): ReasonCodeRemediationEntry | null {
  return remediationByCode.get(code) ?? null;
}

export function problemTypeUriForCode(code: string): string | null {
  const remediation = reasonCodeRemediationForCode(code);
  if (remediation) {
    return `${remediation.docsUrl}#${code}`;
  }
  if (
    code.startsWith("caller_auth_") ||
    code.startsWith("hosted_") ||
    code.includes("refusal") ||
    code.includes("replay") ||
    code.startsWith("protected_action_") ||
    code.includes("proof_gap")
  ) {
    return `https://handshake.dev/problems/${code}`;
  }
  return null;
}
