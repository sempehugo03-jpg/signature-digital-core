export const OFFER = Object.freeze({
  amount: 5900,
  currency: "eur",
  interval: "month",
  label: "59 € / mois",
  installation: 0,
  testPriceId: "price_1UO5oJA4NzNcjm7qxb3LOYwC",
});
export const JOB_STATES = Object.freeze([
  "draft",
  "queued",
  "understanding",
  "planning",
  "creating",
  "rendering",
  "ready",
  "failed",
  "cancelled",
]);
export const TERMINAL = new Set(["ready", "failed", "cancelled"]);
export const STEPS = Object.freeze({
  draft: "Votre projet",
  queued: "Votre demande est enregistrée",
  understanding: "Compréhension de votre entreprise",
  planning: "Direction de votre expérience",
  creating: "Création de votre proposition",
  rendering: "Vérification et finalisation",
  ready: "Votre proposition est prête",
  failed: "La création a été interrompue",
  cancelled: "La création est annulée",
});
export function cleanInput(input = {}) {
  const limits = {
    name: 160,
    activity: 240,
    description: 4000,
    audience: 1000,
    location: 200,
    objective: 1200,
    problem: 2000,
    website: 500,
    brand: 2000,
    assets: 2000,
    constraints: 2000,
  };
  return Object.fromEntries(
    Object.entries(limits).map(([k, max]) => [
      k,
      String(input[k] ?? "")
        .trim()
        .slice(0, max),
    ]),
  );
}
export function attribution(input = {}) {
  const source = ["google_organic", "direct", "referral", "other"].includes(
    input.source,
  )
    ? input.source
    : "direct";
  // Store a category and campaign labels; never store the referrer URL or query string.
  return {
    source,
    campaign: String(input.campaign || "")
      .replace(/[^\w -]/g, "")
      .slice(0, 80),
  };
}
export class ProductError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export const fail = (code, message, status = 400) => {
  throw new ProductError(code, message, status);
};
export async function digest(value) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export const json = (v) => JSON.stringify(v);
export const parse = (v, fallback = {}) => {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};
