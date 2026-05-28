import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

type DocSource = { name: string; text: string; optional?: boolean };

function loadDoc(path: string, optional = false): DocSource {
  if (!existsSync(path)) {
    if (optional) {
      return { name: path, text: "", optional: true };
    }
    throw new Error(`Missing required doc: ${path}`);
  }
  return { name: path, text: readFileSync(path, "utf8") };
}

function activeSources(sources: DocSource[]): DocSource[] {
  return sources.filter((source) => !source.optional || source.text.length > 0);
}

describe("dual enforcement posture", () => {
  it("requires gateway-before-mutation language and forbids admission-only protection claims", () => {
    const sources = activeSources([
      loadDoc("AGENTS.md"),
      loadDoc("docs/internal/service-workflow-story.md"),
      loadDoc("docs/internal/protocol-layman.md"),
      loadDoc("docs/internal/decisions.md"),
      loadDoc("docs/internal/protocol-notes.md"),
      loadDoc("docs/internal/service-operator-golden-path.md", true),
    ]);

    const requiredGatewayPatterns = [
      /gateway check before mutation/i,
      /run\*Gateway/i,
    ];
    const requiredAdmissionAdvisoryPatterns = [
      /admission alone is (?:not|advisory)/i,
      /ingress[- ]only posture is advisory/i,
      /advisory, not Handshake/i,
    ];
    const forbiddenAdmissionProtectionPatterns = [
      /admission (?:alone )?(?:authorizes|permits|protects) mutation/i,
      /middleware (?:alone )?(?:authorizes|permits|protects) mutation/i,
      /ingress (?:equals|is) (?:the )?protection/i,
      /admission is Handshake enforcement/i,
    ];

    for (const source of sources) {
      const combinedRequired = [...requiredGatewayPatterns, ...requiredAdmissionAdvisoryPatterns];
      expect(
        combinedRequired.some((pattern) => pattern.test(source.text)),
        `${source.name} must state gateway-before-mutation or admission-is-advisory posture`,
      ).toBe(true);

      for (const pattern of forbiddenAdmissionProtectionPatterns) {
        expect(source.text, `${source.name} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps x402 as the proof wedge for any-service gating, not payment-only product framing", () => {
    const decisions = readFileSync("docs/internal/decisions.md", "utf8");
    const agents = readFileSync("AGENTS.md", "utf8");
    const story = readFileSync("docs/internal/service-workflow-story.md", "utf8");

    for (const text of [decisions, agents]) {
      expect(text).toMatch(/x402_payment\.exact|buyer-side.*exact.*per-call/i);
      expect(text).not.toMatch(/Handshake is (?:a )?payment (?:only|product)/i);
      expect(text).not.toMatch(/only payments? (?:are|is) protected/i);
    }

    expect(story).toMatch(/x402/i);
    expect(story).not.toMatch(/Handshake is (?:a )?payment (?:only|product)/i);
  });
});
