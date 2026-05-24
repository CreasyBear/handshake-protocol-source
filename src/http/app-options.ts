import type { ProtocolStore } from "../protocol/store/port";
import type { AuthorityCertificateTrustMaterialInput } from "../protocol/areas/authority-certificate";
import type { CallerAuthTokens, CallerAuthWorkerBindings } from "./admission/caller-auth";
import type { HostedCallerVerifier } from "./admission/hosted-caller-identity";

export type WorkerBindings = CallerAuthWorkerBindings & {
  DB?: D1Database;
  CACHE?: KVNamespace;
};

export type AppOptions = {
  store?: ProtocolStore;
  allowEphemeralStore?: boolean;
  callerAuthTokens?: CallerAuthTokens;
  authMode?: "local" | "hosted";
  hostedCallerVerifier?: HostedCallerVerifier;
  authorityCertificateTrustMaterial?: AuthorityCertificateTrustMaterialInput;
};
