// AES-256-GCM encryption for website env vars at rest.
//
// Key: 32 bytes, base64-encoded, stored in WEBSITE_ENV_ENCRYPTION_KEY env var.
// Generate with: openssl rand -base64 32
//
// Ciphertext format (base64-encoded):
//   [12-byte IV] [16-byte auth tag] [encrypted payload]
//
// On read: decode → split → decrypt. Tampering is detected by GCM auth tag.

import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const keyB64 = process.env.WEBSITE_ENV_ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error(
      "WEBSITE_ENV_ENCRYPTION_KEY is not set. Generate with: openssl rand -base64 32, then add to .env.local"
    );
  }
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) {
    throw new Error(
      `WEBSITE_ENV_ENCRYPTION_KEY must be 32 bytes base64-encoded (got ${key.length} bytes).`
    );
  }
  return key;
}

export function encryptEnvVars(vars: Record<string, string>): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(vars), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptEnvVars(ciphertextB64: string): Record<string, string> {
  const key = getKey();
  const buf = Buffer.from(ciphertextB64, "base64");
  if (buf.length < IV_LEN + TAG_LEN) {
    throw new Error("Ciphertext too short — possibly corrupted.");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8"));
}

/**
 * Extract the env var NAMES only (not values) — for system prompt injection.
 * Swallows decryption errors and returns empty array if the key is missing or
 * ciphertext is corrupted. Values are never returned by this function.
 */
export function getEnvVarNamesSafe(ciphertextB64: string | null | undefined): string[] {
  if (!ciphertextB64) return [];
  try {
    const vars = decryptEnvVars(ciphertextB64);
    return Object.keys(vars);
  } catch (err) {
    console.warn("[encryption] getEnvVarNamesSafe failed:", err);
    return [];
  }
}
