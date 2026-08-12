import { defineConfig } from "prisma/config";

import { loadProjectEnv } from "./src/lib/env/load-project-env";

loadProjectEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
});
