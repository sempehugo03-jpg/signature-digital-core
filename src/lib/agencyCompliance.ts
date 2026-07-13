import type { AgencyContactAndLegalIdentity } from './agencyContactLegalIdentity'

export type ComplianceDocumentStatus = 'missing' | 'draft' | 'review-required' | 'approved'
export type ConsentDecision = 'accepted' | 'refused' | 'withdrawn'
export type ConsentPurpose = 'necessary' | 'audience' | 'marketing' | 'third-party-content' | 'personalization' | 'commercial-terms'

export type ComplianceDocumentMeta = {
  version: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  status: ComplianceDocumentStatus
}

export type AgencyComplianceConfig = {
  legalNotice: ComplianceDocumentMeta
  privacyPolicy: ComplianceDocumentMeta & {
    dataRightsContactEmail: string
    retention: {
      estimationRequestsMonths: number
      visitRequestsMonths: number
      contactRequestsMonths: number
      accountDataMonths: number
      documentsMonths: number
      paymentRecordsMonths: number
      emailLogsMonths: number
    }
  }
  cookiePolicy: ComplianceDocumentMeta & {
    necessaryOnly: boolean
    categories: {
      necessary: boolean
      audience: boolean
      marketing: boolean
      thirdPartyContent: boolean
      personalization: boolean
    }
  }
  formPrivacyNotices: {
    shortNotice: string
    requireMarketingConsent: boolean
  }
  consentSettings: {
    policyVersion: string
    cookieConsentStorageDays: number
    proofStorageDays: number
  }
  documentStatus: ComplianceDocumentStatus
}

export type ConsentRecord = {
  agencyId: string
  visitorId?: string
  accountId?: string
  purpose: ConsentPurpose
  decision: ConsentDecision
  policyVersion: string
  createdAt: string
  updatedAt: string
}

export type AgencyComplianceValidation = {
  config: AgencyComplianceConfig
  missingFields: string[]
  warnings: string[]
  approved: boolean
  hasNonNecessaryCookies: boolean
}

const consentStorageKey = 'signatureDigitalConsentRecords'

export function createDefaultAgencyComplianceConfig(
  contactIdentity: AgencyContactAndLegalIdentity,
  existing?: Partial<AgencyComplianceConfig>,
): AgencyComplianceConfig {
  const now = new Date().toISOString()
  const version = existing?.consentSettings?.policyVersion || 'v1'
  const publicEmail = contactIdentity.publicContact.publicEmail

  return {
    legalNotice: {
      version,
      updatedAt: existing?.legalNotice?.updatedAt || now,
      approvedAt: existing?.legalNotice?.approvedAt,
      approvedBy: existing?.legalNotice?.approvedBy,
      status: existing?.legalNotice?.status || 'draft',
    },
    privacyPolicy: {
      version,
      updatedAt: existing?.privacyPolicy?.updatedAt || now,
      approvedAt: existing?.privacyPolicy?.approvedAt,
      approvedBy: existing?.privacyPolicy?.approvedBy,
      status: existing?.privacyPolicy?.status || 'draft',
      dataRightsContactEmail: existing?.privacyPolicy?.dataRightsContactEmail || publicEmail,
      retention: {
        estimationRequestsMonths: existing?.privacyPolicy?.retention?.estimationRequestsMonths ?? 36,
        visitRequestsMonths: existing?.privacyPolicy?.retention?.visitRequestsMonths ?? 36,
        contactRequestsMonths: existing?.privacyPolicy?.retention?.contactRequestsMonths ?? 36,
        accountDataMonths: existing?.privacyPolicy?.retention?.accountDataMonths ?? 60,
        documentsMonths: existing?.privacyPolicy?.retention?.documentsMonths ?? 60,
        paymentRecordsMonths: existing?.privacyPolicy?.retention?.paymentRecordsMonths ?? 120,
        emailLogsMonths: existing?.privacyPolicy?.retention?.emailLogsMonths ?? 24,
      },
    },
    cookiePolicy: {
      version,
      updatedAt: existing?.cookiePolicy?.updatedAt || now,
      approvedAt: existing?.cookiePolicy?.approvedAt,
      approvedBy: existing?.cookiePolicy?.approvedBy,
      status: existing?.cookiePolicy?.status || 'draft',
      necessaryOnly: existing?.cookiePolicy?.necessaryOnly ?? true,
      categories: {
        necessary: true,
        audience: existing?.cookiePolicy?.categories?.audience ?? false,
        marketing: existing?.cookiePolicy?.categories?.marketing ?? false,
        thirdPartyContent: existing?.cookiePolicy?.categories?.thirdPartyContent ?? false,
        personalization: existing?.cookiePolicy?.categories?.personalization ?? false,
      },
    },
    formPrivacyNotices: {
      shortNotice: existing?.formPrivacyNotices?.shortNotice
        || 'Les informations transmises sont utilisees pour traiter votre demande. Consultez la politique de confidentialite pour connaitre vos droits.',
      requireMarketingConsent: existing?.formPrivacyNotices?.requireMarketingConsent ?? false,
    },
    consentSettings: {
      policyVersion: version,
      cookieConsentStorageDays: existing?.consentSettings?.cookieConsentStorageDays ?? 180,
      proofStorageDays: existing?.consentSettings?.proofStorageDays ?? 365,
    },
    documentStatus: existing?.documentStatus || resolveDocumentStatus(
      existing?.legalNotice?.status || 'draft',
      existing?.privacyPolicy?.status || 'draft',
      existing?.cookiePolicy?.status || 'draft',
    ),
  }
}

