export interface TokenPayload {
  userId: number;
}

const TOKEN_TTL_SECONDS = 60 * 60;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in the environment");
  }
  return secret;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return atob(padded);
}

function base64UrlToBytes(input: string): Uint8Array {
  const binary = base64UrlDecode(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function jsonToBase64Url(value: object): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

async function hmacKey(usage: KeyUsage) {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getJwtSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function signToken(userId: number): Promise<string> {
  const header = jsonToBase64Url({ alg: "HS256", typ: "JWT" });
  const now = nowSeconds();
  const payload = jsonToBase64Url({
    userId,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  });
  const data = `${header}.${payload}`;

  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    await hmacKey("sign"),
    new TextEncoder().encode(data),
  );

  return `${data}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  const valid = await globalThis.crypto.subtle.verify(
    "HMAC",
    await hmacKey("verify"),
    base64UrlToBytes(signatureB64),
    new TextEncoder().encode(data),
  );

  if (!valid) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64)) as {
    userId?: unknown;
    exp?: unknown;
  };

  if (typeof payload.userId !== "number") {
    throw new Error("Invalid token payload");
  }

  if (typeof payload.exp === "number" && payload.exp <= nowSeconds()) {
    throw new Error("Token expired");
  }

  return { userId: payload.userId };
}
