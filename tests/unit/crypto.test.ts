import { describe, it, expect } from 'vitest';
import { encryptExport, decryptExport } from '../../src/lib/crypto';

describe('crypto', () => {
  it('round-trips: encrypt then decrypt returns original', async () => {
    const original = JSON.stringify({ hello: 'world', n: 42 });
    const passphrase = 'test-passphrase-123';

    const encrypted = await encryptExport(original, passphrase);
    const decrypted = await decryptExport(encrypted, passphrase);

    expect(decrypted).toBe(original);
  });

  it('throws user-facing error with wrong passphrase', async () => {
    const original = 'secret data';
    const encrypted = await encryptExport(original, 'correct-pass');

    await expect(decryptExport(encrypted, 'wrong-pass')).rejects.toThrow(
      'Invalid file or passphrase.'
    );
  });

  it('throws user-facing error for malformed JSON', async () => {
    await expect(decryptExport('not json at all', 'any')).rejects.toThrow(
      'Invalid file or passphrase.'
    );
  });

  it('throws user-facing error for JSON missing required fields', async () => {
    await expect(decryptExport('{"foo":"bar"}', 'any')).rejects.toThrow(
      'Invalid file or passphrase.'
    );
  });

  it('throws user-facing error for JSON with wrong field types', async () => {
    await expect(
      decryptExport(JSON.stringify({ s: 1, i: 2, d: 3 }), 'any')
    ).rejects.toThrow('Invalid file or passphrase.');
  });
});
