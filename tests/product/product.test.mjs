import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fixture,
  sqliteD1,
  register,
  readyProject,
  signedEvent,
} from "./helpers.mjs";
import { verifyWebhook, stripeGateway } from "../../product/stripe-gateway.mjs";
import { OFFER } from "../../product/contract.mjs";

test("HTTP vertical flow: signup → server brief → durable job → revision → approval → test gateway → activation → client space", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  const preview = await f.req(`projects/${id}/versions/${version}/preview`);
  assert.equal(preview.status, 200);
  assert.match(preview.data, /Atelier du Pic/);
  assert.match(preview.headers.get("content-security-policy"), /sandbox/);
  await f.req(`projects/${id}/revisions`, "POST", {
    request_key: crypto.randomUUID(),
    message:
      "Plus sobre. Titre : Un lieu à votre mesure. Ajoute 06 12 34 56 78",
  });
  f.advance(8000);
  const revised = (await f.req("projects/" + id)).data;
  assert.equal(revised.versions.length, 2);
  const v2 = revised.versions[0].id;
  const modified = await f.req(`projects/${id}/versions/${v2}/preview`);
  assert.match(modified.data, /Un lieu à votre mesure/);
  assert.match(modified.data, /06 12 34 56 78/);
  assert.match(modified.data, /#fafaf8/);
  assert.equal(
    (await f.req(`projects/${id}/versions/${version}/preview`)).data,
    preview.data,
  );
  assert.equal(
    (await f.req(`projects/${id}/approve`, "POST", { version_id: v2 })).data
      .project.status,
    "approved",
  );
  const check = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  assert.match(check.url, /checkout.stripe.com/);
  const before = (await f.req(`projects/${id}/payment`, "POST", {})).data;
  assert.equal(before.activation, null);
  f.stripe.pay(check.session_id);
  const paid = (await f.req(`projects/${id}/payment`, "POST", {})).data;
  assert.equal(paid.project.status, "active");
  assert.equal(paid.project.active_version_id, v2);
  assert.equal(paid.subscription.amount, 5900);
  assert.equal("price_id" in paid.subscription, false, "Stripe configuration remains server-side");
  assert.equal(paid.activation.version_id, v2);
  assert.equal((await f.req("projects/" + id)).data.project.status, "active");
  const attribution = await f.db
    .prepare("SELECT attribution FROM fp_projects WHERE id=?")
    .bind(id)
    .first();
  assert.equal(JSON.parse(attribution.attribution).source, "google_organic");
  await f.req("auth/logout", "POST", {});
  assert.equal((await f.req("projects/" + id)).status, 401);
  await f.req("auth/login", "POST", {
    email: "qa@example.test",
    password: "Test-long-password-2026",
  });
  assert.equal((await f.req("projects/" + id)).data.project.status, "active");
  assert.equal(
    (await f.db.prepare("SELECT COUNT(*) n FROM fp_activations").first()).n,
    1,
  );
  f.db.close();
});

test("Refresh, close, one-hour return and server restart use real SQLite disk persistence, not browser memory", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fabrya-product-"));
  const file = join(dir, "database.sqlite");
  let f = fixture({ db: sqliteD1(file) });
  await register(f);
  const id = (
    await f.req("projects", "POST", { request_key: crypto.randomUUID() })
  ).data.project.id;
  await f.req("projects/" + id, "PATCH", {
    draft_revision: 0,
    step: 2,
    company_input: {
      name: "Durable",
      activity: "Conseil",
      objective: "Être visible",
      description: "Brief partiel sauvegardé.",
    },
  });
  const j = await f.req(`projects/${id}/jobs`, "POST", {
    request_key: crypto.randomUUID(),
    mode: "MOCK_SLOW",
  });
  const cookie = f.cookie;
  const time = f.time + 3600000;
  f.db.close();
  f = fixture({ db: sqliteD1(file, false), start: time });
  f.cookie = cookie;
  const r = await f.req("projects/" + id);
  assert.equal(r.data.job.job_id, j.data.job_id);
  assert.equal(r.data.job.status, "ready");
  assert.equal(
    r.data.project.company_input.description,
    "Brief partiel sauvegardé.",
  );
  assert.equal(r.data.versions.length, 1);
  f.db.close();
  rmSync(dir, { recursive: true });
});

