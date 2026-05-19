import type { ProtocolRecord } from "../object-registry";
import { fail, ok, type TransitionGuardResult } from "../../foundation/transition-guards";

export function guardCatalogRegistration(record: ProtocolRecord): TransitionGuardResult {
  if (
    record.objectType === "tool_capability" ||
    record.objectType === "action_type" ||
    record.objectType === "gateway_registry_entry" ||
    record.objectType === "operating_envelope"
  ) {
    return ok();
  }
  return fail(
    "invalid_transition_direct_protocol_write",
    `Direct writes are not allowed for protocol object type ${record.objectType}. Use the protocol lifecycle method instead.`,
  );
}
