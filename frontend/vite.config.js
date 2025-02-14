import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

const isProduction = process.env.VERCEL || process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    https:
      !isProduction &&
      fs.existsSync("./ssl/key.pem") &&
      fs.existsSync("./ssl/cert.pem")
        ? {
            key: fs.readFileSync("./ssl/key.pem"),
            cert: fs.readFileSync("./ssl/cert.pem"),
          }
        : false,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: !isProduction, // Only enable sourcemaps in development
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@mui")) {
              return "mui";
            }
            if (id.includes("react")) {
              return "react";
            }
            if (id.includes("stripe")) {
              return "stripe";
            }
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ["@mui/material", "@mui/icons-material"],
  },
  publicDir: "public",
});
