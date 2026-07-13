import type { RealEstateAgencyConfig, RealEstateAgent } from '../data/realEstateTemplate'

export type OpeningHourRange = {
  from: string
  to: string
}

export type OpeningDay = {
  closed: boolean
  ranges: OpeningHourRange[]
}

export type AgencyOpeningHours = {
  monday: OpeningDay
  tuesday: OpeningDay
  wednesday: OpeningDay
  thursday: OpeningDay
  friday: OpeningDay
  saturday: OpeningDay
  sunday: OpeningDay
}

export type AgencyContactAndLegalIdentity = {
  publicContact: {
    publicEmail: string
    publicPhone: string
    contactFormRecipientEmail: string
    estimationRecipientEmail: string
    visitRecipientEmail: string
    callbackRecipientEmail: string
  }
  postalAddress: {
    addressLine1: string
    addressLine2?: string
    postalCode: string
    city: string
    country: string
    mapUrl?: string
  }
  openingHours: AgencyOpeningHours
  socialLinks: {
    facebook?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    other?: string
  }
  professionalIdentity: {
    legalName?: string
    tradeName?: string
    legalForm?: string
    registrationNumber?: string
    rcsCity?: string
    vatNumber?: string
    shareCapital?: string
    professionalCardNumber?: string
    cardIssuedBy?: string
    financialGuarantee?: string
    professionalInsurance?: string
    mediatorName?: string
    mediatorUrl?: string
    feesUrl?: string
  }
  publication: {
    publicationDirector?: string
  }
  legalDocumentLinks: {
    legalNoticeUrl?: string
    privacyPolicyUrl?: string
    termsUrl?: string
    feesUrl?: string
  }
}

export type AgencyContactIdentityValidation = {
  normalized: AgencyContactAndLegalIdentity
  missingRequiredFields: string[]
  warnings: string[]
  recipients: {
    contact: string
    estimation: string
    visit: string
    callback: string
  }
}

export const openingDayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type OpeningDayKey = (typeof openingDayKeys)[number]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createDefaultOpeningHours(): AgencyOpeningHours {
  return {
    monday: { closed: false, ranges: [{ from: '09:00', to: '18:00' }] },
    tuesday: { closed: false, ranges: [{ from: '09:00', to: '18:00' }] },
    wednesday: { closed: false, ranges: [{ from: '09:00', to: '18:00' }] },
    thursday: { closed: false, ranges: [{ from: '09:00', to: '18:00' }] },
    friday: { closed: false, ranges: [{ from: '09:00', to: '18:00' }] },
    saturday: { closed: true, ranges: [] },
    sunday: { closed: true, ranges: [] },
  }
}

export function buildAgencyContactLegalIdentity(
  source: Pick<RealEstateAgencyConfig, 'agencyName' | 'city' | 'email' | 'phone' | 'address'> & {
    contactLegalIdentity?: Partial<AgencyContactAndLegalIdentity>
    agents?: RealEstateAgent[]
  },
): AgencyContactAndLegalIdentity {
  const existing = source.contactLegalIdentity
  const publicEmail = normalizeEmail(existing?.publicContact?.publicEmail) || normalizeEmail(source.email)
  const publicPhone = clean(existing?.publicContact?.publicPhone) || clean(source.phone)
  const ownerEmail = findActiveOwnerEmail(source.agents)
  const fallbackRecipient = publicEmail || ownerEmail
  const addressParts = splitAddress(clean(existing?.postalAddress?.addressLine1) || clean(source.address), source.city)

  return {
    publicContact: {
      publicEmail,
      publicPhone,
      contactFormRecipientEmail: normalizeEmail(existing?.publicContact?.contactFormRecipientEmail) || fallbackRecipient,
      estimationRecipientEmail: normalizeEmail(existing?.publicContact?.estimationRecipientEmail) || fallbackRecipient,
      visitRecipientEmail: normalizeEmail(existing?.publicContact?.visitRecipientEmail) || fallbackRecipient,
      callbackRecipientEmail: normalizeEmail(existing?.publicContact?.callbackRecipientEmail) || fallbackRecipient,
    },
    postalAddress: {
      addressLine1: clean(existing?.postalAddress?.addressLine1) || addressParts.addressLine1,
      addressLine2: clean(existing?.postalAddress?.addressLine2) || undefined,
      postalCode: clean(existing?.postalAddress?.postalCode) || addressParts.postalCode,
      city: clean(existing?.postalAddress?.city) || clean(source.city),
      country: clean(existing?.postalAddress?.country) || 'France',
      mapUrl: normalizeUrl(existing?.postalAddress?.mapUrl),
    },
    openingHours: normalizeOpeningHours(existing?.openingHours),
    socialLinks: {
      facebook: normalizeUrl(existing?.socialLinks?.facebook),
      instagram: normalizeUrl(existing?.socialLinks?.instagram),
      linkedin: normalizeUrl(existing?.socialLinks?.linkedin),
      youtube: normalizeUrl(existing?.socialLinks?.youtube),
      other: normalizeUrl(existing?.socialLinks?.other),
    },
    professionalIdentity: {
      legalName: clean(existing?.professionalIdentity?.legalName),
      tradeName: clean(existing?.professionalIdentity?.tradeName) || clean(source.agencyName),
      legalForm: clean(existing?.professionalIdentity?.legalForm),
      registrationNumber: clean(existing?.professionalIdentity?.registrationNumber),
      rcsCity: clean(existing?.professionalIdentity?.rcsCity),
      vatNumber: clean(existing?.professionalIdentity?.vatNumber),
      shareCapital: clean(existing?.professionalIdentity?.shareCapital),
      professionalCardNumber: clean(existing?.professionalIdentity?.professionalCardNumber),
      cardIssuedBy: clean(existing?.professionalIdentity?.cardIssuedBy),
      financialGuarantee: clean(existing?.professionalIdentity?.financialGuarantee),
      professionalInsurance: clean(existing?.professionalIdentity?.professionalInsurance),
      mediatorName: clean(existing?.professionalIdentity?.mediatorName),
      mediatorUrl: normalizeUrl(existing?.professionalIdentity?.mediatorUrl),
      feesUrl: normalizeUrl(existing?.professionalIdentity?.feesUrl),
    },
    publication: {
      publicationDirector: clean(existing?.publication?.publicationDirector),
    },
    legalDocumentLinks: {
      legalNoticeUrl: normalizeUrl(existing?.legalDocumentLinks?.legalNoticeUrl),
      privacyPolicyUrl: normalizeUrl(existing?.legalDocumentLinks?.privacyPolicyUrl),
      termsUrl: normalizeUrl(existing?.legalDocumentLinks?.termsUrl),
      feesUrl: normalizeUrl(existing?.legalDocumentLinks?.feesUrl || existing?.professionalIdentity?.feesUrl),
    },
  }
}

