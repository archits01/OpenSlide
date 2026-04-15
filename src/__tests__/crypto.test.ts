import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes as hex
});

describe('crypto', () => {
  it('encrypt returns iv:tag:ciphertext format', async () => {
    const { encrypt } = await import('../lib/crypto');
    const result = encrypt('hello');
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12-byte IV = 24 hex chars
    expect(parts[1]).toHaveLength(32); // 16-byte auth tag = 32 hex chars
  });

  it('decrypt reverses encrypt', async () => {
    const { encrypt, decrypt } = await import('../lib/crypto');
    const plaintext = 'ya29.supersecret_token';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('two encryptions of same value produce different ciphertexts (random IV)', async () => {
    const { encrypt } = await import('../lib/crypto');
    expect(encrypt('same')).not.toBe(encrypt('same'));
  });

  it('decrypt throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('../lib/crypto');
    const blob = encrypt('secret');
    const tampered = blob.slice(0, -4) + 'ffff';
    expect(() => decrypt(tampered)).toThrow();
  });
});
