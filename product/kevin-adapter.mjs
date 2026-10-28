import { STEPS, digest } from "./contract.mjs";
export const MOCK_MODES = [
  "MOCK_READY",
  "MOCK_FAILED",
  "MOCK_TIMEOUT",
  "MOCK_SLOW",
];
const stages = [
  "queued",
  "understanding",
  "planning",
  "creating",
  "rendering",
  "ready",
];
const escape = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
/** Stable interface. Product storage owns job IDs, input snapshots, retries and versions.
 * Real adapters implement createDemo, getJob and cancel without changing the product API.
 * Deterministic adapter does no provider/network work; its scheduled completion is durable.
 */
export function deterministicKevinAdapter({ clock = () => Date.now() } = {}) {
  return {
    kind: "deterministic-test",
    async createDemo({
      job_id,
      company_input,
      mode = "MOCK_READY",
      revision = "",
      version,
      created_at,
    }) {
      return {
        job_id,
        handle: JSON.stringify({
          mode,
          input: company_input,
          revision,
          version,
          started_at: created_at ?? clock(),
        }),
      };
    },
    async getJob(job) {
      const data = JSON.parse(job.handle);
      const age = Math.max(0, clock() - data.started_at);
      const interval = data.mode === "MOCK_SLOW" ? 12000 : 1400;
      if (data.mode === "MOCK_TIMEOUT" && age >= 7000)
        return {
          status: "failed",
          progress: { stage: "rendering", label: STEPS.rendering },
          recoverable: true,
          error: {
            code: "TIMEOUT",
            message:
              "La création a pris trop de temps. Votre entreprise et votre brief sont conservés. Vous pouvez relancer.",
          },
          result: null,
        };
      if (data.mode === "MOCK_FAILED" && age >= 4200)
        return {
          status: "failed",
          progress: { stage: "creating", label: STEPS.creating },
          recoverable: true,
          error: {
            code: "GENERATION_INTERRUPTED",
            message:
              "La proposition n’a pas pu être finalisée. Votre projet est conservé. Relancez la création.",
          },
          result: null,
        };
      const status = stages[Math.min(5, Math.floor(age / interval))];
      if (status !== "ready")
        return {
          status,
          progress: { stage: status, label: STEPS[status] },
          recoverable: true,
          error: null,
          result: null,
        };
      const html = mockDocument(data.input, data.revision, data.version);
      return {
        status,
        progress: { stage: status, label: STEPS[status] },
        recoverable: false,
        error: null,
        result: {
          html,
          hash: await digest(html),
          media_type: "text/html",
          source: "deterministic-test",
          mock: true,
        },
      };
    },
    async cancel() {
      return {
        status: "cancelled",
        recoverable: true,
        error: null,
        result: null,
        progress: { stage: "cancelled", label: STEPS.cancelled },
      };
    },
  };
}
export function mockDocument(input, revision = "", version = 1) {
  const sober = /sobre|minimal|calme/i.test(revision);
  const phone = revision.match(/(?:\+33|0)[\d .-]{8,18}/)?.[0] || "";
  const headline =
    revision.match(/titre\s*:\s*([^\n]+)/i)?.[1] ||
    input.objective ||
    input.activity;
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(input.name)} · proposition ${version}</title><style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:${sober ? "#fafaf8" : "#f3f0e8"};color:#20382c;font:17px/1.65 system-ui}header,section,footer{padding:32px max(22px,6vw);max-width:1200px;margin:auto}header{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #c8cdbf}a{color:inherit}nav{display:flex;gap:18px;flex-wrap:wrap}.hero{min-height:65vh;display:grid;align-content:center;max-width:960px}h1{font:500 clamp(36px,6vw,76px)/1.04 Georgia;margin:25px 0;overflow-wrap:anywhere}h2{font:400 34px/1.1 Georgia}p{max-width:650px}small{letter-spacing:.08em;text-transform:uppercase}.button{display:inline-block;background:#20382c;color:white;padding:15px 24px;border-radius:40px;text-decoration:none}.line{height:1px;background:#c8cdbf;margin:30px 0}.note{background:white;border-left:3px solid #607c53;padding:15px}footer{font-size:13px}@media(max-width:480px){header{display:block}nav{margin-top:15px}.hero{min-height:60vh}}</style><header><strong>${escape(input.name)}</strong><nav><a href="#approche">Notre approche</a><a href="#contact">Contact</a></nav></header><main><section class="hero"><small>${escape(input.activity)}${input.location ? " · " + escape(input.location) : ""}</small><h1>${escape(headline)}</h1><p>${escape(input.description)}</p><p><a class="button" href="#contact">Parlons de votre projet ↗</a></p></section><section id="approche"><div class="line"></div><small>Votre entreprise, votre approche</small><h2>Une expérience à votre mesure.</h2><p>${escape(input.audience || "Nous vous accompagnons dans votre projet.")}</p><p>${escape(input.brand)}</p>${revision ? `<div class="note"><strong>Révision ${version}</strong><p>${escape(revision)}</p><small>Proposition déterministe de test. Les demandes libres devront être interprétées par le moteur final.</small></div>` : ""}</section><section id="contact"><div class="line"></div><h2>Commençons une conversation.</h2><p>${escape(phone || "Les coordonnées définitives seront complétées avant la mise en ligne.")}</p><a href="#">Revenir en haut ↑</a></section></main><footer>Proposition de test · V${version} · Aucun formulaire public ni publication réelle</footer></html>`;
}
