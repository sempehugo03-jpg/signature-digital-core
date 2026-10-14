import spatialCss from './spatial.css?raw';
import spatialSource from './spatial.mjs?raw';
import spatialRuntime from './spatial-runtime.mjs?raw';
import architecturalReference from './assets/immersive-reference.txt?raw';
import {spatialRail} from './spatial.mjs';
import { initializePrivateChanges } from './change-migration.mjs';
import changeHtml from './change-center.html?raw';
import changeCss from './change-center.css?raw';
import changeClient from './change-center.mjs?raw';
import { workProductAdapter, workDeliveryVerifier } from './work-product-adapter.mjs';
import {postpurchaseFactory} from './postpurchase-adapter.mjs';
import { workMcp } from './work-mcp.mjs';
import { header, footer, landing } from "./presentation.mjs";
import presentationSource from "./presentation.mjs?raw";
import { firstTouch, attributionConsent } from './first-touch.mjs';
import { privateSeoHandler } from './seo-cms.mjs';
import fixtureClient from "./interface-fixture-client.mjs?raw";
import fixtureSource from "./interface-fixtures.mjs?raw";
import { FIXTURE_SCENARIOS, fixturePreview } from "./interface-fixtures.mjs";
import reviewHtml from "./interface-review.html?raw";
import reviewClient from "./interface-review.mjs?raw";
import logo from "./assets/fabrya-logo.svg?raw";
import html from "./index.html?raw";
import css from "./product.css?raw";
import client from "./client.mjs?raw";
import conversationViewSource from './conversation-view.mjs?raw';
import {conversationView} from './conversation-view.mjs';
import contract from "./contract.mjs?raw";
import { productHandler } from "./http.mjs";
import { deterministicKevinAdapter } from "./kevin-adapter.mjs";

// Only this server-side factory changes when the real adapter is connected.
const createKevinAdapter = (env) => workProductAdapter({db:env.DB});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(env.DB) await initializePrivateChanges(env.DB,env);
    if(url.pathname === '/mcp') return workMcp(request,env);
    const arrival = env.DB && request.method === 'GET' && (url.pathname === '/' || url.pathname === '/produit')
      ? await firstTouch({db:env.DB,env}).arrival(request).catch(() => null) : null;
    const attachTouch = response => { if (arrival?.cookie) response.headers.append('set-cookie',arrival.cookie); return response; };
    const privateReview = env.FABRYA_PRODUCT_ORIGIN === "https://fabrya-product-live-validation.sempehugo03.chatgpt.site";
    if (privateReview && url.pathname.startsWith("/api/interface-fixtures/")) {
      const match = url.pathname.match(/\/versions\/fixture_v([12])\/preview$/);
      return new Response(match ? fixturePreview(Number(match[1])) : "Scénario privé indisponible.", {status:match ? 200 : 404,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; form-action 'none'"}});
    }
    if (url.pathname.startsWith("/api/seo/")) return privateSeoHandler(request,env);
    const kevin = createKevinAdapter(env);
    if (url.pathname.startsWith("/api/product/"))
      return productHandler({ db: env.DB, env:typeof env.FABRYA_POSTPURCHASE_STORAGE_FACTORY==='function'?await env.FABRYA_POSTPURCHASE_STORAGE_FACTORY(request,env):env, kevin, modifierFactory:postpurchaseFactory({db:env.DB,env}), deliveryVerifier: workDeliveryVerifier(env.DB),log:event=>console.error(JSON.stringify(event)) })(request);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Méthode indisponible.", { status: 405 });
    const privateAssets = privateReview ? {
      "/product-assets/interface-fixture-client.mjs": [fixtureClient,"text/javascript"],
      "/product-assets/interface-fixtures.mjs": [fixtureSource.replace("'./contract.mjs'", "'/product-assets/contract.mjs'"),"text/javascript"],
      "/product-assets/fixture-product-client.mjs": [client.replaceAll("/api/product/", "/api/interface-fixtures/").replaceAll("/produit", "/interface-fixture"),"text/javascript"],
    } : {};
    const assets = {
      '/product-assets/spatial.css':[spatialCss,'text/css'],
      '/product-assets/spatial.mjs':[spatialSource,'text/javascript'],
      '/product-assets/spatial-runtime.mjs':[spatialRuntime,'text/javascript'],
      '/product-assets/immersive-reference.jpg':[Uint8Array.from(atob(architecturalReference.trim()),c=>c.charCodeAt(0)),'image/jpeg'],
      '/product-assets/conversation-view.mjs':[conversationViewSource,'text/javascript'],
      ...privateAssets,
      "/product-assets/change-center.css": [changeCss,"text/css"],
      "/product-assets/change-center.mjs": [changeClient,"text/javascript"],
      "/product-assets/interface-review.mjs": [reviewClient, "text/javascript"],
      "/product-assets/fabrya-logo.svg": [logo, "image/svg+xml"],
      "/product-assets/product.css": [css, "text/css"],
      "/product-assets/client.mjs": [client, "text/javascript"],
      "/product-assets/presentation.mjs": [presentationSource, "text/javascript"],
      "/product-assets/contract.mjs": [contract, "text/javascript"],
      "/product-assets/config.json": [
        JSON.stringify({
          credits_enabled: env.FABRYA_CREDITS_ENABLED === "true",
          qa: env.FABRYA_PRODUCT_QA === "true",
          attribution_consent: attributionConsent(request) ? 'accepted' : 'unanswered',
          payment_mode:
            env.FABRYA_STRIPE_MODE === "live" &&
            env.FABRYA_PRODUCT_QA !== "true" &&
            env.FABRYA_DEPLOYMENT_STAGE === "production"
              ? "live"
              : "test",
          engine_mode: kevin.kind === "deterministic-test" ? "mock" : "work",
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
    if (privateReview && url.pathname === "/interface-fixture" && FIXTURE_SCENARIOS.includes(url.searchParams.get("scenario"))) {
      const fixtureHtml = html.replace('/product-assets/client.mjs','/product-assets/interface-fixture-client.mjs').replace('<div id="app">','<aside class="fixture-note">Scénario d’interface simulé · Aucun paiement ni donnée LIVE modifiée</aside><div id="app">');
      return new Response(request.method === "HEAD" ? null : fixtureHtml,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'"}});
    }
    if(url.pathname==='/modifications') return new Response(changeHtml,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'"}});
    if (url.pathname === "/" || url.pathname === "/produit" || (url.pathname === "/interface-review" && env.FABRYA_PRODUCT_ORIGIN === "https://fabrya-product-live-validation.sempehugo03.chatgpt.site"))
      return attachTouch(new Response(request.method === "HEAD" ? null : url.pathname === "/interface-review" ? reviewHtml : html.replace("<!--PRODUCT_SERVER_PRESENTATION-->", header() + spatialRail('vision') + '<main class="shell conversation-shell">'+conversationView(null,{visitor:true})+'</main>' + footer()), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'",
          "referrer-policy": "strict-origin-when-cross-origin",
        },
      }));
    return new Response(
      '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page introuvable</title><body><main><h1>Cette page n’existe pas.</h1><p>Votre projet reste dans votre espace.</p><a href="/produit">Revenir à Fabrya</a></main></body></html>',
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  },
};
