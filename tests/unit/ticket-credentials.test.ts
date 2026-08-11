import { describe, expect, it } from "vitest";

import {
  createStoredTicketCredentials,
  decryptValidationToken,
  encryptValidationToken,
  formatManualCode,
  generateManualCode,
  generateValidationToken,
  hashValidationToken,
  normalizeManualCode,
  TicketCredentialError,
} from "@/modules/tickets/ticket-credentials";

const encryptionKey = Buffer.alloc(32, 7).toString("base64");

describe("ticket credentials", () => {
  it("generates distinct 256-bit opaque Base64URL tokens", () => {
    const first = generateValidationToken();
    const second = generateValidationToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(first, "base64url")).toHaveLength(32);
    expect(second).not.toBe(first);
  });

  it("derives a deterministic SHA-256 lookup hash", () => {
    const token = generateValidationToken();

    expect(hashValidationToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashValidationToken(token)).toBe(hashValidationToken(token));
  });

  it("encrypts and decrypts with AES-256-GCM and a fresh IV", () => {
    const token = generateValidationToken();
    const first = encryptValidationToken(token, encryptionKey);
    const second = encryptValidationToken(token, encryptionKey);

    expect(first.validationTokenCiphertext).toMatch(/^v1:/);
    expect(first.validationTokenIv).not.toBe(second.validationTokenIv);
    expect(first.validationTokenCiphertext).not.toBe(
      second.validationTokenCiphertext,
    );
    expect(decryptValidationToken(first, encryptionKey)).toBe(token);
    expect(decryptValidationToken(second, encryptionKey)).toBe(token);
  });

  it("fails safely for tampered ciphertext or an invalid key", () => {
    const token = generateValidationToken();
    const encrypted = encryptValidationToken(token, encryptionKey);
    const [format, ciphertext] = encrypted.validationTokenCiphertext.split(":");
    const tampered = Buffer.from(ciphertext!, "base64");

    tampered[0] = tampered[0]! ^ 1;

    expect(() =>
      decryptValidationToken(
        {
          ...encrypted,
          validationTokenCiphertext: `${format}:${tampered.toString("base64")}`,
        },
        encryptionKey,
      ),
    ).toThrow(TicketCredentialError);
    expect(() => decryptValidationToken(encrypted, "not-base64")).toThrow(
      TicketCredentialError,
    );
  });

  it("stores only derived/encrypted token material", () => {
    const stored = createStoredTicketCredentials(encryptionKey);

    expect(stored.validationTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.validationTokenCiphertext).toMatch(/^v1:/);
    expect(Object.keys(stored)).not.toContain("validationToken");
  });

  it("generates, normalizes and formats a canonical Crockford code", () => {
    const manualCode = generateManualCode();

    expect(manualCode).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
    expect(formatManualCode(manualCode)).toMatch(
      /^[0-9A-HJKMNP-TV-Z]{4}(?:-[0-9A-HJKMNP-TV-Z]{4}){2}$/,
    );
    expect(normalizeManualCode("o1il-2345-6789")).toBe("011123456789");
  });
});
