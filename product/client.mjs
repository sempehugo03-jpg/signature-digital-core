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
  saveText = "",
  pendingSave = null,
  qa = false,
  isMock = true,
  paymentLive = false,
  online = navigator.onLine,
  paymentPolls = 0;
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
  renderError();
}
function renderError() {
  const target = document.querySelector("#error");
  if (target) {
    target.innerHTML = error
      ? `<div class="notice error" role="alert">${esc(error)} <button class="textbutton" data-action="recover">Réessayer</button></div>`
      : "";
  }
}
function header() {
  return `${!paymentLive ? `<div class="testnote">Environnement de test · ${isMock ? "Propositions déterministes" : "Propositions de votre entreprise"} · Paiements Stripe TEST uniquement</div>` : ""}${!online ? '<div class="network" role="status">Hors connexion — votre saisie est conservée sur cet appareil.</div>' : ""}<header class="shell nav"><a class="wordmark" href="/produit" data-action="home"><img src="/product-assets/fabrya-logo.svg" width="30" height="30" alt="">Fabrya</a><nav class="navlinks" aria-label="Navigation principale">${user ? `<span class="sessionname">${esc(user.firstName)}</span><button class="textbutton" data-action="projects">Mes projets</button><button class="button light small" data-action="logout">Déconnexion</button>` : `<a class="navpricing" href="#tarif">59 € / mois</a><button class="textbutton" data-action="login">Connexion</button>`}</nav></header>`;
}
function footer() {
  return `<footer class="shell foot"><span>Fabrya · Votre entreprise, votre prochaine étape.</span><span>59 € / mois · Sans frais d’installation</span></footer>`;
}
function landing() {
  return `<main class="shell"><section class="hero"><div><p class="tagline">Votre entreprise mérite sa propre expérience.</p><h1>Vous avez le métier.<br>Donnez-lui toute<br>sa place.</h1><p class="lede">Présentez votre entreprise. Découvrez une proposition, faites-la évoluer et retrouvez tout votre projet dans un espace qui vous appartient.</p><button class="button" data-action="start">Créer ma proposition <span aria-hidden="true">↗</span></button><p class="fine muted">Vous voyez et validez votre proposition avant de vous abonner.</p></div><div class="visual" aria-label="Illustration d’une proposition et de son historique"><div class="visualpaper"><div class="miniheader"><strong>Atelier du Pic</strong><span>Proposition · V2</span></div><p class="tagline">Menuiserie de caractère</p><h2>Des lieux qui<br>vous ressemblent.</h2><p>Un métier, une identité, une façon singulière de vous rencontrer.</p><div class="minilink">Découvrir notre savoir-faire ↗</div></div><div class="floating"><strong>Votre projet garde le fil.</strong>Brief, versions, modifications : vous reprenez là où vous en êtes.</div></div></section><div class="strip"><span>Une proposition avant votre abonnement</span><span>Vos versions et demandes conservées</span><span>Un espace pour faire évoluer votre projet</span></div><section class="explain"><p class="tagline">Du premier échange à votre espace.</p><h2>Un parcours simple.<br>Du début à la suite.</h2><div class="steps"><article><div class="n">01</div><h3>Parlez de votre entreprise.</h3><p>Votre métier, vos clients et votre objectif. Quelques questions utiles, avec sauvegarde au fil de l’eau.</p></article><article><div class="n">02</div><h3>Prenez le temps de choisir.</h3><p>Ouvrez votre proposition, comparez les versions et demandez une modification. Vous décidez de la version à retenir.</p></article><article><div class="n">03</div><h3>Gardez un point de repère.</h3><p>Après validation et abonnement, votre projet est activé dans votre espace : aperçu, historique et gestion de l’abonnement.</p></article></div><div class="notice">${isMock ? "Pendant ce test, les propositions sont créées par un système déterministe. Le moteur créatif final sera raccordé séparément. " : ""}${paymentLive ? "L’abonnement active votre espace client. La publication de votre site n’est pas incluse à ce stade." : "L’activation reste un état de test : elle ne publie pas votre site sur Internet."}</div></section><section id="tarif" class="pricing"><div><p class="tagline">Votre accès continu à Fabrya</p><h2>Un projet qui avance.<br>Un seul abonnement.</h2><p class="muted">Votre proposition et son espace réunis. Les connexions, le SEO automatisé et les autres services futurs ne sont pas inclus aujourd’hui.</p></div><div><p class="price">59 € <span>/ mois</span></p><ul class="included"><li>Votre proposition et son aperçu</li><li>Les demandes de modification et leurs versions</li><li>Votre historique et votre espace client</li><li>La gestion de votre abonnement</li></ul><p class="muted" style="font-size:13px;margin-bottom:20px">Sans frais d’installation. Abonnement mensuel renouvelé automatiquement ; annulation depuis l’espace abonnement. ${paymentLive ? "" : "Aucun paiement réel dans ce test."}</p><button class="button" data-action="start">Commencer mon projet ↗</button></div></section></main>`;
}
function accountForm() {
  const register = screen === "register";
  return `<main class="shell"><div class="authwrap"><p class="tagline">${register ? "Votre premier pas" : "Heureux de vous retrouver"}</p><h1>${register ? "Un compte pour<br>garder le fil." : "Reprenez votre projet."}</h1><p class="muted">${register ? "Votre brief et vos versions vous attendront ici, même si vous revenez demain." : "Connectez-vous pour retrouver votre entreprise et votre proposition."}</p><form data-form="auth">${register ? '<label class="field"><span>Votre prénom</span><input name="name" autocomplete="given-name" required maxlength="80"></label>' : ""}<label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required maxlength="180"></label><label class="field"><span>Mot de passe</span><input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" required minlength="${register ? "10" : "1"}" maxlength="128">${register ? "<small>10 caractères minimum.</small>" : ""}</label><button class="button formbutton" ${busy ? 'disabled aria-busy="true"' : ""}>${busy ? "Un instant…" : register ? "Créer mon compte" : "Me connecter"}</button></form><p style="margin-top:22px;font-size:14px">${register ? "Vous avez déjà un compte ?" : "Vous découvrez Fabrya ?"} <button class="textbutton" data-action="${register ? "login" : "register"}">${register ? "Me connecter" : "Créer un compte"}</button></p><div id="error"></div></div></main>`;
}
function projectList() {
  return `<main class="shell workspace"><section class="empty"><p class="tagline">Votre espace Fabrya</p><h2>${projects.length ? "Vos projets gardent le fil." : "Tout commence par<br>votre entreprise."}</h2><p>Un brief sauvegardé, une proposition à découvrir, puis une version à choisir.</p><button class="button" data-action="new-project" ${busy ? "disabled" : ""}>Créer mon entreprise ↗</button><div id="error"></div></section><ul class="projectlist">${projects.map((p) => `<li><div><h3>${esc(p.name)}</h3><p class="muted">${statusName(p.status)} · ${date(p.updated_at)}</p></div><button class="button light small" data-action="open" data-id="${esc(p.id)}">Reprendre mon projet ↗</button></li>`).join("")}</ul></main>`;
}
const statusName = (s) =>
  ({
    draft: "Brief en cours",
    creating: "Création en cours",
    review: "Proposition disponible",
    approved: "Version validée",
    active: "Projet actif en test",
    payment_attention: "Abonnement à vérifier",
  })[s] || "Votre projet";
