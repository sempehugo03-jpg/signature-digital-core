import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { productHandler } from "../../product/http.mjs";
import { OFFER } from "../../product/contract.mjs";
export function sqliteD1(filename = ":memory:", initialize = true) {
  const connection = new DatabaseSync(filename);
  connection.exec("PRAGMA foreign_keys=ON");
  if (initialize) {
    connection.exec(
      readFileSync(
        new URL("../../product/drizzle/0000_small_mojo.sql", import.meta.url),
        "utf8",
      ),
    );
  }
  const make = (sql, values = []) => ({
    bind(...v) {
      return make(sql, v);
    },
    async first() {
      return connection.prepare(sql).get(...values) || null;
    },
    async all() {
      return { results: connection.prepare(sql).all(...values) };
    },
    async run() {
      const r = connection.prepare(sql).run(...values);
      return { success: true, meta: { changes: Number(r.changes) } };
    },
  });
  return {
    connection,
    prepare: make,
    async batch(statements) {
      connection.exec("BEGIN IMMEDIATE");
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        connection.exec("COMMIT");
        return results;
      } catch (e) {
        connection.exec("ROLLBACK");
        throw e;
      }
    },
    close() {
      connection.close();
    },
  };
}
export function fixtureStripe() {
  let count = 0;
  const sessions = new Map(),
    subscriptions = new Map();
  const keys = new Map();
  return {
    priceId: OFFER.testPriceId,
    sessions,
    subscriptions,
    get count() {
      return count;
    },
    async verifyOffer() {},
    async createSession(c) {
      if (keys.has(c.idempotency_key))
        return sessions.get(keys.get(c.idempotency_key));
      count++;
      const id = "cs_test_" + count;
      const v = {
        id,
        livemode: false,
        status: "open",
        payment_status: "unpaid",
        amount_total: 5900,
        currency: "eur",
        mode: "subscription",
        url: "https://checkout.stripe.com/c/pay/" + id,
        customer: "cus_test_" + count,
        metadata: {
          project_id: c.project_id,
          approval_id: c.approval_id,
          checkout_id: c.checkout_id,
          user_id: c.user_id,
          version_id: c.version_id,
        },
        subscription: null,
      };
      sessions.set(id, v);
      keys.set(c.idempotency_key, id);
      return structuredClone(v);
    },
    async getSession(id) {
      return structuredClone(sessions.get(id));
    },
    async getSubscription(id) {
      return structuredClone(subscriptions.get(id));
    },
    validSubscription(sub) {
      return (
        sub.price === OFFER.testPriceId &&
        sub.amount === 5900 &&
        sub.currency === "eur"
      );
    },
    async expireSession(id) {
      sessions.get(id).status = "expired";
    },
    async createPortal(customer, project) {
      return { url: "https://billing.stripe.com/p/session/test" };
    },
    pay(id) {
      const s = sessions.get(id);
      s.status = "complete";
      s.payment_status = "paid";
      s.subscription = "sub_test_" + id;
      subscriptions.set(s.subscription, {
        id: s.subscription,
        status: "active",
        livemode: false,
        price: OFFER.testPriceId,
        amount: 5900,
        currency: "eur",
      });
    },
  };
}
export function fixture({
  db = sqliteD1(),
  start = Date.parse("2026-10-10T20:30:00Z"),
  stripe = fixtureStripe(),
} = {}) {
  let time = start;
  let cookies = "";
  const logs = [];
  const env = {
    FABRYA_PRODUCT_QA: "true",
    PRODUCT_COOKIE_SECURE: "false",
    FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET: "whsec_fixture",
  };
  const handle = productHandler({
    db,
    env,
    stripe,
    clock: () => time,
    log: (e) => logs.push(e),
  });
  async function req(path, method = "GET", body, options = {}) {
    const response = await handle(
      new Request("https://qa.fabrya.test/api/product/" + path, {
        method,
        headers: {
          origin: options.origin ?? "https://qa.fabrya.test",
          cookie: options.cookie ?? cookies,
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: method === "GET" ? undefined : JSON.stringify(body || {}),
      }),
    );
    if (response.headers.has("set-cookie"))
      cookies = response.headers.get("set-cookie").split(";")[0];
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: response.status, data, headers: response.headers };
  }
  return {
    db,
    stripe,
    handle,
    req,
    logs,
    env,
    advance(ms) {
      time += ms;
    },
    get time() {
      return time;
    },
    get cookie() {
      return cookies;
    },
    set cookie(v) {
      cookies = v;
    },
  };
}
export async function register(f, email = "qa@example.test") {
  return f.req("auth/register", "POST", {
    name: "Test client",
    email,
    password: "Test-long-password-2026",
  });
}
export async function readyProject(f) {
  await register(f);
  const p = (
    await f.req("projects", "POST", {
      request_key: crypto.randomUUID(),
      attribution: { source: "google_organic" },
    })
  ).data.project;
  await f.req("projects/" + p.id, "PATCH", {
    draft_revision: 0,
    step: 3,
    company_input: {
      name: "Atelier du Pic",
      activity: "Menuiserie",
      objective: "Recevoir des demandes",
      description: "Un atelier de caractère.",
    },
  });
  const j = await f.req("projects/" + p.id + "/jobs", "POST", {
    request_key: crypto.randomUUID(),
  });
  f.advance(8000);
  const r = await f.req("projects/" + p.id);
  return { id: p.id, job: j.data.job_id, version: r.data.versions[0].id };
}
export async function signedEvent(event, secret, time) {
  const raw = JSON.stringify(event);
  const t = Math.floor(time / 1000);
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
        new TextEncoder().encode(`${t}.${raw}`),
      ),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  return { raw, signature: `t=${t},v1=${hash}` };
}
