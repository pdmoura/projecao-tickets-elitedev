import "server-only";

import {
  createCipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { getServerEnv } from "@/lib/env/server";

export type StoredTicketCredentials = {
  manualCode: string;
  validationTokenAuthTag: string;
  validationTokenCiphertext: string;
  validationTokenHash: string;
  validationTokenIv: string;
};

export function createStoredTicketCredentials(): StoredTicketCredentials {
  const validationToken = randomBytes(32).toString("base64url");
  const validationTokenIv = randomBytes(12);
  const encryptionKey = Buffer.from(
    getServerEnv().TICKET_CREDENTIAL_ENCRYPTION_KEY,
    "base64",
  );
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, validationTokenIv);
  const validationTokenCiphertext = Buffer.concat([
    cipher.update(validationToken, "utf8"),
    cipher.final(),
  ]);

  return {
    manualCode: randomBytes(10).toString("hex").toUpperCase(),
    validationTokenAuthTag: cipher.getAuthTag().toString("base64"),
    validationTokenCiphertext: validationTokenCiphertext.toString("base64"),
    validationTokenHash: createHash("sha256").update(validationToken).digest("hex"),
    validationTokenIv: validationTokenIv.toString("base64"),
  };
}
