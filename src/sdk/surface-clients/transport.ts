import { PROTOCOL_VERSION } from "../../protocol/public/schemas";
import {
  TransitionErrorResponseSchema,
  type TransitionErrorEnvelope,
} from "../../http/errors/transition-error-envelope";
import {
  HANDSHAKE_ORIGINATING_IDENTITY_HEADER,
  HANDSHAKE_PROTOCOL_VERSION_HEADER,
  HANDSHAKE_REQUEST_IDENTITY_HEADER,
} from "../../http/admission/request-context";
import type { TransitionCallerRole } from "../../http/admission/caller-auth";
import { HandshakeClientError, type HandshakeFetch } from "../client";

export type RoleScopedTransportRole = Extract<TransitionCallerRole, "review_custody" | "runtime_evidence">;

export type RoleScopedClientOptions = {
  roleCredential: string;
  protocolVersion?: string;
  requestIdentityFactory?: () => string;
  originatingIdentity?: string;
};

export type RoleScopedTransportOptions = RoleScopedClientOptions & {
  role: RoleScopedTransportRole;
};

export class RoleScopedTransport {
  constructor(
    private readonly baseUrl: string,
    private readonly options: RoleScopedTransportOptions,
    private readonly fetchImpl: HandshakeFetch = fetch,
  ) {}

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request("POST", path, body);
  }

  get<T>(path: string): Promise<T> {
    return this.request("GET", path);
  }

  private async request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      [HANDSHAKE_PROTOCOL_VERSION_HEADER]: this.options.protocolVersion ?? PROTOCOL_VERSION,
      [HANDSHAKE_REQUEST_IDENTITY_HEADER]: this.nextRequestIdentity(),
      authorization: `Bearer ${this.options.roleCredential}`,
    };
    if (method === "POST") headers["content-type"] = "application/json";
    if (this.options.originatingIdentity) {
      headers[HANDSHAKE_ORIGINATING_IDENTITY_HEADER] = this.options.originatingIdentity;
    }

    const response = await this.fetchImpl(new URL(path, this.baseUrl), {
      method,
      headers,
      ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      throw new HandshakeClientError(response.status, await this.errorEnvelopeForResponse(response));
    }
    return (await response.json()) as T;
  }

  private nextRequestIdentity(): string {
    return this.options.requestIdentityFactory?.() ?? crypto.randomUUID();
  }

  private async errorEnvelopeForResponse(response: Response): Promise<TransitionErrorEnvelope> {
    const parsedBody = await parseJsonBody(response);
    const parsedError = TransitionErrorResponseSchema.safeParse(parsedBody);
    if (parsedError.success) return parsedError.data.error;
    return {
      code: "http_error",
      message: `Handshake request failed with HTTP ${response.status}.`,
      transitionName: null,
      callerCustodyRole: this.options.role,
      retryability: response.status >= 500 ? "retryable" : "terminal",
      commitState: "unknown",
      requestIdentity: response.headers.get(HANDSHAKE_REQUEST_IDENTITY_HEADER),
      proofRef: null,
      refusalRef: null,
    };
  }
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
