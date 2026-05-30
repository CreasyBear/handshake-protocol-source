const HEX32 = /^[0-9a-f]{64}$/;
const HEX64 = /^[0-9a-f]{128}$/;
const HEX16 = /^[0-9a-f]{32}$/;

export function parseHex32(value: string, field: string): Uint8Array {
  const normalized = value.trim().toLowerCase();
  if (!HEX32.test(normalized)) {
    throw new Error(`${field} must be 64 lowercase hex characters`);
  }
  return hexToBytes(normalized);
}

export function parseHex64(value: string, field: string): Uint8Array {
  const normalized = value.trim().toLowerCase();
  if (!HEX64.test(normalized)) {
    throw new Error(`${field} must be 128 lowercase hex characters`);
  }
  return hexToBytes(normalized);
}

export function parseHex16(value: string, field: string): Uint8Array {
  const normalized = value.trim().toLowerCase();
  if (!HEX16.test(normalized)) {
    throw new Error(`${field} must be 32 lowercase hex characters`);
  }
  return hexToBytes(normalized);
}

export function toHexLower(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function writeU64Be(view: DataView, offset: number, value: number | bigint): void {
  const v = typeof value === "bigint" ? value : BigInt(value);
  view.setBigUint64(offset, v, false);
}

export function writeU64Le(view: DataView, offset: number, value: number | bigint): void {
  const v = typeof value === "bigint" ? value : BigInt(value);
  view.setBigUint64(offset, v, true);
}
