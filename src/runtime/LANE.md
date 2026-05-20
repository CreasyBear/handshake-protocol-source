# Runtime Lane

## Authority owner

Runtime proposal evidence: generated execution observations, candidate extraction inputs, wrapper-produced graph evidence, refusals, uncertainty markers, and action-contract proposal helpers.

## Current proof claim

Runtime evidence proof for local wrapper fixtures. Runtime evidence can support compilation and refusal; it is not authority.

## Use cases

Convert generated tool calls or generated-program blocks into runtime evidence, graph evidence, intent compilations, action contracts, or refusal records without granting execution authority.

## Constraints and assumptions

Generated programs may construct dynamic tool names, omit graph coverage, include unsupported siblings, or drift between proposal and execution. Runtime wrappers cannot own policy, gate, receipt, or mutation.

## Core components

`ingress/index.ts`, `package-install/action-proposal.ts`, `repo-write/action-proposal.ts`, `preview-deploy/action-proposal.ts`, `codemode-multi-action/generated-program-runner.ts`, and `codemode-multi-action/generated-graph-evidence.ts`.

## Failure and scale posture

Scale by adding runtime-specific proposal helpers only when they emit the same protocol evidence shape. Unsupported or partially observed graphs fail as refusals or uncertainty, not best-effort contracts.

## Future package target

`packages/runtime-mcp`, `packages/runtime-codemode`, and protected-action-specific runtime helper packages.

## Allowed imports

Protocol public area indexes, kernel transition facade where wrappers record evidence/propose candidates, canonicalization helpers, and runtime-local fixture helpers.

## Forbidden imports

Protocol root compatibility aggregators, policy decision issuance as authority, greenlight issuance, gateway checks, receipt mutation, storage internals, Hono transport internals, and direct protected-surface mutation.

## Guarding tests

`test/architecture/import-posture.test.ts`, `test/architecture/claim-boundary.test.ts`, `test/runtime/runtime-ingress.test.ts`, `test/runtime/package-install-runtime.test.ts`, `test/runtime/codemode-multi-action-runtime.test.ts`, and `test/protocol/generated-execution-graph.test.ts`.

## Public surface

Runtime ingress and wrapper helpers that turn local observed dispatches, generated tool calls, or codemode blocks into runtime execution evidence, generated graph evidence, intent compilation, action contracts, or refusals.

## Extraction trigger

Extract only after the first self-hosted protected action path proves installed runtime proposal flow through a gateway-checked receipt and the package boundary has a real consumer.

## Scope boundary

This lane may observe and propose. It must not issue policy decisions, greenlights, gateway checks, receipts, mutation attempts, provider enforcement, or production proof.
