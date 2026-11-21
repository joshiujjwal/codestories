import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "studio.spec.js",
  webServer: { command: "npm run serve", port: 4173, reuseExistingServer: true },
  use: { baseURL: "http://127.0.0.1:4173" }
});
