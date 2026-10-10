import test from "node:test";
import assert from "node:assert/strict";
import {
  paymentConfiguration,
  stripeGateway,
  LIVE_ACCOUNT_ID,
} from "../../product/stripe-gateway.mjs";
import { fixture, readyProject } from "./helpers.mjs";
const origin = "https://product.fabrya.example";
const env = {
  FABRYA_STRIPE_MODE: "live",
  FABRYA_DEPLOYMENT_STAGE: "production",
  FABRYA_LIVE_ACCOUNT_ID: LIVE_ACCOUNT_ID,
  FABRYA_PRODUCT_ORIGIN: origin,
  FABRYA_PRODUCT_STRIPE_LIVE_KEY: "rk_live_fixture_only",
  FABRYA_LIVE_PRODUCT_ID: "prod_new_fabrya",
  FABRYA_LIVE_PRICE_ID: "price_new_fabrya",
};
const price = {
  id: env.FABRYA_LIVE_PRICE_ID,
  product: env.FABRYA_LIVE_PRODUCT_ID,
  livemode: true,
  active: true,
  unit_amount: 5900,
  currency: "eur",
  recurring: { interval: "month", interval_count: 1 },
};
test("LIVE configuration rejects QA, wrong key, wrong account, origin and legacy catalogue", () => {
  assert.equal(paymentConfiguration(env, origin).livemode, true);
  for (const patch of [
    { FABRYA_PRODUCT_QA: "true" },
    { FABRYA_DEPLOYMENT_STAGE: "qa" },
    { FABRYA_LIVE_ACCOUNT_ID: "acct_wrong" },
    { FABRYA_PRODUCT_STRIPE_LIVE_KEY: "sk_test_fixture" },
    { FABRYA_LIVE_PRODUCT_ID: "prod_V6ervCHB0ynciw" },
    { FABRYA_LIVE_PRODUCT_ID: "prod_V6erK4BjsInpzN" },
  ])
    assert.throws(() => paymentConfiguration({ ...env, ...patch }, origin));
  assert.throws(() => paymentConfiguration(env, "https://wrong.example"));
});
test("LIVE gateway checks server account and exact monthly offer; Checkout has stable idempotency and full metadata", async () => {
  const calls = [];
  let account = LIVE_ACCOUNT_ID;
  let offer = price;
  const gateway = stripeGateway({
    env,
    origin,
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return Response.json(
        url.endsWith("/account")
          ? { id: account }
          : url.includes("/prices/")
            ? offer
            : {
                id: "cs_live_fixture",
                livemode: true,
                url: "https://checkout.stripe.com/c/pay/fixture",
              },
      );
    },
  });
  await gateway.verifyOffer();
  for (const patch of [
    { livemode: false },
    { unit_amount: 25000 },
    { currency: "usd" },
    { product: "prod_legacy" },
    { recurring: { interval: "year", interval_count: 1 } },
  ]) {
    offer = { ...price, ...patch };
    await assert.rejects(() => gateway.verifyOffer());
  }
  offer = price;
  account = "acct_wrong";
  await assert.rejects(() => gateway.verifyOffer());
  account = LIVE_ACCOUNT_ID;
  const c = {
    project_id: "prj_f",
    user_id: "usr_f",
    version_id: "ver_f",
    approval_id: "app_f",
    checkout_id: "chk_12345678",
    email: "fixture@example.test",
    idempotency_key: "durable-fixture",
  };
  await gateway.createSession(c);
  await gateway.createSession(c);
  const writes = calls.filter((c) => c.options.method === "POST");
  assert.equal(writes.length, 2);
  assert.equal(
    writes[0].options.body.toString(),
    writes[1].options.body.toString(),
  );
  assert.equal(writes[0].options.headers["Idempotency-Key"], c.idempotency_key);
  for (const k of [
    "project_id",
    "user_id",
    "version_id",
    "approval_id",
    "checkout_id",
  ]) {
    assert.equal(writes[0].options.body.get(`metadata[${k}]`), c[k]);
    assert.equal(
      writes[0].options.body.get(`subscription_data[metadata][${k}]`),
      c[k],
    );
  }
  assert.equal(writes[0].options.body.get("line_items[0][price]"), price.id);
  assert.equal(
    writes[0].options.body.has("subscription_data[trial_period_days]"),
    false,
  );
  assert.equal(writes[0].options.body.get("allow_promotion_codes"), "false");
  const sub = { livemode: true, items: { data: [{ quantity: 1, price }] } };
  assert.equal(gateway.validSubscription(sub), true);
  assert.equal(gateway.validSubscription({ ...sub, trial_end: 123 }), false);
  assert.equal(
    gateway.validSubscription({ ...sub, discounts: ["di_fake"] }),
    false,
  );
});
test("Reconciliation reflects cancellation without webhook and keeps all versions", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  const c = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  f.stripe.pay(c.session_id);
  await f.req(`projects/${id}/payment`, "POST", {});
  const session = f.stripe.sessions.get(c.session_id);
  f.stripe.subscriptions.get(session.subscription).status = "canceled";
  const result = (await f.req(`projects/${id}/payment`, "POST", {})).data;
  assert.equal(result.subscription.state, "canceled");
  assert.notEqual(result.project.status, "active");
  assert.equal(result.versions.length, 1);
  assert.equal(result.activation.version_id, version);
  f.db.close();
});

