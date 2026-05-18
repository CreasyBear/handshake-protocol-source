import { describe, expect, it } from "bun:test";
import {
  proposePackageInstallActionContract,
} from "../src/runtime/package-install/tool-wrapper";
import { makeKernelFixture, registerFixtureObjects } from "./fixtures";
import { packageInstallRuntimeConfig } from "./support/package-install-flow";

describe("package install runtime wrapper", () => {
  it("turns a generated package-install tool call into an intent compilation and exact action contract", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const result = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
      principalIntentRef: "intent:install hono",
      generatedCodeOrSpecRef: "code:package-install-tool-call",
      package: "hono",
      versionRange: "^4.12.19",
    });

    expect(result.outcome).toBe("action_contract_proposed");
    if (result.outcome !== "action_contract_proposed") throw new Error("expected action contract");
    expect(result.intentCompilation.uncertaintyMarkers).toEqual([]);
    expect(result.intentCompilation.overreachReasonCodes).toEqual([]);
    expect(result.actionContract.resourceRef).toBe("npm:hono");
    expect(result.actionContract.paramsDigest).toMatch(/^sha256:/);
    expect(result.actionContract.idempotencyKey).toBe("package-install:run_demo:1:hono");
    expect(fixture.store.countRecordsOfType("intent_compilation")).toBe(1);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(0);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("refuses uncertainty instead of inventing a contract for unknown catalog objects", async () => {
    const fixture = makeKernelFixture();

    const result = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
      principalIntentRef: "intent:install hono",
      generatedCodeOrSpecRef: "code:unknown-catalog-tool-call",
      package: "hono",
      versionRange: "^4.12.19",
    });

    expect(result.outcome).toBe("intent_compilation_refused");
    if (result.outcome !== "intent_compilation_refused") throw new Error("expected compilation refusal");
    expect(result.actionContract).toBeNull();
    expect(result.refusalReasonCodes).toEqual([
      "unknown_tool_capability",
      "unknown_action_type",
      "unknown_gateway_registry_entry",
    ]);
    expect(fixture.store.countRecordsOfType("intent_compilation")).toBe(1);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(0);
  });

  it("refuses an unwrapped consequential tool before action contract proposal", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects({ ...fixture, tool: { ...fixture.tool, wrapperStatus: "unwrapped" } });

    const result = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
      principalIntentRef: "intent:install hono",
      generatedCodeOrSpecRef: "code:unwrapped-tool-call",
      package: "hono",
      versionRange: "^4.12.19",
    });

    expect(result.outcome).toBe("intent_compilation_refused");
    if (result.outcome !== "intent_compilation_refused") throw new Error("expected compilation refusal");
    expect(result.refusalReasonCodes).toEqual(["unwrapped_consequential_tool"]);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(0);
  });
});