test("Double click and two tabs produce one project and one generation; concurrent brief edits use compare-and-swap", async () => {
  const f = fixture();
  await register(f);
  const request_key = crypto.randomUUID();
  const [a, b] = await Promise.all([
    f.req("projects", "POST", { request_key }),
    f.req("projects", "POST", { request_key }),
  ]);
  assert.equal(a.data.project.id, b.data.project.id);
  const id = a.data.project.id;
  await f.req("projects/" + id, "PATCH", {
    draft_revision: 0,
    company_input: {
      name: "Unique",
      activity: "Service",
      objective: "Clients",
    },
  });
  const stale = await f.req("projects/" + id, "PATCH", {
    draft_revision: 0,
    company_input: { name: "Lost update" },
  });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.code, "DRAFT_CONFLICT");
  const [x, y] = await Promise.all([
    f.req(`projects/${id}/jobs`, "POST", { request_key: crypto.randomUUID() }),
    f.req(`projects/${id}/jobs`, "POST", { request_key: crypto.randomUUID() }),
  ]);
  assert.equal(x.data.job_id, y.data.job_id);
  assert.equal(
    (await f.db.prepare("SELECT COUNT(*) n FROM fp_jobs").first()).n,
    1,
  );
  assert.equal(
    (await f.db.prepare("SELECT COUNT(*) n FROM fp_versions").first()).n,
    1,
  );
  f.db.close();
});

for (const mode of ["MOCK_FAILED", "MOCK_TIMEOUT"])
  test(`${mode}: project and version retained, idempotent retry succeeds`, async () => {
    const f = fixture();
    await register(f);
    const id = (
      await f.req("projects", "POST", { request_key: crypto.randomUUID() })
    ).data.project.id;
    await f.req("projects/" + id, "PATCH", {
      draft_revision: 0,
      company_input: {
        name: "Retry",
        activity: "Service",
        objective: "Clients",
      },
    });
    const job = (
      await f.req(`projects/${id}/jobs`, "POST", {
        request_key: crypto.randomUUID(),
        mode,
      })
    ).data.job_id;
    f.advance(8000);
    const failed = (await f.req("projects/" + id)).data;
    assert.equal(failed.job.status, "failed");
    assert.equal(failed.job.recoverable, true);
    assert.equal(failed.project.company_input.name, "Retry");
    const key = crypto.randomUUID();
    await f.req(`projects/${id}/jobs/${job}/retry`, "POST", {
      request_key: key,
    });
    await f.req(`projects/${id}/jobs/${job}/retry`, "POST", {
      request_key: key,
    });
    f.advance(8000);
    const retried = (await f.req("projects/" + id)).data;
    assert.equal(retried.job.status, "ready");
    assert.equal(retried.job.attempt, 2);
    assert.equal(retried.versions.length, 1);
    assert.equal(retried.versions[0].id, failed.versions[0].id);
    f.db.close();
  });

test("Slow job has honest stages; cancel does not delete brief and retry recovers", async () => {
  const f = fixture();
  await register(f);
  const id = (
    await f.req("projects", "POST", { request_key: crypto.randomUUID() })
  ).data.project.id;
  await f.req("projects/" + id, "PATCH", {
    draft_revision: 0,
    company_input: { name: "Slow", activity: "Conseil", objective: "Clients" },
  });
  const job = (
    await f.req(`projects/${id}/jobs`, "POST", {
      request_key: crypto.randomUUID(),
      mode: "MOCK_SLOW",
    })
  ).data.job_id;
  f.advance(13000);
  assert.equal(
    (await f.req("projects/" + id)).data.job.status,
    "understanding",
  );
  await f.req(`projects/${id}/jobs/${job}/cancel`, "POST", {});
  assert.equal((await f.req("projects/" + id)).data.job.status, "cancelled");
  await f.req(`projects/${id}/jobs/${job}/retry`, "POST", {
    request_key: crypto.randomUUID(),
  });
  f.advance(8000);
  assert.equal((await f.req("projects/" + id)).data.job.status, "ready");
  f.db.close();
});

