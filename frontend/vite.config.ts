import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 3000,
    proxy: { "/api": "http://localhost:5000" },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    env: {
      VITE_API_URL: "http://localhost/api",
      VITE_CLOUDINARY_CLOUD_NAME: "demo",
      VITE_CLOUDINARY_UPLOAD_PRESET: "preset",
    },
  },
});
