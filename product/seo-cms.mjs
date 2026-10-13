import { digest, ProductError } from "./contract.mjs";
import { firstTouch } from "./first-touch.mjs";
const fail = (code, status = 400) => {
  throw new ProductError(code, code, status);
};
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const privateOrigin =
  "https://fabrya-product-live-validation.sempehugo03.chatgpt.site";
const fields = ["title", "description", "eyebrow", "excerpt", "content_json"];
const forbidden =
  /FALLBACK(?:_V2)?|NEEDS_REGENERATION|TIMEOUT|PROVIDER_ERROR|<\/?script|javascript:|\bon\w+\s*=|\bgh[pousr]_[\w]{20,}|\bsk-[\w-]{20,}|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const key = (s) => typeof s === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(s);
const slugOk = (s) =>
  typeof s === "string" &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) &&
  s.length < 100;
function validatePage(page) {
  for (const f of fields)
    if (
      typeof page[f] !== "string" ||
      !page[f].trim() ||
      page[f].length > 24000 ||
      forbidden.test(page[f])
    )
      fail("INVALID_SEO_CONTENT");
  if (page.title.length > 90 || page.description.length > 200)
    fail("INVALID_SEO_METADATA");
  let article;
  try {
    article = JSON.parse(page.content_json);
  } catch {
    fail("INVALID_SEO_ARTICLE");
  }
  const allowed = [
    "title",
    "description",
    "eyebrow",
    "excerpt",
    "quickAnswer",
    "actionSteps",
    "sections",
    "faq",
  ];
  if (
    !article ||
    Object.keys(article).some((k) => !allowed.includes(k)) ||
    !Array.isArray(article.sections) ||
    !Array.isArray(article.faq) ||
    !Array.isArray(article.actionSteps)
  )
    fail("INVALID_SEO_ARTICLE");
  if (
    article.sections.length < 1 ||
    article.sections.length > 12 ||
    article.faq.length > 8
  )
    fail("UNBOUNDED_SEO_ARTICLE");
  for (const s of article.sections)
    if (
      !s ||
      Object.keys(s).some(
        (k) => !["heading", "paragraphs", "bullets"].includes(k),
      ) ||
      typeof s.heading !== "string" ||
      !Array.isArray(s.paragraphs) ||
      !Array.isArray(s.bullets) ||
      s.paragraphs.some((x) => typeof x !== "string" || x.length > 1000) ||
      s.bullets.some((x) => typeof x !== "string")
    )
      fail("INVALID_SEO_SECTION");
  for (const f of article.faq)
    if (
      Object.keys(f).some((k) => !["question", "answer"].includes(k)) ||
      typeof f.question !== "string" ||
      typeof f.answer !== "string"
    )
      fail("INVALID_SEO_FAQ");
  if (
    article.actionSteps.length > 12 ||
    article.actionSteps.some((x) => typeof x !== "string" || x.length > 500) ||
    typeof article.quickAnswer !== "string" ||
    article.quickAnswer.length > 2000
  )
    fail("INVALID_SEO_ARTICLE");
  for (const f of ["title", "description", "eyebrow", "excerpt"])
    if (typeof article[f] !== "string" || article[f] !== page[f])
      fail("INCONSISTENT_SEO_ARTICLE");
  for (const s of article.sections)
    if (
      s.heading.length > 180 ||
      s.paragraphs.length > 12 ||
      s.bullets.length > 12 ||
      s.bullets.some((x) => x.length > 500)
    )
      fail("UNBOUNDED_SEO_SECTION");
  for (const f of article.faq)
    if (f.question.length > 200 || f.answer.length > 2000)
      fail("UNBOUNDED_SEO_FAQ");
  return page;
}
const snapshot = (p) =>
  Object.fromEntries(
    [
      "slug",
      "topic_key",
      ...fields,
      "status",
      "published_at",
      "updated_at",
    ].map((k) => [k, p[k]]),
  );
