import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              '@mui/material',
              '@mui/icons-material',
              '@stripe/stripe-js',
              '@stripe/react-stripe-js'
            ]
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      },
      chunkSizeWarningLimit: 1000,
      assetsDir: 'assets',
      manifest: true
    },
    optimizeDeps: {
      include: ["@mui/material", "@mui/icons-material"]
    },
    server: {
      port: 3000,
      strictPort: false,
      host: true,
      open: true,
      proxy: mode === 'development' ? {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      } : undefined
    },
    preview: {
      port: 3000,
      strictPort: false,
      host: true
    },
    define: {
      'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY)
    }
  };
});