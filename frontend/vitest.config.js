import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: "vitest.setup.js",
    environment: "jsdom",
    globals: true,
  },
});
