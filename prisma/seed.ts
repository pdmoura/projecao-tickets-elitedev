import { pathToFileURL } from "node:url";

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/db/client";
import { getServerEnv } from "@/lib/env/validation";
import { createBetterAuth } from "@/modules/auth/auth-factory";
import type { UserRole } from "@/modules/auth/auth.types";

export const demoPassword = "ProjecaoDemo2026!";

const demoUsers: ReadonlyArray<{
  email: string;
  name: string;
  role: UserRole;
}> = [
  {
    email: "organizador@projecao.local",
    name: "Organizador Demo",
    role: "ORGANIZER",
  },
  {
    email: "cliente1@projecao.local",
    name: "Cliente Demo 1",
    role: "CUSTOMER",
  },
  {
    email: "cliente2@projecao.local",
    name: "Cliente Demo 2",
    role: "CUSTOMER",
  },
  {
    email: "portaria@projecao.local",
    name: "Portaria Demo",
    role: "GATE",
  },
];

export async function seedDemoUsers(database: PrismaClient): Promise<void> {
  const environment = getServerEnv();
  const seedAuth = createBetterAuth({
    allowSignUp: true,
    database,
    environment,
  });

  for (const demoUser of demoUsers) {
    const existingUser = await database.user.findUnique({
      where: { email: demoUser.email },
    });

    if (!existingUser) {
      await seedAuth.api.signUpEmail({
        body: {
          email: demoUser.email,
          name: demoUser.name,
          password: demoPassword,
        },
      });
    }

    await database.user.update({
      data: {
        emailVerified: true,
        name: demoUser.name,
        role: demoUser.role,
      },
      where: { email: demoUser.email },
    });
  }
}

async function main() {
  const environment = getServerEnv();
  const database = createPrismaClient(environment.DATABASE_URL);

  try {
    await seedDemoUsers(database);
  } finally {
    await database.$disconnect();
  }
}

const executedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (executedDirectly) {
  main()
    .then(() => {
      console.info("Usuários de demonstração semeados com sucesso.");
    })
    .catch((error: unknown) => {
      console.error("Falha ao semear usuários de demonstração.");
      console.error(error);
      process.exitCode = 1;
    });
}