test("Checkout validation, refusal, abandonment, repeat callback and success URL cannot activate unpaid projects", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  assert.equal(
    (await f.req(`projects/${id}/checkout`, "POST", {})).status,
    409,
  );
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  const a = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  const b = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  assert.equal(a.session_id, b.session_id);
  assert.equal(f.stripe.count, 1);
  assert.equal(
    (await f.req("projects/" + id + "?success=true")).data.activation,
    null,
  );
  assert.equal(
    (await f.req(`projects/${id}/payment`, "POST", {})).data.activation,
    null,
  );
  f.stripe.sessions.get(a.session_id).payment_status = "unpaid";
  assert.equal(
    (await f.req(`projects/${id}/payment`, "POST", {})).data.project.status,
    "approved",
  );
  await f.req(`projects/${id}/abandon`, "POST", {});
  const c = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  assert.notEqual(c.session_id, a.session_id);
  f.stripe.pay(c.session_id);
  await f.req(`projects/${id}/payment`, "POST", {});
  await f.req(`projects/${id}/payment`, "POST", {});
  assert.equal(
    (await f.db.prepare("SELECT COUNT(*) n FROM fp_activations").first()).n,
    1,
  );
  f.db.close();
});

test("Signed webhook is replay-safe; duplicate events and delayed callback cause a single activation", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  const c = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  f.stripe.pay(c.session_id);
  const event = {
    id: "evt_test_1",
    livemode: false,
    type: "checkout.session.completed",
    data: { object: { id: c.session_id } },
  };
  const signed = await signedEvent(
    event,
    f.env.FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET,
    f.time,
  );
  const req = () =>
    f.handle(
      new Request("https://qa.fabrya.test/api/product/webhook", {
        method: "POST",
        body: signed.raw,
        headers: { "stripe-signature": signed.signature },
      }),
    );
  assert.equal((await req()).status, 200);
  assert.equal((await (await req()).json()).duplicate, true);
  await f.req(`projects/${id}/payment`, "POST", {});
  assert.equal(
    (await f.db.prepare("SELECT COUNT(*) n FROM fp_activations").first()).n,
    1,
  );
  const wrong = await f.handle(
    new Request("https://qa.fabrya.test/api/product/webhook", {
      method: "POST",
      body: signed.raw,
      headers: {
        "stripe-signature": "t=" + Math.floor(f.time / 1000) + ",v1=bad",
      },
    }),
  );
  assert.equal(wrong.status, 400);
  f.db.close();
});

test("Out-of-order subscription events use current provider state and cannot revive a cancelled subscription", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  const c = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  f.stripe.pay(c.session_id);
  await f.req(`projects/${id}/payment`, "POST", {});
  const sub = f.stripe.sessions.get(c.session_id).subscription;
  f.stripe.subscriptions.get(sub).status = "canceled";
  for (const type of [
    "customer.subscription.deleted",
    "customer.subscription.updated",
  ]) {
    const s = await signedEvent(
      {
        id: crypto.randomUUID(),
        livemode: false,
        type,
        data: { object: { id: sub, status: "active" } },
      },
      f.env.FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET,
      f.time,
    );
    const r = await f.handle(
      new Request("https://qa.fabrya.test/api/product/webhook", {
        method: "POST",
        body: s.raw,
        headers: { "stripe-signature": s.signature },
      }),
    );
    assert.equal(r.status, 200);
  }
  await f.req(`projects/${id}/payment`, "POST", {});
  const r = (await f.req("projects/" + id)).data;
  assert.equal(r.subscription.state, "canceled");
  assert.equal(r.project.status, "payment_attention");
  f.db.close();
});

test("Historic checkout callbacks do not overwrite a newer active version", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  const c = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  f.stripe.pay(c.session_id);
  await f.req(`projects/${id}/payment`, "POST", {});
  await f.req(`projects/${id}/revisions`, "POST", {
    request_key: crypto.randomUUID(),
    message: "Titre : Une nouvelle version",
  });
  f.advance(8000);
  const v2 = (await f.req("projects/" + id)).data.versions[0].id;
  await f.req(`projects/${id}/approve`, "POST", { version_id: v2 });
  await f.req(`projects/${id}/payment`, "POST", {});
  assert.equal(
    (await f.req("projects/" + id)).data.project.active_version_id,
    v2,
  );
  f.db.close();
});

