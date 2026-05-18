import { z } from "zod";

export const PROTOCOL_VERSION = "0.2.3";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

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
export const SignatureSchema = z.string().regex(/^hmac-sha256:[a-f0-9]{64}$/);
export const IdSchema = z.string().min(3).max(160);
export const IsoDateSchema = z.string().datetime({ offset: true });
export const ReasonCodeSchema = z.string().min(2).max(120);
export const ResourceRefSchema = z.string().min(1).max(500);

export const ProtocolBaseSchema = z.strictObject({
  schemaVersion: z.literal(PROTOCOL_VERSION),
  tenantId: IdSchema,
  organizationId: IdSchema,
  createdAt: IsoDateSchema,
});
