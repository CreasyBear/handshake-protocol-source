export async function digestUtf8Content(content: string): Promise<`sha256:${string}`> {
  const bytes = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${toHex(digest)}`;
}

export function utf8ByteLength(content: string): number {
  return new TextEncoder().encode(content).byteLength;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
