export type TransitionGuardResult =
  | { ok: true }
  | { ok: false; code: string; message: string; status: number };

export function ok(): TransitionGuardResult {
  return { ok: true };
}

export function fail(code: string, message: string): TransitionGuardResult {
  return { ok: false, code, message, status: 409 };
}
