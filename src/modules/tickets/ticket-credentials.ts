import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { getServerEnv } from "@/lib/env/server";
import { validateTicketCredentialEncryptionKey } from "@/lib/env/validation";

const credentialFormat = "v1";
const credentialAdditionalData = Buffer.from("projecao:ticket-validation:v1");
const validationTokenBytes = 32;
const encryptionIvBytes = 12;
const authenticationTagBytes = 16;
const manualCodeLength = 12;
const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export type StoredTicketCredentials = {
  manualCode: string;
  validationTokenAuthTag: string;
  validationTokenCiphertext: string;
  validationTokenHash: string;
  validationTokenIv: string;
};

type EncryptedValidationToken = Pick<
  StoredTicketCredentials,
  | "validationTokenAuthTag"
  | "validationTokenCiphertext"
  | "validationTokenIv"
>;

export class TicketCredentialError extends Error {
  constructor(message = "A credencial do ingresso não pôde ser recuperada.") {
    super(message);
    this.name = "TicketCredentialError";
  }
}

function getEncryptionKey(keyBase64?: string): Buffer {
  const value = keyBase64 ?? getServerEnv().TICKET_CREDENTIAL_ENCRYPTION_KEY;

  validateTicketCredentialEncryptionKey(value);
  return Buffer.from(value, "base64");
}

function decodeCanonicalBase64(
  value: string,
  expectedBytes: number,
): Buffer {
  const decoded = Buffer.from(value, "base64");

  if (
    decoded.length !== expectedBytes ||
    decoded.toString("base64") !== value
  ) {
    throw new TicketCredentialError();
  }

  return decoded;
}

export function normalizeValidationToken(value: string): string {
  const normalized = value.trim();
  const decoded = Buffer.from(normalized, "base64url");

  if (
    decoded.length !== validationTokenBytes ||
    decoded.toString("base64url") !== normalized
  ) {
    throw new TicketCredentialError("Token de validação inválido.");
  }

  return normalized;
}

export function generateValidationToken(): string {
  return randomBytes(validationTokenBytes).toString("base64url");
}

export function hashValidationToken(validationToken: string): string {
  return createHash("sha256")
    .update(normalizeValidationToken(validationToken), "utf8")
    .digest("hex");
}

export function encryptValidationToken(
  validationToken: string,
  keyBase64?: string,
): EncryptedValidationToken {
  const normalizedToken = normalizeValidationToken(validationToken);
  const iv = randomBytes(encryptionIvBytes);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(keyBase64), iv, {
    authTagLength: authenticationTagBytes,
  });

  cipher.setAAD(credentialAdditionalData);
  const ciphertext = Buffer.concat([
    cipher.update(normalizedToken, "utf8"),
    cipher.final(),
  ]);

  return {
    validationTokenAuthTag: cipher.getAuthTag().toString("base64"),
    validationTokenCiphertext: `${credentialFormat}:${ciphertext.toString("base64")}`,
    validationTokenIv: iv.toString("base64"),
  };
}

export function decryptValidationToken(
  encrypted: EncryptedValidationToken,
  keyBase64?: string,
): string {
  try {
    const [format, encodedCiphertext, extraPart] =
      encrypted.validationTokenCiphertext.split(":");

    if (format !== credentialFormat || !encodedCiphertext || extraPart) {
      throw new TicketCredentialError();
    }

    const iv = decodeCanonicalBase64(
      encrypted.validationTokenIv,
      encryptionIvBytes,
    );
    const authTag = decodeCanonicalBase64(
      encrypted.validationTokenAuthTag,
      authenticationTagBytes,
    );
    const ciphertext = Buffer.from(encodedCiphertext, "base64");

    if (ciphertext.toString("base64") !== encodedCiphertext) {
      throw new TicketCredentialError();
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(keyBase64),
      iv,
      { authTagLength: authenticationTagBytes },
    );

    decipher.setAAD(credentialAdditionalData);
    decipher.setAuthTag(authTag);

    return normalizeValidationToken(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        "utf8",
      ),
    );
  } catch {
    throw new TicketCredentialError();
  }
}

export function generateManualCode(): string {
  return Array.from(
    randomBytes(manualCodeLength),
    (value) => crockfordAlphabet[value & 31],
  ).join("");
}

export function normalizeManualCode(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");

  if (
    normalized.length !== manualCodeLength ||
    [...normalized].some((character) => !crockfordAlphabet.includes(character))
  ) {
    throw new TicketCredentialError("Código manual inválido.");
  }

  return normalized;
}

export function formatManualCode(value: string): string {
  return normalizeManualCode(value).match(/.{4}/g)!.join("-");
}

export function createStoredTicketCredentials(
  keyBase64?: string,
): StoredTicketCredentials {
  const validationToken = generateValidationToken();

  return {
    manualCode: generateManualCode(),
    validationTokenHash: hashValidationToken(validationToken),
    ...encryptValidationToken(validationToken, keyBase64),
  };
}
