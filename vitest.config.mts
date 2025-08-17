import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: [
      "node_modules/**",
      "prisma/**",
      "**/*.d.ts",
      "**/seed.test.ts",     // <— ignore if it exists
    ],
    setupFiles: ["./tests/setup/env.ts", "./tests/setup/prisma.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)), // so @/ maps to project root
    },
  },
})
