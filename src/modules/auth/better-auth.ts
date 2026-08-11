import "server-only";

import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env/server";

import { createBetterAuth } from "./auth-factory";

export const auth = createBetterAuth({
  database: db,
  environment: getServerEnv(),
});
