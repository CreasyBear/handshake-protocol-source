# Decisions

## D1: Promote Package-Manager Material Attestation First

Package-manager material attestation/package-install is the first concrete adapter pack expansion.

Reason: it breaks the payment-centered narrative while keeping the protected action exact, observable, and gateway-bound.

## D2: Keep x402 As Wedge, Not Center

x402 remains the first exact per-call protected action wedge. It must not become the center of the protocol or the explanation of all protected actions.

Reason: Handshake is the control layer for protected actions in automated decision making, not a payment-management system.

## D3: Expansion Order

Adapter pack expansion order is:

1. package install;
2. preview deploy;
3. repo write.

Reason: package install has enough existing compiler/gateway surface to prove the adapter spine without immediately inheriting deploy or repo-write scope.

## D4: Manifest Contract Is Activation Boundary

The adapter pack manifest is the activation boundary.

Reason: a pack is promotable only when its schemas, compiler, policy rule pack, gateway validator, receipt mapper, bypass probes, and hostile fixtures are declared together.

## D5: Runtime Ingress Selects, It Does Not Authorize

Runtime ingress may route to compilers by action family. It must not become the authority holder.

Reason: authorization belongs to exact contract policy and gateway-bound greenlight enforcement.

## D6: Use Small Typed Registries

Use small typed registries for compilers, policy packs, gateway validators, receipt mappers, bypass probes, and hostile fixtures. Do not create one god registry.

Reason: one central registry invites cross-family shortcut authority and ambient coupling.

## D7: Gateway Validator Enforces Exact Binding

The package-install gateway observed-parameter validator is the pre-consequence enforcement point.

Reason: policy decision without gateway enforcement is advisory, not Handshake.

## D8: Receipts Record Evidence And Proof Gaps

The receipt mapper records material evidence, gateway check, execution result, reconstruction material, and proof gaps.

Reason: missing evidence must survive as missing evidence. It must not be converted into confidence language.

## D9: Lifecycle Scripts Default Blocked

Lifecycle scripts are blocked by default unless separately contracted.

Reason: install scripts are consequential code execution and cannot hide under package-install authority.

## D10: Bypass Posture Blocks Promotion

Raw sibling bypass must be detected, isolated, or treated as a stop condition.

Reason: if generated code can call an unwrapped consequential package-manager tool, the generated code escaped the contract boundary.

## D11: Reports Must Bind To Exact Contract

Buyer-readable reports must reference exact contract and receipt evidence. They must not summarize authority in loose prose.

Reason: otherwise the report becomes review theatre.