export function renderSeo(page, { staging = true } = {}) {
  const a = JSON.parse(page.content_json),
    canonical = "https://fabrya.fr/conseils/" + page.slug;
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: page.title,
        description: page.description,
        mainEntityOfPage: canonical,
        inLanguage: "fr-FR",
        datePublished: page.published_at,
        dateModified: page.updated_at,
        author: {
          "@type": "Organization",
          name: "FABRYA",
          url: "https://fabrya.fr",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: a.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${staging ? "noindex, nofollow" : "index, follow"}"><link rel="canonical" href="${canonical}"><title>${esc(page.title)} | FABRYA</title><meta name="description" content="${esc(page.description)}"><style>body{font-family:system-ui;margin:0}main{max-width:850px;margin:auto;padding:clamp(16px,4vw,48px);overflow-wrap:anywhere}a{color:inherit}h1{font-size:clamp(28px,5vw,48px)}p,li{line-height:1.65}details{padding:16px 0}*{box-sizing:border-box}</style></head><body><main><a href="https://fabrya.fr/">FABRYA</a><h1>${esc(page.title)}</h1><p>${esc(page.excerpt)}</p><section><h2>L’essentiel à retenir</h2><p>${esc(a.quickAnswer || "")}</p></section>${a.sections.map((s) => `<section><h2>${esc(s.heading)}</h2>${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></section>`).join("")}<ol>${a.actionSteps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol><section><h2>Questions fréquentes</h2>${a.faq.map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join("")}</section><a href="https://fabrya.fr/">Créer ma démonstration</a></main><script type="application/ld+json">${schema}</script></body></html>`;
}
export function seoCms({
  db,
  clock = () => Date.now(),
  privateStaging = false,
}) {
  const first = (s, ...a) =>
    db
      .prepare(s)
      .bind(...a)
      .first();
  const stamp = () => new Date(clock()).toISOString();
  async function read(slug) {
    if (!slugOk(slug)) fail("INVALID_SLUG");
    const page = await first(
      "SELECT * FROM sd_seo_pages WHERE slug=? AND status='published'",
      slug,
    );
    if (!page) fail("SEO_PAGE_NOT_FOUND", 404);
    return {
      page: snapshot(page),
      version: await digest(JSON.stringify(snapshot(page))),
    };
  }
  async function execute(body) {
    if (
      !body ||
      Object.keys(body).some(
        (k) =>
          ![
            "action",
            "id",
            "slug",
            "expected_version",
            "patch",
            "why",
            "source_commit",
            "source_data",
            "expected_effect",
            "generation_status",
            "qa",
            "source_page",
          ].includes(k),
      )
    )
      fail("OUT_OF_SCOPE");
    if (!key(body.id) || !slugOk(body.slug)) fail("INVALID_COMMAND");
    const prior = await first(
      "SELECT * FROM fp_seo_changes WHERE id=?",
      body.id,
    );
    if (body.action === "stage") {
      if (
        body.generation_status !== "EDITORIAL_PATCH" ||
        typeof body.why !== "string" ||
        !body.why.trim() ||
        body.why.length > 800 ||
        forbidden.test(body.why) ||
        !/^[a-f0-9]{40}$/.test(body.source_commit || "")
      )
        fail("UNVERIFIED_GENERATION");
      const data = body.source_data;
      if (!data || Object.keys(data).some(k => !["snapshot_commit","read_at","start_date","end_date","impressions","clicks","position","ctr"].includes(k))
        || !/^[a-f0-9]{40}$/.test(data.snapshot_commit || "") || !Number.isFinite(Date.parse(data.read_at || ""))
        || !["impressions","clicks","position","ctr"].every(k => Number.isFinite(data[k]) && data[k] >= 0)
        || typeof body.expected_effect !== "string" || !body.expected_effect.trim() || body.expected_effect.length > 800 || forbidden.test(body.expected_effect)) fail("SOURCE_DATA_REQUIRED");
      if (
        !body.patch ||
        Object.keys(body.patch).some((k) => !fields.includes(k)) ||
        Object.keys(body.patch).length > 2
      )
        fail("OUT_OF_SCOPE");
      const requestHash = await digest(JSON.stringify(body));
      if (prior) {
        if (prior.request_hash !== requestHash)
          fail("IDEMPOTENCY_CONFLICT", 409);
        return prior;
      }
      const current = await read(body.slug);
      if (current.version !== body.expected_version)
        fail("SEO_VERSION_CONFLICT", 409);
      const after = validatePage({ ...current.page, ...body.patch });
      if (JSON.stringify(after) === JSON.stringify(current.page))
        fail("NO_SEO_DIFF");
      await db
        .prepare(
          "INSERT OR IGNORE INTO fp_seo_changes(id,slug,request_hash,before_json,after_json,before_version,after_version,why,source_commit,source_data_json,expected_effect,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'STAGED',?,?)",
        )
        .bind(
          body.id,
          body.slug,
          requestHash,
          JSON.stringify(current.page),
          JSON.stringify(after),
          current.version,
          await digest(JSON.stringify(after)),
          String(body.why).slice(0, 800),
          body.source_commit,
          JSON.stringify(body.source_data),
          body.expected_effect,
          stamp(),
          stamp(),
        )
        .run();
      return first("SELECT * FROM fp_seo_changes WHERE id=?", body.id);
    }
    if (body.action === "import") {
      if (!privateStaging || prior) fail("IMPORT_NOT_PERMITTED", 403);
      const p = body.source_page;
      if (
        !p ||
        Object.keys(p).some(
          (k) =>
            ![
              "slug",
              "topic_key",
              ...fields,
              "status",
              "published_at",
              "updated_at",
            ].includes(k),
        ) ||
        p.slug !== body.slug ||
        p.status !== "published"
      )
        fail("INVALID_SOURCE_PAGE");
      validatePage(p);
      await db
        .prepare(
          "INSERT OR IGNORE INTO sd_seo_pages(slug,topic_key,title,description,eyebrow,excerpt,content_json,status,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          p.slug,
          p.topic_key,
          p.title,
          p.description,
          p.eyebrow,
          p.excerpt,
          p.content_json,
          p.status,
          p.published_at,
          p.updated_at,
        )
        .run();
      return read(p.slug);
    }
    if (!prior || prior.slug !== body.slug) fail("SEO_CHANGE_NOT_FOUND", 404);
    if (body.action === "qa") {
      const q = body.qa;
      if (
        !q ||
        Object.keys(q).some(
          (k) =>
            ![
              "page_hash",
              "http_status",
              "canonical",
              "title",
              "h1_count",
              "robots",
              "links",
              "cta",
              "schema",
              "visible_content",
              "js_errors",
              "viewports",
              "no_invented_claims",
            ].includes(k),
        ) ||
        q.page_hash !==
          (await digest(renderSeo(JSON.parse(prior.after_json)))) ||
        q.http_status !== 200 ||
        q.canonical !== "https://fabrya.fr/conseils/" + body.slug ||
        q.title !== JSON.parse(prior.after_json).title + " | FABRYA" ||
        q.h1_count !== 1 ||
        q.robots !== "noindex, nofollow" ||
        q.js_errors !== 0 ||
        !["1440", "390", "320"].every(
          (w) =>
            q.viewports?.[w]?.checked === true &&
            q.viewports[w].overflow === false,
        ) ||
        ![
          "links",
          "cta",
          "schema",
          "visible_content",
          "no_invented_claims",
        ].every((k) => q[k] === true)
      )
        fail("SEO_QA_REQUIRED", 409);
      await db
        .prepare(
          "UPDATE fp_seo_changes SET qa_json=?,state='QA_PASS',updated_at=? WHERE id=? AND state='STAGED'",
        )
        .bind(JSON.stringify(q), stamp(), body.id)
        .run();
      return first("SELECT * FROM fp_seo_changes WHERE id=?", body.id);
    }
    if (!["publish", "rollback"].includes(body.action)) fail("OUT_OF_SCOPE");
    if (privateStaging && body.action === "publish")
      fail("PRIVATE_STAGING_CANNOT_PUBLISH_PRODUCTION", 409);
    if (
      (body.action === "publish" && prior.state === "PUBLISHED") ||
      (body.action === "rollback" && prior.state === "REVERTED")
    )
      return prior;
    const target =
      body.action === "publish"
        ? JSON.parse(prior.after_json)
        : JSON.parse(prior.before_json);
    const expected =
      body.action === "publish"
        ? prior.before_version
        : prior.published_version;
    if (body.action === "publish" && prior.state !== "QA_PASS")
      fail("SEO_QA_REQUIRED", 409);
    if (body.action === "rollback" && prior.state !== "PUBLISHED")
      fail("ROLLBACK_NOT_PUBLISHED", 409);
    const current = await read(body.slug);
    if (current.version !== expected) fail("SEO_VERSION_CONFLICT", 409);
    const updated = { ...target, updated_at: stamp() },
      version = await digest(JSON.stringify(updated));
    // Single D1 transaction and SQL CAS; no silent overwrite of an intervening edit.
    const values = fields.map((f) => updated[f]);
    const raw = JSON.parse(
      body.action === "publish" ? prior.before_json : prior.published_json,
    );
    const matches = fields.map((f) => `${f}=?`).join(" AND ");
    await db.batch([
      db
        .prepare(
          `UPDATE sd_seo_pages SET title=?,description=?,eyebrow=?,excerpt=?,content_json=?,updated_at=? WHERE slug=? AND updated_at=? AND ${matches}`,
        )
        .bind(
          ...values,
          updated.updated_at,
          body.slug,
          raw.updated_at,
          ...fields.map((f) => raw[f]),
        ),
      db
        .prepare(
          `UPDATE fp_seo_changes SET state=?,published_json=?,published_version=?,updated_at=?,published_at=COALESCE(published_at,?) WHERE id=? AND EXISTS(SELECT 1 FROM sd_seo_pages WHERE slug=? AND updated_at=? AND ${matches})`,
        )
        .bind(
          body.action === "publish" ? "PUBLISHED" : "REVERTED",
          JSON.stringify(updated),
          version,
          stamp(),
          body.action === "publish" ? stamp() : null,
          body.id,
          body.slug,
          updated.updated_at,
          ...values,
        ),
    ]);
    const result = await first(
      "SELECT * FROM fp_seo_changes WHERE id=?",
      body.id,
    );
    if (result.state !== (body.action === "publish" ? "PUBLISHED" : "REVERTED"))
      fail("SEO_VERSION_CONFLICT", 409);
    return result;
  }
  return { read, execute };
}
export async function privateSeoHandler(request, env) {
  if (
    new URL(request.url).origin !== privateOrigin ||
    env.FABRYA_PRODUCT_ORIGIN !== privateOrigin
  )
    return Response.json({ code: "SEO_DISABLED" }, { status: 403 });
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !== privateOrigin
  )
    return Response.json({ code: "ORIGIN" }, { status: 403 });
  // This origin is confirmed owner-private; Sites service access is verified by dispatch.
  try {
    const path = new URL(request.url).pathname.split("/").filter(Boolean),
      cms = seoCms({ db: env.DB, privateStaging: true });
    if (
      request.method === "GET" &&
      path[2] === "attribution" &&
      path.length === 3
    )
      return Response.json(await firstTouch({ db: env.DB, env }).report(), {
        headers: { "cache-control": "no-store" },
      });
    if (request.method === "GET" && path[2] === "pages")
      return Response.json(await cms.read(path[3]), {
        headers: { "cache-control": "no-store" },
      });
    if (
      request.method === "GET" &&
      path[2] === "qa-view" &&
      /^[a-zA-Z0-9_-]{8,100}$/.test(path[3] || "")
    ) {
      const frames = [1440, 390, 320]
        .map(
          (w) =>
            `<section><h2>Largeur ${w}px</h2><iframe title="SEO ${w}" width="${w}" height="2800" sandbox="allow-same-origin" src="/api/seo/preview/${path[3]}" style="border:0;display:block;width:${w}px"></iframe></section>`,
        )
        .join("");
      return new Response(
        `<!doctype html><html lang="fr"><meta charset="utf-8"><title>QA SEO privé</title><body><h1>Prévisualisations SEO isolées</h1>${frames}</body></html>`,
        {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "x-robots-tag": "noindex, nofollow",
            "content-security-policy":
              "default-src 'none'; frame-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'self'",
          },
        },
      );
    }
    if (request.method === "GET" && path[2] === "preview") {
      const row = await env.DB.prepare(
        "SELECT after_json FROM fp_seo_changes WHERE id=?",
      )
        .bind(path[3])
        .first();
      if (!row) return new Response("Not found", { status: 404 });
      return new Response(renderSeo(JSON.parse(row.after_json)), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
          "content-security-policy":
            "default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'",
        },
      });
    }
    if (request.method !== "POST" || path[2] !== "changes" || path.length !== 3)
      return Response.json({ code: "METHOD" }, { status: 405 });
    const raw = await request.text();
    if (raw.length > 40000) fail("TOO_LARGE", 413);
    return Response.json(await cms.execute(JSON.parse(raw)), {
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    return Response.json(
      { code: e instanceof ProductError ? e.code : "SEO_UNAVAILABLE" },
      { status: e instanceof ProductError ? e.status : 503 },
    );
  }
}
