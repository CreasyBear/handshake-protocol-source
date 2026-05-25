import type { DelegatedAuthorityRef, DelegatedAuthorityStatusTransition } from "../../protocol/public/schemas";
import type {
  RegisterDelegatedAuthorityRefInput,
  TransitionDelegatedAuthorityStatusInput,
} from "../../protocol/public/inputs";
import type { HandshakeFetch } from "../client";
import { RoleScopedTransport, type RoleScopedClientOptions } from "./transport";

export type ControlPlaneClientOptions = RoleScopedClientOptions;

export class ControlPlaneClient {
  private readonly transport: RoleScopedTransport;

  constructor(baseUrl: string, options: ControlPlaneClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "control_plane" }, fetchImpl);
  }

  registerDelegatedAuthorityRef(input: RegisterDelegatedAuthorityRefInput): Promise<DelegatedAuthorityRef> {
    return this.transport.post("/v0.2/delegated-authority-refs", input);
  }

  transitionDelegatedAuthorityStatus(
    input: TransitionDelegatedAuthorityStatusInput,
  ): Promise<DelegatedAuthorityStatusTransition> {
    return this.transport.post("/v0.2/delegated-authority-status-transitions", input);
  }
}
