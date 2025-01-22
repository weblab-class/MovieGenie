import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  plugins: [react(), svgr()],
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "client/dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:
          process.env.NODE_ENV === "production"
            ? process.env.RENDER_EXTERNAL_URL
            : "http://localhost:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target:
          process.env.NODE_ENV === "production"
            ? process.env.RENDER_EXTERNAL_URL
            : "http://localhost:3000",
        ws: true,
      },
    },
  },
});