export function validateAgencyComplianceConfig(
  config: AgencyComplianceConfig,
  contactIdentity: AgencyContactAndLegalIdentity,
): AgencyComplianceValidation {
  const missingFields: string[] = []
  const warnings: string[] = []
  const professional = contactIdentity.professionalIdentity

  if (!contactIdentity.publicContact.publicEmail) missingFields.push('Email public')
  if (!contactIdentity.postalAddress.addressLine1) missingFields.push('Adresse')
  if (!contactIdentity.publication.publicationDirector) missingFields.push('Responsable de publication')
  if (!professional.legalName && !professional.tradeName) missingFields.push('Identite juridique ou nom commercial')
  if (!config.privacyPolicy.dataRightsContactEmail) missingFields.push('Contact droits RGPD')

  if (!professional.registrationNumber) warnings.push('SIREN / immatriculation non renseigne.')
  if (!professional.professionalCardNumber) warnings.push('Carte professionnelle non renseignee.')
  if (!professional.professionalInsurance) warnings.push('Assurance professionnelle non renseignee.')
  if (!professional.feesUrl && !contactIdentity.legalDocumentLinks.feesUrl) warnings.push('Lien honoraires non renseigne.')

  const hasNonNecessaryCookies = !config.cookiePolicy.necessaryOnly
    || config.cookiePolicy.categories.audience
    || config.cookiePolicy.categories.marketing
    || config.cookiePolicy.categories.thirdPartyContent
    || config.cookiePolicy.categories.personalization

  return {
    config,
    missingFields,
    warnings,
    approved: config.documentStatus === 'approved'
      && config.legalNotice.status === 'approved'
      && config.privacyPolicy.status === 'approved'
      && config.cookiePolicy.status === 'approved',
    hasNonNecessaryCookies,
  }
}

export function approveAgencyComplianceConfig(config: AgencyComplianceConfig, approvedBy = 'admin'): AgencyComplianceConfig {
  const now = new Date().toISOString()
  const nextMeta = (meta: ComplianceDocumentMeta): ComplianceDocumentMeta => ({
    ...meta,
    status: 'approved',
    approvedAt: now,
    approvedBy,
    updatedAt: now,
  })

  return {
    ...config,
    legalNotice: nextMeta(config.legalNotice),
    privacyPolicy: {
      ...config.privacyPolicy,
      ...nextMeta(config.privacyPolicy),
    },
    cookiePolicy: {
      ...config.cookiePolicy,
      ...nextMeta(config.cookiePolicy),
    },
    documentStatus: 'approved',
  }
}

export function markComplianceReviewRequired(config: AgencyComplianceConfig): AgencyComplianceConfig {
  const now = new Date().toISOString()
  return {
    ...config,
    legalNotice: { ...config.legalNotice, status: 'review-required', updatedAt: now },
    privacyPolicy: { ...config.privacyPolicy, status: 'review-required', updatedAt: now },
    cookiePolicy: { ...config.cookiePolicy, status: 'review-required', updatedAt: now },
    documentStatus: 'review-required',
  }
}

export function resolveDocumentStatus(...statuses: ComplianceDocumentStatus[]): ComplianceDocumentStatus {
  if (statuses.some((status) => status === 'missing')) return 'missing'
  if (statuses.every((status) => status === 'approved')) return 'approved'
  if (statuses.some((status) => status === 'review-required')) return 'review-required'
  return 'draft'
}

