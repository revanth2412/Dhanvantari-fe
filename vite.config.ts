import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
// CommonJS package — only the default export is reachable from ESM.
import JavaScriptObfuscator from "javascript-obfuscator";
import path from "node:path";

/** Chunks that hold third-party code — obfuscating them buys nothing. */
const VENDOR_CHUNKS = new Set(["react", "supabase", "gsap", "icons", "vendor"]);

/**
 * Obfuscates the app's own chunks once the bundle is fully assembled.
 *
 * Two things this must NOT do, both learned the hard way:
 *
 *  - Obfuscate source files (what the off-the-shelf plugin does). It rewrites
 *    the specifier of every `import("…")` into a string-array lookup, Rollup
 *    can no longer follow it, and the entire route-splitting graph silently
 *    collapses into a single chunk.
 *  - Obfuscate in `renderChunk`. At that point cross-chunk imports are still
 *    Rollup placeholders (`!~{007}~`); hiding one inside an encoded string
 *    array means Rollup never substitutes the real filename and every lazy
 *    route 404s at runtime.
 *
 * `generateBundle` runs after both are settled, so the emitted code carries
 * real relative URLs which the browser resolves at runtime.
 *
 * Control-flow flattening and dead-code injection stay off — they cost several
 * times the runtime for protection this app doesn't need.
 */
function obfuscateAppChunks(): Plugin {
  return {
    name: "medivaani:obfuscate-app-chunks",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== "chunk" || VENDOR_CHUNKS.has(file.name)) continue;
        file.code = JavaScriptObfuscator.obfuscate(file.code, {
          compact: true,
          identifierNamesGenerator: "hexadecimal",
          simplify: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          stringArrayEncoding: ["base64"],
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false,
          selfDefending: false,
          splitStrings: false,
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
          sourceMap: false,
        }).getObfuscatedCode();
      }
    },
  };
}

/**
 * Production build policy
 * -----------------------
 * - Vendor code is split by library, so a release invalidates the app chunk
 *   without evicting React/Supabase/GSAP from the browser cache.
 * - lucide-react is pinned into ONE icon chunk: left alone Rollup emits a
 *   separate ~300-byte file per icon, costing more in requests than it saves.
 * - Files are named by hash only, so the bundle stops advertising the app's
 *   page and component structure.
 * - No sourcemaps ship; terser mangles top-level names, strips comments, and
 *   drops console.log/info/debug (warn and error survive so real production
 *   failures stay reportable).
 *
 * https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react(), obfuscateAppChunks()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    target: "es2020",
    sourcemap: false,
    minify: "terser",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    terserOptions: {
      compress: {
        passes: 2,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: { toplevel: true },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        entryFileNames: "assets/[hash].js",
        chunkFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash][extname]",
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // lucide-react is intentionally NOT grouped: one icon chunk would
          // pull every icon in the app into the first paint. Left to Rollup,
          // each route's icons ride along inside that route's own chunk.
          if (id.includes("lucide-react")) return undefined;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("gsap")) return "gsap";
          if (
            id.includes("react-router") ||
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("/scheduler/")
          ) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
});
