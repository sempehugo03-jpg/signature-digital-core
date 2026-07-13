import type { RealEstateAgencyRuntime } from '../data/realEstateAgencyConfig'
import type { RealEstateProperty } from '../data/realEstateTemplate'
import { validateAgencyComplianceConfig } from './agencyCompliance'
import { validateAgencyLegalIdentity } from './agencyContactLegalIdentity'
import { createDefaultAgencyDomainConfig, resolveAgencyPublicUrls } from './agencyDomainSystem'
import { parseVisualBlueprintV1Result } from './visualBlueprint'

export type AgencySeoConfig = {
  title: string
  description: string
  favicon: string
  openGraphImage: string
  canonical: string
  robots: 'index,follow' | 'noindex,nofollow'
}

export type ProductionReadinessCheckStatus = 'passed' | 'warning' | 'blocked'

export type ProductionReadinessCheck = {
  id: string
  label: string
  status: ProductionReadinessCheckStatus
  detail: string
}

export type SitemapEntry = {
  loc: string
  priority: string
  changefreq: 'daily' | 'weekly' | 'monthly'
}

export type ProductionReadinessResult = {
  ready: boolean
  score: number
  checks: ProductionReadinessCheck[]
  warnings: string[]
  blockers: string[]
  seo: AgencySeoConfig
  sitemap: SitemapEntry[]
  robotsTxt: string
}

const fallbackFavicon = '/assets/signature-digital-logo.png'

export function resolveAgencySeoConfig(runtime: RealEstateAgencyRuntime): AgencySeoConfig {
  const { modelConfig, agencyConfig } = runtime
  const urls = resolveAgencyPublicUrls(modelConfig)
  const blueprint = parseVisualBlueprintV1Result(modelConfig.visualBlueprint)
  const description = [
    cleanText(blueprint.blueprint?.hero.subtitle),
    cleanText(modelConfig.heroSubtitle),
    cleanText(modelConfig.objective),
    modelConfig.city ? `Agence immobiliere a ${modelConfig.city}.` : '',
  ].find(Boolean) || `${modelConfig.agencyName} - plateforme immobiliere Signature Digital.`
  const favicon = cleanText(modelConfig.faviconUrl)
    || cleanText(agencyConfig.faviconUrl)
    || cleanText(blueprint.blueprint?.brand.logoUrl)
    || cleanText(modelConfig.logoUrl)
    || fallbackFavicon
  const openGraphImage = cleanText(blueprint.blueprint?.hero.imageUrl)
    || cleanText(agencyConfig.heroImage)
    || firstPropertyImage(agencyConfig.properties)
    || favicon
  const productionIndexable = modelConfig.mode === 'live'
    && modelConfig.status === 'active'
    && modelConfig.agencyKind !== 'internal-test'

  return {
    title: [modelConfig.agencyName, modelConfig.city, 'Immobilier'].filter(Boolean).join(' - '),
    description: truncate(description, 165),
    favicon,
    openGraphImage,
    canonical: urls.primaryUrl,
    robots: productionIndexable ? 'index,follow' : 'noindex,nofollow',
  }
}

export function applyAgencySeo(seo: AgencySeoConfig) {
  if (typeof document === 'undefined') return
  document.title = seo.title
  setMeta('name', 'description', seo.description)
  setMeta('name', 'robots', seo.robots)
  setMeta('property', 'og:title', seo.title)
  setMeta('property', 'og:description', seo.description)
  setMeta('property', 'og:image', seo.openGraphImage)
  setMeta('property', 'og:url', seo.canonical)
  setMeta('property', 'og:type', 'website')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', seo.title)
  setMeta('name', 'twitter:description', seo.description)
  setMeta('name', 'twitter:image', seo.openGraphImage)
  setCanonical(seo.canonical)
  setFavicon(seo.favicon)
}