test("Tenant isolation, expired session, CSRF, preview XSS and absence of secret/PII in error logs", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  const cookie = f.cookie;
  assert.equal(
    (
      await f.req(
        "projects/" + id,
        "PATCH",
        {},
        { origin: "https://attacker.test" },
      )
    ).status,
    403,
  );
  await f.req("auth/logout", "POST", {});
  await register(f, "other@example.test");
  assert.equal((await f.req("projects/" + id)).status, 404);
  assert.equal(
    (await f.req(`projects/${id}/versions/${version}/preview`)).status,
    404,
  );
  assert.equal(
    (await f.req(`projects/${id}/approve`, "POST", { version_id: version }))
      .status,
    404,
  );
  assert.equal((await f.req("projects")).data.projects.length, 0);
  f.advance(31 * 86400000);
  assert.equal((await f.req("projects")).status, 401);
  assert.equal((await f.req("auth/session")).data.user, null);
  assert.doesNotMatch(
    JSON.stringify(f.logs),
    /qa@example|other@example|password|Atelier du Pic|sk_test|whsec/,
  );
  assert.match(cookie, /fby_/);
  f.db.close();
});

test("Missing/invalid Stripe key leaves approved version recoverable; LIVE cannot be configured", async () => {
  assert.equal(
    stripeGateway({ env: {}, origin: "https://qa.fabrya.test" }),
    null,
  );
  assert.throws(
    () =>
      stripeGateway({
        env: { STRIPE_SECRET_KEY_TEST: "sk_live_forbidden" },
        origin: "https://qa.fabrya.test",
      }),
    { code: "LIVE_FORBIDDEN" },
  );
});

test("Webhook rejects stale, missing and tampered signatures", async () => {
  const time = Date.now();
  const signed = await signedEvent(
    { id: "evt_signed", livemode: false },
    "testsecret",
    time,
  );
  assert.equal(
    (
      await verifyWebhook(
        signed.raw,
        signed.signature,
        "testsecret",
        () => time,
      )
    ).id,
    "evt_signed",
  );
  await assert.rejects(() =>
    verifyWebhook(
      signed.raw,
      signed.signature,
      "testsecret",
      () => time + 301000,
    ),
  );
  await assert.rejects(() =>
    verifyWebhook(signed.raw + " ", signed.signature, "testsecret", () => time),
  );
  await assert.rejects(() =>
    verifyWebhook(signed.raw, null, "testsecret", () => time),
  );
});

test("Stripe HTTP gateway validates 59 EUR, monthly cadence, TEST, metadata and idempotency without frontend keys", async () => {
  const requests = [];
  const gateway = stripeGateway({
    env: { STRIPE_SECRET_KEY_TEST: "sk_test_fixture" },
    origin: "https://qa.fabrya.test",
    fetcher: async (url, options) => {
      requests.push({ url, options });
      return Response.json(
        url.includes("/prices/")
          ? {
              livemode: false,
              active: true,
              unit_amount: 5900,
              currency: "eur",
              recurring: { interval: "month", interval_count: 1 },
            }
          : {
              id: "cs_test_gateway",
              livemode: false,
              url: "https://checkout.stripe.com/test",
            },
      );
    },
  });
  await gateway.verifyOffer(OFFER);
  await gateway.createSession({
    idempotency_key: "same-key",
    project_id: "prj_test",
    approval_id: "apv_test",
    checkout_id: "chk_test",
    version_id: "ver_test",
    user_id: "usr_test",
    email: "qa@example.test",
  });
  assert.equal(requests[1].options.headers["Idempotency-Key"], "same-key");
  const values = requests[1].options.body;
  assert.equal(values.get("line_items[0][price]"), OFFER.testPriceId);
  assert.equal(values.get("metadata[approval_id]"), "apv_test");
  assert.equal(values.get("mode"), "subscription");
  assert.equal(values.get("allow_promotion_codes"), "false");
  assert.match(values.get("success_url"), /payment=success/);
});

