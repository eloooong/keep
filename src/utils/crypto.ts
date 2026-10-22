import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { isDemoMode } from "./demo/isDemo";

// Demo data is disposable and never uses the production encryption key.
const demoState = globalThis as typeof globalThis & { __keepDemoKey?: Buffer };

export function getEncryptionKey(): Buffer {
  if (isDemoMode()) return (demoState.__keepDemoKey ??= randomBytes(32));
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || !/^[a-f\d]{64}$/i.test(hex)) {
    throw new Error(
      "ENCRYPTION_KEY is required and must contain exactly 64 hexadecimal characters",
    );
  }
  return Buffer.from(hex, "hex");
}

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Encoding: base64url( iv (12 bytes) || authTag (16 bytes) || ciphertext )
export function encryptValue(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
}

export function decryptValue(payload: string): string {
  const data = Buffer.from(payload, "base64url");
  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Encrypted payload is malformed");
  }
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
