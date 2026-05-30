import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  certFingerprint,
  certSignableBytes,
  certExtensionsCommitment,
  chainFingerprint,
} from "../../../src/integrations/a1-evidence/primitives/crypto.js";
import { parseHex32, toHexLower } from "../../../src/integrations/a1-evidence/hex.js";
import { parseSignedChain } from "../../../src/integrations/a1-evidence/wire-types.js";

const fixturePath = join(process.cwd(), "test/fixtures/a1-evidence/valid-1hop.json");

describe("a1-evidence crypto (A1-1)", () => {
  it("cert signable bytes are 32-byte BLAKE3 digest", () => {
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      signedChain: unknown;
    };
    const chain = parseSignedChain(fixture.signedChain);
    const cert = chain.certs[0]!;
    const ext = certExtensionsCommitment(cert.version, cert.extensions);
    const signable = certSignableBytes(cert, ext);
    expect(signable).toHaveLength(32);
  });

  it("cert and chain fingerprints match committed reference-vector fixture", () => {
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      signedChain: unknown;
      expected: { chainFingerprint: string; certFingerprints: string[] };
    };
    const chain = parseSignedChain(fixture.signedChain);
    const cert = chain.certs[0]!;
    const certFp = toHexLower(certFingerprint(cert));
    expect(certFp).toBe(fixture.expected.certFingerprints[0]!);

    const principalPk = parseHex32(chain.principal_pk, "principal_pk");
    const principalScope = parseHex32(chain.principal_scope, "principal_scope");
    const chainFp = toHexLower(
      chainFingerprint({
        principalPk,
        principalScope,
        certFingerprints: [parseHex32(certFp, "certFp")],
      }),
    );
    expect(chainFp).toBe(fixture.expected.chainFingerprint);
  });
});
