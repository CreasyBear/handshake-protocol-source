import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";

export const IdempotencyLedgerStateSchema = z.enum([
  "authority_reserved",
  "mutation_started",
  "terminal_succeeded",
  "terminal_failed",
  "terminal_refused",
  "terminal_unknown",
]);
export type IdempotencyLedgerState = z.infer<typeof IdempotencyLedgerStateSchema>;

export const IdempotencyLedgerEntrySchema = ProtocolBaseSchema.extend({
  idempotencyLedgerEntryId: IdSchema,
  ledgerKeyDigest: DigestSchema,
  gatewayId: IdSchema,
  protectedSurfaceKind: z.string().min(1),
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  idempotencyKey: IdSchema,
  paramsDigest: DigestSchema,
  actionContractId: IdSchema,
  policyDecisionId: IdSchema,
  greenlightId: IdSchema.nullable(),
  gateAttemptId: IdSchema.nullable(),
  mutationAttemptId: IdSchema.nullable(),
  receiptId: IdSchema.nullable(),
  ledgerState: IdempotencyLedgerStateSchema,
  reasonCode: ReasonCodeSchema,
  evidenceRefs: z.array(z.string().min(1)).default([]),
  firstReservedAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  ledgerDigest: DigestSchema,
});
export type IdempotencyLedgerEntry = z.infer<typeof IdempotencyLedgerEntrySchema>;
