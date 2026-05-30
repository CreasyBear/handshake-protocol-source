/** Wire schemas for delegation evidence chains (A1-shaped field names; Handshake domains). */
import { z } from "zod";

const Hex32Schema = z.string().regex(/^[0-9a-f]{64}$/);
const Hex64Schema = z.string().regex(/^[0-9a-f]{128}$/);
const Hex16Schema = z.string().regex(/^[0-9a-f]{32}$/);

export const SubScopeProofNodeSchema = z
  .object({
    hash: Hex32Schema,
    is_left: z.boolean(),
  })
  .strict();

export const SubScopeProofSchema = z
  .object({
    subset_intents: z.array(Hex32Schema),
    proofs: z.array(z.array(SubScopeProofNodeSchema)),
  })
  .strict();

export const DelegationCertSchema = z
  .object({
    version: z.literal(1),
    delegator_pk: Hex32Schema,
    delegate_pk: Hex32Schema,
    scope_root: Hex32Schema,
    scope_proof: SubScopeProofSchema,
    nonce: Hex16Schema,
    issued_at: z.number().int().nonnegative(),
    expiration_unix: z.number().int().nonnegative(),
    max_depth: z.number().int().min(0).max(255),
    extensions: z.record(z.string(), z.unknown()).optional(),
    signature: Hex64Schema,
  })
  .strict();

export const SignedChainSchema = z
  .object({
    version: z.literal(1),
    principal_pk: Hex32Schema,
    principal_scope: Hex32Schema,
    certs: z.array(DelegationCertSchema),
  })
  .strict();

export type SubScopeProofWire = z.infer<typeof SubScopeProofSchema>;
export type WireDelegationCert = z.infer<typeof DelegationCertSchema>;
export type SignedChainWire = z.infer<typeof SignedChainSchema>;

import { normalizeSignedChainWire } from "./wire-normalize.js";

export function parseSignedChain(input: unknown): SignedChainWire {
  let raw: unknown = input;
  if (typeof input === "string") {
    raw = JSON.parse(input);
  } else if (input instanceof Uint8Array) {
    raw = JSON.parse(new TextDecoder().decode(input));
  }
  return SignedChainSchema.parse(normalizeSignedChainWire(raw));
}
