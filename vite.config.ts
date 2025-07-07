import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "./", // Important for Electron

  server: {
    host: "::",
    port: 5173,
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 👇 This enables React Router fallback
  // So `/dashboard` doesn't 404 in Electron
  assetsInclude: ["**/*.svg"],
}));
