import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "**/coverage/**", "**/.venv/**", "**/next-env.d.ts"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs["core-web-vitals"].rules, "@next/next/no-html-link-for-pages": "off" }
  },
  { files: ["**/*.config.{js,mjs}"], languageOptions: { globals: globals.node } }
);
