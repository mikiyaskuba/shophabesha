import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ["*"], // allow all hosts (required for Replit)
    hmr: {
      protocol: "wss",
      clientPort: 443,
      host: "0.0.0.0",
    },
  },
});
