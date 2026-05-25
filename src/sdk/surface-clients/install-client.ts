import { InstallProposalSchema, type InstallProposal } from "../../install";
import type {
  InstallSetupAuthorityBoundary,
  InstallSetupRefusedResult,
  InstallSetupRegisteredResult,
  InstallSetupResult,
} from "../../protocol/public/schemas";
import type { HandshakeFetch } from "../client";
import { RoleScopedTransport, type RoleScopedClientOptions } from "./transport";

export type InstallClientOptions = RoleScopedClientOptions;
export type InstallClientAuthorityBoundary = InstallSetupAuthorityBoundary;
export type InstallClientRegisteredRecordsResult = InstallSetupRegisteredResult;
export type InstallClientRefusedProposalResult = InstallSetupRefusedResult;
export type InstallClientRegisterCompiledRecordsResult = InstallSetupResult;

export class InstallClient {
  private readonly transport: RoleScopedTransport;

  constructor(baseUrl: string, options: InstallClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "control_plane" }, fetchImpl);
  }

  async registerInstallProposalCompiledRecords(
    input: InstallProposal,
  ): Promise<InstallClientRegisterCompiledRecordsResult> {
    const proposal = InstallProposalSchema.parse(input);
    return this.transport.post("/v0.2/install-proposals/compiled-records", proposal);
  }
}
