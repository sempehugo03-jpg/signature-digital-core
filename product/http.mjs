import { changeCreditsHttp } from './change-credits-http.mjs';
import { firstTouch, attributionConsent } from "./first-touch.mjs";
import { legacyProjects } from './legacy-readonly.mjs';
import { productService } from "./service.mjs";
import { productAuth } from "./auth.mjs";
import { deterministicKevinAdapter } from "./kevin-adapter.mjs";
import {
  stripeGateway,
  verifyWebhook,
  paymentConfiguration,
} from "./stripe-gateway.mjs";
import { ProductError, fail } from "./contract.mjs";
export function productHandler({
  db,
  env = {},
  clock = () => Date.now(),
  stripe,
  auth,
  kevin,
  deliveryVerifier = null,
  modifier = null,
  modifierFactory = null,
  log = () => {},
}) {
  const identity =
    auth ||
    productAuth({ db, clock, secure: env.PRODUCT_COOKIE_SECURE !== "false" });
  return async (request) => {
    const url = new URL(request.url),
      path = url.pathname
        .replace(/^\/api\/product\/?/, "")
        .split("/")
        .filter(Boolean);
    const respond = (data, status = 200, headers = {}) =>
      Response.json(data, {
        status,
        headers: {
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          ...headers,
        },
      });
    try {
      const acquisition = firstTouch({ db, env, clock });
      const linkTouch = async (user, project = null) => {
        try {
          await acquisition.link(request, user, project);
        } catch {
          log({ code: "ATTRIBUTION_UNAVAILABLE" });
        }
      };
      const payment = stripe || stripeGateway({ env, origin: url.origin });
      const service = productService({
        db,
        stripe: payment,
        clock,
        kevin: kevin || deterministicKevinAdapter({ clock }),
        qa: env.FABRYA_PRODUCT_QA === "true",
        deliveryVerifier,
        analyticsConsent: attributionConsent(request),
        creditsEnabled: env.FABRYA_CREDITS_ENABLED === "true",
      });
      if (path.join("/") === "webhook" && request.method === "POST") {
        const raw = await request.text();
        if (raw.length > 200000)
          fail("TOO_LARGE", "Événement trop volumineux.", 413);
        const event = await verifyWebhook(
          raw,
          request.headers.get("stripe-signature"),
          paymentConfiguration(env, url.origin).webhookSecret,
          clock,
        );
        return respond(await service.webhook(event));
      }
      if(path[0]==='projects' && ['credits','changes','change-files'].includes(path[2])) return changeCreditsHttp({request,path,db,identity,env,clock,modifier,modifierFactory,billing:payment});
      if (Number(request.headers.get("content-length") || 0) > 24000)
        fail("TOO_LARGE", "Votre demande est trop longue.", 413);
      if (!["GET", "POST", "PATCH"].includes(request.method))
        return respond(
          { code: "METHOD", message: "Cette action est indisponible." },
          405,
          { allow: "GET, POST, PATCH" },
        );
      if (request.method !== "GET") {
        const origin = request.headers.get("origin"),
          site = request.headers.get("sec-fetch-site");
        if (
          origin !== url.origin ||
          (site && site !== "same-origin" && site !== "none")
        )
          fail("ORIGIN", "Cette action a été refusée. Rechargez la page.", 403);
      }
      const raw = request.method === "GET" ? "{}" : await request.text();
      if (raw.length > 24000)
        fail("TOO_LARGE", "Votre demande est trop longue.", 413);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        fail("INVALID_REQUEST", "La demande est incomplète. Réessayez.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        fail("INVALID_REQUEST", "La demande est incomplète. Réessayez.");
      if (path.join('/') === 'attribution-consent') {
        if (request.method === 'GET') return respond({ state: attributionConsent(request) ? 'accepted' : 'refused' });
        if (request.method !== 'POST' || !['accept', 'refuse', 'withdraw'].includes(body.choice)) return respond({ code: 'INVALID_CONSENT_CHOICE' }, 400);
        const result = await acquisition.consent(request, body.choice);
        const response = respond({ state: result.state });
        for (const cookie of result.cookies) response.headers.append('set-cookie', cookie);
        return response;
      }
      if (path[0] === "auth") {
        if (path[1] === "session" && request.method === "GET")
          return respond({ user: await identity.user(request) });
        if (
          ["register", "login"].includes(path[1]) &&
          request.method === "POST"
        ) {
          const result = await identity[path[1]](request, body);
          if (path[1] === "register")
            await service.emit(
              "signup_completed",
              result.user,
              null,
              body.session_id,
            );
          await linkTouch(result.user);
          return respond(
            { user: result.user },
            path[1] === "register" ? 201 : 200,
            { "set-cookie": result.cookie },
          );
        }
        if (path[1] === "logout" && request.method === "POST") {
          const r = await identity.logout(request);
          return respond({ ok: true }, 200, { "set-cookie": r.cookie });
        }
        return respond({ message: "Cette action est indisponible." }, 404);
      }
      const user = await identity.user(request);
      if (user) await linkTouch(user);
      if (path[0] === "events" && request.method === "POST") {
        await identity.rate(request, "events", user?.id || "anonymous", 120);
        if (!user && !["landing_view", "signup_started"].includes(body.name))
          return respond({ ok: true });
        if (body.project_id) {
          if (!user)
            fail(
              "SESSION_EXPIRED",
              "Connectez-vous pour retrouver votre projet.",
              401,
            );
          await service.read(user, body.project_id);
        }
        await service.emit(
          body.name,
          user,
          body.project_id,
          body.session_id,
          String(body.event_id || crypto.randomUUID()).slice(0, 100),
        );
        return respond({ ok: true });
      }
      if (!user)
        fail(
          "SESSION_EXPIRED",
          "Reconnectez-vous pour retrouver votre projet. Votre travail reste sauvegardé.",
          401,
        );
      if (path[0] === "projects") {
        if (request.method !== "GET")
          await identity.rate(
            request,
            "product-" + (path[2] || "projects"),
            user.id,
            30,
          );
        if (path.length === 1 && request.method === "GET") {
          const result = await service.list(user);
          if (env.FABRYA_PRIVATE_LEGACY_READONLY === 'true') result.legacy = await legacyProjects(db, user);
          return respond(result);
        }
        if (path.length === 1 && request.method === "POST") {
          const result = await service.create(user, body);
          await linkTouch(user, result.project.id);
          return respond(result, 201);
        }
        const id = path[1];
        if (!id) fail("NOT_FOUND", "Projet introuvable.", 404);
        if(request.method==='POST' && ['jobs','revisions','approve'].includes(path[2])) {
          const current=await service.read(user,id);
          if(current.activation) fail('POSTPURCHASE_ROUTE_REQUIRED','Utilisez la bulle FABRYA pour modifier votre site.',409);
        }
        if (path.length === 2 && request.method === "GET")
          return respond(await service.read(user, id));
        if (path.length === 2 && request.method === "PATCH")
          return respond(await service.save(user, id, body));
        if (
          path[2] === "jobs" &&
          path.length === 3 &&
          request.method === "POST"
        )
          return respond(await service.requestDemo(user, id, body), 202);
        if (
          path[2] === "jobs" &&
          path[4] === "retry" &&
          request.method === "POST"
        )
          return respond(await service.retry(user, id, path[3], body), 202);
        if (
          path[2] === "jobs" &&
          path[4] === "cancel" &&
          request.method === "POST"
        )
          return respond(await service.cancel(user, id, path[3]));
        if (path[2] === "revisions" && request.method === "POST") {
          const message = String(body.message || "").trim();
          if (!message)
            fail("EMPTY_REVISION", "Décrivez la modification souhaitée.");
          return respond(
            await service.requestDemo(user, id, body, message),
            202,
          );
        }
        if (path[2] === "approve" && request.method === "POST")
          return respond(await service.approve(user, id, body));
        if (path[2] === "checkout" && request.method === "POST")
          return respond(await service.checkout(user, id));
        if (
          path[2] === "checkout-recovery-proof" &&
          path.length === 3 &&
          request.method === "GET" &&
          env.FABRYA_PRODUCT_ORIGIN ===
            "https://fabrya-product-live-validation.sempehugo03.chatgpt.site"
        )
          return respond(await service.checkoutRecoveryProof(user, id));
        if (path[2] === "payment" && request.method === "POST")
          return respond(await service.reconcile(user, id));
        if (path[2] === "abandon" && request.method === "POST")
          return respond(await service.abandon(user, id));
        if (path[2] === "portal" && request.method === "POST")
          return respond(await service.portal(user, id));
        if (
          path[2] === "versions" &&
          path[4] === "preview" &&
          request.method === "GET"
        ) {
          const v = await service.version(user, id, path[3]);
          const previewHtml =
            (kevin?.kind || "deterministic-test") === "deterministic-test"
              ? v.html.replace(
                  "Proposition déterministe de test. Les demandes libres devront être interprétées par le moteur final.",
                  "Proposition de démonstration. Votre demande est conservée ; la création définitive sera raccordée séparément.",
                )
              : v.html;
          return new Response(previewHtml, {
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "private, no-store",
              "content-security-policy":
                "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; frame-ancestors 'self'; base-uri 'none'; sandbox allow-scripts",
              "x-content-type-options": "nosniff",
            },
          });
        }
      }
      return respond(
        {
          code: "NOT_FOUND",
          message: "Cette page n’existe pas. Revenez à votre projet.",
        },
        404,
      );
    } catch (error) {
      const known = error instanceof ProductError;
      log({
        event: "product_request_failed",
        code: known ? error.code : "INTERNAL",
        request_id: crypto.randomUUID(),
      });
      return respond(
        {
          code: known ? error.code : "UNAVAILABLE",
          message: known
            ? error.message
            : "Fabrya est momentanément indisponible. Votre projet est conservé. Réessayez dans un instant.",
        },
        known ? error.status : 503,
      );
    }
  };
}
