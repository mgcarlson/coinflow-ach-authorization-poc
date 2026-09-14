import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      "/coinflow-api": {
        target: "https://api-sandbox.coinflow.cash",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/coinflow-api/, "/api"),
      },
    },
  },
});
