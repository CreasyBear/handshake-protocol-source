export const X402_PROTECTED_TOOL_ACCEPTANCE_VERSION = "handshake.product.x402-protected-tool-acceptance.v1" as const;

export type X402ProtectedToolAcceptanceAuthorityPosture =
  | "distribution_only"
  | "setup_evidence_only"
  | "local_probe_evidence_only"
  | "pre_contract_readiness"
  | "health_read_only"
  | "host_profile_only"
  | "proposal_only"
  | "policy_authority"
  | "gateway_authority"
  | "terminal_evidence_only";

export type X402ProtectedToolAcceptanceStep = {
  readonly id: string;
  readonly label: string;
  readonly surfaceOwner: string;
  readonly authorityPosture: X402ProtectedToolAcceptanceAuthorityPosture;
  readonly inputEvidence: readonly string[];
  readonly outputRecord: string;
  readonly requiredNonAuthorityFlags: readonly string[];
  readonly bypassPosture: string;
  readonly proofGaps: readonly string[];
  readonly validationGate: string;
  readonly stopCondition: string;
};

const commonSurfaceNonAuthorityFlags = [
  "does_not_create_policy_decision",
  "does_not_create_greenlight",
  "does_not_perform_gateway_check",
  "does_not_resolve_credential",
  "does_not_invoke_signer",
  "does_not_create_payment_material",
  "does_not_mutate",
  "does_not_export_receipt",
  "does_not_mint_terminal_certificate",
] as const;

const commonNoMarketClaims = [
  "does_not_claim_hosted_operation",
  "does_not_claim_provider_custody",
  "does_not_claim_settlement",
  "does_not_claim_marketplace_certification",
  "does_not_claim_host_wide_containment",
] as const;

