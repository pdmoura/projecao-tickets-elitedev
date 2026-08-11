const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for integration tests.");
}

const testDatabaseHost = new URL(testDatabaseUrl).hostname;

if (!new Set(["localhost", "127.0.0.1", "::1"]).has(testDatabaseHost)) {
  throw new Error(
    "TEST_DATABASE_URL must point to a local isolated PostgreSQL database.",
  );
}

process.env.APP_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "test-secret-with-at-least-thirty-two-characters";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;
process.env.TMDB_ACCESS_TOKEN ??= "test-tmdb-access-token";
process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY ??= Buffer.alloc(32).toString(
  "base64",
);
