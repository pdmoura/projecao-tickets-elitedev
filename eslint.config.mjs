import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/modules/auth/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["better-auth", "better-auth/*"],
              message:
                "Importe a fachada de '@/modules/auth'; Better Auth é interno ao módulo de autenticação.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default config;
