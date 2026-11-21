import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:5198",
    reducedMotion: "reduce",
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 5198 --strictPort",
    url: "http://127.0.0.1:5198",
  },
});
