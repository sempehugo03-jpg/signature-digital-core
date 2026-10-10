import { OFFER, fail } from "./contract.mjs";
/** Test-only, server-side Stripe gateway. Never read a LIVE variable. */
export function stripeGateway({ env, origin, fetcher = fetch }) {
  const key = env.FABRYA_PRODUCT_STRIPE_TEST_KEY || env.STRIPE_SECRET_KEY_TEST;
  if (!key) return null;
  if (!/^(sk|rk)_test_/.test(key))
    fail(
      "LIVE_FORBIDDEN",
      "La clé de paiement doit être une clé Stripe TEST.",
      503,
    );
  const priceId = env.FABRYA_PRODUCT_STRIPE_TEST_PRICE || OFFER.testPriceId;
  async function call(
    path,
    method = "GET",
    values = null,
    idempotencyKey = null,
  ) {
    const headers = { Authorization: `Bearer ${key}` };
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
        "Le paiement de test est momentanément indisponible. Votre version validée est conservée.",
        503,
      );
    if (data.livemode === true)
      fail("LIVE_FORBIDDEN", "Paiement réel refusé.", 503);
    return data;
  }
  return {
    priceId,
    async verifyOffer() {
      const p = await call("prices/" + priceId);
      if (
        p.livemode !== false ||
        !p.active ||
        p.unit_amount !== 5900 ||
        p.currency !== "eur" ||
        p.recurring?.interval !== "month" ||
        p.recurring?.interval_count !== 1
      )
        fail(
          "PRICE_INVALID",
          "Le tarif de test doit être de 59 € / mois.",
          503,
        );
    },
    createSession(c) {
      return call(
        "checkout/sessions",
        "POST",
        {
          mode: "subscription",
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
          "subscription_data[metadata][project_id]": c.project_id,
          "subscription_data[metadata][user_id]": c.user_id,
          "payment_method_types[0]": "card",
          allow_promotion_codes: "false",
        },
        c.idempotency_key,
      );
    },
    getSession: (id) => call("checkout/sessions/" + encodeURIComponent(id)),
    getSubscription: (id) => call("subscriptions/" + encodeURIComponent(id)),
    validSubscription(sub) {
      const items = sub.items?.data;
      return (
        sub.livemode === false &&
        items?.length === 1 &&
        items[0].quantity === 1 &&
        items[0].price?.id === priceId &&
        items[0].price?.unit_amount === 5900 &&
        items[0].price?.currency === "eur" &&
        items[0].price?.recurring?.interval === "month"
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
