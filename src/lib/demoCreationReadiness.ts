import type { Project } from '../data/projectStore'
import type { RealEstateProperty } from '../data/realEstateTemplate'
import { normalizeAgencySlug } from '../data/realEstateAgencyConfig'
import { resolveProjectLovableOutput } from './lovableOutput'
import { resolveProjectVisualConfiguration } from './projectVisualConfiguration'
import { resolveProjectClientBrief } from '../types/clientBrief'

export type DemoCreationReadiness = {
  ready: boolean
  blockers: string[]
  warnings: string[]
  summary: {
    identity: 'ready' | 'incomplete'
    blueprint: 'validated' | 'invalid'
    visualPack: 'available' | 'partial' | 'missing'
    listingsReady: number
    listingsTotal: number
    modulesActive: number
    unsupportedCapabilities: number
  }
}

export type DemoCreationReadinessOptions = {
  agencyName?: string
  agencySlug?: string
  visualBlueprint?: string
  importedProperties?: RealEstateProperty[]
  modulesEnabled?: string[]
}

export function resolveDemoCreationReadiness(
  project: Project,
  options: DemoCreationReadinessOptions = {},
): DemoCreationReadiness {
  const clientBrief = resolveProjectClientBrief(project)
  const agencyName = cleanText(options.agencyName ?? clientBrief.agency.companyName)
  const agencySlug = normalizeAgencySlug(options.agencySlug ?? agencyName)
  const visualBlueprint = cleanText(options.visualBlueprint ?? project.visualBlueprint)
  const visualConfiguration = resolveProjectVisualConfiguration({
    ...project,
    visualBlueprint,
  })
  const lovableOutput = resolveProjectLovableOutput(project)
  const importedProperties = options.importedProperties ?? project.importedProperties ?? []
  const modulesEnabled = options.modulesEnabled ?? project.modulesEnabled ?? []
  const readyListings = importedProperties.filter((property) => property.listingReviewStatus === 'ready')
  const blockers: string[] = []
  const warnings: string[] = []

  if (!agencyName || !agencySlug) {
    blockers.push("Identite agence incomplete : nom et slug sont obligatoires.")
  }

  if (!visualConfiguration.blueprintValid) {
    blockers.push('VisualBlueprint valide requis avant creation de la demo moteur.')
  }

  if (importedProperties.length > 0 && readyListings.length !== importedProperties.length) {
    blockers.push('Toutes les annonces ajoutees doivent etre marquees pretes.')
  }

  if (!modulesEnabled.length) {
    blockers.push('Aucun module metier resolu pour la demo moteur.')
  }

  warnings.push(...visualConfiguration.warnings)

  if (!importedProperties.length) {
    warnings.push('Aucune annonce fournie : la demo utilisera les donnees de fallback du moteur.')
  }

  if (lovableOutput.unsupportedCapabilities.length) {
    warnings.push(`${lovableOutput.unsupportedCapabilities.length} capacite(s) non supportee(s) signalee(s) par Lovable.`)
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    summary: {
      identity: agencyName && agencySlug ? 'ready' : 'incomplete',
      blueprint: visualConfiguration.blueprintValid ? 'validated' : 'invalid',
      visualPack: getVisualPackStatus(lovableOutput),
      listingsReady: readyListings.length,
      listingsTotal: importedProperties.length,
      modulesActive: modulesEnabled.length,
      unsupportedCapabilities: lovableOutput.unsupportedCapabilities.length,
    },
  }
}

function getVisualPackStatus(output: ReturnType<typeof resolveProjectLovableOutput>): DemoCreationReadiness['summary']['visualPack'] {
  const colorCount = Object.values(output.visualPack.colors).filter(Boolean).length
  const hasTypography = Boolean(output.visualPack.typography.heading || output.visualPack.typography.body)
  const hasLogo = Boolean(output.visualPack.logoUrl || output.visualPack.logo.url)
  const hasImages = Boolean(output.visualPack.heroImageUrl || output.visualPack.homeImages.length || output.visualPack.sectionImages.length)

  if (hasLogo && colorCount >= 2 && hasTypography && hasImages) return 'available'
  if (hasLogo || colorCount > 0 || hasTypography || hasImages) return 'partial'
  return 'missing'
}

function cleanText(value: string | undefined): string {
  return (value ?? '').trim()
}
