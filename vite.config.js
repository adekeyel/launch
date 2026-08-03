import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Plain Vite + React SPA — no SSR, no router framework. Builds to dist/
// and deploys as static files (Vercel, Netlify, etc).
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  build: {
    outDir: "dist",
  },
});