export const x402ProtectedToolAcceptanceMatrix = [
  {
    id: "package_install",
    label: "Install published package",
    surfaceOwner: "package.json, server.json, bin, package surface checks",
    authorityPosture: "distribution_only",
    inputEvidence: ["published package version", "package allowlist", "server metadata"],
    outputRecord: "installed artifact and command/subpath availability",
    requiredNonAuthorityFlags: [...commonSurfaceNonAuthorityFlags, ...commonNoMarketClaims],
    bypassPosture: "Package availability names no protected path and controls no raw sibling route.",
    proofGaps: ["MCP Registry acceptance", "live host behavior", "provider custody"],
    validationGate: "pack:check verifies clean installed imports and no source/tests/planning/secrets in the artifact.",
    stopCondition:
      "Stop if package exports signer, gateway, policy, raw records, receipt export, or authority writers.",
  },
  {
    id: "init_doctor",
    label: "Initialize project and inspect readiness",
    surfaceOwner: "src/cli/local-project, src/cli/main, src/cli/command-manifest",
    authorityPosture: "setup_evidence_only",
    inputEvidence: ["project id", "state root", "role credential profile refs without token values"],
    outputRecord: ".handshake/project.json plus doctor readiness report",
    requiredNonAuthorityFlags: [...commonSurfaceNonAuthorityFlags, ...commonNoMarketClaims],
    bypassPosture: "Doctor can report missing or unsafe posture; it does not install containment.",
    proofGaps: ["state-root tamper evidence", "directory ownership posture", "live gateway custody"],
    validationGate: "CLI tests prove init/doctor output does not contain credential values or authority-shaped fields.",
    stopCondition: "Stop if doctor output can be used as permission or exposes raw credentials.",
  },
  {
    id: "install_x402_payment",
    label: "Compile local x402 install evidence",
    surfaceOwner: "src/cli/x402 and x402 install proposal compiler",
    authorityPosture: "setup_evidence_only",
    inputEvidence: [
      "x402 install proposal",
      "endpoint evidence",
      "payment requirement digest",
      "gateway profile",
      "spend bound",
    ],
    outputRecord: "local x402 install posture ref",
    requiredNonAuthorityFlags: [...commonSurfaceNonAuthorityFlags, ...commonNoMarketClaims],
    bypassPosture: "Install names the protected path but proves no raw sibling control by itself.",
    proofGaps: ["control-plane registration", "gateway custody proof", "host-specific probes"],
    validationGate: "Install command records setup evidence and requires later probes/readiness before facade use.",
    stopCondition: "Stop if install creates policy, greenlight, gateway check, signer use, or mutation authority.",
  },
  {
    id: "local_probes",
    label: "Record local bypass and custody probes",
    surfaceOwner: "src/cli/x402, x402 bypass probes, protected-path posture evidence",
    authorityPosture: "local_probe_evidence_only",
    inputEvidence: [
      "signer custody probe",
      "raw key exposure probe",
      "direct x402 client probe",
      "sibling MCP/payment probe",
      "wrapper drift probe",
    ],
    outputRecord: "local x402 probe posture report",
    requiredNonAuthorityFlags: [...commonSurfaceNonAuthorityFlags, ...commonNoMarketClaims],
    bypassPosture: "Named raw sibling posture is evidence; detected is not controlled.",
    proofGaps: ["live host raw sibling behavior", "external witness", "provider-side bypass proof"],
    validationGate: "Probe tests classify unsafe posture and preserve named raw sibling evidence.",
    stopCondition: "Stop if missing probes default to protected or if detected bypass is treated as contained.",
  },
  {
    id: "register_gateway_readiness",
    label: "Register trusted gateway readiness",
    surfaceOwner: "src/cli/x402/local-state and protected-tool readiness contract",
    authorityPosture: "pre_contract_readiness",
    inputEvidence: [
      "install digest",
      "probe posture digest",
      "gateway registration",
      "GatewayCredentialRef digest",
      "GatewayCustodyProofPacket digest",
      "policy version",
      "gateway registry entry",
      "operating envelope",
      "selected payment requirement digest",
      "expiry",
    ],
    outputRecord: "X402ProtectedToolReadinessSnapshot",
    requiredNonAuthorityFlags: [
      "readiness_scope_is_pre_contract",
      "readiness_creates_no_authority",
      ...commonSurfaceNonAuthorityFlags,
      ...commonNoMarketClaims,
    ],
    bypassPosture: "Readiness carries raw sibling posture but does not claim host-wide containment.",
    proofGaps: ["customer gateway evidence", "provider gateway evidence", "signed or tamper-evident local state"],
    validationGate:
      "Readiness schema and profile/facade tests refuse stale, unsafe, missing, drifted, or overclaimed readiness.",
    stopCondition: "Stop if trusted_gateway_ready alone can reach signer use or policy authority.",
  },
  {
    id: "install_health",
    label: "Read install health",
    surfaceOwner: "src/cli/x402, MCP install-health resources",
    authorityPosture: "health_read_only",
    inputEvidence: ["local install posture", "probe posture", "gateway readiness record"],
    outputRecord: "redacted install health projection",
    requiredNonAuthorityFlags: [...commonSurfaceNonAuthorityFlags, ...commonNoMarketClaims],
    bypassPosture: "Health can say ready for runtime facade, never ready to mutate.",
    proofGaps: ["live provider custody", "MCP Registry lookup", "host-native behavior"],
    validationGate:
      "Health tests preserve not_ready, local_posture_evidence_present, and trusted_gateway_ready distinctions.",
    stopCondition:
      "Stop if install health emits policy, greenlight, gateway check, payment material, or receipt fields.",
  },
  {
    id: "host_profile_generation",
    label: "Generate host profile artifact",
    surfaceOwner: "src/x402-protected-tool and protected-tool profile builders",
    authorityPosture: "host_profile_only",
    inputEvidence: ["readiness snapshot", "host family", "command/config target", "tool-list digest"],
    outputRecord: "host-specific activation artifact",
    requiredNonAuthorityFlags: [...commonSurfaceNonAuthorityFlags, ...commonNoMarketClaims],
    bypassPosture: "Profile records raw sibling posture and native-host proof gaps instead of claiming containment.",
    proofGaps: ["live user host mutation", "native host certification", "host-wide containment"],
    validationGate:
      "Profile tests prove Codex, Claude, Hermes, and OpenClaw artifacts bind readiness and deny authority.",
    stopCondition: "Stop if a profile writes live config by default or claims host-wide containment.",
  },
  {
    id: "protected_tool_proposal",
    label: "Prepare protected tool proposal",
    surfaceOwner: "protected-tool facade, MCP proposal tool, runtime ingress",
    authorityPosture: "proposal_only",
    inputEvidence: [
      "host profile artifact",
      "readiness digest",
      "runtime identity",
      "x402 tool input",
      "metadata digest",
      "idempotency key",
    ],
    outputRecord: "runtime dispatch block, runtime evidence, tool-call draft, candidate/action-contract proposal",
    requiredNonAuthorityFlags: [...commonSurfaceNonAuthorityFlags, ...commonNoMarketClaims],
    bypassPosture:
      "Raw payload input, sibling direct payment, dynamic params, stale metadata, or unsupported body posture refuse before policy.",
    proofGaps: ["full generated code coverage", "host parallel-call enforcement", "external runtime transcript"],
    validationGate: "Facade/MCP/runtime tests prove proposal surfaces cannot create authority or payment material.",
    stopCondition:
      "Stop if proposal output includes greenlight, gateway check input, payment payload, signature, or receipt export.",
  },
  {
    id: "policy_decision",
    label: "Evaluate exact policy and one-use greenlight or refusal",
    surfaceOwner: "protocol policy-greenlight area and role-scoped PolicyClient",
    authorityPosture: "policy_authority",
    inputEvidence: [
      "exact ActionContract",
      "operating envelope",
      "delegated authority ref",
      "idempotency scope",
      "isolation state",
    ],
    outputRecord: "PolicyDecision plus one-use Greenlight or durable refusal/review/halt/quarantine/proof gap",
    requiredNonAuthorityFlags: [
      "does_not_perform_gateway_check",
      "does_not_resolve_credential",
      "does_not_invoke_signer",
      "does_not_create_payment_material",
      "does_not_mutate",
      "does_not_export_receipt",
      "does_not_mint_terminal_certificate",
      ...commonNoMarketClaims,
    ],
    bypassPosture:
      "Policy must refuse stale registry, stale readiness, stale credential posture, isolation, replay conflict, or overbroad scope.",
    proofGaps: ["aggregate spend ledger", "review renderer registry when review is required"],
    validationGate:
      "Policy tests bind contract digest, params digest, credential ref, gateway registry, policy version, expiry, idempotency, and maxUses 1.",
    stopCondition: "Stop if policy can evaluate vague intent or emit reusable/ambient authority.",
  },
  {
    id: "gateway_check_signer",
    label: "Gateway check before signer use",
    surfaceOwner: "gateway-gate area and x402 wallet gateway adapter",
    authorityPosture: "gateway_authority",
    inputEvidence: [
      "one-use greenlight",
      "exact contract digest",
      "observed request params",
      "credential-ref digest",
      "custody proof freshness",
      "isolation state",
    ],
    outputRecord: "VerifiedGatewayCheck, CredentialResolutionEvidence, MutationAttempt, Receipt or Refusal/ProofGap",
    requiredNonAuthorityFlags: [
      "does_not_claim_settlement",
      "does_not_claim_provider_custody_without_external_proof",
      "does_not_claim_hosted_operation",
      "does_not_export_reusable_authority",
      "does_not_mint_terminal_certificate",
    ],
    bypassPosture:
      "Any raw sibling payment or changed observed parameters must leave signer invocation count unchanged.",
    proofGaps: ["settlement finality", "facilitator operation", "provider custody", "downstream business success"],
    validationGate:
      "Gateway tests prove signer/payment material appears only after VerifiedGatewayCheck and replay/drift refuses first.",
    stopCondition: "Stop if signer use can occur before a verified gate or a greenlight can be reused.",
  },
  {
    id: "redacted_readback_support",
    label: "Read terminal evidence and support bundle",
    surfaceOwner: "evidence projections, MCP resources, CLI evidence/support bundle",
    authorityPosture: "terminal_evidence_only",
    inputEvidence: ["terminal receipt/refusal/proof gap/replay refusal/isolation refs"],
    outputRecord: "redacted evidence projection and support bundle",
    requiredNonAuthorityFlags: [
      "does_not_create_policy_decision",
      "does_not_create_greenlight",
      "does_not_perform_gateway_check",
      "does_not_invoke_signer",
      "does_not_mutate",
      "does_not_export_raw_receipt",
      "does_not_mint_permission",
      ...commonNoMarketClaims,
    ],
    bypassPosture: "Readback preserves bypass evidence and proof gaps without granting retry permission.",
    proofGaps: ["downstream finality", "cross-org trust", "compliance-grade audit"],
    validationGate:
      "Evidence/support tests separate gateway check from downstream observation and redact raw records/payment material.",
    stopCondition: "Stop if readback collapses gateway evidence into business success or exposes reusable authority.",
  },
] as const satisfies readonly X402ProtectedToolAcceptanceStep[];