export function resolveAgencySitemap(runtime: RealEstateAgencyRuntime): SitemapEntry[] {
  const baseUrl = stripTrailingSlash(resolveAgencyPublicUrls(runtime.modelConfig).primaryUrl)
  const entries: SitemapEntry[] = [
    { loc: baseUrl, priority: '1.0', changefreq: 'weekly' },
    { loc: `${baseUrl}/#contact`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${baseUrl}/mentions-legales`, priority: '0.3', changefreq: 'monthly' },
    { loc: `${baseUrl}/confidentialite`, priority: '0.3', changefreq: 'monthly' },
    { loc: `${baseUrl}/cookies`, priority: '0.3', changefreq: 'monthly' },
  ]

  if (runtime.modelConfig.enabledModules.publicProperties) {
    entries.push({ loc: `${baseUrl}/biens`, priority: '0.8', changefreq: 'weekly' })
  }

  if (runtime.modelConfig.enabledModules.propertyDetail) {
    runtime.agencyConfig.properties
      .filter((property) => cleanText(property.id))
      .forEach((property) => {
        entries.push({ loc: `${baseUrl}/bien/${encodeURIComponent(property.id)}`, priority: '0.7', changefreq: 'weekly' })
      })
  }

  return dedupeEntries(entries)
}

export function formatAgencySitemapXml(runtime: RealEstateAgencyRuntime) {
  const entries = resolveAgencySitemap(runtime)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
  ].join('\n')
}

export function resolveAgencyRobotsTxt(runtime: RealEstateAgencyRuntime) {
  const seo = resolveAgencySeoConfig(runtime)
  const sitemapUrl = `${stripTrailingSlash(resolveAgencyPublicUrls(runtime.modelConfig).primaryUrl)}/sitemap.xml`
  if (seo.robots === 'noindex,nofollow') {
    return [
      'User-agent: *',
      'Disallow: /',
      `Sitemap: ${sitemapUrl}`,
    ].join('\n')
  }

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /activation',
    'Disallow: /paiement',
    `Sitemap: ${sitemapUrl}`,
  ].join('\n')
}

export function resolveProductionReadiness(runtime: RealEstateAgencyRuntime): ProductionReadinessResult {
  const seo = resolveAgencySeoConfig(runtime)
  const sitemap = resolveAgencySitemap(runtime)
  const robotsTxt = resolveAgencyRobotsTxt(runtime)
  const { modelConfig } = runtime
  const domain = createDefaultAgencyDomainConfig(modelConfig.agencyId, modelConfig.agencySlug, modelConfig.domainConfig)
  const contact = validateAgencyLegalIdentity(modelConfig.contactLegalIdentity)
  const compliance = validateAgencyComplianceConfig(modelConfig.complianceConfig, modelConfig.contactLegalIdentity)
  const blueprint = parseVisualBlueprintV1Result(modelConfig.visualBlueprint)
  const checks: ProductionReadinessCheck[] = []

  checks.push(createCheck(
    'domain',
    'Domaine',
    domain.primaryDomain === 'custom' && domain.customDomain
      ? domain.status === 'verified' && domain.sslStatus === 'active'
        ? 'passed'
        : 'blocked'
      : 'warning',
    domain.primaryDomain === 'custom' && domain.customDomain
      ? domain.status === 'verified' && domain.sslStatus === 'active'
        ? `Domaine ${domain.customDomain} verifie avec SSL actif.`
        : `Domaine ${domain.customDomain} non pret : ${domain.status}, SSL ${domain.sslStatus}.`
      : 'Sous-domaine Signature Digital utilise comme URL de secours.',
  ))
  checks.push(createCheck(
    'contact',
    'Coordonnees',
    contact.missingRequiredFields.length ? 'blocked' : contact.warnings.length ? 'warning' : 'passed',
    contact.missingRequiredFields.length
      ? `Champs manquants : ${contact.missingRequiredFields.join(', ')}.`
      : contact.warnings.length ? contact.warnings.join(' ') : 'Coordonnees publiques et destinataires resolus.',
  ))
  checks.push(createCheck(
    'compliance',
    'Pages legales',
    compliance.approved ? 'passed' : modelConfig.mode === 'live' ? 'blocked' : 'warning',
    compliance.approved
      ? 'Documents legaux approuves.'
      : `Documents a verifier : ${modelConfig.complianceConfig.documentStatus}.`,
  ))
  checks.push(createCheck('seo', 'SEO', seo.title && seo.description && seo.canonical ? 'passed' : 'blocked', `Titre : ${seo.title}.`))
  checks.push(createCheck('favicon', 'Favicon', seo.favicon === fallbackFavicon ? 'warning' : 'passed', seo.favicon === fallbackFavicon ? 'Fallback Signature Digital utilise.' : 'Favicon agence resolu.'))
  checks.push(createCheck('sitemap', 'Sitemap', sitemap.length >= 5 ? 'passed' : 'blocked', `${sitemap.length} URL(s) exposees.`))
  checks.push(createCheck('robots', 'Robots', robotsTxt.includes('Sitemap:') ? 'passed' : 'blocked', seo.robots === 'index,follow' ? 'Production indexable.' : 'Demo ou test en noindex.'))
  checks.push(createCheck('blueprint', 'VisualBlueprint', blueprint.blueprint ? 'passed' : 'blocked', blueprint.blueprint ? 'Blueprint valide.' : 'Blueprint absent ou invalide.'))
  checks.push(createCheck(
    'ssl',
    'SSL',
    domain.primaryDomain === 'custom'
      ? domain.sslStatus === 'active' ? 'passed' : 'blocked'
      : 'warning',
    domain.primaryDomain === 'custom' ? `SSL ${domain.sslStatus}.` : 'SSL gere par le domaine Signature Digital de secours.',
  ))
  checks.push(createCheck(
    'cta',
    'CTA',
    cleanText(modelConfig.primaryCtaLabel) && (modelConfig.enabledModules.estimation || modelConfig.enabledModules.publicProperties)
      ? 'passed'
      : 'warning',
    cleanText(modelConfig.primaryCtaLabel)
      ? `CTA principal : ${modelConfig.primaryCtaLabel}.`
      : 'CTA principal a confirmer.',
  ))

  const blockers = checks.filter((check) => check.status === 'blocked').map((check) => `${check.label}: ${check.detail}`)
  const warnings = checks.filter((check) => check.status === 'warning').map((check) => `${check.label}: ${check.detail}`)
  const score = Math.round((checks.filter((check) => check.status === 'passed').length / checks.length) * 100)

  return {
    ready: blockers.length === 0,
    score,
    checks,
    warnings,
    blockers,
    seo,
    sitemap,
    robotsTxt,
  }
}

function createCheck(id: string, label: string, status: ProductionReadinessCheckStatus, detail: string): ProductionReadinessCheck {
  return { id, label, status, detail }
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`
  const existing = document.head.querySelector<HTMLMetaElement>(selector)
  const element = existing || document.createElement('meta')
  element.setAttribute(attribute, key)
  element.setAttribute('content', content)
  if (!existing) document.head.appendChild(element)
}

function setCanonical(href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  const element = existing || document.createElement('link')
  element.rel = 'canonical'
  element.href = href
  if (!existing) document.head.appendChild(element)
}

function setFavicon(href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
  const element = existing || document.createElement('link')
  element.rel = 'icon'
  element.href = href
  if (!existing) document.head.appendChild(element)
}

function firstPropertyImage(properties: RealEstateProperty[]) {
  return properties.find((property) => cleanText(property.imageUrl))?.imageUrl || ''
}

function dedupeEntries(entries: SitemapEntry[]) {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) return false
    seen.add(entry.loc)
    return true
  })
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function cleanText(value?: string) {
  return typeof value === 'string' ? value.trim() : ''
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3).trim()}...` : value
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
