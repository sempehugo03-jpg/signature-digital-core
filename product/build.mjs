import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
await mkdir(resolve(root, "dist/server"), { recursive: true });
await mkdir(resolve(root, "dist/client"), { recursive: true });
await mkdir(resolve(root, "dist/.openai"), { recursive: true });
await build({
  entryPoints: [resolve(root, "worker-entry.mjs")],
  outfile: resolve(root, "dist/server/index.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  loader: { ".html": "text", ".css": "text" },
  plugins: [
    {
      name: "raw-assets",
      setup(b) {
        b.onResolve({ filter: /\?raw$/ }, (args) => ({
          path: resolve(args.resolveDir, args.path.slice(0, -4)),
          namespace: "raw",
        }));
        b.onLoad({ filter: /.*/, namespace: "raw" }, async (args) => ({
          contents: await readFile(args.path, "utf8"),
          loader: "text",
        }));
      },
    },
  ],
});
const worker = await import(
  resolve(root, "dist/server/index.js") + "?qa=" + Date.now()
);
if (typeof worker.default.fetch !== "function")
  throw new Error("Worker default.fetch missing");
const response = await worker.default.fetch(
  new Request("https://qa.fabrya.test/"),
  {},
);
if (response.status !== 200 || !(await response.text()).includes("59 € / mois"))
  throw new Error("Landing build failed");
console.log(
  "Product Worker build PASS: isolated bundle, default.fetch and landing verified.",
);
