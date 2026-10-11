import { OFFER, fail } from "./contract.mjs";
export const LIVE_ACCOUNT_ID = "acct_1QDQzUA4NzNcjm7q";
const LEGACY_PRODUCTS = new Set(["prod_V6ervCHB0ynciw", "prod_V6erK4BjsInpzN"]);
export function paymentConfiguration(env, origin) {
  const mode = env.FABRYA_STRIPE_MODE || "test";
  if (!["test", "live"].includes(mode))
    fail("PAYMENT_MODE", "Configuration de paiement invalide.", 503);
  const livemode = mode === "live";
  if (
    livemode &&
    (env.FABRYA_PRODUCT_QA === "true" ||
      env.FABRYA_DEPLOYMENT_STAGE !== "production")
  )
    fail(
      "LIVE_FORBIDDEN",
      "Paiement réel indisponible dans cet environnement.",
      503,
    );
  if (
    livemode &&
    (env.FABRYA_LIVE_ACCOUNT_ID !== LIVE_ACCOUNT_ID ||
      !env.FABRYA_PRODUCT_ORIGIN ||
      env.FABRYA_PRODUCT_ORIGIN !== origin ||
      !origin.startsWith("https://"))
  )
    fail(
      "LIVE_CONFIGURATION",
      "La configuration de paiement doit être vérifiée.",
      503,
    );
  const key = livemode
    ? env.FABRYA_PRODUCT_STRIPE_LIVE_KEY
    : env.FABRYA_PRODUCT_STRIPE_TEST_KEY || env.STRIPE_SECRET_KEY_TEST;
  if (key && !new RegExp(`^(sk|rk)_${mode}_`).test(key))
    fail(
      livemode ? "PAYMENT_MODE" : "LIVE_FORBIDDEN",
      "La configuration de paiement ne correspond pas à cet environnement.",
      503,
    );
  const priceId = livemode
    ? env.FABRYA_LIVE_PRICE_ID
    : env.FABRYA_PRODUCT_STRIPE_TEST_PRICE || OFFER.testPriceId;
  const productId = livemode
    ? env.FABRYA_LIVE_PRODUCT_ID
    : env.FABRYA_PRODUCT_STRIPE_TEST_PRODUCT;
  if (
    livemode &&
    (!/^price_/.test(priceId || "") ||
      !/^prod_/.test(productId || "") ||
      LEGACY_PRODUCTS.has(productId))
  )
    fail("LIVE_CONFIGURATION", "Le catalogue Fabrya doit être vérifié.", 503);
  return {
    mode,
    livemode,
    key,
    priceId,
    productId,
    webhookSecret: livemode
      ? env.FABRYA_PRODUCT_STRIPE_LIVE_WEBHOOK_SECRET
      : env.FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET,
  };
}
/** Explicit server-only TEST/LIVE boundary. QA can never use LIVE. */
export function stripeGateway({ env, origin, fetcher = fetch }) {
  const configuration = paymentConfiguration(env, origin);
  const { key, livemode, priceId, productId } = configuration;
  if (!key) return null;
  async function verifyAccount() {
    if (!livemode) return;
    const account = await call("account");
    if (account.id !== LIVE_ACCOUNT_ID)
      fail("PAYMENT_ACCOUNT", "Le compte de paiement doit être vérifié.", 503);
  }
  async function call(
    path,
    method = "GET",
    values = null,
    idempotencyKey = null,
  ) {
    const headers = {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": "2026-08-26.dahlia",
    };
    if (values) headers["Content-Type"] = "application/x-www-form-urlencoded";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const r = await fetcher("https://api.stripe.com/v1/" + path, {
      method,
      headers,
      body: values ? new URLSearchParams(values) : undefined,
      signal: AbortSignal.timeout(12000),
    });
    const data = await r.json();
    if (!r.ok)
      fail(
        "PAYMENT_UNAVAILABLE",
        "Le paiement est momentanément indisponible. Votre version validée est conservée.",
        503,
      );
    if (typeof data.livemode === "boolean" && data.livemode !== livemode)
      fail("PAYMENT_MODE", "Mode de paiement incorrect.", 503);
    return data;
  }
  return {
    priceId,
    livemode,
    productId,
    verifyAccount,
    async verifyOffer() {
      await verifyAccount();
      const p = await call("prices/" + priceId);
      if (
        p.livemode !== livemode ||
        (productId &&
          (typeof p.product === "string" ? p.product : p.product?.id) !==
            productId) ||
        !p.active ||
        p.unit_amount !== 5900 ||
        p.currency !== "eur" ||
        p.recurring?.interval !== "month" ||
        p.recurring?.interval_count !== 1
      )
        fail("PRICE_INVALID", "Le tarif doit être de 59 € / mois.", 503);
    },
    async createSession(c) {
      await verifyAccount();
      return call(
        "checkout/sessions",
        "POST",
        {
          mode: "subscription",
          integration_identifier:
            "fabrya_product_" +
            c.checkout_id
              .slice(-8)
              .replace(/[0-9]/g, (n) => "abcdefghij"[Number(n)]),
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          customer_email: c.email,
          success_url: `${origin}/produit?project=${c.project_id}&payment=success`,
          cancel_url: `${origin}/produit?project=${c.project_id}&payment=cancel`,
          client_reference_id: c.project_id,
          "metadata[project_id]": c.project_id,
          "metadata[approval_id]": c.approval_id,
          "metadata[checkout_id]": c.checkout_id,
          "metadata[user_id]": c.user_id,
          "metadata[version_id]": c.version_id,
          "subscription_data[metadata][project_id]": c.project_id,
          "subscription_data[metadata][user_id]": c.user_id,
          "subscription_data[metadata][version_id]": c.version_id,
          "subscription_data[metadata][approval_id]": c.approval_id,
          "subscription_data[metadata][checkout_id]": c.checkout_id,
          allow_promotion_codes: "false",
        },
        c.idempotency_key,
      );
    },
    async findCheckout(c) {
      await verifyAccount();
      const params = new URLSearchParams({ limit: "100", "created[gte]": String(Math.floor(Date.parse(c.created_at) / 1000) - 300) });
      const matches = [];
      // Read every page before choosing: one early match cannot hide a duplicate.
      for (let page = 0; page < 20; page++) {
        const list = await call("checkout/sessions?" + params);
        if (!Array.isArray(list.data) || typeof list.has_more !== "boolean")
          fail("CHECKOUT_RECOVERY_REQUIRED", "La vérification du paiement doit être terminée avant de continuer. Votre version est conservée.", 409);
        for (const session of list.data) {
          if (session.metadata?.checkout_id === c.checkout_id) matches.push(session);
        }
        if (!list.has_more) {
          if (matches.length !== 1)
            fail("CHECKOUT_RECOVERY_REQUIRED", "Nous ne pouvons pas encore confirmer votre paiement précédent. Aucun nouveau paiement n’a été créé. Votre version reste conservée.", 409);
          const found = await call("checkout/sessions/" + encodeURIComponent(matches[0].id));
          const expected = ["checkout_id", "project_id", "user_id", "approval_id", "version_id"];
          if (found.livemode !== livemode || found.mode !== "subscription" || found.currency !== "eur" || found.amount_total !== 5900 || found.client_reference_id !== c.project_id || expected.some(k => found.metadata?.[k] !== c[k]))
            fail("PAYMENT_CONTEXT", "Le paiement retrouvé doit être vérifié. Aucun nouveau paiement n’a été créé.", 409);
          return found;
        }
        const last = list.data.at(-1)?.id;
        if (!last || params.get("starting_after") === last) break;
        params.set("starting_after", last);
      }
      fail("CHECKOUT_RECOVERY_REQUIRED", "La vérification du paiement précédent n’est pas terminée. Votre projet reste conservé.", 409);
    },
    getSession: (id) => call("checkout/sessions/" + encodeURIComponent(id)),
    getInvoice: (id) => call("invoices/" + encodeURIComponent(id)),
    getSessionsForSubscription: (id) =>
      call(
        "checkout/sessions?subscription=" + encodeURIComponent(id) + "&limit=2",
      ),
    getSubscription: (id) =>
      call(
        "subscriptions/" +
          encodeURIComponent(id) +
          "?expand%5B%5D=latest_invoice",
      ),
    validSubscription(sub) {
      const items = sub.items?.data;
      return (
        sub.livemode === livemode &&
        !sub.trial_end &&
        !sub.discount &&
        !sub.discounts?.length &&
        items?.length === 1 &&
        items[0].quantity === 1 &&
        items[0].price?.id === priceId &&
        items[0].price?.unit_amount === 5900 &&
        items[0].price?.currency === "eur" &&
        items[0].price?.recurring?.interval === "month" &&
        items[0].price?.recurring?.interval_count === 1 &&
        (!productId ||
          (typeof items[0].price?.product === "string"
            ? items[0].price.product
            : items[0].price?.product?.id) === productId)
      );
    },
    expireSession: (id) =>
      call(
        "checkout/sessions/" + encodeURIComponent(id) + "/expire",
        "POST",
        {},
      ),
    createPortal(customer, project) {
      return call("billing_portal/sessions", "POST", {
        customer,
        return_url: `${origin}/produit?project=${project}`,
      });
    },
  };
}
export async function verifyWebhook(
  body,
  header,
  secret,
  clock = () => Date.now(),
) {
  if (!secret || !header) fail("SIGNATURE_REQUIRED", "Signature requise.", 400);
  const fields = header.split(",").map((v) => v.split("="));
  const t = fields.find(([k]) => k === "t")?.[1];
  const signatures = fields.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!/^\d+$/.test(t || "") || Math.abs(clock() / 1000 - Number(t)) > 300)
    fail("SIGNATURE_EXPIRED", "Signature expirée.", 400);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${t}.${body}`),
      ),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  if (
    !signatures.some((sig) => {
      if (sig.length !== hash.length) return false;
      let mismatch = 0;
      for (let i = 0; i < hash.length; i++)
        mismatch |= hash.charCodeAt(i) ^ sig.charCodeAt(i);
      return mismatch === 0;
    })
  )
    fail("SIGNATURE_INVALID", "Signature invalide.", 400);
  try {
    return JSON.parse(body);
  } catch {
    fail("EVENT_INVALID", "Événement invalide.", 400);
  }
}