export function resolveAgencyContactIdentity(config: RealEstateAgencyConfig): AgencyContactIdentityValidation {
  return validateAgencyLegalIdentity(buildAgencyContactLegalIdentity(config))
}

export function validateAgencyLegalIdentity(identity: AgencyContactAndLegalIdentity): AgencyContactIdentityValidation {
  const missingRequiredFields: string[] = []
  const warnings: string[] = []
  const publicEmail = normalizeEmail(identity.publicContact.publicEmail)
  const publicPhone = clean(identity.publicContact.publicPhone)
  const addressLine1 = clean(identity.postalAddress.addressLine1)
  const city = clean(identity.postalAddress.city)

  if (!publicEmail) missingRequiredFields.push('Email public')
  if (!publicPhone) missingRequiredFields.push('Telephone public')
  if (!addressLine1) missingRequiredFields.push('Adresse')
  if (!city) missingRequiredFields.push('Ville')

  const recipients = {
    contact: normalizeEmail(identity.publicContact.contactFormRecipientEmail) || publicEmail,
    estimation: normalizeEmail(identity.publicContact.estimationRecipientEmail) || publicEmail,
    visit: normalizeEmail(identity.publicContact.visitRecipientEmail) || publicEmail,
    callback: normalizeEmail(identity.publicContact.callbackRecipientEmail) || publicEmail,
  }

  Object.entries(recipients).forEach(([key, value]) => {
    if (!value) warnings.push(`Destinataire ${key} manquant.`)
  })

  return {
    normalized: identity,
    missingRequiredFields,
    warnings,
    recipients,
  }
}

export function formatOpeningHours(openingHours: AgencyOpeningHours) {
  return openingDayKeys
    .map((day) => {
      const config = openingHours[day]
      return {
        day,
        label: getOpeningDayLabel(day),
        value: config.closed || !config.ranges.length
          ? 'Ferme'
          : config.ranges.map((range) => `${range.from}-${range.to}`).join(', '),
      }
    })
}

export function getOpeningDayLabel(day: OpeningDayKey) {
  const labels: Record<OpeningDayKey, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  }
  return labels[day]
}

export function createTelHref(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}

export function createMailtoHref(email: string) {
  const normalized = normalizeEmail(email)
  return normalized ? `mailto:${normalized}` : ''
}

export function normalizeEmail(value?: string) {
  const email = clean(value).toLowerCase()
  return emailPattern.test(email) ? email : ''
}

export function normalizeUrl(value?: string) {
  const url = clean(value)
  if (!url) return undefined
  if (!/^https?:\/\//i.test(url)) return undefined
  try {
    return new URL(url).toString()
  } catch {
    return undefined
  }
}

function normalizeOpeningHours(value?: Partial<AgencyOpeningHours>): AgencyOpeningHours {
  const defaults = createDefaultOpeningHours()
  return openingDayKeys.reduce((next, day) => {
    const current = value?.[day]
    next[day] = {
      closed: Boolean(current?.closed ?? defaults[day].closed),
      ranges: Array.isArray(current?.ranges)
        ? current.ranges
          .map((range) => ({ from: clean(range.from), to: clean(range.to) }))
          .filter((range) => range.from && range.to)
        : defaults[day].ranges,
    }
    return next
  }, {} as AgencyOpeningHours)
}

function splitAddress(address: string, city: string) {
  const postalCodeMatch = address.match(/\b\d{5}\b/)
  return {
    addressLine1: address,
    postalCode: postalCodeMatch?.[0] ?? '',
    city: clean(city),
  }
}

function findActiveOwnerEmail(agents?: RealEstateAgent[]) {
  const owner = agents?.find((agent) => agent.active && /patron|direct|owner|responsable/i.test(agent.role))
  return normalizeEmail(owner?.email)
}

function clean(value?: string) {
  return typeof value === 'string' ? value.trim() : ''
}
