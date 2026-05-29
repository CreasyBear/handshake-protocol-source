import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const {
  projectProductCompletionReadback,
  PRODUCT_COMPLETION_READBACK_KIND,
  PRODUCT_COMPLETION_STATUSES,
  PRODUCT_COMPLETION_PACK_CHECK_EXPECT_STATUS,
  assertProductCompletionGateIds,
} = await import(pathToFileURL(join(repoRoot, "dist/surfaces/index.mjs")).href);

const args = process.argv.slice(2);
const expectedStatus = optionValue(args, "--expect-status") ?? PRODUCT_COMPLETION_PACK_CHECK_EXPECT_STATUS;
const printJson = args.includes("--json");

assert.equal(
  ["completed", "closed_with_hard_blocks", "incomplete"].includes(expectedStatus),
  true,
  "--expect-status must be completed, closed_with_hard_blocks, or incomplete",
);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const proof = buildProductCompletionProof(pkg);

assert.equal(proof.proofKind, PRODUCT_COMPLETION_READBACK_KIND, "proofKind must match projector contract");
assert.equal(
  PRODUCT_COMPLETION_STATUSES.includes(proof.status),
  true,
  `status must be one of ${PRODUCT_COMPLETION_STATUSES.join(", ")}`,
);
assertProductCompletionGateIds(proof.gates.map((gate) => gate.gateId));

const dualGate = proof.gates.find((gate) => gate.gateId === "dual_enforcement_posture");
assert.equal(dualGate?.status, "incomplete", "dual_enforcement_posture must stay incomplete until structural evidence");

if (printJson) {
  console.log(JSON.stringify(proof, null, 2));
} else {
  console.log(`Product completion is ${proof.status}.`);
}

if (proof.status !== expectedStatus) {
  console.error(`Expected product completion status ${expectedStatus}, got ${proof.status}.`);
  process.exit(1);
}

function buildProductCompletionProof(pkg) {
  return projectProductCompletionReadback({
    generatedAt: new Date().toISOString(),
    commandRefs: ["node scripts/check-product-completion.mjs"],
    qualityGate: {
      command: "npm run check:repo",
      passed: false,
      evidenceRef: "quality-gate:not-passed",
    },
    gates: {
      codexLocalHostActivation: {
        status: "blocked",
        artifactVersion: pkg.version ?? "0.0.0",
        artifactSha256: null,
        observesHostToolInvocation: false,
        authorityCreated: false,
        evidenceRefs: [],
      },
      publicDistributionAndRegistry: {
        status: "blocked",
        localVersion: pkg.version ?? "0.0.0",
        npmLatestVersion: null,
        currentSurfacePublished: false,
        mcpRegistryAccepted: false,
        mcpRegistryDiscoverable: false,
        provenanceAttempted: false,
        provenanceSupported: null,
        proofGapReasonCodes: ["npm_latest_readback_failed"],
        evidenceRefs: [],
      },
      customerGatewayLiveX402PaidProof: {
        status: "blocked",
        customerGatewayCustodyPresent: false,
        livePaidRetryPerformed: false,
        terminalReadbackPresent: false,
        signerInvocationPosture: "not_observed",
        proofGapReasonCodes: ["customer_gateway_custody_packet_absent"],
        evidenceRefs: [],
      },
      authMdX402AdmissionPacket: {
        packetVersion: "v0",
        packetProjectorPresent: false,
        refusalFirstTestsPassed: false,
        redactedReadbackTestsPassed: false,
        createsAuthority: false,
        evidenceRefs: [],
      },
      dualEnforcementPosture: {
        dualEnforcementPostureTestPassed: false,
        mutationManifestGatingTestPassed: false,
        evidenceRefs: ["evidence:test:dual-enforcement-posture:pending"],
      },
      perCustomerBypassScaffold: {
        customerOnboardingRef: null,
        firstPartyDogfoodCustomerId: null,
        evidenceRefs: [],
      },
    },
  });
}

function optionValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}
