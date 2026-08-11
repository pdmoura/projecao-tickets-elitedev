import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";

import type { PrismaClient } from "@/generated/prisma/client";
import type { ServerEnv } from "@/lib/env/validation";

type BetterAuthFactoryOptions = {
  allowSignUp?: boolean;
  database: PrismaClient;
  environment: ServerEnv;
};

export function createBetterAuth({
  allowSignUp = false,
  database,
  environment,
}: BetterAuthFactoryOptions) {
  return betterAuth({
    baseURL: environment.BETTER_AUTH_URL,
    database: prismaAdapter(database, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      autoSignIn: false,
      disableSignUp: !allowSignUp,
      enabled: true,
      minPasswordLength: 12,
    },
    secret: environment.BETTER_AUTH_SECRET,
    trustedOrigins: [...new Set([environment.APP_URL, environment.BETTER_AUTH_URL])],
    user: {
      additionalFields: {
        role: {
          defaultValue: "CUSTOMER",
          input: false,
          required: false,
          type: ["ORGANIZER", "CUSTOMER", "GATE"],
        },
      },
    },
  });
}
