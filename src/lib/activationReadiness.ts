import type { Project } from '../data/projectStore'
import type { RealEstateAgencyRuntime } from '../data/realEstateAgencyConfig'
import { parseVisualBlueprintV1Result } from './visualBlueprint'

export type ActivationReadiness = {
  ready: boolean
  blockers: string[]
  warnings: string[]
}

export function resolveActivationReadiness(project: Project, agency: RealEstateAgencyRuntime | undefined): ActivationReadiness {
  const blockers: string[] = []
  const warnings: string[] = []
  const hasListings = (project.importedProperties ?? []).length > 0
  const listingsReady = !hasListings || project.importedProperties.every((property) => property.listingReviewStatus === 'ready')
  const enabledModules = agency?.modelConfig.enabledModules
  const moduleCount = enabledModules ? Object.values(enabledModules).filter(Boolean).length : 0

  if (!agency || !project.generatedAgencyId) {
    blockers.push('Agence moteur non creee.')
  }

  if (project.demoReviewStatus !== 'ready-to-send') {
    blockers.push('Controle avant envoi non valide.')
  }

  if (project.status !== 'approved' && project.status !== 'activated') {
    blockers.push('Validation commerciale client requise.')
  }

  if (!parseVisualBlueprintV1Result(project.visualBlueprint).blueprint) {
    blockers.push('VisualBlueprint valide requis.')
  }

  if (!listingsReady) {
    blockers.push('Les annonces ajoutees doivent etre validees.')
  }

  if (!moduleCount) {
    blockers.push('Aucun module actif sur l agence.')
  }

  if (!agency?.modelConfig.logoUrl) {
    warnings.push('Logo absent : facultatif pour activer.')
  }

  if (!project.lovableOutput?.visualPack.homeImages.length) {
    warnings.push('Photos home absentes : facultatif pour activer.')
  }

  if (!hasListings) {
    warnings.push('Aucune annonce fournie : activation autorisee avec les donnees fallback du moteur.')
  }

  if (agency?.modelConfig.status === 'paused') {
    warnings.push('Agence actuellement en pause : activation technique passera le statut agence a active.')
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  }
}