const date = (d) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
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
          )}</dl></details><p class="notice">Vous créerez une proposition de test. Aucune carte bancaire n’est demandée à cette étape.</p>`
      : ""
  }<div class="briefactions">${step ? '<button type="button" class="textbutton" data-action="previous">← Retour</button>' : "<span></span>"}<button class="button" ${busy ? 'disabled aria-busy="true"' : ""}>${busy ? "Sauvegarde…" : step === 3 ? "Créer ma démo ↗" : "Continuer →"}</button></div>${qa && step === 3 ? '<label class="field"><span>Scénario de vérification</span><select id="qa-mode"><option>MOCK_READY</option><option>MOCK_FAILED</option><option>MOCK_TIMEOUT</option><option>MOCK_SLOW</option></select></label>' : ""}</form><div id="error"></div></section>`;
}
function generation() {
  const j = data.job,
    state = j?.status,
    failed = state === "failed" || state === "cancelled";
  const chain = ["understanding", "planning", "creating", "rendering"];
  const index = chain.indexOf(state);
  return `<section class="generation"><p class="tagline">${failed ? "Votre projet est conservé" : "Votre proposition se prépare"}</p><h2>${failed ? "Reprenons simplement." : state === "queued" ? "Votre demande<br>est bien enregistrée." : STEPS[state] || "Votre demande est sauvegardée."}</h2><p>${failed ? esc(j.error?.message || "La création a été annulée. Votre brief est conservé.") : "Vous pouvez fermer cette page et revenir. Fabrya retrouve votre demande et son état sauvegardé."}</p>${failed ? `<div class="notice">Votre entreprise, votre brief et les versions précédentes sont conservés.</div>${j.recoverable ? `<button class="button" data-action="retry" ${busy ? "disabled" : ""}>Relancer la création ↗</button>` : ""}` : `<ol class="progresssteps" aria-label="Étapes de création">${chain.map((s, i) => `<li class="${i < index ? "done" : i === index ? "current" : ""}" ${i === index ? 'aria-current="step"' : ""}><span class="dot">${i < index ? "✓" : i + 1}</span><span>${STEPS[s]}</span></li>`).join("")}</ol><p class="muted" style="font-size:13px">Ce sont des étapes, pas une estimation de temps restante. ${state === "rendering" ? "La finalisation peut encore prendre un instant." : ""}</p><button class="textbutton" data-action="cancel-job" ${busy ? "disabled" : ""}>Annuler cette création</button>`}${data.versions.some((v) => v.state === "ready") ? '<p><button class="textbutton" data-action="history">Voir mes versions précédentes</button></p>' : ""}<div id="error"></div></section>`;
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
  return `<section><div class="previewhead"><div><p class="tagline">${active && v.id === data.project.active_version_id ? "Votre version active en test" : "Votre proposition · aperçu"}</p><h2>${esc(data.project.company_input.name)} · V${v.number}</h2><p class="muted" style="font-size:13px">${date(v.created_at)} · ${active ? "Cette activation reste privée et de test." : "Cette proposition n’est pas encore publiée."}</p></div><div class="viewcontrols" aria-label="Taille de l’aperçu">${[
    ["desktop", "Grand écran"],
    ["mobile", "390 px"],
    ["narrow", "320 px"],
  ]
    .map(
      ([d, l]) =>
        `<button class="button light small" data-action="device" data-id="${d}" aria-pressed="${device === d}">${l}</button>`,
    )
    .join(
      "",
    )}</div></div><div class="previewbox ${device}"><iframe title="Proposition ${esc(data.project.company_input.name)} version ${v.number}" src="${src}" sandbox="allow-scripts" loading="lazy"></iframe></div><div class="afterpreview"><div><h3>Qu’aimeriez-vous ajuster ?</h3><p>Votre demande crée une nouvelle version. La précédente reste dans votre historique. ${isMock ? "Pendant ce test, « plus sobre », « titre : … » et un numéro de téléphone produisent des changements déterministes. Les autres demandes restent visibles comme notes." : "Décrivez le changement souhaité : la proposition suivante restera liée à cette demande dans votre historique."}</p><form data-form="revision"><label class="field"><span>Votre modification</span><textarea name="message" maxlength="2000" required placeholder="Ex. Plus sobre. Titre : Un savoir-faire à votre mesure.">${esc(safeStore.get(`fabrya-revision-${user.id}-${data.project.id}`) || "")}</textarea></label><button class="button light" ${busy ? "disabled" : ""}>Demander une modification ↗</button></form></div><div><h3>${active ? "Faire évoluer mon projet" : "Cette proposition me convient."}</h3><p>${active ? "Validez cette version pour la retrouver comme version active dans votre espace." : "Choisissez cette version. Elle sera précisément conservée, puis vous pourrez vous abonner à Fabrya pour 59 € / mois."}</p><button class="button" data-action="approve" data-id="${v.id}" ${busy ? "disabled" : ""}>${active ? "Utiliser cette version" : "Valider cette version"} ↗</button><p><button class="textbutton" data-action="history">Voir l’historique des versions</button></p></div></div><div id="error"></div></section>`;
}
function history() {
  const ready = data.versions.filter((v) => v.state === "ready");
  return `<section><p class="tagline">Rien n’est perdu.</p><h2>Votre projet, version après version.</h2><ul class="history">${data.versions.map((v) => `<li><div><h3>V${v.number} ${v.id === data.project.active_version_id ? "· Active" : v.id === data.project.approved_version_id ? "· Validée" : ""}</h3><small>${date(v.created_at)} · ${v.state === "ready" ? "Disponible" : STEPS[v.state] || "En cours"}</small><p>${esc(v.modification || "Première proposition issue de votre brief.")}</p></div>${v.state === "ready" ? `<button class="button light small" data-action="view-version" data-id="${v.id}">Ouvrir cette version ↗</button>` : ""}</li>`).join("")}</ul>${ready.length > 1 ? `<label class="field"><span>Comparer la version ouverte à…</span><select id="compare-version"><option value="">Choisir une version</option>${ready.map((v) => `<option value="${v.id}" ${compare === v.id ? "selected" : ""}>Version ${v.number}</option>`).join("")}</select></label>${compare ? `<div class="compare"><div><label>Version sélectionnée</label><iframe title="Version sélectionnée" sandbox="allow-scripts" src="/api/product/${projectPath(`versions/${selected || ready[0].id}/preview`)}"></iframe></div><div><label>Autre version</label><iframe title="Version de comparaison" sandbox="allow-scripts" src="/api/product/${projectPath(`versions/${compare}/preview`)}"></iframe></div></div>` : ""}` : ""}<div id="error"></div></section>`;
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
  return `<section class="approved"><p class="tagline">${active ? "Votre abonnement Fabrya" : "Votre version est validée"}</p><h2>${active ? "Votre projet est actif." : "Votre prochaine étape,<br>au même endroit."}</h2><p class="muted">${active ? "Votre entreprise, votre version active et votre historique sont réunis dans votre espace." : `La version ${v ? "V" + v.number : ""} de ${esc(data.project.company_input.name)} est conservée. Vous gardez la main sur votre abonnement.`}</p><p class="price">59 € <span>/ mois</span></p><ul class="included"><li>Votre proposition et son aperçu</li><li>Vos demandes de modification et vos versions</li><li>L’historique de votre entreprise et son espace client</li><li>La gestion de votre abonnement</li></ul><p class="muted" style="font-size:14px">Sans frais d’installation. Renouvellement mensuel automatique, annulation depuis votre espace abonnement. ${paymentLive ? "L’abonnement active votre espace client ; la publication du site n’est pas encore incluse." : "Aucun paiement réel. L’activation de test ne met pas votre site en production."}</p>${callback === "success" && !active ? `<div class="notice" role="status">${paymentPolls >= 12 ? "La confirmation n’est pas encore disponible. Votre version est conservée. Utilisez « Vérifier la confirmation » ou revenez plus tard." : "Nous vérifions votre paiement auprès de Stripe. Votre projet est conservé. Si la confirmation prend du temps, vous pouvez revenir plus tard."}</div>` : ""}${callback === "cancel" && !active ? '<div class="notice">Le paiement a été interrompu. Vous n’avez pas perdu votre version validée. Vous pouvez reprendre ou fermer cette étape de paiement.</div>' : ""}${data.subscription && !active ? `<div class="notice">État de l’abonnement : ${esc(data.subscription.state)}. Votre projet et vos versions restent conservés.</div><button class="button" data-action="portal">Gérer mon abonnement ↗</button><p><button class="textbutton" data-action="project-tab">Retrouver mon projet</button></p>` : active ? `<div class="notice">Abonnement confirmé · Version active V${data.versions.find((v) => v.id === data.project.active_version_id)?.number || ""} · ${paymentLive ? "Projet activé" : "Activation durable de test"}</div><button class="button" data-action="project-tab">Ouvrir mon espace client ↗</button><p><button class="textbutton" data-action="portal" ${busy ? "disabled" : ""}>Gérer / annuler mon abonnement</button></p>` : v ? `<label class="ack"><input type="checkbox" id="accept-offer"><span>J’ai compris l’abonnement de 59 € / mois, son renouvellement mensuel ${paymentLive ? "et son annulation depuis mon espace." : "et le caractère de test de cette activation."}</span></label><button class="button" data-action="checkout" ${busy ? "disabled" : ""}>${busy ? "Un instant…" : pending ? (paymentLive ? "Reprendre le paiement" : "Reprendre le paiement TEST") : paymentLive ? "Continuer vers le paiement sécurisé" : "Continuer vers Stripe TEST"} ↗</button>${pending ? '<p><button class="textbutton" data-action="check-payment">Vérifier la confirmation</button></p><p><button class="textbutton" data-action="abandon">Fermer ce paiement</button></p>' : ""}` : '<div class="notice">Validez d’abord une proposition pour vous abonner. <button class="textbutton" data-action="project-tab">Voir ma proposition</button></div>'}<div id="error"></div></section>`;
}
function account() {
  return `<section class="account"><p class="tagline">Votre compte</p><h2>Vos repères.</h2><dl><div><dt>Prénom</dt><dd>${esc(user.firstName)}</dd></div><div><dt>Email</dt><dd>${esc(user.email)}</dd></div><div><dt>Entreprise</dt><dd>${esc(data.project.company_input.name)}</dd></div><div><dt>Projet</dt><dd>${statusName(data.project.status)}</dd></div><div><dt>Abonnement</dt><dd>${data.subscription ? esc(data.subscription.state) : "Pas encore souscrit"} · 59 € / mois</dd></div></dl><p class="notice">Vos données restent liées à votre compte. Les mots de passe et les coordonnées de paiement ne figurent pas dans les événements produit.</p><button class="textbutton" data-action="logout">Me déconnecter</button><div id="error"></div></section>`;
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
        `<button data-action="tab" data-id="${t}" aria-current="${tab === t}">${l}</button>`,
    )
    .join(
      "",
    )}</nav>${tab === "history" ? history() : tab === "subscription" ? subscription() : tab === "account" ? account() : data.project.status === "draft" ? brief() : data.job && !TERMINAL.has(data.job.status) ? generation() : data.job && ["failed", "cancelled"].includes(data.job.status) ? generation() : preview()}</main>`;
}
function render() {
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
    footer();
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
    if (action === "approve") {
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
app.innerHTML = '<main class="shell"><p role="status">Chargement de votre espace Fabrya…</p></main>';
boot();
