import test from "node:test";
import assert from "node:assert/strict";
import { sqliteD1, fixture, register, readyProject } from "./helpers.mjs";
import { firstTouch, classifyArrival } from "../../product/first-touch.mjs";
import {
  seoCms,
  renderSeo,
  privateSeoHandler,
} from "../../product/seo-cms.mjs";
import { digest } from "../../product/contract.mjs";
const request = (ref, cookie = "", url = "https://fabrya.fr/produit") =>
  new Request(url, { headers: { ...(ref ? { referer: ref } : {}), cookie } });
const source = {
  slug: "site-garagiste",
  topic_key: "garage",
  title: "Un site pour votre garage",
  description: "Présenter les services et les horaires du garage.",
  eyebrow: "Conseils",
  excerpt: "Aider les automobilistes à vous contacter.",
  status: "published",
  published_at: "2026-10-01",
  updated_at: "2026-10-01",
};
source.content_json = JSON.stringify({
  ...Object.fromEntries(
    ["title", "description", "eyebrow", "excerpt"].map((k) => [k, source[k]]),
  ),
  quickAnswer: "Présentez vos prestations réelles.",
  actionSteps: ["Vérifiez les coordonnées."],
  sections: [
    {
      heading: "Présenter vos services",
      paragraphs: ["Décrivez les prestations réellement disponibles."],
      bullets: [],
    },
  ],
  faq: [],
});
const command = async (cms) => {
  await cms.execute({
    action: "import",
    id: "import-test-01",
    slug: source.slug,
    source_page: source,
  });
  const current = await cms.read(source.slug);
  const a = JSON.parse(source.content_json);
  a.sections[0].paragraphs.push(
    "Affichez des horaires exacts pour faciliter le contact.",
  );
  return {
    action: "stage",
    id: "change-test-01",
    slug: source.slug,
    expected_version: current.version,
    patch: { content_json: JSON.stringify(a) },
    why: "Clarifier une information utile sans nouvelle promesse.",
    source_commit: "a".repeat(40),
    source_data: {snapshot_commit:"b".repeat(40),read_at:"2026-10-11T18:00:00Z",start_date:"2026-09-11",end_date:"2026-10-08",impressions:47,clicks:0,position:85,ctr:0},
    expected_effect: "Faciliter la décision d’un professionnel avant sa demande de démonstration.",
    generation_status: "EDITORIAL_PATCH",
  };
};
test("first-touch remains immutable across later direct and outbound arrivals", async () => {
  const db = sqliteD1(),
    a = firstTouch({ db });
  const one = await a.arrival(
    request("https://www.google.fr/search?q=site+garage"),
  );
  const cookie = one.cookie.split(";")[0];
  assert.equal(one.touch.channel, "google_organic_non_brand");
  const two = await a.arrival(
    request(null, cookie, "https://fabrya.fr/?utm_source=email"),
  );
  assert.equal(two.touch.id, one.touch.id);
  assert.equal(two.touch.channel, "google_organic_non_brand");
  assert.equal(two.cookie, null);
  assert.equal(
    db.connection.prepare("SELECT COUNT(*) n FROM fp_first_touch").get().n,
    1,
  );
  db.close();
});
test("missing Google query remains unknown; campaigns and brand are separated", () => {
  assert.equal(
    classifyArrival(request("https://www.google.fr/")).channel,
    "unknown",
  );
  assert.equal(
    classifyArrival(request("https://www.google.fr/search?q=Fabrya")).channel,
    "google_organic_brand",
  );
  assert.equal(
    classifyArrival(
      request(
        "https://www.google.fr/search?q=garage",
        "",
        "https://fabrya.fr/?utm_source=outbound",
      ),
    ).channel,
    "outbound",
  );
  assert.equal(
    classifyArrival(request("https://google.fr.attacker.test/")).channel,
    "referral",
  );
});
test("server first-touch links through existing project without changing payment state", async () => {
  const f = fixture();
  const a = firstTouch({ db: f.db, env: f.env, clock: () => f.time });
  const one = await a.arrival(
    request("https://www.google.fr/search?q=site+garage"),
  );
  f.cookie = one.cookie.split(";")[0];
  await register(f);
  f.cookie += "; " + one.cookie.split(";")[0];
  const p = await f.req("projects", "POST", {
    request_key: "ft-project-01",
    attribution: { source: "direct" },
  });
  assert.equal(p.status, 201);
  const link = f.db.connection
    .prepare("SELECT * FROM fp_project_first_touch WHERE project_id=?")
    .get(p.data.project.id);
  assert.equal(link.touch_id, one.touch.id);
  assert.equal((await a.report()).first_google_organic_customer, "NOT_YET");
  assert.equal(
    f.db.connection.prepare("SELECT COUNT(*) n FROM fp_activations").get().n,
    0,
  );
  assert.equal(
    f.db.connection.prepare("SELECT COUNT(*) n FROM fp_checkouts").get().n,
    0,
  );
  f.db.close();
});
test("legacy acquisition cannot be reassigned from a later Google visit", async () => {
  const f = fixture();
  await register(f);
  f.advance(10000);
  const a = firstTouch({ db: f.db, clock: () => f.time });
  const one = await a.arrival(
    request("https://www.google.fr/search?q=site+garage"),
  );
  f.cookie += "; " + one.cookie.split(";")[0];
  const p = await f.req("projects", "POST", { request_key: "ft-legacy-01" });
  const link = f.db.connection
    .prepare("SELECT * FROM fp_user_first_touch")
    .get();
  assert.equal(link.acquisition_verified, 0);
  assert.equal((await a.report()).first_google_organic_customer, "NOT_YET");
  f.db.close();
});
test("attribution storage failure does not prevent product account and project creation", async () => {
  const f = fixture();
  f.db.connection.exec("DROP TABLE fp_first_touch");
  f.cookie = "fabrya_first_touch=" + "a".repeat(64);
  assert.equal((await register(f)).status, 201);
  f.cookie += "; fabrya_first_touch=" + "a".repeat(64);
  assert.equal(
    (await f.req("projects", "POST", { request_key: "ft-fail-open" })).status,
    201,
  );
  assert.ok(f.logs.some((x) => x.code === "ATTRIBUTION_UNAVAILABLE"));
  f.db.close();
});
test("CMS is bounded, checkpointed, idempotent and rejects fallback or price writes", async () => {
  const db = sqliteD1(),
    cms = seoCms({ db, privateStaging: true });
  const c = await command(cms);
  const row = await cms.execute(c);
  assert.equal(row.state, "STAGED");
  assert.equal(JSON.parse(row.before_json).content_json, source.content_json);
  assert.equal((await cms.execute(c)).id, row.id);
  await assert.rejects(
    cms.execute({ ...c, patch: { price: 1 } }),
    /OUT_OF_SCOPE/,
  );
  await assert.rejects(
    cms.execute({ ...c, id: "another-id-01", patch: { title: "FALLBACK_V2" } }),
    /INVALID_SEO_CONTENT/,
  );
  await assert.rejects(
    cms.execute({ ...c, why: "changed" }),
    /IDEMPOTENCY_CONFLICT/,
  );
  await assert.rejects(
    cms.execute({ action: "publish", id: c.id, slug: c.slug }),
    /PRIVATE_STAGING_CANNOT_PUBLISH_PRODUCTION/,
  );
  db.close();
});
test("QA is mandatory; publication and rollback use CAS and cannot overwrite concurrent edits", async () => {
  const db = sqliteD1(),
    staging = seoCms({ db, privateStaging: true, clock: () => 100000 }),
    c = await command(staging),
    row = await staging.execute(c);
  const cms = seoCms({ db, clock: () => 200000 });
  await assert.rejects(
    cms.execute({ action: "publish", id: c.id, slug: c.slug }),
    /SEO_QA_REQUIRED/,
  );
  const qa = {
    page_hash: await digest(renderSeo(JSON.parse(row.after_json))),
    http_status: 200,
    canonical: "https://fabrya.fr/conseils/" + c.slug,
    title: source.title + " | FABRYA",
    h1_count: 1,
    robots: "noindex, nofollow",
    links: true,
    cta: true,
    schema: true,
    visible_content: true,
    js_errors: 0,
    viewports: Object.fromEntries(
      [1440, 390, 320].map((w) => [w, { checked: true, overflow: false }]),
    ),
    no_invented_claims: true,
  };
  await cms.execute({ action: "qa", id: c.id, slug: c.slug, qa });
  const published = await cms.execute({
    action: "publish",
    id: c.id,
    slug: c.slug,
  });
  assert.equal(published.state, "PUBLISHED");
  assert.equal(
    (await cms.execute({ action: "publish", id: c.id, slug: c.slug })).state,
    "PUBLISHED",
  );
  db.connection
    .prepare("UPDATE sd_seo_pages SET excerpt=? WHERE slug=?")
    .run("Modification concurrente", c.slug);
  await assert.rejects(
    cms.execute({ action: "rollback", id: c.id, slug: c.slug }),
    /SEO_VERSION_CONFLICT/,
  );
  db.connection
    .prepare("UPDATE sd_seo_pages SET excerpt=? WHERE slug=?")
    .run(source.excerpt, c.slug);
  assert.equal(
    (await cms.execute({ action: "rollback", id: c.id, slug: c.slug })).state,
    "REVERTED",
  );
  assert.equal((await cms.read(c.slug)).page.content_json, source.content_json);
  db.close();
});
test("CMS handler denies public origin and cross-origin writes", async () => {
  const db = sqliteD1();
  assert.equal(
    (
      await privateSeoHandler(
        new Request("https://fabrya.fr/api/seo/changes"),
        { DB: db },
      )
    ).status,
    403,
  );
  const origin =
    "https://fabrya-product-live-validation.sempehugo03.chatgpt.site";
  assert.equal(
    (
      await privateSeoHandler(
        new Request(origin + "/api/seo/changes", {
          method: "POST",
          headers: { origin: "https://attacker.test" },
          body: "{}",
        }),
        { DB: db, FABRYA_PRODUCT_ORIGIN: origin },
      )
    ).status,
    403,
  );
  db.close();
});


