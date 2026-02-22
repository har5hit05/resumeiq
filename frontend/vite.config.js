import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to backend during local dev so you don't need CORS headers
    proxy: {
      "/api": {
        target:       "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
