import { describe, expect, it } from "bun:test";
import { requireInstallProposalGatewayRegistryEntry } from "../../src/install/install-proposal";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";
import { failureClassForProtocolError } from "../../src/http/errors/transition-error-envelope";

describe("install proposal gateway registry guard", () => {
  it("throws typed HandshakeProtocolError for orphan compiled records", () => {
    expect(() => requireInstallProposalGatewayRegistryEntry(null)).toThrow(HandshakeProtocolError);
    try {
      requireInstallProposalGatewayRegistryEntry(null);
    } catch (error) {
      expect(error).toBeInstanceOf(HandshakeProtocolError);
      const protocolError = error as HandshakeProtocolError;
      expect(protocolError.code).toBe("install_orphan_catalog_missing_gateway");
      expect(protocolError.status).toBe(422);
      expect(failureClassForProtocolError(protocolError)).toBe("proof_gap");
    }
  });
});
