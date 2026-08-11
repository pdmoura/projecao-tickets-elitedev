import { describe, expect, it } from "vitest";

import {
  getServerEnv,
  validateTicketCredentialEncryptionKey,
} from "@/lib/env/validation";

const validKey = Buffer.alloc(32, 7).toString("base64");

const validEnv = {
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://runtime",
  DIRECT_URL: "postgresql://tooling",
  TEST_DATABASE_URL: "postgresql://test",
  BETTER_AUTH_SECRET: "test-secret",
  BETTER_AUTH_URL: "http://localhost:3000",
  TMDB_ACCESS_TOKEN: "test-token",
  TICKET_CREDENTIAL_ENCRYPTION_KEY: validKey,
};

describe("server environment", () => {
  it("accepts all required server-only variables", () => {
    expect(getServerEnv(validEnv)).toEqual(validEnv);
  });

  it("rejects a missing required variable", () => {
    const missingToken = { ...validEnv, TMDB_ACCESS_TOKEN: "" };

    expect(() => getServerEnv(missingToken)).toThrow(
      "Missing required server environment variable: TMDB_ACCESS_TOKEN",
    );
  });

  it("does not require TEST_DATABASE_URL at runtime", () => {
    const productionEnv = Object.fromEntries(
      Object.entries(validEnv).filter(([key]) => key !== "TEST_DATABASE_URL"),
    );

    expect(getServerEnv(productionEnv)).toEqual(productionEnv);
  });

  it("requires a canonical Base64 key representing 32 bytes", () => {
    expect(() => validateTicketCredentialEncryptionKey("not-base64")).toThrow(
      "TICKET_CREDENTIAL_ENCRYPTION_KEY",
    );
    expect(() =>
      validateTicketCredentialEncryptionKey(Buffer.alloc(31).toString("base64")),
    ).toThrow("TICKET_CREDENTIAL_ENCRYPTION_KEY");
    expect(() => validateTicketCredentialEncryptionKey(validKey)).not.toThrow();
  });
});
