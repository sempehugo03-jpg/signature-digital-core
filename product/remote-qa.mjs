import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
if (process.stdin.isTTY)
  execFileSync("stty", ["-echo"], { stdio: ["inherit", "ignore", "ignore"] });
console.log("Ready for private QA JSON on stdin (input hidden).");
let source = "";
for await (const chunk of process.stdin) {
  source += chunk;
  if (source.includes("\n")) break;
}
const input = JSON.parse(source);
source = "";
const origin = input.origin,
  header = { "OAI-Sites-Authorization": "Bearer " + input.token };
delete input.token;
let cookie = "";
const results = [];
async function req(path, method = "GET", body, options = {}) {
  const r = await fetch(origin + path, {
    method,
    headers: {
      ...header,
      Origin: origin,
      cookie: options.cookie ?? cookie,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const setCookie = r.headers.get("set-cookie");
  if (setCookie?.includes("fabrya_session=")) {
    const match = setCookie.match(/fabrya_session=[^;,]*/);
    if (match) cookie = match[0];
  }
  const raw = await r.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  return { status: r.status, data, headers: r.headers };
}
function record(name, pass, details = {}) {
  results.push({ name, pass, ...details });
  console.log(JSON.stringify(results.at(-1)));
}
try {
  const landing = await req("/");
  assert.equal(landing.status, 200);
  assert.match(landing.data, /59 € \/ mois/);
  record("landing_served", true);
  for (const asset of [
    "/product-assets/client.mjs",
    "/product-assets/product.css",
    "/product-assets/contract.mjs",
  ])
    assert.equal((await req(asset)).status, 200);
  record("product_assets_served", true);
  const email = `qa-${crypto.randomUUID()}@example.test`,
    password = "Qa-" + crypto.randomUUID();
  const auth = await req("/api/product/auth/register", "POST", {
    name: "Client QA inconnu",
    email,
    password,
  });
  assert.equal(auth.status, 201);
  assert.ok(cookie.startsWith("fabrya_session="));
  record("signup_real_D1", true);
  const id = (
    await req("/api/product/projects", "POST", {
      request_key: crypto.randomUUID(),
      attribution: { source: "google_organic" },
    })
  ).data.project.id;
  const p = "/api/product/projects/" + id;
  let r = await req(p, "PATCH", {
    draft_revision: 0,
    step: 1,
    company_input: {
      name: "Atelier QA",
      activity: "Conseil",
      objective: "Être visible",
      description: "Projet de vérification technique.",
    },
  });
  assert.equal(r.status, 200);
  const saved = (await req(p)).data;
  assert.equal(saved.project.company_input.name, "Atelier QA");
  assert.equal(saved.project.draft_revision, 1);
  record("brief_real_D1_refresh", true);
  const key = crypto.randomUUID();
  const job = (await req(p + "/jobs", "POST", { request_key: key })).data
    .job_id;
  const double = (await req(p + "/jobs", "POST", { request_key: key })).data
    .job_id;
  assert.equal(double, job);
  record("durable_job_double_click", true);
  await req("/api/product/auth/logout", "POST", {});
  assert.equal((await req(p)).status, 401);
  record("logout_protected_project", true);
  await new Promise((resolve) => setTimeout(resolve, 8000));
  await req("/api/product/auth/login", "POST", { email, password });
  r = await req(p);
  assert.equal(r.data.job.status, "ready");
  assert.equal(r.data.job.job_id, job);
  const v1 = r.data.versions[0].id;
  record("login_job_recovered_ready", true);
  const preview = await req(p + "/versions/" + v1 + "/preview");
  assert.equal(preview.status, 200);
  assert.match(preview.data, /Atelier QA/);
  record("private_preview_real", true);
  await req(p + "/revisions", "POST", {
    request_key: crypto.randomUUID(),
    message: "Plus sobre. Titre : Mon activité mérite sa place.",
  });
  await new Promise((resolve) => setTimeout(resolve, 8000));
  r = await req(p);
  assert.equal(r.data.versions.length, 2);
  const v2 = r.data.versions[0].id;
  assert.notEqual(v2, v1);
  const revised = await req(p + "/versions/" + v2 + "/preview");
  assert.match(revised.data, /Mon activité mérite sa place/);
  assert.equal(
    (await req(p + "/versions/" + v1 + "/preview")).data,
    preview.data,
  );
  record("revision_history_immutable", true);
  const approved = await req(p + "/approve", "POST", { version_id: v2 });
  assert.equal(approved.data.project.status, "approved");
  record("version_approval_frozen", true);
  const checkout = await req(p + "/checkout", "POST", {});
  record("stripe_checkout_test", checkout.status === 200, {
    http_status: checkout.status,
    code: checkout.data.code || null,
  });
  assert.equal(checkout.status, 503);
  assert.equal(checkout.data.code, "PAYMENT_UNAVAILABLE");
  assert.equal((await req(p + "?success=true")).data.activation, null);
  record("missing_test_secret_no_activation", true);
  const ownerCookie = cookie;
  await req("/api/product/auth/logout", "POST", {});
  await req("/api/product/auth/register", "POST", {
    name: "Autre client QA",
    email: `qa-${crypto.randomUUID()}@example.test`,
    password: "Qa-" + crypto.randomUUID(),
  });
  assert.equal((await req(p)).status, 404);
  assert.equal((await req(p + "/versions/" + v2 + "/preview")).status, 404);
  record("tenant_isolation_real_D1", true);
  await req("/api/product/auth/logout", "POST", {});
  await req("/api/product/auth/login", "POST", { email, password });
  assert.equal((await req(p)).data.project.status, "approved");
  record("relogin_preserves_validated_project", true);
  const failureId = (
    await req("/api/product/projects", "POST", {
      request_key: crypto.randomUUID(),
    })
  ).data.project.id;
  const fp = "/api/product/projects/" + failureId;
  await req(fp, "PATCH", {
    draft_revision: 0,
    step: 3,
    company_input: {
      name: "Projet erreur QA",
      activity: "Conseil",
      objective: "Clients",
    },
  });
  const failureJob = (
    await req(fp + "/jobs", "POST", {
      request_key: crypto.randomUUID(),
      mode: "MOCK_TIMEOUT",
    })
  ).data.job_id;
  await new Promise((resolve) => setTimeout(resolve, 8000));
  r = await req(fp);
  assert.equal(r.data.job.status, "failed");
  assert.equal(r.data.job.recoverable, true);
  record("timeout_real_D1", true);
  const retryKey = crypto.randomUUID();
  await req(fp + "/jobs/" + failureJob + "/retry", "POST", {
    request_key: retryKey,
  });
  await req(fp + "/jobs/" + failureJob + "/retry", "POST", {
    request_key: retryKey,
  });
  await new Promise((resolve) => setTimeout(resolve, 8000));
  r = await req(fp);
  assert.equal(r.data.job.status, "ready");
  assert.equal(r.data.job.attempt, 2);
  assert.equal(r.data.versions.length, 1);
  record("idempotent_retry_real_D1", true);
} catch (error) {
  record("runner_error", false, { message: error.message.slice(0, 300) });
  process.exitCode = 1;
}
const report = {
  origin,
  executed_at: new Date().toISOString(),
  scope:
    "HTTP API against private hosted Cloudflare D1; no browser and no real Stripe Checkout payment",
  results,
};
writeFileSync(input.report, JSON.stringify(report, null, 2) + "\n");
console.log("Private QA report saved.");
