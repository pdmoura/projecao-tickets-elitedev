import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve("src");
const envValidationPath = path.join(sourceRoot, "lib", "env", "validation.ts");
const tmdbClientPath = path.join(
  sourceRoot,
  "modules",
  "catalog",
  "tmdb.client.ts",
);

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(entryPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

describe("TMDb server boundary", () => {
  it("keeps the credential and TMDb host restricted to the catalog client", () => {
    const credentialUsages = getSourceFiles(sourceRoot).filter(
      (filePath) =>
        readFileSync(filePath, "utf8").includes("TMDB_ACCESS_TOKEN") &&
        filePath !== envValidationPath,
    );
    const tmdbHostUsages = getSourceFiles(sourceRoot).filter((filePath) =>
      readFileSync(filePath, "utf8").includes("api.themoviedb.org"),
    );

    expect(credentialUsages).toEqual([tmdbClientPath]);
    expect(tmdbHostUsages).toEqual([tmdbClientPath]);
  });

  it("marks the catalog entry points as server-only modules", () => {
    expect(readFileSync(tmdbClientPath, "utf8")).toContain(
      'import "server-only";',
    );
    expect(
      readFileSync(path.join(sourceRoot, "modules", "catalog", "index.ts"), "utf8"),
    ).toContain('import "server-only";');
  });
});
