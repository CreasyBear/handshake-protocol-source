import { blake3 } from "@noble/hashes/blake3";
import { computeA1VerifyOutcomeDigest } from "./verify-outcome-digest.js";

const BINDING_DOMAIN = "handshake::delegation_evidence::binding::v1";
const BINDING_SCHEMA_ID = "delegation-evidence-binding";
const BINDING_SCHEMA_VERSION = 0x01;

export type EvidenceBindingDigestInput = {
  a1ChainFingerprint: Uint8Array;
  a1VerifierVersion: string;
  a1VerifyOutcomeDigest: Uint8Array;
  candidateDigest: Uint8Array;
  actionContractDigest: Uint8Array;
  actionTypeId: string;
  paramsDigest: Uint8Array;
  principalId: string;
  agentId: string;
  presentedAtUnix: number;
};

export function computeEvidenceBindingDigest(input: EvidenceBindingDigestInput): Uint8Array {
  const h = blake3.create({ context: BINDING_DOMAIN });
  const schemaId = new TextEncoder().encode(BINDING_SCHEMA_ID);
  h.update(schemaId);
  h.update(Uint8Array.of(0));
  h.update(Uint8Array.of(BINDING_SCHEMA_VERSION));
  h.update(input.a1ChainFingerprint);
  const versionBytes = new TextEncoder().encode(input.a1VerifierVersion);
  h.update(u16Be(versionBytes.length));
  h.update(versionBytes);
  h.update(input.a1VerifyOutcomeDigest);
  h.update(input.candidateDigest);
  h.update(input.actionContractDigest);
  const actionTypeBytes = new TextEncoder().encode(input.actionTypeId);
  h.update(u16Be(actionTypeBytes.length));
  h.update(actionTypeBytes);
  h.update(input.paramsDigest);
  const principalBytes = new TextEncoder().encode(input.principalId);
  h.update(u16Be(principalBytes.length));
  h.update(principalBytes);
  const agentBytes = new TextEncoder().encode(input.agentId);
  h.update(u16Be(agentBytes.length));
  h.update(agentBytes);
  h.update(u64Be(input.presentedAtUnix));
  return h.digest();
}

export { computeA1VerifyOutcomeDigest };

function u16Be(value: number): Uint8Array {
  const buf = new ArrayBuffer(2);
  new DataView(buf).setUint16(0, value, false);
  return new Uint8Array(buf);
}

function u64Be(value: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(value), false);
  return new Uint8Array(buf);
}