test("A crash after provider Checkout creation recovers the same session by durable idempotency key", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  let ambiguous = true;
  const original = f.stripe.createSession.bind(f.stripe);
  f.stripe.createSession = async (c) => {
    const r = await original(c);
    if (ambiguous) {
      ambiguous = false;
      throw new Error("Crash after provider response");
    }
    return r;
  };
  assert.equal(
    (await f.req(`projects/${id}/checkout`, "POST", {})).status,
    503,
  );
  const recovered = await f.req(`projects/${id}/checkout`, "POST", {});
  assert.equal(recovered.status, 200);
  assert.equal(f.stripe.count, 1);
  assert.equal(recovered.data.session_id, "cs_test_1");
  assert.equal((await f.req("projects/" + id)).data.activation, null);
  f.db.close();
});

test("Wrong amount, mismatched approval and LIVE events cannot activate a project", async () => {
  const f = fixture();
  const { id, version } = await readyProject(f);
  await f.req(`projects/${id}/approve`, "POST", { version_id: version });
  const c = (await f.req(`projects/${id}/checkout`, "POST", {})).data;
  f.stripe.pay(c.session_id);
  const session = f.stripe.sessions.get(c.session_id);
  session.amount_total = 9000;
  assert.equal((await f.req(`projects/${id}/payment`, "POST", {})).status, 409);
  session.amount_total = 5900;
  const expected = session.metadata.approval_id;
  session.metadata.approval_id = "wrong";
  assert.equal((await f.req(`projects/${id}/payment`, "POST", {})).status, 409);
  session.metadata.approval_id = expected;
  session.livemode = true;
  assert.equal((await f.req(`projects/${id}/payment`, "POST", {})).status, 400);
  assert.equal((await f.req("projects/" + id)).data.activation, null);
  f.db.close();
});

test("Server escapes untrusted company content and provides no executable preview or outbound form", async () => {
  const f = fixture();
  await register(f);
  const id = (
    await f.req("projects", "POST", { request_key: crypto.randomUUID() })
  ).data.project.id;
  await f.req("projects/" + id, "PATCH", {
    draft_revision: 0,
    company_input: {
      name: "<script>alert(1)</script>",
      activity: "Service",
      objective: "<img src=x onerror=alert(1)>",
      description: "</style><script>steal()</script>",
    },
  });
  await f.req(`projects/${id}/jobs`, "POST", {
    request_key: crypto.randomUUID(),
  });
  f.advance(8000);
  const version = (await f.req("projects/" + id)).data.versions[0].id;
  const r = await f.req(`projects/${id}/versions/${version}/preview`);
  assert.doesNotMatch(r.data, /<script>|<img src=x|<form/);
  assert.match(r.data, /&lt;script&gt;/);
  assert.match(r.headers.get("content-security-policy"), /form-action 'none'/);
  f.db.close();
});

test("Unavailable adapter becomes a recoverable durable failure, with no perpetual spinner", async () => {
  const f = fixture();
  await register(f);
  const id = (
    await f.req("projects", "POST", { request_key: crypto.randomUUID() })
  ).data.project.id;
  await f.req("projects/" + id, "PATCH", {
    draft_revision: 0,
    company_input: {
      name: "Unavailable",
      activity: "Service",
      objective: "Clients",
    },
  });
  await f.req(`projects/${id}/jobs`, "POST", {
    request_key: crypto.randomUUID(),
  });
  const { productHandler } = await import("../../product/http.mjs");
  const handle = productHandler({
    db: f.db,
    env: f.env,
    clock: () => f.time,
    stripe: f.stripe,
    kevin: {
      async createDemo() {
        throw new Error("Internal supplier stack secret");
      },
    },
  });
  const response = await handle(
    new Request(`https://qa.fabrya.test/api/product/projects/${id}`, {
      headers: { cookie: f.cookie },
    }),
  );
  const r = await response.json();
  assert.equal(r.job.status, "failed");
  assert.equal(r.job.recoverable, true);
  assert.doesNotMatch(JSON.stringify(r), /supplier stack/);
  assert.equal((await f.req("projects/" + id)).data.job.status, "failed");
  f.db.close();
});