export const x402ProtectedToolForbiddenProductionClaims = [
  "readiness_is_permission",
  "package_install_authorizes_payment",
  "mcp_tool_visibility_is_authorization",
  "host_profile_is_host_wide_containment",
  "certificate_is_permission_or_settlement",
  "receipt_is_downstream_business_success",
  "x402_proof_is_broad_x402_compatibility",
  "per_call_bound_is_aggregate_spend_enforcement",
  "local_fixture_is_provider_custody",
  "self_hosted_path_is_hosted_operation",
  "activation_artifact_is_native_host_certification",
  "auth_md_is_authority_without_gateway_contract",
  "support_bundle_is_retry_permission",
] as const;

export const x402ProtectedToolReleaseBlockers = [
  "signer_invocation_before_verified_gateway_check",
  "reusable_greenlight_or_changed_params_after_greenlight",
  "trusted_readiness_used_as_mutation_permission",
  "raw_sibling_payment_path_claimed_as_contained_without_evidence",
  "policy_drift_broadens_existing_authority",
  "active_isolation_not_checked_before_policy_or_gateway",
  "receipt_or_support_bundle_cannot_distinguish_gateway_check_from_downstream_finality",
  "package_or_profile_exports_signer_payment_payload_raw_record_or_authority_writer",
] as const;
