import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/vibe-3/" : "/",
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
}));
