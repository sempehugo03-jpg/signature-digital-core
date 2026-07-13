export type AgencyDomainStatus =
  | 'not-configured'
  | 'pending-dns'
  | 'verifying'
  | 'verified'
  | 'error'
  | 'disabled'

export type AgencySslStatus = 'pending' | 'active' | 'error'
export type AgencyDomainPrimary = 'default' | 'custom'
export type AgencyDomainRedirectMode = 'custom-to-default' | 'default-to-custom' | 'none'

export type AgencyDomainVerification = {
  method: 'manual'
  checkedAt?: string
  notes?: string
}

export type AgencyDomainConfig = {
  agencyId: string
  defaultSubdomain: string
  customDomain?: string
  primaryDomain: AgencyDomainPrimary
  status: AgencyDomainStatus
  verification: AgencyDomainVerification
  sslStatus: AgencySslStatus
  redirectMode: AgencyDomainRedirectMode
  createdAt: string
  updatedAt: string
}

export type AgencyPublicUrls = {
  defaultUrl: string
  customUrl: string
  primaryUrl: string
  activationUrl: string
  fallbackUrl: string
}

export type DomainDnsInstruction = {
  label: string
  type: 'A' | 'ALIAS' | 'CNAME'
  host: string
  value: string
  note: string
}

export type DomainValidationResult = {
  valid: boolean
  domain: string
  error?: string
}

export type AgencyDomainOwner = {
  agencyId: string
  agencySlug: string
  domainConfig?: AgencyDomainConfig
}

const localhostNames = new Set(['localhost', 'local', 'test', 'invalid', 'example'])

