import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve("src");
const authRoot = path.join(sourceRoot, "modules", "auth");
const betterAuthImport = /(?:from\s*|import\s*\()\s*["']better-auth(?:\/[^"']*)?["']/;

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(entryPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

describe("Better Auth import boundary", () => {
  it("allows Better Auth imports only inside src/modules/auth", () => {
    const violations = getSourceFiles(sourceRoot)
      .filter((filePath) => !filePath.startsWith(authRoot))
      .filter((filePath) => betterAuthImport.test(readFileSync(filePath, "utf8")));

    expect(violations).toEqual([]);
  });
});
