export type CommercialOfferCurrency = 'EUR'
export type CommercialOfferRecurringInterval = 'month'

export type CommercialOffer = {
  id: string
  name: string
  installationAmount: number
  recurringAmount: number
  currency: CommercialOfferCurrency
  recurringInterval: CommercialOfferRecurringInterval
  active: boolean
  description: string
  includedFeatures: string[]
  stripeInstallationPriceId?: string
  stripeRecurringPriceId?: string
}

export type CommercialOfferSnapshot = {
  offerId: string
  name: string
  installationAmount: number
  recurringAmount: number
  currency: CommercialOfferCurrency
  recurringInterval: CommercialOfferRecurringInterval
  capturedAt: string
}

export const defaultCommercialOffer: CommercialOffer = {
  id: 'signature-immobilier-standard',
  name: 'Signature Immobilier',
  installationAmount: 100000,
  recurringAmount: 25000,
  currency: 'EUR',
  recurringInterval: 'month',
  active: true,
  description: "Activation de la plateforme Signature Immobilier avec accompagnement initial.",
  includedFeatures: [
    'Adaptation finale de la demo validee',
    'Mise en ligne',
    'Configuration des acces',
    'Plateforme complete apres activation',
    'Accompagnement initial',
    'Suivi apres activation',
  ],
  stripeInstallationPriceId: '',
  stripeRecurringPriceId: '',
}

const commercialOfferStorageKey = 'signatureDigitalCommercialOffer'

export function readCommercialOffer() {
  if (typeof window === 'undefined') return defaultCommercialOffer

  try {
    const raw = window.localStorage.getItem(commercialOfferStorageKey)
    if (!raw) return defaultCommercialOffer

    return normalizeCommercialOffer(JSON.parse(raw))
  } catch {
    return defaultCommercialOffer
  }
}

export function readActiveCommercialOffer() {
  const offer = readCommercialOffer()
  return offer.active && validateCommercialOffer(offer).valid ? offer : defaultCommercialOffer
}

export function updateCommercialOffer(updates: Partial<CommercialOffer>) {
  const offer = normalizeCommercialOffer({ ...readCommercialOffer(), ...updates })
  const validation = validateCommercialOffer(offer)
  if (offer.active && !validation.valid) {
    return { offer: readCommercialOffer(), validation }
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(commercialOfferStorageKey, JSON.stringify(offer))
  }

  return { offer, validation }
}

export function validateCommercialOffer(offer: CommercialOffer) {
  const errors: string[] = []

  if (!offer.name.trim()) errors.push("Le nom de l'offre est requis.")
  if (!Number.isInteger(offer.installationAmount) || offer.installationAmount <= 0) errors.push("Les frais d'installation doivent etre positifs.")
  if (!Number.isInteger(offer.recurringAmount) || offer.recurringAmount <= 0) errors.push("L'abonnement doit etre positif.")
  if (offer.currency !== 'EUR') errors.push('La devise doit etre EUR.')
  if (offer.recurringInterval !== 'month') errors.push('La periodicite doit etre mensuelle.')
  if (offer.includedFeatures.length === 0) errors.push('Ajoutez au moins un element inclus.')

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function createCommercialOfferSnapshot(offer = readActiveCommercialOffer(), capturedAt = new Date().toISOString()): CommercialOfferSnapshot {
  return {
    offerId: offer.id,
    name: offer.name,
    installationAmount: offer.installationAmount,
    recurringAmount: offer.recurringAmount,
    currency: offer.currency,
    recurringInterval: offer.recurringInterval,
    capturedAt,
  }
}

export function resolveCommercialOfferForProject(project: { commercialOfferSnapshot?: CommercialOfferSnapshot }) {
  const activeOffer = readActiveCommercialOffer()
  if (!project.commercialOfferSnapshot) return activeOffer

  return {
    ...activeOffer,
    id: project.commercialOfferSnapshot.offerId,
    name: project.commercialOfferSnapshot.name,
    installationAmount: project.commercialOfferSnapshot.installationAmount,
    recurringAmount: project.commercialOfferSnapshot.recurringAmount,
    currency: project.commercialOfferSnapshot.currency,
    recurringInterval: project.commercialOfferSnapshot.recurringInterval,
  }
}

export function formatCommercialAmount(amountInCents: number, currency: CommercialOfferCurrency = 'EUR') {
  const amount = Number.isInteger(amountInCents) ? amountInCents : 0
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100)
}

export function formatRecurringInterval(interval: CommercialOfferRecurringInterval) {
  return interval === 'month' ? 'mois' : interval
}

export function parseCommercialAmountInput(value: string) {
  const normalized = value.replace(/[^\d,.]/g, '').replace(',', '.')
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100)
}

function normalizeCommercialOffer(value: Partial<CommercialOffer> = {}): CommercialOffer {
  const includedFeatures = Array.isArray(value.includedFeatures)
    ? value.includedFeatures.map((item) => String(item).trim()).filter(Boolean)
    : defaultCommercialOffer.includedFeatures

  return {
    id: String(value.id || defaultCommercialOffer.id).trim() || defaultCommercialOffer.id,
    name: String(value.name || defaultCommercialOffer.name).trim(),
    installationAmount: normalizeAmount(value.installationAmount, defaultCommercialOffer.installationAmount),
    recurringAmount: normalizeAmount(value.recurringAmount, defaultCommercialOffer.recurringAmount),
    currency: value.currency === 'EUR' ? 'EUR' : defaultCommercialOffer.currency,
    recurringInterval: value.recurringInterval === 'month' ? 'month' : defaultCommercialOffer.recurringInterval,
    active: typeof value.active === 'boolean' ? value.active : defaultCommercialOffer.active,
    description: String(value.description || defaultCommercialOffer.description).trim(),
    includedFeatures,
    stripeInstallationPriceId: String(value.stripeInstallationPriceId || '').trim(),
    stripeRecurringPriceId: String(value.stripeRecurringPriceId || '').trim(),
  }
}

function normalizeAmount(value: unknown, fallback: number) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback
}
