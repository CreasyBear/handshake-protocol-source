#!/usr/bin/env bun
/**
 * Regenerates test/fixtures/a1-evidence/*.json from Handshake-domain reference signer.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildSignedChain,
  certFingerprintHex,
  chainFingerprintHex,
  fixedNonce,
  identityFromSigningBytes,
  refIntentLeafHash,
  refIntentTreeRoot,
  signDelegationCert,
} from "./reference-signer.js";
import { toHexLower } from "../../src/integrations/a1-evidence/hex.js";
import type { SignedChainWire } from "../../src/integrations/a1-evidence/wire-types.js";

const fixtureDir = process.env.HANDSHAKE_FIXTURE_DIR ?? join(process.cwd(), "test/fixtures/a1-evidence");
mkdirSync(fixtureDir, { recursive: true });

type Fixture = {
  signedChain: SignedChainWire;
  executorPk: string;
  intentHash: string;
  merkleProof: { siblings: { hash: string; isLeft: boolean }[] };
  nowUnix: number;
  driftToleranceSecs: number;
  expected: {
    valid: boolean;
    chainFingerprint: string;
    certFingerprints: string[];
    reasonCode: string | null;
    _proofGap?: string;
  };
};

const human = identityFromSigningBytes(1);
const agent1 = identityFromSigningBytes(33);
const agent2 = identityFromSigningBytes(65);

const now = 1_700_000_000;
const ttl = 3600;

const intentHash = refIntentLeafHash("repo.write", { path: "/tmp/demo" });
const scope = refIntentTreeRoot([intentHash]);

const cert1 = signDelegationCert({
  delegator: human,
  delegatePk: agent1.publicKey,
  scopeRoot: scope,
  nonce: fixedNonce(1),
  issuedAt: now,
  expirationUnix: now + ttl,
  maxDepth: 8,
});
const chain1 = buildSignedChain({ principal: human, principalScope: scope, certs: [cert1] });

const valid1hopFixture: Fixture = {
  signedChain: chain1,
  executorPk: toHexLower(agent1.publicKey),
  intentHash: toHexLower(intentHash),
  merkleProof: { siblings: [] },
  nowUnix: now,
  driftToleranceSecs: 15,
  expected: {
    valid: true,
    chainFingerprint: chainFingerprintHex(chain1),
    certFingerprints: [certFingerprintHex(cert1)],
    reasonCode: null,
  },
};

writeFixture("valid-1hop.json", valid1hopFixture);
writeFixture("valid-zip215-edge.json", valid1hopFixture);

const cert2a = signDelegationCert({
  delegator: human,
  delegatePk: agent2.publicKey,
  scopeRoot: scope,
  nonce: fixedNonce(2),
  issuedAt: now,
  expirationUnix: now + ttl,
  maxDepth: 8,
});
const cert2b = signDelegationCert({
  delegator: identityFromSigningBytes(65),
  delegatePk: agent1.publicKey,
  scopeRoot: scope,
  nonce: fixedNonce(3),
  issuedAt: now,
  expirationUnix: now + ttl,
  maxDepth: 8,
});
const chain2 = buildSignedChain({ principal: human, principalScope: scope, certs: [cert2a, cert2b] });

writeFixture("valid-2hop.json", {
  signedChain: chain2,
  executorPk: toHexLower(agent1.publicKey),
  intentHash: toHexLower(intentHash),
  merkleProof: { siblings: [] },
  nowUnix: now,
  driftToleranceSecs: 15,
  expected: {
    valid: true,
    chainFingerprint: chainFingerprintHex(chain2),
    certFingerprints: chain2.certs.map(certFingerprintHex),
    reasonCode: null,
  },
});

writeFixture("valid-multihop.json", {
  signedChain: chain2,
  executorPk: toHexLower(agent1.publicKey),
  intentHash: toHexLower(intentHash),
  merkleProof: { siblings: [] },
  nowUnix: now,
  driftToleranceSecs: 15,
  expected: {
    valid: true,
    chainFingerprint: chainFingerprintHex(chain2),
    certFingerprints: chain2.certs.map(certFingerprintHex),
    reasonCode: null,
  },
});

// invalid bad sig
const badSigCert = { ...cert1, signature: flipHexChar(cert1.signature, 0) };
const chainBad = buildSignedChain({ principal: human, principalScope: scope, certs: [badSigCert] });
writeFixture("invalid-bad-sig.json", {
  signedChain: chainBad,
  executorPk: toHexLower(agent1.publicKey),
  intentHash: toHexLower(intentHash),
  merkleProof: { siblings: [] },
  nowUnix: now,
  driftToleranceSecs: 15,
  expected: {
    valid: false,
    chainFingerprint: chainFingerprintHex(
      buildSignedChain({ principal: human, principalScope: scope, certs: [cert1] }),
    ),
    certFingerprints: [certFingerprintHex(cert1)],
    reasonCode: "delegation_evidence_invalid:invalid_signature",
  },
});

const expiredCert = signDelegationCert({
  delegator: human,
  delegatePk: agent1.publicKey,
  scopeRoot: scope,
  nonce: fixedNonce(4),
  issuedAt: now - 7200,
  expirationUnix: now - 3600,
  maxDepth: 8,
});
const chainExpired = buildSignedChain({ principal: human, principalScope: scope, certs: [expiredCert] });
writeFixture("invalid-expired.json", {
  signedChain: chainExpired,
  executorPk: toHexLower(agent1.publicKey),
  intentHash: toHexLower(intentHash),
  merkleProof: { siblings: [] },
  nowUnix: now,
  driftToleranceSecs: 15,
  expected: {
    valid: false,
    chainFingerprint: chainFingerprintHex(chainExpired),
    certFingerprints: [certFingerprintHex(expiredCert)],
    reasonCode: "delegation_evidence_invalid:expired",
  },
});

const wrongIntent = refIntentLeafHash("deploy.preview", {});
writeFixture("invalid-scope-mismatch.json", {
  signedChain: chain1,
  executorPk: toHexLower(agent1.publicKey),
  intentHash: toHexLower(wrongIntent),
  merkleProof: { siblings: [] },
  nowUnix: now,
  driftToleranceSecs: 15,
  expected: {
    valid: false,
    chainFingerprint: chainFingerprintHex(chain1),
    certFingerprints: [certFingerprintHex(cert1)],
    reasonCode: "delegation_evidence_invalid:scope_mismatch",
  },
});

console.log(`Wrote fixtures to ${fixtureDir}`);

function writeFixture(name: string, fixture: Fixture): void {
  writeFileSync(join(fixtureDir, name), `${JSON.stringify(fixture, null, 2)}\n`);
}

function flipHexChar(hex: string, index: number): string {
  const chars = hex.split("");
  const c = chars[index] ?? "0";
  chars[index] = c === "a" ? "b" : "a";
  return chars.join("");
}
