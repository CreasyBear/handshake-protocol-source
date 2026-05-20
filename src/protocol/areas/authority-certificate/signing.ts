import { canonicalize, digestCanonical, signCanonicalHmac } from "../../foundation/canonical";
import type { JsonValue } from "../../foundation/schema-core";
import {
  AuthorityCertificateSignatureEntrySchema,
  type AuthorityCertificate,
  type AuthorityCertificateSignatureEntry,
  type ParsedAuthorityCertificateSignerInput,
} from "./types";

export type AuthorityCertificateSigningInput = JsonValue;

const ED25519_ALGORITHM = { name: "Ed25519" } as Algorithm;

export function buildAuthorityCertificateSigningInput(
  certificate: Pick<
    AuthorityCertificate,
    | "schemaVersion"
    | "tenantId"
    | "organizationId"
    | "createdAt"
    | "authorityCertificateId"
    | "authorityCertificateVersion"
    | "canonicalizerVersion"
    | "terminalizedAt"
    | "terminal"
    | "envelope"
    | "envelopeDigest"
    | "artifacts"
    | "verificationPolicy"
    | "consumerBindings"
    | "extensions"
    | "emittedAt"
  >,
): AuthorityCertificateSigningInput {
  return {
    schemaVersion: certificate.schemaVersion,
    tenantId: certificate.tenantId,
    organizationId: certificate.organizationId,
    createdAt: certificate.createdAt,
    authorityCertificateVersion: certificate.authorityCertificateVersion,
    canonicalizerVersion: certificate.canonicalizerVersion,
    certificateId: certificate.authorityCertificateId,
    terminalizedAt: certificate.terminalizedAt,
    terminal: certificate.terminal,
    envelope: certificate.envelope,
    envelopeDigest: certificate.envelopeDigest,
    artifacts: certificate.artifacts,
    verificationPolicy: certificate.verificationPolicy,
    consumerBindings: certificate.consumerBindings,
    extensions: certificate.extensions,
    emittedAt: certificate.emittedAt,
  } as unknown as JsonValue;
}

export async function authorityCertificateSigningInputDigest(
  certificate: Parameters<typeof buildAuthorityCertificateSigningInput>[0],
): Promise<`sha256:${string}`> {
  return digestCanonical(buildAuthorityCertificateSigningInput(certificate));
}

export async function signAuthorityCertificateSigningInput(
  signingInput: AuthorityCertificateSigningInput,
  signedOver: `sha256:${string}`,
  signer: ParsedAuthorityCertificateSignerInput,
): Promise<AuthorityCertificateSignatureEntry> {
  if (signer.algorithm === "hmac-sha256") {
    return AuthorityCertificateSignatureEntrySchema.parse({
      signerRole: signer.signerRole,
      keyIdentityRef: signer.keyIdentityRef,
      algorithm: signer.algorithm,
      signedOver,
      signature: await signCanonicalHmac(signingInput, signer.hmacSecret),
    });
  }

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    base64UrlToArrayBuffer(signer.privateKeyPkcs8),
    ED25519_ALGORITHM,
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    ED25519_ALGORITHM,
    privateKey,
    new TextEncoder().encode(canonicalize(signingInput)),
  );
  return AuthorityCertificateSignatureEntrySchema.parse({
    signerRole: signer.signerRole,
    keyIdentityRef: signer.keyIdentityRef,
    algorithm: signer.algorithm,
    signedOver,
    signature: `ed25519:${bytesToBase64Url(new Uint8Array(signature))}`,
  });
}

export async function verifyAuthorityCertificateSignature(input: {
  signingInput: AuthorityCertificateSigningInput;
  signature: AuthorityCertificateSignatureEntry;
  publicKeyEd25519?: string | null;
  hmacSecret?: string | null;
}): Promise<boolean> {
  if (input.signature.algorithm === "hmac-sha256") {
    if (!input.hmacSecret) return false;
    return (await signCanonicalHmac(input.signingInput, input.hmacSecret)) === input.signature.signature;
  }
  if (!input.publicKeyEd25519) return false;
  const publicKey = await crypto.subtle.importKey(
    "raw",
    base64UrlToArrayBuffer(input.publicKeyEd25519),
    ED25519_ALGORITHM,
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    ED25519_ALGORITHM,
    publicKey,
    signatureBytes(input.signature.signature),
    new TextEncoder().encode(canonicalize(input.signingInput)),
  );
}

function signatureBytes(signature: string): ArrayBuffer {
  return base64UrlToArrayBuffer(signature.slice("ed25519:".length));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
