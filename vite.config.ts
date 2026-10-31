import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

function staticSpaPlugin(): Plugin {
  return {
    name: "static-spa-routes",
    closeBundle() {
      const distDir = path.resolve(process.cwd(), "dist");
      const indexPath = path.join(distDir, "index.html");
      if (!fs.existsSync(indexPath)) return;

      const html = fs.readFileSync(indexPath, "utf-8");
      const routes = [
        "dashboard",
        "cases",
        "cases/my",
        "cases/unassigned",
        "cases/resolved",
        "agents",
        "login",
      ];

      for (const route of routes) {
        const routeDir = path.join(distDir, route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, "index.html"), html, "utf-8");
      }
    },
  };
}

export default defineConfig(() => ({
  plugins: [svelte(), staticSpaPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: process.env.DISABLE_HMR !== "true",
    watch: process.env.DISABLE_HMR === "true" ? null : {},
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log(
              `[PROXY] ${req.url} -> ${proxyReq.getHeader("host")}${proxyReq.path}`,
            );
          });

          proxy.on("error", (err) => {
            console.error("[PROXY ERROR]", err);
          });
        },
      },
    },
  },
}));
