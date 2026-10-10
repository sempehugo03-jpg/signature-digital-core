import html from "./index.html";
import css from "./product.css";
import client from "./client.mjs?raw";
import contract from "./contract.mjs?raw";
import { productHandler } from "./http.mjs";
import { deterministicKevinAdapter } from "./kevin-adapter.mjs";

// Only this server-side factory changes when the real adapter is connected.
const createKevinAdapter = (_env) => deterministicKevinAdapter();
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const kevin = createKevinAdapter(env);
    if (url.pathname.startsWith("/api/product/"))
      return productHandler({ db: env.DB, env, kevin })(request);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Méthode indisponible.", { status: 405 });
    const assets = {
      "/product-assets/product.css": [css, "text/css"],
      "/product-assets/client.mjs": [client, "text/javascript"],
      "/product-assets/contract.mjs": [contract, "text/javascript"],
      "/product-assets/config.json": [
        JSON.stringify({
          qa: env.FABRYA_PRODUCT_QA === "true",
          engine_mode: kevin.kind === "deterministic-test" ? "mock" : "real",
        }),
        "application/json",
      ],
    };
    const asset = assets[url.pathname];
    if (asset)
      return new Response(request.method === "HEAD" ? null : asset[0], {
        headers: {
          "content-type": asset[1] + "; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    if (url.pathname === "/" || url.pathname === "/produit")
      return new Response(request.method === "HEAD" ? null : html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'",
          "referrer-policy": "strict-origin-when-cross-origin",
        },
      });
    return new Response(
      '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page introuvable</title><body><main><h1>Cette page n’existe pas.</h1><p>Votre projet reste dans votre espace.</p><a href="/produit">Revenir à Fabrya</a></main></body></html>',
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  },
};
