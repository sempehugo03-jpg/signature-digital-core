import { STEPS, TERMINAL, OFFER } from "/product-assets/contract.mjs";
const app = document.querySelector("#app");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const safeStore = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  remove: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};
const key = () => crypto.randomUUID();
const sessionId = key();
let user = null,
  data = null,
  projects = [],
  screen = "landing",
  tab = "project",
  device = "desktop",
  selected = "",
  compare = "",
  draft = {},
  step = 0,
  dirty = false,
  busy = false,
  saving = false,
  saveTimer = null,
  pollTimer = null,
  error = "",
  errorCode = "",
  saveText = "",
  pendingSave = null,
  qa = false,
  isMock = true,
  paymentLive = false,
  online = navigator.onLine,
  paymentPolls = 0,
  approvalPending = "",
  comparisonSide = "current";
let creationKey = safeStore.get("fabrya-product-create-key") || key();
safeStore.set("fabrya-product-create-key", creationKey);
const initialAcquisition = (() => {
  const q = new URLSearchParams(location.search),
    ref = document.referrer;
  const source = q.get("utm_source")
    ? "other"
    : ref &&
        /^(?:www\.)?google\.(?:com|fr|co\.uk|de|es|it|be|ch|ca)$/.test(
          new URL(ref).hostname,
        )
      ? "google_organic"
      : ref && new URL(ref).origin !== location.origin
        ? "referral"
        : "direct";
  let v;
  try {
    v = JSON.parse(safeStore.get("fabrya-product-first-source"));
  } catch {}
  if (!v) {
    v = { source, campaign: q.get("utm_campaign") || "" };
    safeStore.set("fabrya-product-first-source", JSON.stringify(v));
  }
  return v;
})();
const fields = [
  [
    ["name", "Le nom de votre entreprise", "text", "Ex. Atelier du Pic"],
    ["activity", "Votre activité", "text", "Ex. Menuiserie sur mesure"],
    [
      "location",
      "Où travaillez-vous ? (facultatif)",
      "text",
      "Ex. Tarbes et ses alentours",
    ],
  ],
  [
    [
      "objective",
      "Que voulez-vous obtenir ?",
      "textarea",
      "Ex. Recevoir des demandes pour nos cuisines sur mesure",
    ],
    [
      "audience",
      "À qui vous adressez-vous ? (facultatif)",
      "textarea",
      "Ex. Des particuliers qui rénovent leur maison",
    ],
  ],
  [
    [
      "description",
      "Présentez votre entreprise",
      "textarea",
      "Votre métier, ce que vous faites et votre différence",
    ],
    [
      "problem",
      "Qu’est-ce qui vous manque aujourd’hui ? (facultatif)",
      "textarea",
      "Ex. Nos réalisations sont peu visibles en ligne",
    ],
    ["website", "Votre site actuel (facultatif)", "text", "https://…"],
  ],
  [
    [
      "brand",
      "Votre univers et vos éléments de marque (facultatif)",
      "textarea",
      "Couleurs, ton, logo, références",
    ],
    [
      "assets",
      "Liens vers des éléments utiles (facultatif)",
      "textarea",
      "Liens de consultation vers vos photos ou documents utiles au projet",
    ],
    [
      "constraints",
      "Ce qu’il faut respecter (facultatif)",
      "textarea",
      "Ex. Ne pas présenter des prestations que nous ne proposons pas",
    ],
  ],
];
async function api(path = "", method = "GET", body) {
  if (!online)
    throw Object.assign(
      new Error(
        "Vous êtes hors connexion. Votre saisie est conservée sur cet appareil et sera sauvegardée dès votre retour en ligne.",
      ),
      { code: "OFFLINE" },
    );
  let response;
  try {
    response = await fetch("/api/product/" + path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(16000),
    });
  } catch {
    throw Object.assign(
      new Error(
        "La connexion a été interrompue. Votre projet est conservé. Réessayez.",
      ),
      { code: "NETWORK" },
    );
  }
  const r = await response.json().catch(() => ({
    message: "Fabrya est momentanément indisponible. Réessayez.",
  }));
  if (!response.ok) {
    if (response.status === 401 && path !== "auth/login") {
      stash();
      user = null;
      screen = "login";
      stopPoll();
      render();
    }
    throw Object.assign(new Error(r.message), { code: r.code });
  }
  return r;
}
const projectPath = (suffix = "") =>
  `projects/${data.project.id}${suffix ? "/" + suffix : ""}`;
