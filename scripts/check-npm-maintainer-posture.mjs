import { readFileSync } from "node:fs";

const POSTURE_KIND = "handshake.npm_maintainer_posture";
const POSTURE_VERSION = "v1";
const args = process.argv.slice(2);
const jsonOutput = hasFlag("--json");
const registryReadback = hasFlag("--registry-readback");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const serverJson = JSON.parse(readFileSync("server.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const runbook = readFileSync("docs/internal/release-admin-runbook.md", "utf8");

const posture = await buildPosture();
const failedChecks = posture.localChecks.filter((check) => check.status === "failed");
const failedRemoteChecks = posture.remoteReadback.checks.filter((check) => check.status === "failed");
posture.status = failedChecks.length > 0 || failedRemoteChecks.length > 0 ? "blocked" : "local_ready";

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(posture, null, 2)}\n`);
} else {
  printText(posture);
}

if (posture.status === "blocked") process.exit(1);

async function buildPosture() {
  const localChecks = [
    check("package_identity_bound", pkg.name === "handshake-protocol-kernel" && pkg.version === serverJson.version, {
      pass: `${pkg.name}@${pkg.version} matches server.json ${serverJson.version}`,
      fail: "package.json and server.json identity/version are not aligned",
      evidenceRefs: ["package.json", "server.json"],
    }),
    check("release_scripts_bound", hasRequiredReleaseScripts(), {
      pass: "package release and npm-maintainer posture scripts are present",
      fail: "package release scripts are missing npm maintainer posture checks",
      evidenceRefs: ["package.json#scripts"],
    }),
    check("pack_check_runs_maintainer_posture", scriptContains("pack:check", "check-npm-maintainer-posture.mjs"), {
      pass: "pack:check includes npm maintainer posture",
      fail: "pack:check does not include npm maintainer posture",
      evidenceRefs: ["package.json#scripts.pack:check"],
    }),
    check("no_install_lifecycle_scripts", installLifecycleScripts().length === 0, {
      pass: "package does not define install-time lifecycle scripts",
      fail: `package defines install-time lifecycle scripts: ${installLifecycleScripts().join(", ")}`,
      evidenceRefs: ["package.json#scripts"],
    }),
    check("package_surface_allowlisted", packageFilesAreAllowlisted(), {
      pass: "package files are limited to runtime artifacts and public metadata",
      fail: "package files include source, test, planning, or internal paths",
      evidenceRefs: ["package.json#files"],
    }),
    check("readme_non_authority_claims_present", readmeHasNonAuthorityClaims(), {
      pass: "README keeps npm/MCP/package surfaces non-authority",
      fail: "README is missing required non-authority claims",
      evidenceRefs: ["README.md"],
    }),
    check("runbook_high_activity_posture_present", runbookHasHighActivityPosture(), {
      pass: "release runbook defines high-activity npm maintainer posture",
      fail: "release runbook is missing high-activity npm maintainer posture",
      evidenceRefs: ["docs/internal/release-admin-runbook.md"],
    }),
  ];

  return {
    postureKind: POSTURE_KIND,
    postureVersion: POSTURE_VERSION,
    status: "local_ready",
    package: {
      name: pkg.name,
      version: pkg.version,
      mcpName: pkg.mcpName,
      serverJsonName: serverJson.name,
      serverJsonVersion: serverJson.version,
    },
    authorityBoundary: {
      createsAuthority: false,
      createsPolicyDecision: false,
      createsGreenlight: false,
      performsGatewayCheck: false,
      performsMutation: false,
      publishesPackage: false,
      changesDistTags: false,
      changesPackageSettings: false,
      deprecatesPackage: false,
    },
    localChecks,
    remoteReadback: registryReadback ? await buildRemoteReadback() : notRequestedRemoteReadback(),
    manualExternalChecks: [
      manual(
        "npm_account_2fa_or_token_disallow",
        "Verify npm account/package publishing requires 2FA or disallows tokens.",
      ),
      manual(
        "trusted_publisher_artifact_boundary",
        "Verify Trusted Publishing is configured only for the artifact repository.",
      ),
      manual("long_lived_write_tokens_absent", "Verify no long-lived npm write token can publish this package."),
      manual("maintainer_list_minimal", "Verify package maintainers are minimal and expected."),
      manual("dist_tags_intended", "Verify latest, next, beta, and deprecated versions match the release plan."),
      manual(
        "support_intake_monitored",
        "Verify issues, discussions, and security channels are monitored after promotion.",
      ),
    ],
  };
}

function check(id, condition, messages) {
  return {
    id,
    status: condition ? "passed" : "failed",
    summary: condition ? messages.pass : messages.fail,
    evidenceRefs: messages.evidenceRefs,
  };
}

function manual(id, summary) {
  return {
    id,
    status: "manual_required",
    summary,
  };
}

function hasFlag(flag) {
  return args.includes(flag);
}

function hasRequiredReleaseScripts() {
  return (
    pkg.scripts?.["release:admin:check"] === "node scripts/check-release-admin.js" &&
    pkg.scripts?.["release:admin:check:remote"] === "node scripts/check-release-admin.js --remote-readback" &&
    pkg.scripts?.["release:npm:posture"] === "node scripts/check-npm-maintainer-posture.mjs" &&
    pkg.scripts?.["release:npm:posture:remote"] === "node scripts/check-npm-maintainer-posture.mjs --registry-readback"
  );
}

function scriptContains(scriptName, expected) {
  return typeof pkg.scripts?.[scriptName] === "string" && pkg.scripts[scriptName].includes(expected);
}

function installLifecycleScripts() {
  const lifecycleNames = ["preinstall", "install", "postinstall"];
  return lifecycleNames.filter((scriptName) => typeof pkg.scripts?.[scriptName] === "string");
}

function packageFilesAreAllowlisted() {
  const expectedFiles = ["bin", "dist", "server.json", "README.md", "CHANGELOG.md", "LICENSE", "NOTICE"];
  const files = Array.isArray(pkg.files) ? pkg.files : [];
  return files.length === expectedFiles.length && expectedFiles.every((file) => files.includes(file));
}

function readmeHasNonAuthorityClaims() {
  return (
    /Public npm availability\s+does not create authority/i.test(readme) &&
    /MCP Registry discoverability remains a proof gap/i.test(readme) &&
    /does not evaluate policy/i.test(readme) &&
    /gateway checks/i.test(readme) &&
    /not hosted operation/i.test(readme)
  );
}

function runbookHasHighActivityPosture() {
  return (
    /First-Time npm Maintainer Practices/.test(runbook) &&
    /Three-Month High-Activity Readiness/.test(runbook) &&
    /Only levels 3 through 6 count as adoption evidence/.test(runbook) &&
    /no install-time telemetry, phone-home behavior/.test(runbook) &&
    /Support intake should classify every public report/.test(runbook)
  );
}

function notRequestedRemoteReadback() {
  return {
    status: "not_requested",
    checks: [],
    downloads: null,
    note: "Run npm run release:npm:posture:remote after publication or dist-tag changes.",
  };
}

async function buildRemoteReadback() {
  const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`;
  const latestUrl = `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/latest`;
  const downloadsUrl = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg.name)}`;
  const [packageReadback, latestReadback, downloadsReadback] = await Promise.all([
    fetchJson(packageUrl),
    fetchJson(latestUrl),
    fetchJson(downloadsUrl),
  ]);
  const distTags = packageReadback.json?.["dist-tags"] ?? {};
  const latestDist = latestReadback.json?.dist ?? {};
  const checks = [
    check("registry_package_readable", packageReadback.ok, {
      pass: "npm package registry document is readable",
      fail: packageReadback.error ?? `npm package registry returned ${packageReadback.status}`,
      evidenceRefs: [packageUrl],
    }),
    check("registry_latest_matches_local", latestReadback.json?.version === pkg.version, {
      pass: `npm latest resolves to local package version ${pkg.version}`,
      fail: `npm latest is ${latestReadback.json?.version ?? "unreadable"}, local package is ${pkg.version}`,
      evidenceRefs: [latestUrl],
    }),
    check("dist_tag_latest_matches_local", distTags.latest === pkg.version, {
      pass: `latest dist-tag points at ${pkg.version}`,
      fail: `latest dist-tag points at ${distTags.latest ?? "missing"}, local package is ${pkg.version}`,
      evidenceRefs: [packageUrl],
    }),
    check("registry_signature_present", Array.isArray(latestDist.signatures) && latestDist.signatures.length > 0, {
      pass: "npm registry signature metadata is present",
      fail: "npm registry signature metadata is missing",
      evidenceRefs: [latestUrl],
    }),
    check("registry_provenance_present", Boolean(latestDist.attestations?.provenance), {
      pass: "npm provenance attestation metadata is present",
      fail: "npm provenance attestation metadata is missing",
      evidenceRefs: [latestUrl],
    }),
  ];

  return {
    status: checks.some((remoteCheck) => remoteCheck.status === "failed") ? "failed" : "passed",
    checks,
    distTags,
    downloads: downloadsReadback.ok
      ? {
          period: `${downloadsReadback.json?.start ?? "unknown"}:${downloadsReadback.json?.end ?? "unknown"}`,
          count: downloadsReadback.json?.downloads ?? null,
          classification: "telemetry_only_until_bound_to_external_adoption_evidence",
        }
      : {
          period: "last-week",
          count: null,
          classification: "proof_gap_download_readback_failed",
        },
  };
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      json: parseJsonOrNull(text),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      json: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseJsonOrNull(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function printText(output) {
  console.log(`${output.postureKind} ${output.status}`);
  for (const localCheck of output.localChecks) {
    console.log(`${localCheck.status === "passed" ? "PASS" : "FAIL"} ${localCheck.id}: ${localCheck.summary}`);
  }
  console.log(`remote_readback: ${output.remoteReadback.status}`);
  for (const remoteCheck of output.remoteReadback.checks) {
    console.log(`${remoteCheck.status === "passed" ? "PASS" : "FAIL"} ${remoteCheck.id}: ${remoteCheck.summary}`);
  }
  for (const manualCheck of output.manualExternalChecks) {
    console.log(`MANUAL ${manualCheck.id}: ${manualCheck.summary}`);
  }
}