test("Google services and paid identifiers cannot become organic acquisition", () => {
  assert.equal(classifyArrival(request("https://www.google.fr/maps")).channel,"referral");
  for (const tag of ["gclid", "gbraid", "wbraid", "dclid", "msclkid"])
    assert.equal(classifyArrival(request("https://www.google.fr/search?q=site", "", "https://fabrya.fr/?"+tag+"=test")).channel,"outbound");
});
test("aggregate reporting covers unconverted visits and refuses terminal success without exclusion policy", async () => {
  const db=sqliteD1(),a=firstTouch({db});
  await a.arrival(request("https://www.google.fr/"));
  const r=await a.report();
  assert.equal(r.rows[0].sessions,1);
  assert.equal(r.rows[0].projects,0);
  assert.equal(r.exclusion_policy_ready,false);
  assert.equal(r.first_google_organic_customer,"NOT_YET");
  db.close();
});

test("first-touch acquisition and links are immutable in SQLite", async () => {
 const db=sqliteD1(); const a=firstTouch({db});const one=await a.arrival(request("https://www.google.fr/"));
 assert.throws(()=>db.connection.prepare("UPDATE fp_first_touch SET channel='direct' WHERE id=?").run(one.touch.id),/immutable/i);
 assert.equal((await a.get(request(null,one.cookie.split(';')[0]))).channel,"unknown");db.close();
});