function track(name, project = data?.project.id) {
  api("events", "POST", {
    event_id: key(),
    session_id: sessionId,
    name,
    project_id: project,
  }).catch(() => {});
}
function setError(e) {
  error = e.message || String(e);
  errorCode = e.code || "";
  renderError();
}
function renderError() {
  const target = document.querySelector("#error");
  if (target) {
    document.querySelectorAll('[data-form="auth"] input').forEach(input => { input.setAttribute("aria-describedby", "error"); input.setAttribute("aria-invalid", String(!!error && (["LOGIN_FAILED","INVALID_ACCOUNT"].includes(errorCode) || (errorCode === "ACCOUNT_EXISTS" && input.name === "email")))); });
    target.innerHTML = error
      ? `<div class="notice error" role="alert">${esc(error)} <button class="textbutton" data-action="recover">Réessayer</button></div>`
      : "";
  }
}
function header() {
  return `<a class="skiplink" href="#main-content">Aller au contenu</a>${!paymentLive ? `<div class="testnote">Validation privée · Aucun paiement réel</div>` : ""}${!online ? '<div class="network" role="status">Hors connexion — votre saisie est conservée sur cet appareil.</div>' : ""}<header class="shell nav"><a class="wordmark" href="/produit" data-action="home"><img src="/product-assets/fabrya-logo.svg" width="30" height="30" alt="">Fabrya</a><nav class="navlinks" aria-label="Navigation principale">${user ? `<span class="sessionname">${esc(user.firstName)}</span><button class="textbutton" data-action="projects">Mes projets</button><button class="button light small" data-action="logout">Déconnexion</button>` : `<a class="navpricing" href="#tarif">59 € / mois</a><button class="textbutton" data-action="login">Connexion</button>`}</nav></header>`;
}
function footer() {
  return `<footer class="shell foot"><span>Fabrya · Votre entreprise, votre prochaine étape.</span><span>59 € / mois · Sans frais d’installation</span></footer>`;
}
function landing() {
  return `<main class="shell"><section class="hero"><div><p class="tagline">Votre projet numérique, pas à pas.</p><h1>Votre entreprise.<br>Une proposition<br>à votre image.</h1><p class="lede">Parlez-nous de votre entreprise. Découvrez une proposition, demandez des changements et choisissez votre version. Tout reste dans votre espace Fabrya.</p><button class="button" data-action="start">Créer ma proposition <span aria-hidden="true">↗</span></button><ul class="hero-promises" aria-label="Vos repères avant l’abonnement"><li><span aria-hidden="true">✓</span> Une proposition à découvrir avant de payer</li><li><span aria-hidden="true">✓</span> Des versions à comparer et à ajuster</li><li><span aria-hidden="true">✓</span> Votre projet sauvegardé à chaque étape</li></ul><p class="fine muted">Aucune carte bancaire demandée pour découvrir et valider votre proposition.</p></div><div class="visual" aria-label="Illustration d’une proposition et de son historique"><div class="visualpaper"><span class="sample-label">Exemple fictif · aperçu illustratif</span><div class="miniheader"><strong>Atelier du Pic</strong><span>Proposition · V2</span></div><p class="tagline">Menuiserie de caractère</p><h2>Des lieux qui<br>vous ressemblent.</h2><p>Un métier, une identité, une façon singulière de vous rencontrer.</p><div class="minilink">Découvrir notre savoir-faire ↗</div></div><div class="floating"><strong>Votre projet garde le fil.</strong>Brief, versions, modifications : vous reprenez là où vous en êtes.</div><div class="visual-journey" aria-hidden="true"><span>Comprendre</span><span>Créer</span><span>Choisir</span></div></div></section><div class="strip"><span>Une proposition avant votre abonnement</span><span>Vos versions et demandes conservées</span><span>Un espace pour faire évoluer votre projet</span></div><section class="trust-story" aria-labelledby="trust-story-title"><div class="trust-story-heading"><p class="tagline">Fabrya avance avec vous</p><h2 id="trust-story-title">Vous gardez la main.<br>À chaque étape.</h2><p class="muted">Pas de jargon, pas de décision à l’aveugle. Votre projet prend forme devant vous et vous restez libre de le relire, de le faire évoluer et de choisir votre version.</p></div><div class="trust-story-grid"><article class="trust-story-card"><span class="trust-mark" aria-hidden="true">01</span><h3>Vous savez où vous en êtes.</h3><p>Un parcours guidé, une progression visible et un brief conservé pour le reprendre plus tard.</p></article><article class="trust-story-card"><span class="trust-mark" aria-hidden="true">02</span><h3>Vous voyez avant de choisir.</h3><p>Une proposition à explorer, des demandes de modification et un historique des versions.</p></article><article class="trust-story-card"><span class="trust-mark" aria-hidden="true">03</span><h3>Vous décidez avant de payer.</h3><p>Le prix, les inclusions et les limites sont expliqués avant l’ouverture du paiement.</p></article></div></section><section class="explain"><p class="tagline">Du premier échange à votre espace.</p><h2>Un parcours simple.<br>Du début à la suite.</h2><div class="steps"><article><div class="n">01</div><h3>Parlez de votre entreprise.</h3><p>Votre métier, vos clients et votre objectif. Quelques questions utiles, avec sauvegarde au fil de l’eau.</p></article><article><div class="n">02</div><h3>Prenez le temps de choisir.</h3><p>Ouvrez votre proposition, comparez les versions et demandez une modification. Vous décidez de la version à retenir.</p></article><article><div class="n">03</div><h3>Gardez un point de repère.</h3><p>Après validation et abonnement, votre projet est activé dans votre espace : aperçu, historique et gestion de l’abonnement.</p></article></div><div class="notice">${isMock ? "Cette validation privée présente des propositions de démonstration. La création définitive sera disponible séparément. " : ""}${paymentLive ? "L’abonnement active votre espace client. La publication de votre site n’est pas incluse à ce stade." : "L’activation reste un état de test : elle ne publie pas votre site sur Internet."}</div></section><section id="tarif" class="pricing"><div><p class="tagline">Votre accès continu à Fabrya</p><h2>Un projet qui avance.<br>Un seul abonnement.</h2><p class="muted">Votre proposition et son espace réunis. La publication publique du site et les services complémentaires ne sont pas inclus à ce stade.</p></div><div><p class="price">59 € <span>/ mois</span></p><ul class="included"><li>Votre proposition et son aperçu</li><li>Les demandes de modification et leurs versions</li><li>Votre historique et votre espace client</li><li>La gestion de votre abonnement</li></ul><div class="offer-boundary"><strong>À savoir avant de vous engager</strong><p>La publication publique du site et les prestations complémentaires ne font pas partie de cet abonnement à ce stade.</p></div><p class="muted" style="font-size:13px;margin-bottom:20px">Sans frais d’installation. Abonnement mensuel renouvelé automatiquement ; annulation depuis l’espace abonnement. ${paymentLive ? "" : "Aucun paiement réel dans ce test."}</p><button class="button" data-action="start">Commencer mon projet ↗</button></div></section><section class="trust-faq" aria-labelledby="trust-faq-title"><div class="trust-faq-heading"><p class="tagline">Avant de vous engager</p><h2 id="trust-faq-title">Vos questions méritent des réponses claires.</h2><p>Vous ne devriez jamais avoir à deviner ce que vous achetez.</p><button class="button light" data-action="start">Découvrir mon projet sans payer ↗</button></div><div class="trust-faq-items"><details><summary>À quel moment dois-je payer ?</summary><p>Après avoir découvert votre proposition et choisi votre version. Aucune carte bancaire n’est demandée pour remplir le brief et voir votre proposition.</p></details><details><summary>Que comprend l’abonnement de 59 € / mois ?</summary><p>L’accès à votre proposition et à son aperçu, vos demandes de modification, vos versions, votre historique et votre espace client. Aucun frais d’installation n’est ajouté.</p></details><details><summary>Mon site est-il publié sur Internet ?</summary><p>Non, pas dans l’offre actuelle. La publication publique et les prestations complémentaires ne sont pas incluses à ce stade. Fabrya doit vous le préciser avant tout paiement.</p></details><details><summary>Et si je dois interrompre mon parcours ?</summary><p>Votre brief, vos versions et vos demandes sont sauvegardés. Vous pouvez revenir à votre projet et retrouver son avancement.</p></details><details><summary>Comment est géré mon abonnement ?</summary><p>Le paiement se déroule sur Stripe. Le renouvellement est mensuel et l’annulation s’effectue depuis votre espace abonnement.</p></details></div></section></main>`;
}
function accountForm() {
  const register = screen === "register";
  return `<main class="shell"><div class="authwrap"><p class="tagline">${register ? "Votre premier pas" : "Heureux de vous retrouver"}</p><h1>${register ? "Un compte pour<br>garder le fil." : "Reprenez votre projet."}</h1><p class="muted">${register ? "Votre brief et vos versions vous attendront ici, même si vous revenez demain." : "Connectez-vous pour retrouver votre entreprise et votre proposition."}</p><form data-form="auth">${register ? '<label class="field"><span>Votre prénom</span><input name="name" autocomplete="given-name" required maxlength="80"></label>' : ""}<label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required maxlength="180"></label><label class="field"><span>Mot de passe</span><input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" required minlength="${register ? "10" : "1"}" maxlength="128">${register ? "<small>10 caractères minimum.</small>" : ""}</label><button class="button formbutton" ${busy ? 'disabled aria-busy="true"' : ""}>${busy ? "Un instant…" : register ? "Créer mon compte" : "Me connecter"}</button></form><p style="margin-top:22px;font-size:14px">${register ? "Vous avez déjà un compte ?" : "Vous découvrez Fabrya ?"} <button class="textbutton" data-action="${register ? "login" : "register"}">${register ? "Me connecter" : "Créer un compte"}</button></p><div id="error"></div></div></main>`;
}
function projectList() {
  return `<main class="shell workspace"><section class="empty"><p class="tagline">Votre espace Fabrya</p><h2>${projects.length ? "Vos projets gardent le fil." : "Tout commence par<br>votre entreprise."}</h2><p>Un brief sauvegardé, une proposition à découvrir, puis une version à choisir.</p><button class="button" data-action="new-project" ${busy ? "disabled" : ""}>Nouveau projet ↗</button><div id="error"></div></section><ul class="projectlist">${projects.map((p) => `<li><div><h3>${esc(p.name)}</h3><p class="muted">${statusName(p.status)} · ${date(p.updated_at)}</p></div><button class="button light small" data-action="open" data-id="${esc(p.id)}">Reprendre mon projet ↗</button></li>`).join("")}</ul></main>`;
}
const statusName = (s) =>
  ({
    draft: "Brief en cours",
    creating: "Création en cours",
    review: "Proposition disponible",
    approved: "Version validée",
    active: "Projet actif",
    payment_attention: "Abonnement à vérifier",
  })[s] || "Votre projet";
