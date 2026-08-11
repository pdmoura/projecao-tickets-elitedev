export type ServerEnv = {
  APP_URL: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  TEST_DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TMDB_ACCESS_TOKEN: string;
  TICKET_CREDENTIAL_ENCRYPTION_KEY: string;
};

const requiredKeys = [
  "APP_URL",
  "DATABASE_URL",
  "DIRECT_URL",
  "TEST_DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "TMDB_ACCESS_TOKEN",
  "TICKET_CREDENTIAL_ENCRYPTION_KEY",
] as const satisfies readonly (keyof ServerEnv)[];

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function getRequiredServerEnvValue(
  key: keyof ServerEnv,
  source: EnvironmentSource = process.env,
): string {
  const value = source[key]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return value;
}

export function validateTicketCredentialEncryptionKey(value: string): void {
  const isBase64 =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    );
  const decoded = isBase64 ? Buffer.from(value, "base64") : undefined;

  if (
    !decoded ||
    decoded.length !== 32 ||
    decoded.toString("base64") !== value
  ) {
    throw new Error(
      "TICKET_CREDENTIAL_ENCRYPTION_KEY must be canonical Base64 for exactly 32 bytes.",
    );
  }
}

export function getServerEnv(source: EnvironmentSource = process.env): ServerEnv {
  const values = Object.fromEntries(
    requiredKeys.map((key) => [key, getRequiredServerEnvValue(key, source)]),
  ) as ServerEnv;

  validateTicketCredentialEncryptionKey(values.TICKET_CREDENTIAL_ENCRYPTION_KEY);

  return values;
}
