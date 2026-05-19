import { z } from "zod";

export const CreateReceiptExportInputSchema = z.strictObject({
  receiptId: z.string().min(1),
  exportFormat: z.enum(["json", "redacted_json"]).default("redacted_json"),
  redactionProfileRef: z.string().min(1).default("redaction:default"),
  exportPurposeCode: z.string().min(1).default("audit_drop_copy"),
  requestedByRef: z.string().min(1),
  evidenceRetentionUntil: z.string().datetime({ offset: true }).nullable().default(null),
});
export type CreateReceiptExportInput = z.input<typeof CreateReceiptExportInputSchema>;