const date = (d) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(d));
function field(k, label, type, placeholder) {
  return `<label class="field"><span>${label}</span>${type === "textarea" ? `<textarea name="${k}" placeholder="${placeholder}" maxlength="${k === "description" ? 4000 : 2000}" ${["objective", "description"].includes(k) ? "required" : ""}>${esc(draft[k])}</textarea>` : `<input name="${k}" type="text" value="${esc(draft[k])}" placeholder="${placeholder}" maxlength="${k === "name" ? 160 : k === "activity" ? 240 : 500}" ${["name", "activity"].includes(k) ? "required" : ""}>`}</label>`;
}
function brief() {
  return `<section class="brief"><ol class="breadcrumb" aria-label="Progression du brief">${["Votre entreprise", "Votre objectif", "Votre contexte", "Vos éléments utiles"].map((x, i) => `<li aria-current="${step === i ? "step" : "false"}">${i + 1}. ${x}</li>`).join("")}</ol><h2>${["Commençons par votre métier.", "Qu’aimeriez-vous changer ?", "Ce qui fait votre différence.", "Une dernière touche."][step]}</h2><p class="intro">${["Trois repères pour donner une direction à votre proposition.", "Un objectif concret suffit. Vous pourrez affiner ensuite.", "Quelques phrases suffisent pour commencer.", "Ces éléments sont facultatifs. Vous pouvez commencer sans logo ni photos."][step]}</p><form data-form="brief">${fields[step].map((x) => field(...x)).join("")}${
    step === 3
      ? `<details class="summary"><summary>Relire mon brief</summary><dl>${Object.entries(
          draft,
        )
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<div><dt>${esc({ name: "Entreprise", activity: "Activité", objective: "Objectif", description: "Présentation", location: "Zone", audience: "Clients", problem: "Besoin", website: "Site", brand: "Marque", assets: "Éléments", constraints: "Contraintes" }[k] || k)}</dt><dd>${esc(v)}</dd></div>`,
          )
          .join(
            "",
          )}</dl></details><p class="notice">Votre première proposition vous attend à la prochaine étape. Aucune carte bancaire n’est demandée ici.</p>`
      : ""
  }<div class="briefactions">${step ? '<button type="button" class="textbutton" data-action="previous">← Retour</button>' : "<span></span>"}<button class="button" ${busy ? 'disabled aria-busy="true"' : ""}>${busy ? "Sauvegarde…" : step === 3 ? "Découvrir ma proposition ↗" : "Continuer →"}</button></div>${qa && step === 3 ? '<label class="field"><span>Scénario de vérification</span><select id="qa-mode"><option>MOCK_READY</option><option>MOCK_FAILED</option><option>MOCK_TIMEOUT</option><option>MOCK_SLOW</option></select></label>' : ""}</form><div id="error"></div></section>`;
}
function generation() {
  const j = data.job,
    state = j?.status,
    failed = state === "failed" || state === "cancelled";
  const chain = ["understanding", "planning", "creating", "rendering"];
  const index = chain.indexOf(state);
  return `<section class="generation"><p class="tagline">${failed ? "Votre projet est conservé" : "Votre proposition se prépare"}</p><h2>${failed ? "Reprenons simplement." : state === "queued" ? "Votre demande<br>est bien enregistrée." : STEPS[state] || "Votre demande est sauvegardée."}</h2><p>${failed ? esc(j.error?.message || "La création a été annulée. Votre brief est conservé.") : "Vous pouvez fermer cette page et revenir. Fabrya retrouve votre demande et son état sauvegardé."}</p>${failed ? `<div class="notice">Votre entreprise, votre brief et les versions précédentes sont conservés.</div>${j.recoverable ? `<button class="button" data-action="retry" ${busy ? "disabled" : ""}>Relancer la création ↗</button>` : ""}` : `<ol class="progresssteps" aria-label="Étapes de création">${chain.map((s, i) => `<li class="${i < index ? "done" : i === index ? "current" : ""}" ${i === index ? 'aria-current="step"' : ""}><span class="dot">${i < index ? "✓" : i + 1}</span><span>${STEPS[s]}</span></li>`).join("")}</ol><p class="muted" style="font-size:13px">Chaque étape prépare la suivante. ${state === "rendering" ? "La finalisation peut encore prendre un instant." : ""}</p><button class="textbutton" data-action="cancel-job" ${busy ? "disabled" : ""}>Annuler cette création</button>`}${data.versions.some((v) => v.state === "ready") ? '<p><button class="textbutton" data-action="history">Voir mes versions précédentes</button></p>' : ""}<div id="error"></div></section>`;
}
function preview() {
  const v =
    data.versions.find((v) => v.id === selected && v.state === "ready") ||
    data.versions.find((v) => v.id === data.project.active_version_id) ||
    data.versions.find((v) => v.state === "ready");
  if (!v) return generation();
  selected = v.id;
  const active = data.project.status === "active";
  const src = `/api/product/${projectPath(`versions/${v.id}/preview`)}`;
  return `<section><div class="previewhead"><div><p class="tagline">${active && v.id === data.project.active_version_id ? "Votre version active" : "Votre proposition · aperçu"}</p><h2>${esc(data.project.company_input.name)} · V${v.number}</h2><p class="muted" style="font-size:13px">${date(v.created_at)}${v.number > 1 ? ` · Une évolution de V${v.number - 1}` : " · Première proposition"} · ${active ? "Votre version est conservée dans votre espace." : "Cette proposition n’est pas encore publiée."}</p>${v.modification ? `<p class="versionrequest"><strong>Votre demande :</strong> ${esc(v.modification)}</p>` : ""}</div><div class="viewcontrols" aria-label="Taille de l’aperçu">${[
    ["desktop", "Grand écran"],
    ["mobile", "Mobile"],
    ["narrow", "Petit écran"],
  ]
    .map(
      ([d, l]) =>
        `<button class="button light small" data-action="device" data-id="${d}" aria-pressed="${device === d}">${l}</button>`,
    )
    .join(
      "",
    )}</div></div><div class="previewbox ${device} loading"><p class="previewloading" role="status">Votre aperçu se charge…</p><iframe title="Proposition ${esc(data.project.company_input.name)} version ${v.number}" src="${src}" sandbox="allow-scripts" loading="lazy"></iframe></div><div class="afterpreview"><div><h3>Qu’aimeriez-vous ajuster ?</h3><p>Votre demande crée une nouvelle version. La précédente reste dans votre historique. ${isMock ? "Dans cette validation privée, la démonstration prend en compte un titre, un numéro de téléphone ou une demande de sobriété. Les autres demandes sont conservées sans être appliquées automatiquement." : "Décrivez le changement souhaité : la proposition suivante restera liée à cette demande dans votre historique."}</p><form data-form="revision"><label class="field"><span>Votre modification</span><textarea name="message" maxlength="2000" required placeholder="Ex. Plus sobre. Titre : Un savoir-faire à votre mesure.">${esc(safeStore.get(`fabrya-revision-${user.id}-${data.project.id}`) || "")}</textarea></label><button class="button light" ${busy ? "disabled" : ""}>Demander une modification ↗</button></form></div><div><h3>${active ? "Faire évoluer mon projet" : "Cette proposition me convient."}</h3><p>${active ? "Validez cette version pour la retrouver comme version active dans votre espace." : "Choisissez cette version. Elle sera précisément conservée, puis vous pourrez vous abonner à Fabrya pour 59 € / mois."}</p><button class="button" data-action="approve" data-id="${v.id}" ${busy || (active && v.id === data.project.active_version_id) ? "disabled" : ""}>${active ? (v.id === data.project.active_version_id ? "Version active" : "Utiliser cette version") : "Valider cette version"} ↗</button><p><button class="textbutton" data-action="history">Voir l’historique des versions</button></p></div></div><div id="error"></div></section>`;
}
function history() {
  const ready = data.versions.filter((v) => v.state === "ready");
  if (compare === selected || !ready.some(v => v.id === compare)) compare = "";
  return `<section><p class="tagline">Rien n’est perdu.</p><h2>Votre projet, version après version.</h2>${data.versions.length ? "" : `<div class="notice"><h3>Votre histoire commence ici.</h3><p>Votre première proposition apparaîtra après le brief. Chaque nouvelle version sera conservée au même endroit.</p><button class="button light" data-action="project-tab">Reprendre mon brief →</button></div>`}<ul class="history">${data.versions.map((v) => `<li><div><h3>V${v.number} ${v.id === data.project.active_version_id ? "· Active" : v.id === data.project.approved_version_id ? "· Validée" : ""}</h3><small>${date(v.created_at)} · ${v.state === "ready" ? "Disponible" : STEPS[v.state] || "En cours"}</small><p>${esc(v.modification || "Première proposition issue de votre brief.")}</p></div>${v.state === "ready" ? `<button class="button light small" data-action="view-version" data-id="${v.id}">Ouvrir cette version ↗</button>` : ""}</li>`).join("")}</ul>${ready.length > 1 ? `<label class="field"><span>Comparer la version ouverte à…</span><select id="compare-version"><option value="">Choisir une version</option>${ready.filter(v => v.id !== selected).map((v) => `<option value="${v.id}" ${compare === v.id ? "selected" : ""}>Version ${v.number}</option>`).join("")}</select></label>${compare ? `<div class="comparison-switch" aria-label="Version à afficher"><button class="button light small" data-action="compare-side" data-id="current" aria-pressed="${comparisonSide === "current"}">Version ouverte</button><button class="button light small" data-action="compare-side" data-id="other" aria-pressed="${comparisonSide === "other"}">Version comparée</button></div><div class="compare" data-side="${comparisonSide}"><div class="compare-current"><label>Version ouverte · V${ready.find(v => v.id === selected)?.number || ready[0].number}</label><iframe title="Version sélectionnée" sandbox="allow-scripts" src="/api/product/${projectPath(`versions/${selected || ready[0].id}/preview`)}"></iframe></div><div class="compare-other"><label>Version comparée · V${ready.find(v => v.id === compare)?.number || ""}</label><iframe title="Version de comparaison" sandbox="allow-scripts" src="/api/product/${projectPath(`versions/${compare}/preview`)}"></iframe></div></div>` : ""}` : ""}<div id="error"></div></section>`;
}
function subscription() {
  const active = data.subscription?.state === "active" && data.activation;
  const v = data.versions.find(
    (v) => v.id === data.project.approved_version_id,
  );
  const callback = new URLSearchParams(location.search).get("payment");
  const pending =
    data.checkout &&
    ["open", "creating", "processing"].includes(data.checkout.state);
  return `<section class="approved"><p class="tagline">${data.subscription ? "Votre abonnement Fabrya" : v ? "Votre version est validée" : "Votre abonnement, à votre rythme"}</p><h2>${active ? "Votre projet est actif." : data.subscription ? (["canceled","cancelled"].includes(data.subscription.state) ? "Votre abonnement est annulé." : (["past_due","unpaid"].includes(data.subscription.state) ? "Un paiement<br>à régulariser." : "Votre abonnement<br>à vérifier.")) : v ? "Votre prochaine étape,<br>au même endroit." : "Choisissez d’abord<br>votre proposition."}</h2><p class="muted">${active ? "Votre entreprise, votre version active et votre historique sont réunis dans votre espace." : v ? `La version V${v.number} de ${esc(data.project.company_input.name)} est conservée. Vous gardez la main sur votre abonnement.` : "Vous pourrez vous abonner après avoir découvert et validé une version. Votre brief reste sauvegardé."}</p><p class="price">59 € <span>/ mois</span></p><ul class="included"><li>Votre proposition et son aperçu</li><li>Vos demandes de modification et vos versions</li><li>L’historique de votre entreprise et son espace client</li><li>La gestion de votre abonnement</li></ul><p class="muted" style="font-size:14px">${data.subscription ? "Sans frais d’installation. Vos échéances, vos factures et la gestion du renouvellement sont disponibles dans votre espace abonnement." : "Sans frais d’installation. Renouvellement mensuel automatique, annulation depuis votre espace abonnement."} ${paymentLive ? "L’abonnement active votre espace client ; la publication du site n’est pas encore incluse." : "Aucun paiement réel. L’activation de test ne met pas votre site en production."}</p>${callback === "success" && !active ? `<div class="notice" role="status">${paymentPolls >= 12 ? "La confirmation n’est pas encore disponible. Votre version est conservée. Utilisez « Vérifier la confirmation » ou revenez plus tard." : "Nous vérifions votre paiement auprès de Stripe. Votre projet est conservé. Si la confirmation prend du temps, vous pouvez revenir plus tard."}</div>` : ""}${pending && !active && callback !== "success" && callback !== "cancel" ? `<div class="notice" role="status">${data.checkout.state === "creating" ? "Nous retrouvons votre étape de paiement. Vérifiez la confirmation avant de continuer : votre version reste conservée." : "Une étape de paiement existe déjà pour cette version. Vous pouvez la reprendre ou vérifier sa confirmation."}</div>` : ""}${callback === "cancel" && !active ? '<div class="notice">Le paiement a été interrompu. Vous n’avez pas perdu votre version validée. Vous pouvez reprendre ou fermer cette étape de paiement.</div>' : ""}${data.subscription && !active ? `<div class="notice">État de l’abonnement : ${esc(billingStatus(data.subscription.state))}. ${["canceled","cancelled"].includes(data.subscription.state) ? "Votre abonnement ne se renouvelle plus. " : ""}Votre projet et vos versions restent conservés.</div><button class="button" data-action="portal">${["past_due","unpaid"].includes(data.subscription.state) ? "Régulariser mon paiement" : "Gérer mon abonnement"} ↗</button><p><button class="textbutton" data-action="project-tab">Retrouver mon projet</button></p>` : active ? `<div class="notice">Abonnement confirmé · Version active V${data.versions.find((v) => v.id === data.project.active_version_id)?.number || ""} · ${paymentLive ? "Projet activé" : "Activation durable de test"}</div><button class="button" data-action="project-tab">Ouvrir mon espace client ↗</button><p><button class="textbutton" data-action="portal" ${busy ? "disabled" : ""}>Gérer / annuler mon abonnement</button></p>` : v ? `<div class="payment-clarity" aria-label="Récapitulatif avant paiement"><div class="payment-clarity-top"><span class="payment-clarity-icon" aria-hidden="true">✓</span><div><strong>Votre décision, sans zone d’ombre.</strong><p>Vous avez validé une version. Voici ce qui se passe ensuite.</p></div></div><div class="payment-clarity-grid"><div><span>Votre version choisie</span><strong>V${v.number} · ${esc(data.project.company_input.name)}</strong></div><div><span>Votre abonnement</span><strong>59 € / mois</strong><small>Sans frais d’installation · renouvellement mensuel</small></div><div><span>Ce qui n’est pas inclus</span><strong>Publication du site sur Internet</strong><small>Ni prestations complémentaires à ce stade</small></div></div><p class="payment-clarity-bottom">Paiement sur Stripe. Votre espace n’est activé qu’après confirmation du paiement.</p></div><label class="ack"><input type="checkbox" id="accept-offer"><span>J’ai compris l’abonnement de 59 € / mois, son renouvellement mensuel ${paymentLive ? ", son annulation depuis mon espace et l’absence de publication publique incluse." : "et le caractère de test de cette activation."}</span></label><button class="button" data-action="checkout" ${busy ? "disabled" : ""}>${busy ? "Un instant…" : pending ? (paymentLive ? "Reprendre le paiement" : "Reprendre le paiement TEST") : paymentLive ? "Continuer vers le paiement sécurisé" : "Continuer vers Stripe TEST"} ↗</button>${pending ? '<p><button class="textbutton" data-action="check-payment">Vérifier la confirmation</button></p><p><button class="textbutton" data-action="abandon">Fermer ce paiement</button></p>' : ""}` : '<div class="notice">Validez d’abord une proposition pour vous abonner. <button class="textbutton" data-action="project-tab">Voir ma proposition</button></div>'}<div id="error"></div></section>`;
}
function billingStatus(state) {
  return ({active:"Actif",canceled:"Annulé",cancelled:"Annulé",past_due:"Paiement à régulariser",unpaid:"Paiement non réglé",payment_attention:"Paiement à vérifier",incomplete:"Confirmation en attente",incomplete_expired:"Paiement expiré",paused:"En pause",trialing:"À vérifier"})[state] || "Confirmation en attente";
}
function approvalDialog() {
  const v = data?.versions.find(v => v.id === approvalPending && v.state === "ready");
  if (!v) return "";
  return `<dialog open id="approval-confirm" aria-labelledby="approval-title" aria-describedby="approval-description"><p class="tagline">Votre choix, précisément</p><h2 id="approval-title">Choisir la version V${v.number} ?</h2><p id="approval-description">${esc(data.project.company_input.name)} · ${date(v.created_at)}. ${data.activation ? "Cette version remplacera votre version active dans votre espace." : "Cette version sera conservée pour votre abonnement. Cette validation ne déclenche aucun paiement."} Les autres versions restent accessibles.</p><div class="dialogactions"><button class="button light" data-action="cancel-approval">Revoir ma proposition</button><button class="button" data-action="confirm-approval" data-id="${v.id}">Confirmer V${v.number}</button></div></dialog>`;
}
function account() {
  return `<section class="account"><p class="tagline">Votre compte</p><h2>Vos repères.</h2><dl><div><dt>Prénom</dt><dd>${esc(user.firstName)}</dd></div><div><dt>Email</dt><dd>${esc(user.email)}</dd></div><div><dt>Entreprise</dt><dd>${esc(data.project.company_input.name)}</dd></div><div><dt>Projet</dt><dd>${statusName(data.project.status)}</dd></div><div><dt>Abonnement</dt><dd>${data.subscription ? esc(billingStatus(data.subscription.state)) : "Pas encore souscrit"} · 59 € / mois</dd></div></dl><p class="notice">Votre brief, vos demandes et chaque version restent dans votre espace. Vos coordonnées de paiement sont gérées par Stripe.</p><button class="textbutton" data-action="logout">Me déconnecter</button><div id="error"></div></section>`;
}
function workspace() {
  return `<main class="shell workspace"><header class="projecthead"><div><p class="tagline">${data.project.status === "active" ? "Votre espace client" : "Votre projet Fabrya"}</p><h1>${esc(draft.name || data.project.company_input.name || "Votre entreprise")}</h1><span class="save" id="save-status" role="status" aria-live="polite">${esc(saveText || "Projet sauvegardé")}</span></div><button class="textbutton" data-action="projects">← Mes projets</button></header><nav class="tabs" aria-label="Votre espace">${[
    ["project", "Mon projet"],
    ["history", "Historique"],
    ["subscription", "Abonnement"],
    ["account", "Compte"],
  ]
    .map(
      ([t, l]) =>
        `<button data-action="tab" data-id="${t}" aria-current="${tab === t ? "page" : "false"}">${l}</button>`,
    )
    .join(
      "",
    )}</nav>${tab === "history" ? history() : tab === "subscription" ? subscription() : tab === "account" ? account() : data.project.status === "draft" ? brief() : data.job && !TERMINAL.has(data.job.status) ? generation() : data.job && ["failed", "cancelled"].includes(data.job.status) ? generation() : preview()}</main>`;
}
let renderedLocation = "";
function render() {
  const focused = document.activeElement;
  const focusKey = app.contains(focused) ? {heading:/^H[1-6]$/.test(focused.tagName),action:focused.dataset?.action,id:focused.dataset?.id,name:focused.name} : null;
  const wasDialog = !!focused?.closest?.("#approval-confirm");
  const phase = data?.project?.status === "draft" ? `brief-${step}` : data?.job && !TERMINAL.has(data.job.status) ? "creation" : data?.job && ["failed", "cancelled"].includes(data.job.status) ? "interrupted" : "preview";
  const nextLocation = `${screen}:${tab}:${data?.project?.id || ""}:${phase}:${tab === "project" ? selected : ""}`;
  const moved = renderedLocation !== nextLocation;
  renderedLocation = nextLocation;
  app.innerHTML =
    header() +
    (screen === "landing"
      ? landing()
      : ["register", "login"].includes(screen)
        ? accountForm()
        : screen === "projects"
          ? projectList()
          : data
            ? workspace()
            : '<main class="boot" role="status"><p>Votre projet se charge…</p><button class="textbutton" data-action="projects">Retrouver mes projets</button><div id="error"></div></main>') +
    footer() + approvalDialog();
  app.querySelectorAll(".previewbox iframe").forEach(frame => frame.addEventListener("load", () => frame.parentElement.classList.remove("loading"), {once:true}));
  const dialog = document.querySelector("#approval-confirm");
  if (dialog) {
    if (typeof dialog.showModal === "function") { dialog.removeAttribute("open"); dialog.showModal(); }
    dialog.querySelector("button")?.focus();
    dialog.addEventListener("cancel", e => { e.preventDefault(); approvalPending = ""; render(); });
  }
  const main = app.querySelector("main");
  if (main) {
    main.id = "main-content";
    if (moved) {
      window.scrollTo?.(0, 0);
      const heading = main.querySelector("h1, h2");
      if (heading && !dialog) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }
  }
  if (!moved && !dialog && focusKey) {
    let replacement = focusKey.heading ? main?.querySelector("h1, h2") : [...app.querySelectorAll("[data-action], input, textarea, select")].find(e => focusKey.action ? e.dataset.action === focusKey.action && e.dataset.id === focusKey.id : focusKey.name && e.name === focusKey.name);
    if (!replacement && wasDialog) replacement = app.querySelector('[data-action="approve"]');
    if (replacement) { if (focusKey.heading) replacement.tabIndex = -1; replacement.focus({preventScroll:true}); }
  }
  renderError();
}
function saveLabel(t) {
  saveText = t;
  const node = document.querySelector("#save-status");
  if (node) node.textContent = t;
}
function stash() {
  if (user && data)
    safeStore.set(
      `fabrya-draft-${user.id}-${data.project.id}`,
      JSON.stringify({
        input: draft,
        step,
        base_revision: data.project.draft_revision,
      }),
    );
}
async function flush() {
  clearTimeout(saveTimer);
  if (!dirty) return;
  if (pendingSave) {
    await pendingSave;
    if (dirty) return flush();
    return;
  }
  saveLabel("Sauvegarde…");
  const snapshot = JSON.stringify(draft),
    body = {
      company_input: structuredClone(draft),
      draft_revision: data.project.draft_revision,
      step,
    };
  pendingSave = (async () => {
    try {
      const r = await api(projectPath(), "PATCH", body);
      data = r;
      dirty = JSON.stringify(draft) !== snapshot;
      if (!dirty) {
        safeStore.remove(`fabrya-draft-${user.id}-${data.project.id}`);
        saveLabel("Sauvegardé");
      } else {
        stash();
        saveLabel("Sauvegarde des dernières modifications…");
      }
    } catch (e) {
      stash();
      saveLabel(
        e.code === "DRAFT_CONFLICT"
          ? "Une autre version est sauvegardée — votre saisie est conservée ici"
          : "Saisie conservée sur cet appareil — sauvegarde à reprendre",
      );
      throw e;
    } finally {
      pendingSave = null;
    }
  })();
  await pendingSave;
  if (dirty) return flush();
}
function stopPoll() {
  clearTimeout(pollTimer);
  pollTimer = null;
}
function schedulePoll() {
  stopPoll();
  if (!data || !user || screen !== "workspace") return;
  const running = data.job && !TERMINAL.has(data.job.status);
  const payment =
    new URLSearchParams(location.search).get("payment") === "success" &&
    !data.activation &&
    paymentPolls < 12;
  if (!running && !payment) return;
  pollTimer = setTimeout(
    async () => {
      try {
        if (payment) paymentPolls++;
        const before = data.job?.status;
        data = payment
          ? await api(projectPath("payment"), "POST", {})
          : await api(projectPath());
        if (data.job?.status === "ready" && before !== "ready")
          selected = data.job.version;
        if (before !== data.job?.status || data.activation) render();
      } catch (e) {
        if (payment) paymentPolls = 12;
        setError(e);
      }
      if (payment && paymentPolls >= 12) render();
      schedulePoll();
    },
    payment ? 5000 : 1800,
  );
}
async function open(id) {
  stopPoll();
  error = "";
  screen = "workspace";
  data = null;
  render();
  data = await api("projects/" + encodeURIComponent(id));
  draft = structuredClone(data.project.company_input);
  step = data.project.step;
  dirty = false;
  saveText = "Projet sauvegardé";
  const stashed = safeStore.get(`fabrya-draft-${user.id}-${id}`);
  if (stashed && data.project.status === "draft") {
    const stored = JSON.parse(stashed);
    draft = stored.input;
    step = stored.step;
    dirty = true;
    saveText = "Saisie locale retrouvée — sauvegarde à reprendre";
    if (stored.base_revision !== data.project.draft_revision)
      error =
        "Votre saisie locale et la version sauvegardée ont changé. Copiez les éléments utiles ou chargez la version sauvegardée avant de continuer.";
  }
  historyReplace(id);
  selected =
    data.project.active_version_id ||
    data.project.approved_version_id ||
    data.versions.find((v) => v.state === "ready")?.id ||
    "";
  tab = new URLSearchParams(location.search).has("payment")
    ? "subscription"
    : "project";
  render();
  schedulePoll();
  if (dirty && !error && online) flush().catch(setError);
}
function historyReplace(id) {
  const q = new URLSearchParams(location.search);
  q.set("project", id);
  window.history.replaceState({}, "", `/produit?${q}`);
}
async function showProjects() {
  if (data && dirty) await flush();
  stopPoll();
  projects = (await api("projects")).projects;
  screen = "projects";
  data = null;
  error = "";
  window.history.replaceState({}, "", "/produit");
  render();
}
async function mutation(action) {
  if (busy) return;
  busy = true;
  error = "";
  const button = document.activeElement;
  if (button?.tagName === "BUTTON") button.disabled = true;
  try {
    await action();
  } catch (e) {
    setError(e);
  } finally {
    busy = false;
    if (button?.isConnected) button.disabled = false;
    if (app.querySelector("button[disabled]")) render();
  }
}
app.addEventListener("input", (e) => {
  if (e.target.closest('[data-form="brief"]')) {
    draft[e.target.name] = e.target.value;
    dirty = true;
    stash();
    saveLabel(
      online ? "Modifications en cours…" : "Saisie conservée sur cet appareil",
    );
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => flush().catch(setError), 800);
  }
  if (e.target.closest('[data-form="revision"]') && user && data)
    safeStore.set(
      `fabrya-revision-${user.id}-${data.project.id}`,
      e.target.value,
    );
});
app.addEventListener("change", (e) => {
  if (e.target.id === "compare-version") {
    compare = e.target.value;
    render();
  }
});
app.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target,
    values = Object.fromEntries(new FormData(form));
  mutation(async () => {
    if (form.dataset.form === "auth") {
      const isRegister = screen === "register";
      const r = await api(
        "auth/" + (isRegister ? "register" : "login"),
        "POST",
        { ...values, session_id: sessionId },
      );
      user = r.user;
      const id = new URLSearchParams(location.search).get("project");
      if (id) await open(id);
      else await showProjects();
    }
    if (form.dataset.form === "brief") {
      if (step < 3) {
        await flush();
        step++;
        dirty = true;
        stash();
        await flush();
        render();
        document.querySelector(".brief h2")?.scrollIntoView({ block: "start" });
      } else {
        await flush();
        const mode = document.querySelector("#qa-mode")?.value;
        const stored =
          safeStore.get("fabrya-generation-" + data.project.id) || key();
        safeStore.set("fabrya-generation-" + data.project.id, stored);
        await api(projectPath("jobs"), "POST", { request_key: stored, mode });
        data = await api(projectPath());
        render();
        schedulePoll();
      }
    }
    if (form.dataset.form === "revision") {
      const revisionKey =
        safeStore.get("fabrya-revision-key-" + data.project.id) || key();
      safeStore.set("fabrya-revision-key-" + data.project.id, revisionKey);
      await api(projectPath("revisions"), "POST", {
        request_key: revisionKey,
        message: values.message,
      });
      safeStore.remove("fabrya-revision-key-" + data.project.id);
      safeStore.remove(`fabrya-revision-${user.id}-${data.project.id}`);
      data = await api(projectPath());
      tab = "project";
      render();
      schedulePoll();
    }
  });
});
app.addEventListener("click", (e) => {
  const button = e.target.closest("[data-action]");
  if (!button) return;
  e.preventDefault();
  const action = button.dataset.action,
    id = button.dataset.id;
  if (["home", "login", "register", "start"].includes(action)) {
    if (dirty) {
      setError(
        new Error(
          "Votre saisie est en cours de sauvegarde. Utilisez « Mes projets » pour quitter cette étape en conservant votre travail.",
        ),
      );
      return;
    }
    error = "";
    if (action === "start") {
      track("signup_started", null);
      if (user) {
        showProjects().catch(setError);
        return;
      }
      screen = "register";
    } else screen = action === "home" ? "landing" : action;
    render();
    return;
  }
  if (action === "approve") {
    approvalPending = id;
    render();
    return;
  }
  if (action === "cancel-approval") { approvalPending = ""; render(); return; }
  if (action === "compare-side") { comparisonSide = id; render(); return; }
  if (action === "tab") {
    tab = id;
    render();
    return;
  }
  if (action === "project-tab") {
    tab = "project";
    render();
    return;
  }
  if (action === "history") {
    tab = "history";
    render();
    return;
  }
  if (action === "device") {
    device = id;
    render();
    return;
  }
  if (action === "view-version") {
    selected = id;
    tab = "project";
    render();
    return;
  }
  mutation(async () => {
    if (action === "projects") await showProjects();
    if (action === "open") await open(id);
    if (action === "new-project") {
      const r = await api("projects", "POST", {
        request_key: creationKey,
        attribution: initialAcquisition,
      });
      creationKey = key();
      safeStore.set("fabrya-product-create-key", creationKey);
      await open(r.project.id);
    }
    if (action === "previous") {
      await flush();
      step = Math.max(0, step - 1);
      dirty = true;
      stash();
      await flush();
      render();
    }
    if (action === "retry") {
      const retryKey =
        safeStore.get(
          "fabrya-retry-" + data.job.job_id + "-" + data.job.attempt,
        ) || key();
      safeStore.set(
        "fabrya-retry-" + data.job.job_id + "-" + data.job.attempt,
        retryKey,
      );
      await api(projectPath(`jobs/${data.job.job_id}/retry`), "POST", {
        request_key: retryKey,
      });
      data = await api(projectPath());
      render();
      schedulePoll();
    }
    if (action === "cancel-job") {
      await api(projectPath(`jobs/${data.job.job_id}/cancel`), "POST", {});
      data = await api(projectPath());
      render();
    }
    if (action === "confirm-approval") {
      if (approvalPending !== id) throw new Error("Choisissez à nouveau la version à valider.");
      approvalPending = "";
      data = await api(projectPath("approve"), "POST", { version_id: id });
      tab = data.project.status === "active" ? "project" : "subscription";
      render();
    }
    if (action === "checkout") {
      if (!document.querySelector("#accept-offer")?.checked)
        throw new Error(
          "Confirmez les conditions de l’abonnement avant de continuer.",
        );
      const r = await api(projectPath("checkout"), "POST", {});
      if (r.url) location.assign(r.url);
      else {
        data = await api(projectPath("payment"), "POST", {});
        render();
        schedulePoll();
      }
    }
    if (action === "check-payment") {
      paymentPolls = 0;
      data = await api(projectPath("payment"), "POST", {});
      render();
      schedulePoll();
    }
    if (action === "abandon") {
      data = await api(projectPath("abandon"), "POST", {});
      render();
    }
    if (action === "portal") {
      const r = await api(projectPath("portal"), "POST", {});
      if (r.url) location.assign(r.url);
    }
    if (action === "recover") {
      if (data && dirty) {
        if (error.includes("autre onglet") || error.includes("saisie locale")) {
          const latest = await api(projectPath());
          error =
            "Une autre saisie est sauvegardée. Votre saisie locale est conservée. ";
          const target = document.querySelector("#error");
          target.innerHTML =
            '<div class="notice error" role="alert">Une autre saisie est sauvegardée. Votre saisie locale reste conservée sur cet appareil. <button class="textbutton" data-action="load-server-draft">Charger la saisie sauvegardée</button><p>Copiez vos ajouts avant de remplacer le formulaire.</p></div>';
          return;
        }
        await flush();
        error = "";
        renderError();
      } else if (user) {
        const id = new URLSearchParams(location.search).get("project");
        if (id) await open(id);
        else await showProjects();
      } else await boot();
    }
    if (action === "load-server-draft") {
      const localBackup = JSON.stringify({ input: draft, step });
      safeStore.set(
        `fabrya-draft-backup-${user.id}-${data.project.id}`,
        localBackup,
      );
      data = await api(projectPath());
      draft = structuredClone(data.project.company_input);
      step = data.project.step;
      dirty = false;
      safeStore.remove(`fabrya-draft-${user.id}-${data.project.id}`);
      error = "";
      saveText =
        "Sauvegardé — une copie de votre saisie précédente reste sur cet appareil";
      render();
    }
    if (action === "logout") {
      if (dirty) await flush();
      await api("auth/logout", "POST", {});
      user = null;
      data = null;
      stopPoll();
      screen = "login";
      render();
    }
  });
});
window.addEventListener("offline", () => {
  online = false;
  stash();
  saveLabel("Saisie conservée sur cet appareil — hors connexion");
  if (!dirty) render();
});
window.addEventListener("online", () => {
  online = true;
  error = "";
  if (dirty)
    flush()
      .then(() => render())
      .catch(setError);
  else render();
  schedulePoll();
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    stash();
    e.preventDefault();
    e.returnValue = "";
  }
});
window.addEventListener("visibilitychange", () => {
  if (!document.hidden) schedulePoll();
});
window.addEventListener("popstate", () => {
  if (dirty) {
    stash();
    return;
  }
  boot().catch(setError);
});
async function boot() {
  const screenAtStart = screen;
  try {
    const config = await fetch("/product-assets/config.json").then((r) =>
      r.json(),
    );
    if (!["test", "live"].includes(config.payment_mode))
      throw new Error("Configuration de paiement indisponible.");
    qa = !!config.qa;
    paymentLive = config.payment_mode === "live";
    isMock = config.engine_mode !== "real";
  } catch {
    app.innerHTML = '<main class="shell"><p role="alert">Votre espace ne peut pas être chargé. Actualisez la page pour réessayer.</p></main>';
    return;
  }
  try {
    const r = await api("auth/session");
    if (
      screen !== screenAtStart &&
      ["login", "register", "workspace", "projects"].includes(screen)
    )
      return;
    user = r.user;
    const id = new URLSearchParams(location.search).get("project");
    if (user && id) await open(id);
    else if (user) await showProjects();
    else {
      screen = id ? "login" : "landing";
      render();
      track("landing_view", null);
    }
  } catch (e) {
    screen = "login";
    render();
    setError(e);
  }
}
app.innerHTML = '<main class="boot" role="status"><img src="/product-assets/fabrya-logo.svg" width="42" height="42" alt="Fabrya"><p>Votre espace se prépare…</p></main>';
boot();