export function createConsentRecord(input: Omit<ConsentRecord, 'createdAt' | 'updatedAt'>): ConsentRecord {
  const now = new Date().toISOString()
  return {
    ...input,
    createdAt: now,
    updatedAt: now,
  }
}

export function saveConsentRecord(record: ConsentRecord) {
  if (typeof window === 'undefined') return record
  const current = readConsentRecords().filter((item) => !(
    item.agencyId === record.agencyId
    && item.visitorId === record.visitorId
    && item.accountId === record.accountId
    && item.purpose === record.purpose
  ))
  const next = [{ ...record, updatedAt: new Date().toISOString() }, ...current]
  window.localStorage.setItem(consentStorageKey, JSON.stringify(next))
  return next[0]
}

export function readConsentRecords(): ConsentRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(consentStorageKey) || '[]') as ConsentRecord[]
    return Array.isArray(parsed) ? parsed.filter((item) => Boolean(item.agencyId && item.purpose && item.decision)) : []
  } catch {
    return []
  }
}

export function getOrCreateVisitorId(agencyId: string) {
  if (typeof window === 'undefined') return ''
  const key = `signatureDigitalVisitor:${agencyId}`
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const next = `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
  window.localStorage.setItem(key, next)
  return next
}

export function getLatestConsentRecord(agencyId: string, visitorId: string, purpose: ConsentPurpose) {
  return readConsentRecords().find((record) => record.agencyId === agencyId && record.visitorId === visitorId && record.purpose === purpose)
}

export const complianceTreatments = [
  {
    id: 'estimation',
    label: 'Demandes d estimation',
    data: 'Identite, coordonnees, informations sur le bien et projet de vente.',
    purpose: 'Traiter la demande et recontacter le prospect.',
    legalBasis: 'A confirmer par l agence.',
    recipients: 'Agence et prestataires techniques strictement necessaires.',
    retentionKey: 'estimationRequestsMonths',
  },
  {
    id: 'visit',
    label: 'Demandes de visite',
    data: 'Nom, email, telephone, message et bien concerne.',
    purpose: 'Organiser une visite et repondre aux questions.',
    legalBasis: 'A confirmer par l agence.',
    recipients: 'Agence et agent concerne.',
    retentionKey: 'visitRequestsMonths',
  },
  {
    id: 'contact',
    label: 'Contact et rappel',
    data: 'Nom, coordonnees et message.',
    purpose: 'Repondre a une demande entrante.',
    legalBasis: 'A confirmer par l agence.',
    recipients: 'Agence.',
    retentionKey: 'contactRequestsMonths',
  },
  {
    id: 'accounts',
    label: 'Comptes patron, agent et vendeur',
    data: 'Nom, email, role, statut du compte et liens d invitation.',
    purpose: 'Donner acces aux espaces prives autorises.',
    legalBasis: 'A confirmer par l agence.',
    recipients: 'Agence et utilisateurs invites.',
    retentionKey: 'accountDataMonths',
  },
  {
    id: 'documents',
    label: 'Documents et suivi metier',
    data: 'Documents, visites, rapports, offres et demandes rattaches a un bien.',
    purpose: 'Assurer le suivi immobilier et la relation vendeur/agence.',
    legalBasis: 'A confirmer par l agence.',
    recipients: 'Agence, vendeur et intervenants autorises.',
    retentionKey: 'documentsMonths',
  },
  {
    id: 'payments',
    label: 'Paiements Stripe',
    data: 'Identifiants techniques de session et statut de paiement. Aucune donnee bancaire stockee par Signature Digital.',
    purpose: 'Suivre l activation commerciale lorsque le paiement est branche.',
    legalBasis: 'A confirmer par l agence.',
    recipients: 'Stripe et Signature Digital pour le suivi technique.',
    retentionKey: 'paymentRecordsMonths',
  },
  {
    id: 'emails',
    label: 'Emails automatiques',
    data: 'Adresse email, contenu genere, statut d envoi et erreurs techniques.',
    purpose: 'Informer les prospects, clients et utilisateurs invites.',
    legalBasis: 'A confirmer par l agence.',
    recipients: 'Destinataires des emails et fournisseur d envoi configure.',
    retentionKey: 'emailLogsMonths',
  },
] as const
