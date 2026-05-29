import { z } from "zod";
import {
  compileX402InstallProposal,
  X402InstallProposalInputSchema,
  type X402InstallProposal,
  type X402InstallProposalInput,
} from "../../adapters/x402-payment/install-proposal";
import type { InstallProposal } from "../../install";
import { createApp, type WorkerBindings } from "../../http/app";
import type { CallerAuthTokens } from "../../http/admission/caller-auth";
import { nowIso } from "../../protocol/foundation/ids";
import type { InstallSetupResult } from "../../protocol/public/schemas";
import type { HandshakeFetch } from "../../sdk/client";
import { InstallClient } from "../../sdk/surface-clients";
import type { ProtocolStore } from "../../protocol/store/port";
import { InMemoryProtocolStore } from "../../storage/memory";
import { cliNonClaims, cliOutput } from "../output";

const X402_ACTION_FAMILY = "x402_payment.exact" as const;

const ServiceBootstrapInputSchema = z.union([
  X402InstallProposalInputSchema,
  z.strictObject({
    actionFamily: z.string().min(1).optional(),
    installInput: X402InstallProposalInputSchema,
  }),
]);

export type ServiceBootstrapResult = {
  outcome: InstallSetupResult["outcome"];
  actionFamily: string;
  installProposalId: string;
  installDigest: string;
  reasonCodes: readonly string[];
  recordRefs: InstallSetupResult["recordRefs"];
  policyPackRef: string | null;
  policyPackVersion: string | null;
  authorityBoundary: {
    authorityCreated: false;
    greenlightCreated: false;
    gatewayCheckPerformed: false;
    mutationAttempted: false;
  };
};

type X402BootstrapInstallInputOverrides = Partial<
  Omit<X402InstallProposalInput, "endpointEvidence" | "walletGatewayProfile" | "spendBounds">
> & {
  endpointEvidence?: Partial<X402InstallProposalInput["endpointEvidence"]>;
  walletGatewayProfile?: Partial<X402InstallProposalInput["walletGatewayProfile"]>;
  spendBounds?: Partial<X402InstallProposalInput["spendBounds"]>;
};

export function defaultX402BootstrapInstallInput(
  overrides: X402BootstrapInstallInputOverrides = {},
): X402InstallProposalInput {
  const { endpointEvidence, walletGatewayProfile, spendBounds, ...restOverrides } = overrides;
  const createdAt = restOverrides.createdAt ?? nowIso();
  const digest = `sha256:${"d".repeat(64)}` as const;
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: "https://api.example.com/mcp/premium-context",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      maxAtomicAmount: "2500",
      paymentRequirementsDigest: digest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
      ...endpointEvidence,
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "fixture_gateway_held",
      signerRef: "secretref:service-bootstrap-fixture-signer",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: ["base-sepolia"],
      supportedTokens: ["USDC"],
      ...walletGatewayProfile,
    },
    spendBounds: {
      principalId: "principal_demo",
      agentId: "agent_demo",
      runtimeAdapterId: "runtime_codex",
      objectiveRef: "intent:service-operator-bootstrap",
      allowedDomains: ["api.example.com"],
      allowedPayees: ["0xpayee"],
      allowedNetworks: ["base-sepolia"],
      allowedTokens: ["USDC"],
      maxAtomicAmountPerCall: "2500",
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: "5000",
      spendWindowEnforcementStatus: "not_enforced_local_metadata",
      issuedAt: createdAt,
      expiresAt: futureIsoFromNow(),
      ...spendBounds,
    },
    ...restOverrides,
  };
}

export function installProposalFromX402(proposal: X402InstallProposal): InstallProposal {
  return {
    installProposalId: proposal.installProposalId,
    schemaVersion: proposal.schemaVersion,
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    createdAt: proposal.createdAt,
    adapterPackId: proposal.adapterPackId,
    adapterPackVersion: proposal.adapterPackVersion,
    actionFamily: proposal.actionFamily,
    protectedSurfaceKind: proposal.protectedSurfaceKind,
    resourceRef: proposal.resourceRef,
    status: proposal.status,
    humanSummary: proposal.humanSummary,
    refusalReasonCodes: proposal.refusalReasonCodes,
    compiledRecords: proposal.compiledRecords,
    policyPackRef: proposal.policyPackRef,
    policyPackVersion: proposal.policyPackVersion,
    bypassProbePlan: proposal.bypassProbePlan,
    receiptExpectationRefs: proposal.receiptExpectationRefs,
    installDigest: proposal.installDigest,
  };
}

