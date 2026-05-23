import type { SurfaceRouteFamily } from "../surfaces/boundary-manifest";
import { CLI_SCHEMA_VERSION } from "./output";

export type CliCommandStatus = "active" | "deferred";
export type CliCommandPlane = "operator" | "evidence";
export type CliCommandCustodyRole = "none" | "review_custody";

export type CliCommandManifestEntry = {
  readonly id: string;
  readonly aliases: readonly string[];
  readonly status: CliCommandStatus;
  readonly plane: CliCommandPlane;
  readonly custodyRole: CliCommandCustodyRole;
  readonly routeFamilies: readonly SurfaceRouteFamily[];
  readonly filesystemReads: readonly string[];
  readonly filesystemWrites: readonly string[];
  readonly childProcessEnvInheritance: "none";
  readonly outputSchema: typeof CLI_SCHEMA_VERSION;
  readonly agentSafe: boolean;
  readonly redactionPosture: "redacted_projection_only" | "local_certificate_verification" | "manifest_only";
  readonly nonGoals: readonly string[];
};

const sharedNonGoals = [
  "policy evaluation",
  "gateway check",
  "protected mutation",
  "credential custody",
  "raw record access",
  "process startup",
] as const;

export const cliCommandManifest = [
  {
    id: "schema",
    aliases: ["schema"],
    status: "active",
    plane: "operator",
    custodyRole: "none",
    routeFamilies: [],
    filesystemReads: [],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "manifest_only",
    nonGoals: sharedNonGoals,
  },
  {
    id: "init",
    aliases: ["init"],
    status: "active",
    plane: "operator",
    custodyRole: "none",
    routeFamilies: [],
    filesystemReads: [],
    filesystemWrites: [".handshake/project.json", "external role credential profile without token values"],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: false,
    redactionPosture: "manifest_only",
    nonGoals: sharedNonGoals,
  },
  {
    id: "doctor",
    aliases: ["doctor"],
    status: "active",
    plane: "operator",
    custodyRole: "none",
    routeFamilies: [],
    filesystemReads: [".handshake/project.json", "external role credential profile", "explicit trust bundle ref"],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "manifest_only",
    nonGoals: sharedNonGoals,
  },
  {
    id: "evidence.aps-report",
    aliases: ["evidence aps-report"],
    status: "active",
    plane: "evidence",
    custodyRole: "review_custody",
    routeFamilies: [],
    filesystemReads: ["explicit aps report json path"],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "redacted_projection_only",
    nonGoals: sharedNonGoals,
  },
  {
    id: "evidence.contract-view",
    aliases: ["evidence contract-view"],
    status: "active",
    plane: "evidence",
    custodyRole: "review_custody",
    routeFamilies: ["evidence_projection_read"],
    filesystemReads: ["explicit redacted contract projection json path"],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "redacted_projection_only",
    nonGoals: sharedNonGoals,
  },
  {
    id: "evidence.receipt-timeline",
    aliases: ["evidence receipt-timeline"],
    status: "active",
    plane: "evidence",
    custodyRole: "review_custody",
    routeFamilies: ["evidence_projection_read"],
    filesystemReads: ["explicit redacted receipt timeline projection json path"],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "redacted_projection_only",
    nonGoals: sharedNonGoals,
  },
  {
    id: "cert.verify",
    aliases: ["cert verify"],
    status: "active",
    plane: "evidence",
    custodyRole: "review_custody",
    routeFamilies: ["certificate_verify_local"],
    filesystemReads: ["explicit certificate json path", "explicit trust bundle json path"],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "local_certificate_verification",
    nonGoals: sharedNonGoals,
  },
  {
    id: "support.bundle",
    aliases: ["support bundle"],
    status: "active",
    plane: "evidence",
    custodyRole: "review_custody",
    routeFamilies: ["evidence_projection_read", "install_health_read"],
    filesystemReads: ["explicit support bundle input json path"],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "redacted_projection_only",
    nonGoals: [...sharedNonGoals, "receipt export", "raw record dump", "trusted install readiness"],
  },
  {
    id: "install.x402-payment",
    aliases: ["install x402-payment"],
    status: "active",
    plane: "operator",
    custodyRole: "none",
    routeFamilies: [],
    filesystemReads: ["explicit x402 install proposal json path", ".handshake/project.json"],
    filesystemWrites: ["external local x402 install posture ref when --record-local is supplied"],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: false,
    redactionPosture: "redacted_projection_only",
    nonGoals: [...sharedNonGoals, "signer use", "live control-plane registration", "broad x402 compatibility"],
  },
  {
    id: "probes.x402-payment",
    aliases: ["probes x402-payment"],
    status: "active",
    plane: "operator",
    custodyRole: "none",
    routeFamilies: ["install_health_read"],
    filesystemReads: ["explicit x402 gateway posture json path", ".handshake/project.json"],
    filesystemWrites: ["external local x402 probe report ref when --record-local is supplied"],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: false,
    redactionPosture: "redacted_projection_only",
    nonGoals: [...sharedNonGoals, "gateway check", "provider certification"],
  },
  {
    id: "install.health",
    aliases: ["install health"],
    status: "active",
    plane: "operator",
    custodyRole: "none",
    routeFamilies: ["install_health_read"],
    filesystemReads: [".handshake/project.json", "external local x402 install/probe refs"],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "redacted_projection_only",
    nonGoals: sharedNonGoals,
  },
  {
    id: "conformance.x402-payment",
    aliases: ["conformance x402-payment"],
    status: "active",
    plane: "operator",
    custodyRole: "none",
    routeFamilies: [],
    filesystemReads: [],
    filesystemWrites: [],
    childProcessEnvInheritance: "none",
    outputSchema: CLI_SCHEMA_VERSION,
    agentSafe: true,
    redactionPosture: "redacted_projection_only",
    nonGoals: [...sharedNonGoals, "broad x402 compatibility"],
  },
] as const satisfies readonly CliCommandManifestEntry[];

export function cliSchemaOutput() {
  return cliCommandManifest.map((command) => ({
    id: command.id,
    aliases: command.aliases,
    status: command.status,
    plane: command.plane,
    custodyRole: command.custodyRole,
    outputSchema: command.outputSchema,
    agentSafe: command.agentSafe,
    redactionPosture: command.redactionPosture,
  }));
}
