import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@online-order-system/types": fileURLToPath(
        new URL("../../packages/types/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.tsx"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
