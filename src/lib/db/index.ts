import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { getRequiredServerEnvValue } from "@/lib/env/server";

import { createPrismaClient } from "./client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  createPrismaClient(getRequiredServerEnvValue("DATABASE_URL"));

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
