import { z } from "zod";

export const PROTOCOL_VERSION = "0.2.4";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const SignatureSchema = z.union([
  z.string().regex(/^ed25519:[A-Za-z0-9_-]+$/),
  z.string().regex(/^hmac-sha256:[a-f0-9]{64}$/),
]);
export const SignaturePostureSchema = z.enum(["unsigned", "local_hmac", "external_signature", "unverified"]);
export const IdSchema = z.string().min(3).max(160);
export const IsoDateSchema = z.string().datetime({ offset: true });
export const ReasonCodeSchema = z.string().min(2).max(120);
export const ResourceRefSchema = z.string().min(1).max(500);

export const ClearingEvidenceRefsSchema = z
  .strictObject({
    correlationRef: z.string().min(1).max(500).optional(),
    obligationRef: z.string().min(1).max(500).optional(),
    counterpartyRef: z.string().min(1).max(500).optional(),
  })
  .default({});
export type ClearingEvidenceRefs = z.infer<typeof ClearingEvidenceRefsSchema>;

export const ProtocolBaseSchema = z.strictObject({
  schemaVersion: z.literal(PROTOCOL_VERSION),
  tenantId: IdSchema,
  organizationId: IdSchema,
  createdAt: IsoDateSchema,
});
