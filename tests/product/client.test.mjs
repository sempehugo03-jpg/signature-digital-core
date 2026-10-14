// DOM interaction tests only. Linkedom has no layout engine: these are not browser/mobile QA.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { fixture } from "./helpers.mjs";
const require = createRequire(
  new URL("../../product/package.json", import.meta.url),
);
const { parseHTML } = require("linkedom");
const { build } = require("esbuild");
const compiled = await build({
  entryPoints: [
    fileURLToPath(new URL("../../product/client.mjs", import.meta.url)),
  ],
  bundle: true,
  format: "iife",
  write: false,
  platform: "browser",
  plugins: [
    {
      name: "product-contract",
      setup(b) {
        b.onResolve({ filter: /^\/product-assets\/contract.mjs$/ }, () => ({
          path: fileURLToPath(
            new URL("../../product/contract.mjs", import.meta.url),
          ),
        }));
      },
    },
  ],
});
const waitUntil = async (fn) => {
  for (let i = 0; i < 200; i++) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 5));
  }
  assert.ok(fn(), "DOM condition not reached");
};
function ui(f, store = new Map(), search = "") {
  const { window, document } = parseHTML(
    '<html><body><div id="app"></div></body></html>',
  );
  Object.defineProperty(document, "referrer", {
    value: "https://www.google.fr/search?q=fabrya",
  });
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const location = {
    origin: "https://qa.fabrya.test",
    search,
    assign(url) {
      this.assigned = url;
    },
  };
  const timers = new Map();
  let timerId = 0;
  let network = true;
  const context = vm.createContext({
    window,
    document,
    location,
    navigator: { onLine: true },
    localStorage: {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    },
    crypto,
    URL,
    URLSearchParams,
    structuredClone,
    AbortSignal,
    Intl,
    console,
    FormData: class {
      constructor(form) {
        this.entries = [
          ...form.querySelectorAll("input[name],textarea[name],select[name]"),
        ].map((e) => [e.name, e.value]);
      }
      [Symbol.iterator]() {
        return this.entries[Symbol.iterator]();
      }
    },
    setTimeout(fn, delay) {
      const id = ++timerId;
      timers.set(id, { fn, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    fetch: async (url, options = {}) => {
      if (!network) throw new TypeError("Network disconnected");
      if (url === "/product-assets/config.json")
        return Response.json({ qa: true, payment_mode: "test", engine_mode: "mock" });
      const r = await f.handle(
        new Request("https://qa.fabrya.test" + url, {
          ...options,
          headers: {
            ...options.headers,
            origin: "https://qa.fabrya.test",
            cookie: f.cookie,
          },
        }),
      );
      if (r.headers.get("set-cookie")?.startsWith("fabrya_session="))
        f.cookie = r.headers.get("set-cookie").split(";")[0];
      return r;
    },
  });
  window.history = {
    replaceState(_a, _b, url) {
      location.search = new URL(url, location.origin).search;
    },
  };
  vm.runInContext(compiled.outputFiles[0].text, context);
  return {
    document,
    window,
    location,
    store,
    click(action) {
      const b = document.querySelector(`[data-action="${action}"]`);
      assert.ok(b, `button ${action} exists`);
      b.dispatchEvent(
        new window.Event("click", { bubbles: true, cancelable: true }),
      );
    },
    input(name, value) {
      const input = document.querySelector(`[name="${name}"]`);
      assert.ok(input, `${name} field exists`);
      input.value = value;
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    },
    submit(type) {
      const form = document.querySelector(`[data-form="${type}"]`);
      assert.ok(form, `${type} form exists`);
      form.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    },
    async timers(max) {
      const callbacks = [...timers].filter(([, t]) => t.delay <= max);
      for (const [id, t] of callbacks) {
        timers.delete(id);
        await t.fn();
      }
    },
    offline() {
      network = false;
      window.dispatchEvent(new window.Event("offline"));
    },
    online() {
      network = true;
      window.dispatchEvent(new window.Event("online"));
    },
  };
}

test("DOM flow: landing, signup, brief autosave, ready preview, revision, validation and human payment error", async () => {
  const f = fixture();
  const u = ui(f);
  await waitUntil(() => u.document.querySelector('[data-action="start"]'));
  u.click("start");
  u.input("name", "Hélène");
  u.input("email", "ui@example.test");
  u.input("password", "A-long-test-password");
  u.submit("auth");
  await waitUntil(() =>
    u.document.querySelector('[data-action="new-project"]'),
  );
  assert.equal(
    u.document.querySelector('[data-action="new-project"]').disabled,
    false,
  );
  u.click("new-project");
  await waitUntil(() => u.document.querySelector('[name="activity"]'));
  u.input("name", "Atelier UI");
  u.input("activity", "Artisan");
  u.submit("brief");
  await waitUntil(() => u.document.querySelector('[name="objective"]'));
  u.input("objective", "Recevoir des demandes");
  u.submit("brief");
  await waitUntil(() => u.document.querySelector('[name="description"]'));
  u.input("description", "Notre métier, notre savoir-faire.");
  u.submit("brief");
  await waitUntil(() => u.document.querySelector('[name="brand"]'));
  u.submit("brief");
  await waitUntil(() => u.document.querySelector(".generation"));
  f.advance(8000);
  await u.timers(2000);
  await waitUntil(() => u.document.querySelector("iframe"));
  assert.ok(
    u.document.querySelector("iframe").getAttribute("sandbox") ===
      "allow-scripts",
  );
  assert.match(u.document.body.textContent, /Valider cette version/);
  u.input("message", "Plus sobre. Titre : Un nouveau départ");
  u.submit("revision");
  await waitUntil(() => u.document.querySelector(".generation"));
  f.advance(8000);
  await u.timers(2000);
  await waitUntil(() => u.document.querySelector("iframe"));
  assert.match(u.document.body.textContent, /V2/);
  u.click("approve");
  assert.ok(u.document.querySelector("#approval-confirm"));
  assert.equal(u.document.querySelector("#accept-offer"), null);
  u.click("confirm-approval");
  await waitUntil(() => u.document.querySelector("#accept-offer"));
  assert.match(u.document.body.textContent, /59 € \/ mois/);
  u.click("checkout");
  await waitUntil(() =>
    u.document.querySelector("#error").textContent.includes("Confirmez"),
  );
  assert.equal(
    u.document.querySelector('[data-action="checkout"]').disabled,
    false,
  );
  const check = u.document.querySelector("#accept-offer");
  check.checked = true;
  u.click("checkout");
  await waitUntil(() =>
    u.location.assigned?.startsWith("https://checkout.stripe.com"),
  );
  f.stripe.pay("cs_test_1");
  u.location.search += "&payment=success";
  u.window.dispatchEvent(new u.window.Event("popstate"));
  await waitUntil(() =>
    u.document.querySelector('[data-action="check-payment"]'),
  );
  u.click("check-payment");
  await waitUntil(() =>
    u.document.body.textContent.includes("Votre projet est actif."),
  );
  u.click("project-tab");
  await waitUntil(() =>
    u.document.body.textContent.includes("Votre espace client"),
  );
  assert.match(u.document.body.textContent, /Votre version active/);
  f.db.close();
});

test("DOM network loss: keep local outbox, retain field focus/value, save on reconnection", async () => {
  const f = fixture();
  await f.req("auth/register", "POST", {
    name: "Client",
    email: "offline@example.test",
    password: "A-long-test-password",
  });
  const u = ui(f);
  await waitUntil(() =>
    u.document.querySelector('[data-action="new-project"]'),
  );
  u.click("new-project");
  await waitUntil(() => u.document.querySelector('[name="activity"]'));
  u.offline();
  u.input("name", "Conservé hors ligne");
  await u.timers(1000);
  await waitUntil(() =>
    u.document.querySelector("#error").textContent.includes("hors connexion"),
  );
  assert.equal(
    u.document.querySelector('[name="name"]').value,
    "Conservé hors ligne",
  );
  assert.ok([...u.store.keys()].some((k) => k.startsWith("fabrya-draft-")));
  u.online();
  await waitUntil(
    () => u.document.querySelector("#save-status").textContent === "Sauvegardé",
  );
  const id = new URLSearchParams(u.location.search).get("project");
  assert.equal(
    (await f.req("projects/" + id)).data.project.company_input.name,
    "Conservé hors ligne",
  );
  f.db.close();
});

test("DOM login failure keeps form editable and provides a human error", async () => {
  const f = fixture();
  const u = ui(f);
  await waitUntil(() => u.document.querySelector('[data-action="login"]'));
  u.click("login");
  u.input("email", "unknown@example.test");
  u.input("password", "Invalid-password");
  u.submit("auth");
  await waitUntil(() =>
    u.document.querySelector("#error")?.textContent.includes("incorrect"),
  );
  assert.equal(
    u.document.querySelector('[name="email"]').value,
    "unknown@example.test",
  );
  assert.equal(
    u.document.querySelector('[data-form="auth"] button').disabled,
    false,
  );
  f.db.close();
});
