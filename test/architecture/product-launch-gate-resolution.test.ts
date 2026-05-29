import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import {
  ProductLaunchGateIdSchema,
  productLaunchGateResolutionFor,
  productLaunchGateResolutions,
} from "../../src/surfaces/product-launch-gate-resolution";

describe("product launch gate resolutions", () => {
  it("pins the resolved gate posture into canonical docs", () => {
    const decisions = readFileSync("docs/internal/decisions.md", "utf8");
    const readme = readFileSync("README.md", "utf8");
    const normalizedDecisions = decisions.replace(/\s+/g, " ");
    const normalizedReadme = readme.replace(/\s+/g, " ");

    expect(decisions).toContain("Product Launch Gate Resolutions");
    expect(decisions).toContain("no former launch gate remains a user-owned vague branch");
    expect(decisions).toContain("Codex-local is selected as the first live runtime target");
    expect(decisions).toContain("Customer-gateway custody evidence is the external product wording threshold");
    expect(decisions).toContain("MCP Registry acceptance and lookup remain launch blockers");
    expect(decisions).toContain("The first buyer segment is agent builders and engineering organizations");
    expect(decisions).toContain("Terminal certificates are prominent terminal evidence");
    expect(normalizedDecisions).toContain(
      "`auth.md + x402` is the first expansion candidate, not current composite execution",
    );
    expect(decisions).toContain("Live 402 challenge evidence");
    expect(decisions).toContain("Package provenance is now satisfied for `0.2.8`");
    expect(normalizedReadme).toContain("MCP Registry discoverability is now the remaining distribution launch blocker");
    expect(normalizedReadme).toContain("`0.2.8` npm availability is verified by registry readback");
  });

  it("turns every former launch deferral into a selected, raised-bar, blocked, or cut-line decision", () => {
    const gateIds = productLaunchGateResolutions.map((resolution) => resolution.gateId).sort();

    expect(gateIds).toEqual([...ProductLaunchGateIdSchema.options].sort());
    expect(productLaunchGateResolutions).toHaveLength(8);

    for (const resolution of productLaunchGateResolutions) {
      expect(resolution.status).toMatch(/^resolved_/);
      expect(resolution.decision).not.toMatch(/\bTBD\b|\bdefer(?:red|ring)?\b|user-owned branch/i);
      expect(resolution.launchLanguageBoundary).not.toMatch(/authoriz(?:e|es|ed) mutation|creates authority/i);
      expect(resolution.nonClaims.length).toBeGreaterThan(0);
    }
  });

  it("hard-blocks launch distribution until MCP Registry evidence exists", () => {
    const distribution = productLaunchGateResolutionFor("distribution_bar");

    expect(distribution.status).toBe("resolved_blocked");
    expect(distribution.decision).toContain("official MCP Registry acceptance and lookup verification");
    expect(distribution.currentEvidence).toContain(
      "official MCP Registry GET by io.github.CreasyBear/handshake-protocol-kernel returned 404 Server not found",
    );
    expect(distribution.currentEvidence).toContain(
      "official MCP Registry search for handshake-protocol-kernel returned an empty server list",
    );
    expect(distribution.currentEvidence).toContain(
      "trusted-publish workflow completed successfully for expected_version=0.2.8 and published GitHub Actions provenance",
    );
    expect(distribution.blockerReasonCodes).toEqual([
      "mcp_registry_submission_not_accepted",
      "mcp_registry_discoverability_not_verified",
    ]);
    expect(distribution.nonClaims).toContain("not_authority_by_publication");
  });

  it("selects Codex-local and pins observed host invocation without host-wide claims", () => {
    const runtime = productLaunchGateResolutionFor("first_external_runtime_transcript");

    expect(runtime.status).toBe("resolved_selected");
    expect(runtime.decision).toContain("Codex-local is the first live runtime target");
    expect(runtime.currentEvidence.join("\n")).toContain("fresh Codex host observed and attempted");
    expect(runtime.blockerReasonCodes).toEqual([]);
    expect(runtime.nonClaims).toEqual([
      "not_authority_by_host_invocation",
      "not_host_wide_containment",
      "not_native_codex_certification",
    ]);
  });

  it("requires live signed x402 retry evidence before stronger external launch claims", () => {
    const liveProvider = productLaunchGateResolutionFor("live_external_provider_x402_proof");

    expect(liveProvider.status).toBe("resolved_blocked");
    expect(liveProvider.currentEvidence.join("\n")).toContain("HTTP 402 with payment-required header");
    expect(liveProvider.currentEvidence.join("\n")).toContain("Agentic.Market service page");
    expect(liveProvider.blockerReasonCodes).toEqual([
      "funded_customer_gateway_signer_missing",
      "live_signed_retry_not_exercised",
    ]);
    expect(liveProvider.nonClaims).toContain("not_live_paid_execution");
  });

  it("keeps auth.md plus x402 as an admitted expansion candidate, not composite authority", () => {
    const expansion = productLaunchGateResolutionFor("auth_md_x402_expansion_trigger");

    expect(expansion.status).toBe("resolved_raised_bar");
    expect(expansion.decision).toContain("auth.md + x402 is the first expansion candidate");
    expect(expansion.decision).toContain("exact contract, policy, one-use greenlight, and gateway check");
    expect(expansion.requiredEvidence).toContain(
      "x402 policy decision, one-use greenlight, gateway check, and post-gate signer evidence",
    );
    expect(expansion.nonClaims).toContain("auth_md_is_not_authority");
    expect(expansion.nonClaims).toContain("not_composite_execution_ready");
  });

  it("keeps terminal certificates prominent only as terminal evidence", () => {
    const certificate = productLaunchGateResolutionFor("terminal_certificate_prominence");

    expect(certificate.status).toBe("resolved_selected");
    expect(certificate.decision).toContain("prominent after a terminal event");
    expect(certificate.launchLanguageBoundary).toContain("terminal evidence");
    expect(certificate.nonClaims).toContain("not_permission");
    expect(certificate.nonClaims).toContain("not_cross_org_trust");
  });
});
