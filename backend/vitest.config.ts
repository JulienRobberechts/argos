import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      UPLOAD_DIR: "/tmp/test-uploads",
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: process.env.CI ? ["tests/integration/**"] : [],
    passWithNoTests: true,
    fileParallelism: false,
    coverage: {
      reportOnFailure: true,
      exclude: [
        "src/index.ts",
        "src/infrastructure/db/migrate.ts",
        "src/infrastructure/db/pool.ts",
      ],
    },
  },
});
