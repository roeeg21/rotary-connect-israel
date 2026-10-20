// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "claude-server-environment",
        config(_config, { mode }) {
          // Load local server secrets without putting them in Vite's client defines.
          const env = loadEnv(mode, process.cwd(), "ANTHROPIC_");
          for (const key of ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "ANTHROPIC_SEARCH_MODEL"]) {
            if (!process.env[key] && env[key]) process.env[key] = env[key];
          }
        },
      },
    ],
    resolve: {
      alias: {
        "punycode/": "punycode",
      },
    },
  },
});
