# Risks

## P0 - Dual-Lane Authority Drift

Risk: `product surface` and `protocol kernel` become peer lanes of truth.

Mitigation: canonical docs must say projection/readback over one authority
spine; claim-boundary tests must forbid product/protocol peer-lane claims.

Stop condition: any product noun creates, grants, reinterprets, or bypasses
authority.

## P0 - Handle Or Badge As Reusable Auth

Risk: generated agents treat `ServiceWorkflowHandle` or badge-like UX as a
bearer token.

Mitigation: schema false flags, workflow-admission tests, runtime misuse tests,
and forbidden vocabulary rules.

Stop condition: a handle can satisfy policy, gateway, signer, mutation, receipt,
certificate, payment, or credential requirements.

## P0 - Case-Study Overclaiming

Risk: Stripe/Kubernetes/Vault/GitHub/AWS/SLSA/Vercel/Cloudflare analogies create
unearned authority claims.

Mitigation: research is stored as mechanism rules only; source proof still wins.

Stop condition: docs imply Handshake has hosted operation, provider custody,
settlement, host containment, or marketplace trust because another product has a
similar concept.

## P1 - Surface Folder Name Confusion

Risk: `src/surfaces` sounds like a product lane.

Mitigation: keep the folder but clarify that it owns projection/readback
implementation boundaries only.

Stop condition: surface code evaluates policy, issues greenlights, performs
gateway checks, mutates, exports receipts, mints certificates, or reads raw
protocol records.

## P1 - ProtectedActionEvent Object Creep

Risk: a useful lifecycle concept becomes a duplicated protocol primitive.

Mitigation: keep it documentation/testing-only in this run and map to existing
protocol navigation/action-attempt lifecycle evidence.

Stop condition: new stored event object, package export, gateway input, or
policy input is introduced without a separate transition proposal.

## P1 - Tier 3 Kernel Creep

Risk: hosted-product needs use the simplified vocabulary to widen kernel exports
or package surfaces.

Mitigation: preserve hosted admission lock and route hosted operation to a
separate workspace or fresh pre-hosted kernel task.