export function createDefaultAgencyDomainConfig(
  agencyId: string,
  agencySlug: string,
  existing?: Partial<AgencyDomainConfig>,
): AgencyDomainConfig {
  const now = new Date().toISOString()
  const customDomain = normalizeCustomDomain(existing?.customDomain ?? '')
  const status = customDomain
    ? normalizeDomainStatus(existing?.status) ?? 'pending-dns'
    : 'not-configured'

  return {
    agencyId,
    defaultSubdomain: normalizeDefaultSubdomain(existing?.defaultSubdomain || agencySlug),
    customDomain: customDomain || undefined,
    primaryDomain: customDomain ? normalizePrimaryDomain(existing?.primaryDomain) : 'default',
    status,
    verification: {
      method: 'manual',
      checkedAt: existing?.verification?.checkedAt,
      notes: existing?.verification?.notes,
    },
    sslStatus: customDomain ? normalizeSslStatus(existing?.sslStatus) ?? 'pending' : 'pending',
    redirectMode: normalizeRedirectMode(existing?.redirectMode) ?? 'none',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
}

export function resolveAgencyPublicUrls(
  agency: AgencyDomainOwner,
  activationToken?: string,
): AgencyPublicUrls {
  const config = createDefaultAgencyDomainConfig(agency.agencyId, agency.agencySlug, agency.domainConfig)
  const publicAppUrl = getPublicAppUrl()
  const defaultUrl = `${publicAppUrl}/demo/${agency.agencySlug}`
  const customUrl = config.customDomain ? `https://${config.customDomain}` : ''
  const hasVerifiedCustomDomain = Boolean(customUrl && config.status === 'verified' && config.sslStatus === 'active')
  const primaryUrl = hasVerifiedCustomDomain && config.primaryDomain === 'custom' ? customUrl : defaultUrl
  const activationId = activationToken || agency.agencySlug

  return {
    defaultUrl,
    customUrl,
    primaryUrl,
    activationUrl: `${stripTrailingSlash(primaryUrl)}/activation/${activationId}`,
    fallbackUrl: defaultUrl,
  }
}

export function resolveAgencyByHostname<T extends AgencyDomainOwner>(
  hostname: string,
  agencies: T[],
): T | undefined {
  const normalizedHostname = normalizeCustomDomain(hostname)
  if (!normalizedHostname) return undefined

  return agencies.find((agency) => {
    const config = createDefaultAgencyDomainConfig(agency.agencyId, agency.agencySlug, agency.domainConfig)
    return config.customDomain === normalizedHostname &&
      config.status === 'verified' &&
      config.sslStatus === 'active'
  })
}

export function normalizeCustomDomain(value: string) {
  const trimmed = String(value || '').trim().toLowerCase()
  if (!trimmed) return ''

  const withoutProtocol = trimmed.replace(/^https?:\/\//, '')
  const hostname = withoutProtocol.split('/')[0]?.replace(/:\d+$/, '').replace(/\.$/, '') ?? ''

  return hostname
}

export function validateCustomDomain(
  value: string,
  agencies: AgencyDomainOwner[],
  currentAgencyId: string,
): DomainValidationResult {
  const rawValue = value.trim()
  const domain = normalizeCustomDomain(value)
  if (!domain) return { valid: true, domain: '' }
  if (rawValue.replace(/^https?:\/\//i, '').includes('/')) {
    return { valid: false, domain, error: 'Le domaine ne doit pas contenir de chemin.' }
  }
  if (!isValidHostname(domain)) return { valid: false, domain, error: 'Domaine invalide.' }
  if (isLocalDomain(domain)) return { valid: false, domain, error: 'Les domaines locaux ne sont pas acceptes.' }
  if (isIpAddress(domain)) return { valid: false, domain, error: 'Les adresses IP ne sont pas acceptées comme domaine agence.' }

  const duplicate = agencies.find((agency) => {
    if (agency.agencyId === currentAgencyId) return false
    const config = createDefaultAgencyDomainConfig(agency.agencyId, agency.agencySlug, agency.domainConfig)
    return config.customDomain === domain
  })
  if (duplicate) return { valid: false, domain, error: 'Ce domaine est deja utilise par une autre agence.' }

  return { valid: true, domain }
}

export function createDnsInstructions(config: AgencyDomainConfig): DomainDnsInstruction[] {
  if (!config.customDomain) return []

  const isSubdomain = config.customDomain.split('.').length > 2
  const cnameTarget = getCustomDomainCnameTarget()
  const apexTarget = getCustomDomainApexTarget()

  if (isSubdomain) {
    return [{
      label: 'Sous-domaine',
      type: 'CNAME',
      host: config.customDomain.split('.')[0],
      value: cnameTarget || 'CUSTOM_DOMAIN_CNAME_TARGET non configure',
      note: 'A ajouter chez le fournisseur DNS du client. Signature Digital ne modifie pas les DNS automatiquement.',
    }]
  }

  return [
    {
      label: 'Domaine racine',
      type: 'A',
      host: '@',
      value: apexTarget || 'CUSTOM_DOMAIN_APEX_TARGET non configure',
      note: 'Utiliser A ou ALIAS selon les capacites du fournisseur DNS.',
    },
    {
      label: 'www',
      type: 'CNAME',
      host: 'www',
      value: cnameTarget || 'CUSTOM_DOMAIN_CNAME_TARGET non configure',
      note: 'Optionnel mais recommande pour rediriger www vers le domaine principal.',
    },
  ]
}

export function markDomainVerificationStatus(config: AgencyDomainConfig, status: AgencyDomainStatus): AgencyDomainConfig {
  const now = new Date().toISOString()
  return {
    ...config,
    status,
    sslStatus: status === 'verified' ? 'active' : status === 'error' ? 'error' : config.sslStatus,
    verification: {
      ...config.verification,
      checkedAt: now,
    },
    primaryDomain: status === 'verified' ? config.primaryDomain : 'default',
    updatedAt: now,
  }
}

export function disableCustomDomain(config: AgencyDomainConfig): AgencyDomainConfig {
  return {
    ...config,
    status: 'disabled',
    primaryDomain: 'default',
    redirectMode: 'custom-to-default',
    updatedAt: new Date().toISOString(),
  }
}

function getPublicAppUrl() {
  const env = import.meta.env as Record<string, string | undefined>
  const configured = env.VITE_PUBLIC_APP_URL || env.PUBLIC_APP_URL
  if (configured) return stripTrailingSlash(configured)
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin
  return 'https://signature-digital.fr'
}

function getCustomDomainCnameTarget() {
  const env = import.meta.env as Record<string, string | undefined>
  return env.VITE_CUSTOM_DOMAIN_CNAME_TARGET || env.CUSTOM_DOMAIN_CNAME_TARGET || ''
}

function getCustomDomainApexTarget() {
  const env = import.meta.env as Record<string, string | undefined>
  return env.VITE_CUSTOM_DOMAIN_APEX_TARGET || env.CUSTOM_DOMAIN_APEX_TARGET || ''
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizeDefaultSubdomain(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
}

function normalizeDomainStatus(value?: string): AgencyDomainStatus | undefined {
  return ['not-configured', 'pending-dns', 'verifying', 'verified', 'error', 'disabled'].includes(String(value))
    ? value as AgencyDomainStatus
    : undefined
}

function normalizeSslStatus(value?: string): AgencySslStatus | undefined {
  return ['pending', 'active', 'error'].includes(String(value)) ? value as AgencySslStatus : undefined
}

function normalizePrimaryDomain(value?: string): AgencyDomainPrimary {
  return value === 'custom' ? 'custom' : 'default'
}

function normalizeRedirectMode(value?: string): AgencyDomainRedirectMode | undefined {
  return ['custom-to-default', 'default-to-custom', 'none'].includes(String(value))
    ? value as AgencyDomainRedirectMode
    : undefined
}

function isValidHostname(hostname: string) {
  if (hostname.length > 253) return false
  if (!hostname.includes('.')) return false
  return hostname.split('.').every((label) => (
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  ))
}

function isLocalDomain(hostname: string) {
  const parts = hostname.split('.')
  const tld = parts[parts.length - 1]
  return localhostNames.has(hostname) || localhostNames.has(tld)
}

function isIpAddress(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')
}
