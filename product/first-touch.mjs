import { digest } from "./contract.mjs";
const COOKIE = "fabrya_first_touch";
const GOOGLE = /^(?:www\.)?google\.(?:com|fr|co\.uk|de|es|it|be|ch|ca)$/;
const idFrom = (req) =>
  String(req.headers.get("cookie") || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
export function classifyArrival(request) {
  const url = new URL(request.url);
  let ref = null;
  try {
    ref = new URL(request.headers.get("referer") || "");
  } catch {}
  let channel = "unknown",
    google = false,
    evidence = "MISSING_REFERRER";
  if (url.searchParams.has("utm_source") || url.searchParams.has("gclid")) {
    channel = "outbound";
    evidence = "CAMPAIGN";
  } else if (!ref) {
    channel = "direct";
    evidence = "NO_REFERRER";
  } else if (GOOGLE.test(ref.hostname)) {
    google = true;
    const q = ref.searchParams.get("q");
    // Query absent is UNKNOWN, never inferred from aggregate GSC or invented.
    channel = q
      ? /\bfabrya\b/i.test(q)
        ? "google_organic_brand"
        : "google_organic_non_brand"
      : "unknown";
    evidence = q
      ? "GOOGLE_REFERRER_WITH_QUERY"
      : "GOOGLE_REFERRER_QUERY_UNAVAILABLE";
  } else if (ref.origin !== url.origin) {
    channel = "referral";
    evidence = "EXTERNAL_REFERRER";
  } else {
    evidence = "INTERNAL_ARRIVAL_WITHOUT_PRIOR_TOUCH";
  }
  return {
    channel,
    google_origin: google ? 1 : 0,
    evidence,
    landing_path: url.pathname.slice(0, 200),
    referrer_host: ref?.hostname.slice(0, 100) || "",
  };
}
export function firstTouch({ db, env = {}, clock = () => Date.now() }) {
  const stamp = () => new Date(clock()).toISOString();
  const get = async (req) => {
    const id = idFrom(req);
    if (!/^[a-f0-9]{64}$/.test(id || "")) return null;
    return db
      .prepare("SELECT * FROM fp_first_touch WHERE id=?")
      .bind(id)
      .first();
  };
  async function arrival(request) {
    const prior = await get(request);
    if (prior) return { touch: prior, cookie: null };
    const id = await digest(crypto.randomUUID() + crypto.randomUUID());
    const context = classifyArrival(request),
      url = new URL(request.url);
    const test =
      env.FABRYA_PRODUCT_QA === "true" || url.hostname !== "fabrya.fr" ? 1 : 0;
    await db
      .prepare(
        "INSERT OR IGNORE INTO fp_first_touch(id,channel,google_origin,evidence,landing_path,referrer_host,is_test,created_at) VALUES(?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        context.channel,
        context.google_origin,
        context.evidence,
        context.landing_path,
        context.referrer_host,
        test,
        stamp(),
      )
      .run();
    return {
      touch: await db
        .prepare("SELECT * FROM fp_first_touch WHERE id=?")
        .bind(id)
        .first(),
      cookie: `${COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
    };
  }
  async function link(request, user, project = null) {
    const touch = await get(request);
    if (!touch || !user) return;
    const account = await db
      .prepare("SELECT created_at FROM sd_platform_users WHERE id=?")
      .bind(user.id)
      .first();
    const verified = account && account.created_at >= touch.created_at ? 1 : 0;
    await db
      .prepare(
        "INSERT OR IGNORE INTO fp_user_first_touch(user_id,touch_id,acquisition_verified,created_at) VALUES(?,?,?,?)",
      )
      .bind(user.id, touch.id, verified, stamp())
      .run();
    if (project)
      await db
        .prepare(
          "INSERT OR IGNORE INTO fp_project_first_touch(project_id,touch_id,created_at) SELECT ?,touch_id,? FROM fp_user_first_touch WHERE user_id=?",
        )
        .bind(project, stamp(), user.id)
        .run();
  }
  async function report() {
    // Read-only join over records written exclusively by the existing payment logic.
    const rows = await db
      .prepare(
        `SELECT t.channel,t.is_test,COUNT(DISTINCT p.project_id) projects,
      COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN p.project_id END) checkouts,
      COUNT(DISTINCT CASE WHEN u.acquisition_verified=1 AND c.state='paid' AND substr(c.stripe_session_id,1,8)='cs_live_'
        AND a.project_id IS NOT NULL AND s.state='active' AND s.amount=5900 AND s.currency='eur'
        THEN p.project_id END) confirmed_live_payments
      FROM fp_project_first_touch p JOIN fp_first_touch t ON t.id=p.touch_id
      JOIN fp_projects pr ON pr.id=p.project_id JOIN fp_user_first_touch u ON u.user_id=pr.user_id AND u.touch_id=p.touch_id
      LEFT JOIN fp_checkouts c ON c.project_id=p.project_id
      LEFT JOIN fp_activations a ON a.project_id=p.project_id AND a.stripe_session_id=c.stripe_session_id
      LEFT JOIN fp_subscriptions s ON s.project_id=p.project_id GROUP BY t.channel,t.is_test`,
      )
      .all();
    return {
      source: "SERVER_FIRST_TOUCH_AND_EXISTING_PAYMENT_RECORDS",
      rows: rows.results,
      first_google_organic_customer: rows.results.some(
        (x) =>
          x.channel === "google_organic_non_brand" &&
          x.is_test === 0 &&
          x.confirmed_live_payments > 0,
      )
        ? "YES"
        : "NOT_YET",
    };
  }
  return { arrival, get, link, report };
}
