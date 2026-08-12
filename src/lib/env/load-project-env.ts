import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

export function loadProjectEnv(projectDirectory = process.cwd()): void {
  loadEnvConfig(projectDirectory, process.env.NODE_ENV === "development");
}