test("Public ingress rejects unsigned, wrong-mode, wrong-account events and exposes no product routes", async () => {
  const { webhookIngress } = await import("../../product/webhook-ingress.mjs");
  const { signedEvent } = await import("./helpers.mjs");
  let forwarded = 0;
  const time = Date.now();
  const ingress = webhookIngress({
    env: {
      FABRYA_PRODUCT_STRIPE_LIVE_WEBHOOK_SECRET: "fixture",
      FABRYA_PRIVATE_PRODUCT_BEARER: "private-fixture",
      FABRYA_PRIVATE_PRODUCT_ORIGIN:
        "https://fabrya-product-live-validation.sempehugo03.chatgpt.site",
    },
    clock: () => time,
    fetcher: async (url, o) => {
      forwarded++;
      assert.equal(new URL(url).pathname, "/api/product/webhook");
      assert.equal(
        o.headers["OAI-Sites-Authorization"],
        "Bearer private-fixture",
      );
      assert.equal(o.redirect, "manual");
      return new Response("ok");
    },
  });
  assert.equal(
    (await ingress(new Request("https://ingress.example/produit"))).status,
    404,
  );
  assert.equal(
    (await ingress(new Request("https://ingress.example/stripe/webhook")))
      .status,
    405,
  );
  assert.equal(
    (
      await ingress(
        new Request("https://ingress.example/stripe/webhook", {
          method: "POST",
          body: "{}",
        }),
      )
    ).status,
    400,
  );
  for (const event of [
    { id: "evt_test", livemode: false },
    { id: "evt_wrong", livemode: true, account: "acct_wrong" },
    { id: "evt_live", livemode: true },
  ]) {
    const signed = await signedEvent(event, "fixture", time);
    const response = await ingress(
      new Request("https://ingress.example/stripe/webhook", {
        method: "POST",
        body: signed.raw,
        headers: { "Stripe-Signature": signed.signature },
      }),
    );
    assert.equal(response.status, event.id === "evt_live" ? 200 : 400);
  }
  assert.equal(forwarded, 1);
});

test("Unpaid latest invoice suspends access; current paid invoice restores it without deleting content", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  const c = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  f.stripe.pay(c.session_id);
  await f.req(`projects/${id}/payment`, "POST", {});
  const sub = f.stripe.subscriptions.get(
    f.stripe.sessions.get(c.session_id).subscription,
  );
  sub.latest_invoice = { status: "open", paid: false, attempt_count: 1 };
  let result = (await f.req(`projects/${id}/payment`, "POST", {})).data;
  assert.equal(result.subscription.state, "payment_attention");
  assert.notEqual(result.project.status, "active");
  assert.equal(result.versions.length, 1);
  sub.latest_invoice = { status: "paid", paid: true, attempt_count: 1 };
  result = (await f.req(`projects/${id}/payment`, "POST", {})).data;
  assert.equal(result.project.status, "active");
  f.db.close();
});
