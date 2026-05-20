import { z } from "zod";
import { AuthorityCertificateConsumerBindingSchema, AuthorityCertificateSignerRoleSchema } from "./schemas";
import { JsonValueSchema } from "../../foundation/schema-core";

export const AuthorityCertificateSignerInputSchema = z.discriminatedUnion("algorithm", [
  z.strictObject({
    signerRole: AuthorityCertificateSignerRoleSchema,
    keyIdentityRef: z.string().min(1),
    algorithm: z.literal("ed25519"),
    privateKeyPkcs8: z.string().min(1),
  }),
  z.strictObject({
    signerRole: AuthorityCertificateSignerRoleSchema,
    keyIdentityRef: z.string().min(1),
    algorithm: z.literal("hmac-sha256"),
    hmacSecret: z.string().min(1),
  }),
]);
export type AuthorityCertificateSignerInput = z.input<typeof AuthorityCertificateSignerInputSchema>;
export type ParsedAuthorityCertificateSignerInput = z.output<typeof AuthorityCertificateSignerInputSchema>;

export const CreateAuthorityCertificateInputSchema = z.strictObject({
  terminalObjectRef: z.string().min(1),
  signers: z.array(AuthorityCertificateSignerInputSchema).min(1),
  consumerBindings: z.array(AuthorityCertificateConsumerBindingSchema).default([]),
  extensions: z.record(z.string(), JsonValueSchema).default({}),
});
export type CreateAuthorityCertificateInput = z.input<typeof CreateAuthorityCertificateInputSchema>;