export async function runServiceBootstrap(input: {
  installInput: unknown;
  store?: ProtocolStore;
  callerAuthTokens?: CallerAuthTokens;
}): Promise<ServiceBootstrapResult> {
  const parsed = ServiceBootstrapInputSchema.parse(input.installInput);
  const actionFamily =
    "installInput" in parsed
      ? (parsed.actionFamily ?? X402_ACTION_FAMILY)
      : X402_ACTION_FAMILY;
  if (actionFamily !== X402_ACTION_FAMILY) {
    return refusedBootstrapResult({
      actionFamily,
      installProposalId: "install_unsupported_family",
      installDigest: `sha256:${"0".repeat(64)}`,
      reasonCodes: ["service_bootstrap_x402_only"],
    });
  }

  const installInput = "installInput" in parsed ? parsed.installInput : parsed;
  const proposal = await compileX402InstallProposal(installInput);
  const store = input.store ?? new InMemoryProtocolStore();
  const tokens =
    input.callerAuthTokens ??
    ({
      control_plane: "service_bootstrap_control_plane",
      runtime_evidence: "service_bootstrap_runtime_evidence",
      gateway_custody: "service_bootstrap_gateway_custody",
      review_custody: "service_bootstrap_review_custody",
    } satisfies CallerAuthTokens);

  const installClient = installClientForStore(store, tokens);
  const registration = await installClient.registerInstallProposalCompiledRecords(
    installProposalFromX402(proposal),
  );

  return {
    outcome: registration.outcome,
    actionFamily: proposal.actionFamily,
    installProposalId: proposal.installProposalId,
    installDigest: proposal.installDigest,
    reasonCodes:
      registration.outcome === "install_proposal_refused"
        ? registration.reasonCodes
        : proposal.refusalReasonCodes,
    recordRefs: registration.recordRefs,
    policyPackRef: proposal.policyPackRef,
    policyPackVersion: proposal.policyPackVersion,
    authorityBoundary: {
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    },
  };
}

export async function serviceBootstrapCommand(input: { installInput?: unknown }) {
  const result = await runServiceBootstrap({
    installInput: input.installInput ?? defaultX402BootstrapInstallInput(),
  });

  return cliOutput({
    command: "service bootstrap",
    plane: "operator",
    ok: result.outcome === "compiled_records_registered",
    reasonCodes: [...result.reasonCodes],
    nextAction: result.outcome === "compiled_records_registered" ? "read_result" : "fix_install",
    retryability: result.outcome === "compiled_records_registered" ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-service-bootstrap:v1-redacted",
    nonClaims: [
      ...cliNonClaims,
      "live wallet mutation",
      "second action-family install",
      "orphan catalog without compiled-records transition",
    ],
    warnings: [
      "Service bootstrap registers compiled catalog records via control-plane InstallClient only.",
      "No greenlight, gateway check, signer use, or protected mutation was performed.",
      "x402_payment.exact is the only supported action family in phase 04.",
    ],
    result,
  });
}

function workerBindingsFromTokens(tokens: CallerAuthTokens): WorkerBindings {
  const env: WorkerBindings = {};
  if (tokens.control_plane !== undefined) env.HANDSHAKE_CONTROL_PLANE_TOKEN = tokens.control_plane;
  if (tokens.runtime_evidence !== undefined) env.HANDSHAKE_RUNTIME_EVIDENCE_TOKEN = tokens.runtime_evidence;
  if (tokens.gateway_custody !== undefined) env.HANDSHAKE_GATEWAY_CUSTODY_TOKEN = tokens.gateway_custody;
  if (tokens.review_custody !== undefined) env.HANDSHAKE_REVIEW_CUSTODY_TOKEN = tokens.review_custody;
  return env;
}

function installClientForStore(store: ProtocolStore, tokens: CallerAuthTokens): InstallClient {
  const controlPlaneToken = tokens.control_plane;
  if (!controlPlaneToken) {
    throw new Error("service bootstrap requires a control_plane caller auth token.");
  }
  const app = createApp({ store, callerAuthTokens: tokens });
  const env = workerBindingsFromTokens(tokens);
  const fetchImpl: HandshakeFetch = async (requestInput, init) => {
    const url = new URL(String(requestInput), "http://handshake.test");
    return app.request(`${url.pathname}${url.search}`, init, env);
  };
  return new InstallClient(
    "http://handshake.test",
    {
      roleCredential: controlPlaneToken,
      requestIdentityFactory: () => "service-bootstrap-request",
      originatingIdentity: "ref:cli/service-operator-bootstrap",
    },
    fetchImpl,
  );
}

function refusedBootstrapResult(input: {
  actionFamily: string;
  installProposalId: string;
  installDigest: string;
  reasonCodes: readonly string[];
}): ServiceBootstrapResult {
  return {
    outcome: "install_proposal_refused",
    actionFamily: input.actionFamily,
    installProposalId: input.installProposalId,
    installDigest: input.installDigest,
    reasonCodes: input.reasonCodes,
    recordRefs: null,
    policyPackRef: null,
    policyPackVersion: null,
    authorityBoundary: {
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    },
  };
}

function futureIsoFromNow(minutes = 10): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
