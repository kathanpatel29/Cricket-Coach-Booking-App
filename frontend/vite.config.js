import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import autoprefixer from "autoprefixer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === "production";

  return {
    plugins: [react()],
    css: { postcss: { plugins: [autoprefixer] } },
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    build: {
      outDir: "dist",
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1000,
      manifest: true,
    },
    server: {
      port: 3000,
      host: true,
      open: true,
      proxy: {
        "/api": {
          target: isProd
            ? "https://cricket-coach-booking-app-backend.vercel.app"
            : "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: { port: 3000, host: true },
    define: { "process.env.VITE_STRIPE_PUBLIC_KEY": JSON.stringify(env.VITE_STRIPE_PUBLIC_KEY) },
  };
});
