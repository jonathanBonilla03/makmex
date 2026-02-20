import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  cacheDir: ".vite",
  // Allow the Cloudflare preview host so Vite accepts incoming requests from it.
  server: {
    // Add hostnames that are allowed to access the dev server.
    // You can add more hosts to this array if needed.
    allowedHosts: ["betting-drugs-exploration-revolution.trycloudflare.com"],
  },
});
