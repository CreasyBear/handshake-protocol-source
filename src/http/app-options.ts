import type { ProtocolStore } from "../protocol/store/port";
import type { AuthorityCertificateTrustMaterialInput } from "../protocol/areas/authority-certificate";
import type { CallerAuthTokens, CallerAuthWorkerBindings } from "./admission/caller-auth";
import type { HostedAdmissionConfigInput } from "./admission/hosted-admission-config";
import type { HostedCallerVerifier } from "./admission/hosted-caller-identity";

export type WorkerBindings = CallerAuthWorkerBindings & {
  DB?: D1Database;
  CACHE?: KVNamespace;
  [bindingName: string]: unknown;
};

export type AppOptions = {
  store?: ProtocolStore;
  allowEphemeralStore?: boolean;
  callerAuthTokens?: CallerAuthTokens;
  authMode?: "local" | "hosted";
  hostedAdmissionConfig?: HostedAdmissionConfigInput;
  hostedCallerVerifier?: HostedCallerVerifier;
  authorityCertificateTrustMaterial?: AuthorityCertificateTrustMaterialInput;
};
