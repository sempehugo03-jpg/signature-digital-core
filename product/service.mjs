import { creditService } from './change-credits.mjs';
import {
  OFFER,
  TERMINAL,
  ProductError,
  fail,
  cleanInput,
  attribution,
  digest,
  json,
  parse,
} from "./contract.mjs";
import { deterministicKevinAdapter, MOCK_MODES } from "./kevin-adapter.mjs";
import { deliveryGate } from "./delivery-gate.mjs";
const nowISO = (clock) => new Date(clock()).toISOString();
const opaque = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{8,160}$/.test(value);
const eventNames = new Set([
  "landing_view",
  "signup_started",
  "signup_completed",
  "project_created",
  "brief_started",
  "brief_completed",
  "demo_requested",
  "demo_ready",
  "demo_failed",
  "demo_retry",
  "revision_requested",
  "version_ready",
  "version_approved",
  "checkout_started",
  "checkout_completed",
  "activation_completed",
]);
/** D1 SQL is the only source of truth. Supply adapters at the server composition root. */
export function productService({
  db,
  kevin = deterministicKevinAdapter(),
  stripe,
  clock = () => Date.now(),
  qa = false,
  deliveryVerifier = null,
  analyticsConsent = false,
  creditsEnabled = false,
}) {
  const first = (sql, ...args) =>
    db
      .prepare(sql)
      .bind(...args)
      .first();
  const all = async (sql, ...args) =>
    (
      await db
        .prepare(sql)
        .bind(...args)
        .all()
    ).results;
  const run = (sql, ...args) =>
    db
      .prepare(sql)
      .bind(...args)
      .run();
  const stmt = (sql, ...args) => db.prepare(sql).bind(...args);
  const stamp = () => nowISO(clock);
  const paymentLive = stripe?.livemode === true;
  const owner = async (user, id) => {
    const p = await first(
      "SELECT * FROM fp_projects WHERE id=? AND user_id=?",
      id,
      user.id,
    );
    if (!p)
      fail("NOT_FOUND", "Ce projet est introuvable dans votre compte.", 404);
    return p;
  };
  const commandKey = (key) => {
    if (!opaque(key))
      fail("INVALID_KEY", "Rechargez cette étape puis réessayez.");
    return key;
  };
  const emit = async (
    name,
    user,
    project,
    session = "server",
    id = crypto.randomUUID(),
  ) => {
    if (!analyticsConsent || !eventNames.has(name)) return;
    await run(
      "INSERT OR IGNORE INTO fp_events(id,session_id,user_id,project_id,name,created_at) VALUES(?,?,?,?,?,?)",
      id,
      String(session).slice(0, 100),
      user?.id || null,
      project || null,
      name,
      stamp(),
    );
  };
  const serializeJob = (j) =>
    j
      ? {
          job_id: j.id,
          status: j.status,
          progress: parse(j.progress),
          created_at: j.created_at,
          updated_at: j.updated_at,
          recoverable: !!j.recoverable,
          error: parse(j.error, null),
          result: j.result_hash
            ? {
                version_id: j.version_id,
                hash: j.result_hash,
                preview_url: `/api/product/projects/${j.project_id}/versions/${j.version_id}/preview`,
              }
            : null,
          version: j.version_id,
          attempt: j.attempt,
        }
      : null;
  async function advance(j, user) {
    if (!j || TERMINAL.has(j.status)) return j;
    const pending = parse(j.adapter_handle);
    if (pending.pending) {
      const snapshot = parse(j.input_snapshot);
      const created = await kevin.createDemo({
        job_id: j.id,
        ...snapshot,
        mode: pending.mode,
        created_at: pending.started_at,
        idempotency_key: j.id + ":" + j.attempt,
      });
      if (created.job_id !== j.id)
        fail(
          "ADAPTER_ID",
          "Votre projet reste enregistré. La création sera disponible après vérification.",
          503,
        );
      await run(
        "UPDATE fp_jobs SET adapter_handle=? WHERE id=? AND attempt=? AND adapter_handle=?",
        created.handle,
        j.id,
        j.attempt,
        j.adapter_handle,
      );
      j = await first("SELECT * FROM fp_jobs WHERE id=?", j.id);
    }
    const state = await kevin.getJob({
      job_id: j.id,
      handle: j.adapter_handle,
    });
    if (
      ![
        "queued",
        "understanding",
        "planning",
        "creating",
        "rendering",
        "ready",
        "failed",
        "cancelled",
      ].includes(state.status)
    )
      fail(
        "ADAPTER_STATE",
        "Votre projet est conservé. La création nécessite une vérification.",
        503,
      );
    const statements = [
      stmt(
        `UPDATE fp_jobs SET status=?,progress=?,error=?,recoverable=?,result_hash=?,updated_at=? WHERE id=? AND attempt=? AND adapter_handle=? AND status NOT IN ('ready','failed','cancelled')`,
        state.status,
        json(state.progress),
        state.error ? json(state.error) : null,
        state.recoverable ? 1 : 0,
        state.result?.hash || null,
        stamp(),
        j.id,
        j.attempt,
        j.adapter_handle,
      ),
    ];
    if (state.status === "ready") {
      if (
        !state.result?.html ||
        !state.result.hash ||
        (await digest(state.result.html)) !== state.result.hash
      )
        fail(
          "ARTIFACT_INVALID",
          "Votre proposition est conservée mais sa vérification a échoué.",
          503,
        );
      statements.push(
        stmt(
          `UPDATE fp_versions SET state='ready',html=?,artifact_hash=?,updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_jobs WHERE id=? AND attempt=? AND status='ready' AND result_hash=?)`,
          state.result.html,
          state.result.hash,
          stamp(),
          j.version_id,
          j.id,
          j.attempt,
          state.result.hash,
        ),
      );
      // Provenance is recorded once, with the artifact, never backfilled as real.
      statements.push(stmt(
        `INSERT OR IGNORE INTO fp_version_delivery(version_id,job_id,artifact_hash,adapter_kind,result_source,is_mock,created_at)
         SELECT id,job_id,artifact_hash,?,?,?,? FROM fp_versions WHERE id=? AND state='ready' AND artifact_hash=?`,
        kevin.kind || "unknown", /^[a-zA-Z0-9_.:-]{1,100}$/.test(state.result.source || "") ? state.result.source : "unknown",
        state.result.mock === false && kevin.kind !== "deterministic-test" ? 0 : 1,
        stamp(), j.version_id, state.result.hash,
      ));
      statements.push(
        stmt(
          `UPDATE fp_projects SET status=CASE WHEN status='active' THEN 'active' ELSE 'review' END,updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_versions WHERE id=? AND state='ready')`,
          stamp(),
          j.project_id,
          j.version_id,
        ),
      );
    } else if (TERMINAL.has(state.status))
      statements.push(
        stmt(
          `UPDATE fp_versions SET state=?,updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_jobs WHERE id=? AND attempt=? AND status=?)`,
          state.status,
          stamp(),
          j.version_id,
          j.id,
          j.attempt,
          state.status,
        ),
      );
    await db.batch(statements);
    const latest = await first("SELECT * FROM fp_jobs WHERE id=?", j.id);
    if (TERMINAL.has(latest.status))
      await emit(
        latest.status === "ready" ? "demo_ready" : "demo_failed",
        user,
        j.project_id,
        "server",
        `job-${j.id}-${j.attempt}-${latest.status}`,
      );
    if (latest.status === "ready")
      await emit(
        "version_ready",
        user,
        j.project_id,
        "server",
        `version-${j.version_id}-ready`,
      );
    return latest;
  }
  async function read(user, id) {
    await owner(user, id);
    for (const j of await all(
      "SELECT * FROM fp_jobs WHERE project_id=? AND status NOT IN ('ready','failed','cancelled')",
      id,
    )) {
      try {
        await advance(j, user);
      } catch {
        await db.batch([
          stmt(
            "UPDATE fp_jobs SET status='failed',error=?,recoverable=1,updated_at=? WHERE id=? AND attempt=? AND status NOT IN ('ready','failed','cancelled')",
            json({
              code: "ADAPTER_UNAVAILABLE",
              message:
                "La création a été interrompue. Votre brief et les versions précédentes sont conservés. Vous pouvez relancer.",
            }),
            stamp(),
            j.id,
            j.attempt,
          ),
          stmt(
            "UPDATE fp_versions SET state='failed',updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_jobs WHERE id=? AND status='failed')",
            stamp(),
            j.version_id,
            j.id,
          ),
        ]);
        await emit(
          "demo_failed",
          user,
          id,
          "server",
          `failure-${j.id}-${j.attempt}`,
        );
      }
    }
    const p = await owner(user, id);
    const versions = await all(
      "SELECT id,number,source,state,modification,artifact_hash,created_at,updated_at FROM fp_versions WHERE project_id=? ORDER BY number DESC",
      id,
    );
    const job = await first(
      "SELECT * FROM fp_jobs WHERE project_id=? ORDER BY created_at DESC,id DESC LIMIT 1",
      id,
    );
    const subscription = await first(
      "SELECT state,amount,currency,updated_at FROM fp_subscriptions WHERE project_id=?",
      id,
    );
    const activation = await first(
      "SELECT version_id,artifact_hash,created_at FROM fp_activations WHERE project_id=?",
      id,
    );
    const checkout = await first(
      "SELECT stripe_session_id,state,updated_at FROM fp_checkouts WHERE project_id=? ORDER BY created_at DESC,attempt DESC LIMIT 1",
      id,
    );
    return {
      project: {
        id: p.id,
        company_input: parse(p.company_input),
        draft_revision: p.draft_revision,
        step: p.step,
        status: p.status,
        approved_version_id: p.approved_version_id,
        active_version_id: p.active_version_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
      },
      job: serializeJob(job),
      versions,
      subscription,
      activation,
      checkout,
      offer: OFFER,
      delivery: await deliveryGate({ db, version: p.approved_version_id
        ? await first("SELECT * FROM fp_versions WHERE id=? AND project_id=?", p.approved_version_id, id)
        : null, verifier: deliveryVerifier }),
    };
  }
  async function create(user, body) {
    const key = commandKey(body.request_key),
      id = "prj_" + (await digest(user.id + ":" + key)).slice(0, 32);
    await run(
      `INSERT OR IGNORE INTO fp_projects(id,user_id,request_key,company_input,attribution,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`,
      id,
      user.id,
      key,
      json(cleanInput(body.company_input)),
      // The legacy client category is not acquisition proof. Only consented
      // server first-touch records may establish an origin through their join.
      json({ source: "unknown" }),
      stamp(),
      stamp(),
    );
    await emit("project_created", user, id, "server", `created-${id}`);
    return read(user, id);
  }
  async function save(user, id, body) {
    const p = await owner(user, id);
    const input = cleanInput(body.company_input);
    if (p.status !== "draft")
      fail(
        "BRIEF_LOCKED",
        "Ce brief appartient à une version déjà créée. Demandez une modification pour conserver son historique.",
        409,
      );
    if (!Number.isInteger(body.draft_revision) || body.draft_revision < 0)
      fail(
        "INVALID_REVISION",
        "Rechargez votre projet avant de sauvegarder.",
        400,
      );
    const changed = await run(
      `UPDATE fp_projects SET company_input=?,draft_revision=draft_revision+1,step=?,updated_at=? WHERE id=? AND user_id=? AND draft_revision=? AND status='draft'`,
      json(input),
      Math.min(3, Math.max(0, Math.floor(body.step || 0))),
      stamp(),
      id,
      user.id,
      body.draft_revision,
    );
    if (!changed.meta?.changes)
      fail(
        "DRAFT_CONFLICT",
        "Le projet a été modifié dans un autre onglet. Votre saisie reste ici : comparez avec la version sauvegardée.",
        409,
      );
    await emit("brief_started", user, id, "server", `brief-${id}`);
    return read(user, id);
  }
  async function requestDemo(user, id, body, revision = "") {
    const p = await owner(user, id);
    const key = commandKey(body.request_key);
    const duplicate = await first(
      "SELECT * FROM fp_jobs WHERE project_id=? AND request_key=?",
      id,
      key,
    );
    if (duplicate) return { job_id: duplicate.id };
    const running = await first(
      "SELECT * FROM fp_jobs WHERE project_id=? AND status IN ('queued','understanding','planning','creating','rendering')",
      id,
    );
    if (running) return { job_id: running.id };
    const pending = await first(
      "SELECT id FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing')",
      id,
    );
    if (pending)
      fail(
        "CHECKOUT_PENDING",
        "Terminez ou annulez le paiement avant de créer une autre version.",
        409,
      );
    if (p.status !== "draft" && !revision) {
      const existing = await first(
        "SELECT * FROM fp_jobs WHERE project_id=? ORDER BY created_at DESC LIMIT 1",
        id,
      );
      if (existing) return { job_id: existing.id };
    }
    const input = parse(p.company_input);
    if (!input.name || !input.activity || !input.objective)
      fail(
        "BRIEF_INCOMPLETE",
        "Indiquez le nom, l’activité et l’objectif de votre entreprise.",
      );
    if (revision && revision.length > 2000)
      fail("REVISION_TOO_LONG", "Limitez votre demande à 2 000 caractères.");
    const mode =
      qa && MOCK_MODES.includes(body.mode) ? body.mode : "MOCK_READY";
    const jobId = "job_" + (await digest(id + ":" + key)).slice(0, 32),
      versionId = "ver_" + (await digest(jobId)).slice(0, 32);
    const number = Number(
      (
        await first(
          "SELECT COALESCE(MAX(number),0)+1 AS n FROM fp_versions WHERE project_id=?",
          id,
        )
      ).n,
    );
    const initialHandle = json({ pending: true, mode, started_at: clock() });
    await db.batch([
      stmt(
        `INSERT OR IGNORE INTO fp_jobs(id,project_id,version_id,request_key,status,adapter_handle,input_snapshot,progress,created_at,updated_at) VALUES(?,?,?,?,'queued',?,?,?, ?,?)`,
        jobId,
        id,
        versionId,
        key,
        initialHandle,
        json({ company_input: input, revision, version: number }),
        json({ stage: "queued", label: "Votre demande est enregistrée" }),
        stamp(),
        stamp(),
      ),
      stmt(
        `INSERT OR IGNORE INTO fp_versions(id,project_id,number,job_id,source,state,modification,created_at,updated_at) SELECT ?,?,?,?,?,'queued',?,?,? WHERE EXISTS(SELECT 1 FROM fp_jobs WHERE id=?)`,
        versionId,
        id,
        number,
        jobId,
        kevin.kind || "engine",
        revision,
        stamp(),
        stamp(),
        jobId,
      ),
      stmt(
        `UPDATE fp_projects SET status=CASE WHEN status='active' THEN 'active' ELSE 'creating' END,approved_version_id=NULL,updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_jobs WHERE id=?)`,
        stamp(),
        id,
        jobId,
      ),
    ]);
    const actual =
      (await first("SELECT * FROM fp_jobs WHERE id=?", jobId)) ||
      (await first(
        "SELECT * FROM fp_jobs WHERE project_id=? AND status IN ('queued','understanding','planning','creating','rendering')",
        id,
      ));
    if (!actual)
      fail(
        "CREATION_CONFLICT",
        "Votre projet a changé dans un autre onglet. Rechargez-le.",
        409,
      );
    await emit(
      revision ? "revision_requested" : "demo_requested",
      user,
      id,
      "server",
      `request-${actual.id}`,
    );
    await emit("brief_completed", user, id, "server", `completed-${id}`);
    return { job_id: actual.id };
  }
  async function retry(user, id, jobId, body) {
    await owner(user, id);
    const key = commandKey(body.request_key);
    const j = await first(
      "SELECT * FROM fp_jobs WHERE id=? AND project_id=?",
      jobId,
      id,
    );
    if (!j) fail("NOT_FOUND", "Cette création est introuvable.", 404);
    if (j.last_retry_key === key || !TERMINAL.has(j.status))
      return { job_id: j.id };
    if (!["failed", "cancelled"].includes(j.status) || !j.recoverable)
      fail(
        "NOT_RECOVERABLE",
        "Cette proposition est déjà prête. Ouvrez-la.",
        409,
      );
    const pendingHandle = json({
      pending: true,
      mode: "MOCK_READY",
      started_at: clock(),
    });
    await db.batch([
      stmt(
        `UPDATE fp_jobs SET status='queued',adapter_handle=?,error=NULL,result_hash=NULL,progress=?,recoverable=1,attempt=attempt+1,last_retry_key=?,updated_at=? WHERE id=? AND status IN ('failed','cancelled') AND attempt=?`,
        pendingHandle,
        json({ stage: "queued", label: "Votre demande est enregistrée" }),
        key,
        stamp(),
        j.id,
        j.attempt,
      ),
      stmt(
        `UPDATE fp_versions SET state='queued',updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_jobs WHERE id=? AND last_retry_key=?)`,
        stamp(),
        j.version_id,
        j.id,
        key,
      ),
    ]);
    await emit("demo_retry", user, id, "server", `retry-${j.id}-${key}`);
    return { job_id: j.id };
  }
  async function cancel(user, id, jobId) {
    await owner(user, id);
    const j = await first(
      "SELECT * FROM fp_jobs WHERE id=? AND project_id=?",
      jobId,
      id,
    );
    if (!j) fail("NOT_FOUND", "Cette création est introuvable.", 404);
    if (TERMINAL.has(j.status)) return { job_id: j.id };
    await kevin.cancel({ job_id: j.id, handle: j.adapter_handle });
    await db.batch([
      stmt(
        `UPDATE fp_jobs SET status='cancelled',recoverable=1,updated_at=? WHERE id=? AND status NOT IN ('ready','failed','cancelled')`,
        stamp(),
        j.id,
      ),
      stmt(
        `UPDATE fp_versions SET state='cancelled',updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_jobs WHERE id=? AND status='cancelled')`,
        stamp(),
        j.version_id,
        j.id,
      ),
    ]);
    return { job_id: j.id };
  }
  async function version(user, id, versionId) {
    await owner(user, id);
    const v = await first(
      "SELECT * FROM fp_versions WHERE id=? AND project_id=? AND state='ready'",
      versionId,
      id,
    );
    if (!v)
      fail("NOT_FOUND", "Cette proposition n’est pas encore disponible.", 404);
    return v;
  }
  async function approve(user, id, body) {
    const p = await owner(user, id);
    const v = await version(user, id, body.version_id);
    if (
      await first(
        "SELECT id FROM fp_jobs WHERE project_id=? AND status IN ('queued','understanding','planning','creating','rendering')",
        id,
      )
    )
      fail(
        "GENERATION_RUNNING",
        "Attendez la nouvelle proposition avant de valider.",
        409,
      );
    if (
      await first(
        "SELECT id FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing')",
        id,
      )
    )
      fail(
        "CHECKOUT_PENDING",
        "Un paiement est déjà ouvert pour une version validée.",
        409,
      );
    const approval =
      "apv_" +
      (await digest(id + ":" + v.id + ":" + v.artifact_hash)).slice(0, 32);
    await db.batch([
      stmt(
        "INSERT OR IGNORE INTO fp_approvals(id,project_id,version_id,artifact_hash,user_id,created_at) VALUES(?,?,?,?,?,?)",
        approval,
        id,
        v.id,
        v.artifact_hash,
        user.id,
        stamp(),
      ),
      stmt(
        "UPDATE fp_projects SET approved_version_id=?,status=CASE WHEN status='active' THEN 'active' ELSE 'approved' END,updated_at=? WHERE id=?",
        v.id,
        stamp(),
        id,
      ),
    ]);
    await emit("version_approved", user, id, "server", `approved-${approval}`);
    if (p.status === "active") {
      // Explicit publication of a previously reviewed revision for an already active test project.
      await db.batch([
        stmt(
          `UPDATE fp_projects SET active_version_id=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_subscriptions WHERE project_id=? AND state='active')`,
          v.id,
          id,
          id,
        ),
        stmt(
          `UPDATE fp_activations SET version_id=?,approval_id=?,artifact_hash=? WHERE project_id=? AND EXISTS(SELECT 1 FROM fp_subscriptions WHERE project_id=? AND state='active')`,
          v.id,
          approval,
          v.artifact_hash,
          id,
          id,
        ),
      ]);
    }
    return read(user, id);
  }
  function requireStripe() {
    if (!stripe)
      fail(
        "PAYMENT_UNAVAILABLE",
        "Le paiement de test est en cours de configuration. Votre version validée est conservée.",
        503,
      );
  }
  async function recoverCheckoutIdentity(user, project, c) {
    if (c.stripe_session_id || clock() - Date.parse(c.created_at) <= 23 * 60 * 60 * 1000) return c;
    if (!stripe.findCheckout)
      fail("CHECKOUT_RECOVERY_REQUIRED", "Votre paiement précédent doit être vérifié. Aucun nouveau paiement n’a été créé.", 409);
    const approval = await first("SELECT * FROM fp_approvals WHERE id=? AND project_id=?", c.approval_id, project.id);
    if (!approval || project.approved_version_id !== approval.version_id)
      fail("CHECKOUT_VERSION", "La version du paiement précédent doit être vérifiée.", 409);
    const found = await stripe.findCheckout({ checkout_id:c.id, project_id:project.id, user_id:user.id, approval_id:approval.id, version_id:approval.version_id, created_at:c.created_at });
    await run("UPDATE fp_checkouts SET stripe_session_id=?,url=?,updated_at=? WHERE id=? AND stripe_session_id IS NULL", found.id, found.url || null, stamp(), c.id);
    const saved = await first("SELECT * FROM fp_checkouts WHERE id=?", c.id);
    if (saved.stripe_session_id !== found.id)
      fail("CHECKOUT_RECOVERY_REQUIRED", "Une vérification de paiement est déjà en cours. Votre projet reste conservé.", 409);
    return saved;
  }
  // Read-only verification of the exact Stripe search used by long recovery.
  // It never repairs a row, creates a Checkout or changes an approval.
  async function checkoutRecoveryProof(user, id) {
    const project = await owner(user, id);
    requireStripe();
    const c = await first("SELECT * FROM fp_checkouts WHERE project_id=? ORDER BY created_at DESC LIMIT 1", id);
    if (!c || !c.stripe_session_id) fail("NO_CHECKOUT", "Ouvrez d’abord une étape de paiement, sans la payer.", 409);
    const approval = await first("SELECT * FROM fp_approvals WHERE id=? AND project_id=?", c.approval_id, id);
    if (!approval) fail("CHECKOUT_VERSION", "La version du paiement doit être vérifiée.", 409);
    const found = await stripe.findCheckout({checkout_id:c.id,project_id:id,user_id:user.id,approval_id:approval.id,version_id:approval.version_id,created_at:c.created_at});
    if (found.id !== c.stripe_session_id) fail("PAYMENT_CONTEXT", "L’étape retrouvée ne correspond pas à la demande conservée.", 409);
    return {verified:true,mode:found.livemode ? "LIVE" : "TEST",same_session:true,project_id:id,version_id:approval.version_id,session_status:found.status,payment_status:found.payment_status,age_hours:Math.floor((clock()-Date.parse(c.created_at))/3600000),writes:0};
  }
  async function checkout(user, id) {
    const p = await owner(user, id);
    if (p.status === "active")
      fail(
        "ALREADY_ACTIVE",
        "Ce projet est déjà actif. Gérez votre abonnement dans votre espace.",
        409,
      );
    if (
      await first(
        "SELECT project_id FROM fp_subscriptions WHERE project_id=?",
        id,
      )
    )
      fail(
        "SUBSCRIPTION_EXISTS",
        "Votre projet possède déjà un abonnement. Ouvrez sa gestion pour vérifier ou régulariser son état.",
        409,
      );
    const a = await first(
      "SELECT * FROM fp_approvals WHERE project_id=? AND version_id=?",
      id,
      p.approved_version_id || "",
    );
    if (!a)
      fail(
        "NOT_APPROVED",
        "Choisissez et validez une version avant de vous abonner.",
        409,
      );
    const approvedVersion = await version(user, id, a.version_id);
    const delivery = await deliveryGate({ db, version: approvedVersion, approval: a, verifier: deliveryVerifier });
    if (!delivery.checkout_allowed)
      fail("SERVICE_DELIVERY_REQUIRED", "Cette proposition n’est pas encore disponible à l’abonnement. Votre choix et votre projet sont conservés. Aucun paiement n’a été ouvert.", 409);
    requireStripe();
    await stripe.verifyOffer(OFFER);
    let c = await first(
      "SELECT * FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing')",
      id,
    );
    if (!c) {
      const attempt = Number(
        (
          await first(
            "SELECT COALESCE(MAX(attempt),0)+1 AS n FROM fp_checkouts WHERE approval_id=?",
            a.id,
          )
        ).n,
      );
      const cid = "chk_" + (await digest(a.id + ":" + attempt)).slice(0, 32);
      await run(
        "INSERT OR IGNORE INTO fp_checkouts(id,project_id,approval_id,attempt,created_at,updated_at) VALUES(?,?,?,?,?,?)",
        cid,
        id,
        a.id,
        attempt,
        stamp(),
        stamp(),
      );
      c = await first(
        "SELECT * FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing')",
        id,
      );
    }
    if (c.approval_id !== a.id)
      fail(
        "CHECKOUT_VERSION",
        "Le paiement ouvert concerne une autre version. Fermez-le avant de continuer.",
        409,
      );
    c = await recoverCheckoutIdentity(user, p, c);
    if (c.stripe_session_id) {
      const session = await stripe.getSession(c.stripe_session_id);
      if (session.status === "open" && session.url)
        return { url: session.url, session_id: session.id };
      if (session.status === "complete") {
        await reconcile(user, id);
        return { pending: true };
      }
      if (session.status === "expired") {
        await run(
          "UPDATE fp_checkouts SET state='expired',updated_at=? WHERE id=?",
          stamp(),
          c.id,
        );
        return checkout(user, id);
      }
      fail("CHECKOUT_RECOVERY_REQUIRED", "Votre paiement précédent est en cours de vérification. Aucun nouveau paiement n’a été créé.", 409);
    }
    if (clock() - Date.parse(c.created_at) > 23 * 60 * 60 * 1000)
      fail(
        "CHECKOUT_RECOVERY_REQUIRED",
        "La confirmation de ce paiement doit être retrouvée avant une nouvelle tentative. Votre projet est conservé.",
        409,
      );
    const session = await stripe.createSession({
      idempotency_key: `fabrya-product-${c.id}`,
      project_id: id,
      approval_id: a.id,
      checkout_id: c.id,
      version_id: a.version_id,
      user_id: user.id,
      email: user.email,
    });
    if (session.livemode !== paymentLive || !session.url || !session.id)
      fail(
        "PAYMENT_MODE",
        "Ce paiement ne correspond pas à cet environnement.",
        503,
      );
    await run(
      "UPDATE fp_checkouts SET stripe_session_id=?,url=?,state='open',updated_at=? WHERE id=?",
      session.id,
      session.url,
      stamp(),
      c.id,
    );
    await emit("checkout_started", user, id, "server", `checkout-${c.id}`);
    return { url: session.url, session_id: session.id };
  }
  async function completeSession(session) {
    if (session.livemode !== paymentLive)
      fail("LIVE_FORBIDDEN", "Événement réel refusé.", 400);
    await stripe.verifyAccount?.();
    const c = await first(
      "SELECT * FROM fp_checkouts WHERE stripe_session_id=?",
      session.id,
    );
    if (!c) return { ignored: true };
    if (session.status !== "complete" || session.payment_status !== "paid") {
      if (session.status === "expired")
        await run(
          "UPDATE fp_checkouts SET state='expired',updated_at=? WHERE id=? AND state!='paid'",
          stamp(),
          c.id,
        );
      return { pending: true };
    }
    const a = await first(
      "SELECT * FROM fp_approvals WHERE id=? AND project_id=?",
      c.approval_id,
      c.project_id,
    );
    const p = await first("SELECT * FROM fp_projects WHERE id=?", c.project_id);
    if (
      !a ||
      session.metadata?.approval_id !== a.id ||
      session.metadata?.project_id !== p.id ||
      session.metadata?.checkout_id !== c.id ||
      session.metadata?.user_id !== p.user_id ||
      session.metadata?.version_id !== a.version_id ||
      (c.state !== "paid" && p.approved_version_id !== a.version_id)
    )
      fail("PAYMENT_CONTEXT", "Contexte du paiement invalide.", 409);
    if (
      session.amount_total !== OFFER.amount ||
      session.currency !== OFFER.currency ||
      session.mode !== "subscription"
    )
      fail(
        "PAYMENT_AMOUNT",
        "Le paiement ne correspond pas à l’offre validée.",
        409,
      );
    const sub = await stripe.getSubscription(
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id,
    );
    if (sub.livemode !== paymentLive || !stripe.validSubscription(sub, OFFER))
      fail(
        "PAYMENT_CONTEXT",
        "L’abonnement ne correspond pas à l’offre Fabrya.",
        409,
      );
    if (
      paymentLive &&
      [
        "project_id",
        "user_id",
        "version_id",
        "approval_id",
        "checkout_id",
      ].some((k) => sub.metadata?.[k] !== session.metadata?.[k])
    )
      fail("PAYMENT_CONTEXT", "Contexte de l’abonnement invalide.", 409);
    if (sub.status !== "active") return { pending: true };
    const customer =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (
      !customer ||
      !sub.id ||
      (sub.customer &&
        (typeof sub.customer === "string" ? sub.customer : sub.customer.id) !==
          customer)
    )
      fail("PAYMENT_CONTEXT", "Confirmation du paiement incomplète.", 409);
    await db.batch([
      stmt(
        `INSERT INTO fp_subscriptions(project_id,stripe_subscription_id,stripe_customer_id,state,price_id,amount,currency,provider_updated_at,created_at,updated_at) VALUES(?,?,?,'active',?,?,?,0,?,?) ON CONFLICT(project_id) DO UPDATE SET state='active',updated_at=excluded.updated_at WHERE fp_subscriptions.stripe_subscription_id=excluded.stripe_subscription_id`,
        p.id,
        sub.id,
        customer,
        stripe.priceId,
        OFFER.amount,
        OFFER.currency,
        stamp(),
        stamp(),
      ),
      stmt(
        `INSERT OR IGNORE INTO fp_activations(project_id,version_id,approval_id,stripe_session_id,artifact_hash,created_at) VALUES(?,?,?,?,?,?)`,
        p.id,
        a.version_id,
        a.id,
        session.id,
        a.artifact_hash,
        stamp(),
      ),
      stmt(
        `UPDATE fp_projects SET status='active',active_version_id=COALESCE(active_version_id,?),updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM fp_activations WHERE project_id=? AND stripe_session_id=?) AND EXISTS(SELECT 1 FROM fp_subscriptions WHERE project_id=? AND stripe_subscription_id=? AND state='active')`,
        a.version_id,
        stamp(),
        p.id,
        p.id,
        session.id,
        p.id,
        sub.id,
      ),
      stmt(
        `UPDATE fp_checkouts SET state='paid',updated_at=? WHERE id=?`,
        stamp(),
        c.id,
      ),
    ]);
    await emit(
      "checkout_completed",
      { id: p.user_id },
      p.id,
      "server",
      `payment-${session.id}`,
    );
    await emit(
      "activation_completed",
      { id: p.user_id },
      p.id,
      "server",
      `activation-${p.id}`,
    );
    if(creditsEnabled) {
      const invoiceId=typeof sub.latest_invoice==='string'?sub.latest_invoice:sub.latest_invoice?.id;
      if(invoiceId) await creditService({db,clock,billing:stripe,enabled:true}).grantPaidMonth(p.id,invoiceId);
    }
    return { activated: true };
  }
  async function reconcile(user, id) {
    const project = await owner(user, id);
    requireStripe();
    const uncertain = await first("SELECT * FROM fp_checkouts WHERE project_id=? AND stripe_session_id IS NULL AND state='creating'", id);
    if (uncertain) await recoverCheckoutIdentity(user, project, uncertain);
    const c = await first(
      "SELECT * FROM fp_checkouts WHERE project_id=? AND stripe_session_id IS NOT NULL AND state IN ('open','creating','processing','paid') ORDER BY created_at DESC LIMIT 1",
      id,
    );
    if (c) {
      await completeSession(await stripe.getSession(c.stripe_session_id));
      const saved = await first(
        "SELECT * FROM fp_subscriptions WHERE project_id=?",
        id,
      );
      if (saved)
        await syncSubscription(
          await stripe.getSubscription(saved.stripe_subscription_id),
        );
    }
    return read(user, id);
  }
  async function abandon(user, id) {
    await owner(user, id);
    requireStripe();
    const c = await first(
      "SELECT * FROM fp_checkouts WHERE project_id=? AND state IN ('creating','open','processing')",
      id,
    );
    if (!c) return read(user, id);
    if (!c.stripe_session_id)
      fail(
        "CHECKOUT_PREPARING",
        "Le paiement se prépare. Réessayez dans un instant.",
        409,
      );
    const session = await stripe.getSession(c.stripe_session_id);
    if (session.status === "complete") {
      await completeSession(session);
      return read(user, id);
    }
    if (session.status === "open") await stripe.expireSession(session.id);
    await run(
      "UPDATE fp_checkouts SET state='expired',updated_at=? WHERE id=? AND state!='paid'",
      stamp(),
      c.id,
    );
    return read(user, id);
  }
  async function syncSubscription(sub) {
    if (sub.livemode !== paymentLive)
      fail("PAYMENT_MODE", "Mode de paiement incorrect.", 400);
    const latestInvoice =
      typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
    const subscriptionState =
      sub.status === "active" &&
      latestInvoice &&
      latestInvoice.paid !== true &&
      latestInvoice.status === "open" &&
      latestInvoice.attempt_count > 0
        ? "payment_attention"
        : sub.status;
    const saved = await first(
      "SELECT * FROM fp_subscriptions WHERE stripe_subscription_id=?",
      sub.id,
    );
    if (saved) {
      if (sub.status === "active" && !stripe.validSubscription(sub, OFFER))
        fail(
          "PAYMENT_CONTEXT",
          "L’abonnement ne correspond pas à l’offre Fabrya.",
          409,
        );
      await db.batch([
        stmt(
          `UPDATE fp_subscriptions SET state=?,updated_at=? WHERE stripe_subscription_id=?`,
          subscriptionState,
          stamp(),
          sub.id,
        ),
        stmt(
          `UPDATE fp_projects SET status=CASE WHEN ?='active' THEN CASE WHEN EXISTS(SELECT 1 FROM fp_activations WHERE project_id=?) THEN 'active' ELSE status END ELSE 'payment_attention' END,updated_at=? WHERE id=?`,
          subscriptionState,
          saved.project_id,
          stamp(),
          saved.project_id,
        ),
      ]);
    }
  }
  async function webhook(event) {
    requireStripe();
    if (event.livemode !== paymentLive)
      fail("LIVE_FORBIDDEN", "Événement réel refusé.", 400);
    if (
      paymentLive &&
      event.account &&
      event.account !== "acct_1QDQzUA4NzNcjm7q"
    )
      fail("PAYMENT_ACCOUNT", "Compte de paiement incorrect.", 400);
    const prior = await first(
      "SELECT state FROM fp_webhooks WHERE id=?",
      event.id,
    );
    if (prior?.state === "processed") return { duplicate: true };
    await run(
      "INSERT OR IGNORE INTO fp_webhooks(id,type,state,created_at) VALUES(?,?,'received',?)",
      event.id,
      event.type,
      stamp(),
    );
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.expired",
      ].includes(event.type)
    )
      await completeSession(await stripe.getSession(event.data.object.id));
    else if (
      event.type.startsWith("customer.subscription.") ||
      ["invoice.paid", "invoice.payment_failed"].includes(event.type)
    ) {
      // Always fetch current provider truth; event order or retries cannot resurrect old state.
      await stripe.verifyAccount?.();
      let subscriptionId = event.data.object.id;
      if (event.type.startsWith("invoice.")) {
        const invoice = await stripe.getInvoice(event.data.object.id);
        subscriptionId =
          invoice.parent?.subscription_details?.subscription ||
          invoice.subscription;
        subscriptionId =
          typeof subscriptionId === "string"
            ? subscriptionId
            : subscriptionId?.id;
        if (!subscriptionId) {
          await run(
            "UPDATE fp_webhooks SET state='processed',processed_at=? WHERE id=?",
            stamp(),
            event.id,
          );
          return { ignored: true };
        }
        const sessions =
          await stripe.getSessionsForSubscription(subscriptionId);
        for (const session of sessions.data || [])
          await completeSession(await stripe.getSession(session.id));
      }
      const sub = await stripe.getSubscription(subscriptionId);
      if (sub.livemode !== paymentLive)
        fail("LIVE_FORBIDDEN", "Abonnement réel refusé.", 400);
      await syncSubscription(sub);
      if(creditsEnabled && event.type==='invoice.paid') {
        const linked=await first('SELECT project_id FROM fp_subscriptions WHERE stripe_subscription_id=?',subscriptionId);
        if(linked) await creditService({db,clock,billing:stripe,enabled:true}).grantPaidMonth(linked.project_id,event.data.object.id);
      }
    }
    await run(
      "UPDATE fp_webhooks SET state='processed',processed_at=? WHERE id=?",
      stamp(),
      event.id,
    );
    return { received: true };
  }
  async function portal(user, id) {
    await owner(user, id);
    requireStripe();
    const s = await first(
      "SELECT * FROM fp_subscriptions WHERE project_id=?",
      id,
    );
    if (!s)
      fail("NO_SUBSCRIPTION", "Aucun abonnement n’est encore actif.", 409);
    return stripe.createPortal(s.stripe_customer_id, id);
  }
  return {
    read,
    create,
    save,
    requestDemo,
    retry,
    cancel,
    version,
    approve,
    checkout,
    checkoutRecoveryProof,
    reconcile,
    abandon,
    webhook,
    portal,
    emit,
    list: async (user) => ({
      projects: (
        await all(
          "SELECT id,company_input,status,updated_at FROM fp_projects WHERE user_id=? ORDER BY updated_at DESC",
          user.id,
        )
      ).map((p) => ({
        id: p.id,
        name: parse(p.company_input).name || "Votre nouveau projet",
        status: p.status,
        updated_at: p.updated_at,
      })),
    }),
  };
}
