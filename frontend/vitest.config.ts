import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    passWithNoTests: true,
    define: {
      __APP_VERSION__: JSON.stringify("test"),
    },
    projects: [
      {
        plugins: [react()],
        test: {
          name: "u-ui",
          include: ["src/**/*.u-ui.test.ts"],
          environment: "jsdom",
        },
      },
    ],
  },
});
