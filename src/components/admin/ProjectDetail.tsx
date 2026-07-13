import { useMemo, useState } from 'react'
import type { DemoReviewStatus, ListingImportStatus, Project } from '../../data/projectStore'
import { getProjectSourceAdminLabel, isValidExternalUrl, normalizeLovableUrl, projectStatusLabels } from '../../data/projectStore'
import type { RealEstateProperty } from '../../data/realEstateTemplate'
import {
  canManageRealEstateAgency,
  getDefaultRealEstateEnabledModules,
  getRealEstateAgencyRuntimeBySlug,
  listRealEstateAgencyRuntimes,
  normalizeAgencySlug,
  saveRealEstateAgencyConfig,
  updateRealEstateAgencyStatus,
  type DuplicateRealEstateAgencyInput,
  type RealEstateAgencyMode,
  type RealEstateAgencyRuntime,
  type RealEstateAgencyStatus,
  type RealEstateEnabledModules,
  type RealEstateHeroVariant,
  type RealEstateThemePreset,
} from '../../data/realEstateAgencyConfig'
import { extractPropertyFromUrl, type ExtractedPropertyDraft } from '../../lib/propertyUrlExtractor'
import { generateLovablePromptFromProject } from '../../lib/lovablePrompt'
import { resolveDemoCreationReadiness } from '../../lib/demoCreationReadiness'
import { resolveDemoReviewReadiness } from '../../lib/demoReviewReadiness'
import { resolveActivationReadiness } from '../../lib/activationReadiness'
import {
  formatLovableOutputExample,
  parseLovableOutput,
  resolveProjectLovableOutput,
  type LovableDemoOutput,
  type LovableOutputParseResult,
} from '../../lib/lovableOutput'
import { parseVisualBlueprintV1, parseVisualBlueprintV1Result, type VisualBlueprintDiagnostic } from '../../lib/visualBlueprint'
import { resolveProjectClientBrief } from '../../types/clientBrief'
import { Button, Card, SectionTitle, StatusBadge, TextArea, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

type AgencyFormState = {
  agencyName: string
  city: string
  agencySlug: string
  email: string
  phone: string
  address: string
  websiteUrl: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  painPoint: string
  objective: string
  desiredFeeling: string
  visualStyle: string
  variant: string
  themePreset: RealEstateThemePreset
  heroVariant: RealEstateHeroVariant
  heroTitle: string
  heroSubtitle: string
  primaryCtaLabel: string
  sectionOrder: string
  visualBlueprint: string
  importedProperties: RealEstateProperty[]
  mode: RealEstateAgencyMode
  status: RealEstateAgencyStatus
  enabledModules: RealEstateEnabledModules
}

type PropertyUrlFormState = Omit<ExtractedPropertyDraft, 'gallery'> & {
  gallery: string
}

const moduleLabels: Array<[keyof RealEstateEnabledModules, string]> = [
  ['estimation', 'Estimation'],
  ['sellerSpace', 'Espace vendeur'],
  ['agentSpace', 'Espace agent'],
  ['ownerSpace', 'Espace patron'],
  ['publicProperties', 'Biens publics'],
  ['propertyDetail', 'Fiche bien'],
  ['visits', 'Visites'],
  ['documents', 'Documents'],
  ['offers', 'Offres'],
  ['reports', 'Comptes rendus'],
  ['teamPage', 'Equipe'],
  ['soldProperties', 'Biens vendus'],
  ['rentalPage', 'Location'],
  ['blog', 'Blog'],
  ['reviews', 'Avis'],
]

const themePresetValues: RealEstateThemePreset[] = ['luxury_dark', 'premium_light', 'local_trust', 'modern_minimal']
const heroVariantValues: RealEstateHeroVariant[] = ['premium', 'trust', 'estimation', 'local']
const modeValues: RealEstateAgencyMode[] = ['demo', 'live']
const statusValues: RealEstateAgencyStatus[] = ['demo_ready', 'active', 'paused', 'archived']

const heroVariantAliases: Record<string, RealEstateHeroVariant> = {
  premium: 'premium',
  editorial: 'premium',
  editorial_premium: 'premium',
  trust: 'trust',
  confiance: 'trust',
  estimation: 'estimation',
  local: 'local',
}

const demoReviewCheckLegacyIds: Record<string, string[]> = {
  'identity-content-quality': ['hero-quality', 'texts-images-contrast', 'overall-impression'],
  'public-responsive-quality': ['navigation-quality', 'sections-quality', 'property-cards-quality', 'mobile-rendering'],
  'business-paths-quality': ['private-workspaces-quality'],
}

const visualBlueprintPlaceholder = `VisualBlueprint:
  version: v1
  brand:
    logoUrl: "https://..."
    primaryColor: "#0B1E4F"
    accentColor: "#D9B52C"
  hero:
    layout: premium
    title: "Vendez votre bien avec une agence qui inspire confiance."
    subtitle: "Une experience immobiliere premium pensee pour rendre votre accompagnement evident."
    cta: "Estimer mon bien"
  sections:
    sectionOrder: hero,properties,trust,estimation,contact`

export function ProjectDetail({
  project,
  onNavigate,
  onUpdate,
}: {
  project: Project
  onNavigate: Navigate
  onUpdate: (updates: Partial<Project>) => void
}) {
  const linkedAgency = useMemo(
    () => project.generatedAgencyId ? getRealEstateAgencyRuntimeBySlug(project.generatedAgencyId) : undefined,
    [project.generatedAgencyId],
  )
  const [form, setForm] = useState<AgencyFormState>(() => createAgencyFormFromProject(project, linkedAgency))
  const [visualBlueprint, setVisualBlueprint] = useState(form.visualBlueprint)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [lovableLink, setLovableLink] = useState(project.lovableLink)
  const [lovableLinkNotice, setLovableLinkNotice] = useState('')
  const [lovableLinkError, setLovableLinkError] = useState('')
  const [lovableOutputRaw, setLovableOutputRaw] = useState('')
  const [lovableOutputResult, setLovableOutputResult] = useState<LovableOutputParseResult | null>(null)
  const [lovableOutputNotice, setLovableOutputNotice] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedDemoLink, setCopiedDemoLink] = useState(false)
  const [showTechnicalBlueprint, setShowTechnicalBlueprint] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [propertyUrl, setPropertyUrl] = useState('')
  const [propertyUrlDraft, setPropertyUrlDraft] = useState<PropertyUrlFormState | null>(null)
  const [propertyUrlNotice, setPropertyUrlNotice] = useState('')
  const [listingImportStatus, setListingImportStatus] = useState<ListingImportStatus>(project.listingImportStatus)
  const [isAnalyzingPropertyUrl, setIsAnalyzingPropertyUrl] = useState(false)
  const clientBrief = useMemo(() => resolveProjectClientBrief(project), [project])
  const resolvedLovableOutput = useMemo(() => resolveProjectLovableOutput(project), [project])
  const currentLovableOutput = lovableOutputResult?.output ?? resolvedLovableOutput
  const currentLovableOutputDiagnostics = lovableOutputResult?.diagnostics ?? currentLovableOutput.diagnostics
  const normalizedAgencySlug = normalizeAgencySlug(project.generatedAgencyId || form.agencySlug)
  const publicRoute = `/demo/${normalizedAgencySlug}`
  const lovablePrompt = useMemo(() => generateLovablePromptFromProject(project), [project])
  const hasLinkedAgency = Boolean(project.generatedAgencyId && linkedAgency)
  const targetAgency = normalizedAgencySlug ? getRealEstateAgencyRuntimeBySlug(normalizedAgencySlug) : undefined
  const willUpdateExistingAgency = Boolean(targetAgency && canManageRealEstateAgency(normalizedAgencySlug))
  const demoRoute = publicRoute
  const normalizedLovableLink = normalizeLovableUrl(lovableLink)
  const projectModulesEnabled = useMemo(() => mergeProjectModules(form.enabledModules, project.modulesEnabled), [form.enabledModules, project.modulesEnabled])
  const enabledProjectModuleKeys = useMemo(() => Object.keys(projectModulesEnabled).filter((key) => projectModulesEnabled[key as keyof RealEstateEnabledModules]), [projectModulesEnabled])
  const demoReadiness = useMemo(() => resolveDemoCreationReadiness(project, {
    agencyName: form.agencyName,
    agencySlug: project.generatedAgencyId || form.agencySlug,
    visualBlueprint: form.visualBlueprint,
    importedProperties: form.importedProperties,
    modulesEnabled: enabledProjectModuleKeys,
  }), [enabledProjectModuleKeys, form.agencyName, form.agencySlug, form.importedProperties, form.visualBlueprint, project])
  const demoReviewReadiness = useMemo(() => resolveDemoReviewReadiness(project, linkedAgency), [linkedAgency, project])
  const activationReadiness = useMemo(() => resolveActivationReadiness(project, linkedAgency), [linkedAgency, project])
  const lovableOutputStatus = lovableOutputResult
    ? getLovableOutputStatus(lovableOutputResult)
    : project.lovableOutputStatus

  function updateForm<K extends keyof AgencyFormState>(key: K, value: AgencyFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setNotice('')
    setError('')
  }

  async function copyPrompt() {
    await navigator.clipboard?.writeText(lovablePrompt.prompt).catch(() => undefined)
    setCopiedPrompt(true)
    window.setTimeout(() => setCopiedPrompt(false), 2200)
  }

  async function copyDemoLink() {
    await navigator.clipboard?.writeText(window.location.origin ? `${window.location.origin}${demoRoute}` : demoRoute).catch(() => undefined)
    setCopiedDemoLink(true)
    window.setTimeout(() => setCopiedDemoLink(false), 2200)
  }

  function toggleDemoReviewCheck(checkId: string, checked: boolean) {
    const nextChecks = checked
      ? [...new Set([...project.demoReviewChecks, checkId])]
      : project.demoReviewChecks.filter((item) => item !== checkId && !demoReviewCheckLegacyIds[checkId]?.includes(item))
    onUpdate({
      demoReviewChecks: nextChecks,
      demoReviewStatus: 'review-required',
      demoReviewedAt: '',
      nextAction: 'Terminer le controle avant envoi client.',
    })
  }

  function prepareClientLink() {
    if (!demoReviewReadiness.ready || !project.generatedAgencyId) return
    onUpdate({
      status: 'client-review',
      demoReviewStatus: 'ready-to-send',
      demoReviewedAt: new Date().toISOString(),
      liveRepoLink: demoRoute,
      lastClientAction: 'Lien client prepare',
      nextAction: 'Lien client pret. Le transmettre au client puis attendre son retour.',
    })
    setNotice('Lien client prepare. Aucun email automatique envoye.')
    setError('')
  }

  function approveClientDemo() {
    if (!project.generatedAgencyId) return
    onUpdate({
      status: 'approved',
      lovableDemoStatus: 'validée',
      lastClientAction: 'Demo validee par le client',
      nextAction: 'Creer les acces puis activer techniquement l agence.',
    })
  }

  function requestClientChanges() {
    onUpdate({
      status: 'changes-required',
      demoReviewStatus: 'changes-required',
      lovableDemoStatus: 'refusée',
      lastClientAction: 'Modifications demandees',
      nextAction: 'Conserver les donnees et corriger la demo avant nouvel envoi.',
    })
  }

  function createClientAccess() {
    if (project.status !== 'approved') return
    onUpdate({
      clientSpaceCreated: true,
      clientEmailConfirmed: true,
      nextAction: 'Acces crees. Activer techniquement l agence.',
    })
  }

  function activateAgency() {
    if (!activationReadiness.ready || !project.generatedAgencyId) return
    const runtime = updateRealEstateAgencyStatus(project.generatedAgencyId, 'active')
    if (!runtime) {
      setError("Impossible d'activer l'agence technique.")
      return
    }

    onUpdate({
      status: 'activated',
      technicalStatus: 'active',
      clientSpaceCreated: true,
      clientEmailConfirmed: true,
      liveRepoLink: runtime.routes.public,
      nextAction: 'Agence active. Suivre les premiers retours client.',
    })
    setForm(createAgencyFormFromProject(project, runtime))
    setNotice('Agence active.')
    setError('')
  }

  function saveLovableLink() {
    const normalized = normalizeLovableUrl(lovableLink)
    if (normalized && !isValidExternalUrl(normalized)) {
      setLovableLinkError('Ajoutez un lien Lovable valide commençant par https://')
      setLovableLinkNotice('')
      return
    }

    setLovableLink(normalized)
    setLovableLinkError('')
    setLovableLinkNotice(normalized ? 'Lien Lovable enregistré.' : 'Lien Lovable supprimé.')
    onUpdate({
      lovableLink: normalized,
      nextAction: normalized ? 'Modifier et valider la démo dans Lovable.' : 'Coller le lien Lovable après création de la maquette.',
    })
  }

  function openLovableLink() {
    if (!normalizedLovableLink || !isValidExternalUrl(normalizedLovableLink)) return
    window.open(normalizedLovableLink, '_blank', 'noopener,noreferrer')
  }

  function interpretAndValidateLovableOutput() {
    const result = parseLovableOutput(lovableOutputRaw)
    const nextLovableLink = result.output.demo.url || project.lovableLink
    const nextDemoAssets = mergeLovableOutputIntoDemoAssets(project.demoAssets, result.output)
    const blueprintRaw = result.output.visualBlueprint.raw.trim()
    const blueprintResult = parseVisualBlueprintV1Result(blueprintRaw)
    const blockingDiagnostics = getBlockingLovableDiagnostics(result, blueprintResult.diagnostics)
    const warningCount = getLovableWarningCount(result, blueprintResult.diagnostics)
    const canAutoValidate = Boolean(blueprintRaw && result.output.visualBlueprint.normalized && blueprintResult.blueprint)
      && blockingDiagnostics.length === 0
    const nextStatus: Project['lovableOutputStatus'] = canAutoValidate ? 'validated' : 'invalid'
    const nextOutput: LovableDemoOutput = {
      ...result.output,
      visualBlueprint: {
        ...result.output.visualBlueprint,
        normalized: blueprintResult.blueprint,
        diagnostics: blueprintResult.diagnostics,
      },
    }

    setLovableOutputResult({
      output: nextOutput,
      diagnostics: result.diagnostics,
    })
    setLovableOutputNotice(
      canAutoValidate
        ? warningCount
          ? `Retour Lovable valide avec ${warningCount} warning(s).`
          : 'Retour Lovable interprete et VisualBlueprint valide.'
        : 'Retour Lovable invalide : corrigez les erreurs bloquantes.',
    )

    if (result.output.demo.url) {
      setLovableLink(result.output.demo.url)
    }

    if (blueprintRaw) {
      setVisualBlueprint(blueprintRaw)
      const updates = parseVisualBlueprint(blueprintRaw)
      setForm((current) => ({
        ...current,
        ...updates,
        visualBlueprint: canAutoValidate ? blueprintRaw : current.visualBlueprint,
      }))
    }
    onUpdate({
      lovableOutput: nextOutput,
      lovableLink: nextLovableLink,
      demoAssets: nextDemoAssets,
      lovableOutputStatus: nextStatus,
      visualBlueprint: canAutoValidate ? blueprintRaw : project.visualBlueprint,
      nextAction: nextStatus === 'invalid'
        ? 'Corriger le retour Lovable avant validation du VisualBlueprint.'
        : hasLinkedAgency || willUpdateExistingAgency
          ? 'Previsualiser la demo moteur existante avec le Blueprint valide.'
          : "Le Blueprint est valide. L'agence sera creee a l'etape suivante.",
    })
  }

  function interpretVisualBlueprint() {
    const blueprintResult = parseVisualBlueprintV1Result(visualBlueprint)
    const updates = parseVisualBlueprint(visualBlueprint)
    const nextStatus: Project['lovableOutputStatus'] = project.lovableOutput ? 'parsed' : blueprintResult.blueprint ? 'validated' : 'invalid'
    setForm((current) => ({ ...current, ...updates, visualBlueprint }))
    onUpdate({
      visualBlueprint: visualBlueprint.trim(),
      lovableOutputStatus: nextStatus,
      demoReviewStatus: project.demoReviewStatus === 'ready-to-send' ? 'review-required' : project.demoReviewStatus,
      nextAction: project.lovableOutput
        ? 'Blueprint technique modifie : revalider le retour Lovable avant creation.'
        : 'Blueprint technique interprete pour compatibilite ancien projet.',
    })
    setNotice(Object.keys(updates).length ? 'Visual Blueprint technique interprete.' : 'Aucun champ compatible trouve.')
    setError('')
  }

  function updateTechnicalVisualBlueprint(value: string) {
    setVisualBlueprint(value)
    setForm((current) => ({ ...current, visualBlueprint: value }))
    if (project.lovableOutputStatus === 'validated') {
      onUpdate({
        visualBlueprint: value,
        lovableOutputStatus: 'parsed',
        demoReviewStatus: project.demoReviewStatus === 'ready-to-send' ? 'review-required' : project.demoReviewStatus,
        nextAction: 'Blueprint technique modifie : revalider le retour Lovable avant creation.',
      })
    }
  }

  async function analyzePropertyUrl() {
    setIsAnalyzingPropertyUrl(true)
    setPropertyUrlNotice('')
    setListingImportStatus('importing')
    onUpdate({
      listingImportStatus: 'importing',
      nextAction: 'Analyser et controler les annonces de la demo.',
    })

    try {
      const draft = await extractPropertyFromUrl(propertyUrl)
      setPropertyUrlDraft(createPropertyUrlFormState(draft))
      setListingImportStatus('review-required')
      setPropertyUrlNotice(
        draft.extractionStatus === 'empty'
          ? 'Extraction impossible depuis cette URL. Vous pouvez remplir les champs manuellement.'
          : 'Extraction partielle : vérifiez les champs avant d’ajouter le bien.',
      )
      onUpdate({
        listingImportStatus: 'review-required',
        nextAction: 'Verifier les donnees recuperees puis ajouter l annonce au projet.',
      })
      setError('')
    } catch {
      setPropertyUrlDraft(null)
      setPropertyUrlNotice('')
      setListingImportStatus('error')
      onUpdate({
        listingImportStatus: 'error',
        nextAction: 'Corriger l URL d annonce ou saisir les donnees manuellement.',
      })
      setError('Ajoutez une URL d annonce valide.')
    } finally {
      setIsAnalyzingPropertyUrl(false)
    }
  }

  function updatePropertyUrlDraft<K extends keyof PropertyUrlFormState>(key: K, value: PropertyUrlFormState[K]) {
    if (!propertyUrlDraft) return
    setPropertyUrlDraft({ ...propertyUrlDraft, [key]: value })
  }

  function addPropertyUrlDraft() {
    if (!propertyUrlDraft) return
    const agencySlug = normalizeAgencySlug(form.agencySlug || form.agencyName)
    const property = createImportedProperty(propertyUrlFormToPropertyRow(propertyUrlDraft), agencySlug, form.importedProperties.length)
    const nextProperties = [...form.importedProperties, property]
    setForm((current) => ({
      ...current,
      agencySlug,
      importedProperties: nextProperties,
    }))
    setPropertyUrl('')
    setPropertyUrlDraft(null)
    setListingImportStatus('review-required')
    onUpdate({
      importedProperties: nextProperties,
      listingImportStatus: 'review-required',
      nextAction: 'Controler puis valider les annonces de la demo.',
    })
    setNotice(`${form.importedProperties.length + 1} bien(s) importé(s).`)
    setError('')
  }

  function updateImportedProperty(index: number, updates: Partial<RealEstateProperty>) {
    const nextProperties = form.importedProperties.map((property, propertyIndex) => (
      propertyIndex === index ? { ...property, ...updates, listingReviewStatus: 'review-required' as const } : property
    ))
    setForm((current) => ({ ...current, importedProperties: nextProperties }))
    setListingImportStatus('review-required')
    onUpdate({
      importedProperties: nextProperties,
      listingImportStatus: 'review-required',
      nextAction: 'Controler puis valider les annonces de la demo.',
    })
  }

  function removeImportedProperty(index: number) {
    const nextProperties = form.importedProperties.filter((_, propertyIndex) => propertyIndex !== index)
    const nextStatus = getListingImportStatus(nextProperties)
    setForm((current) => ({ ...current, importedProperties: nextProperties }))
    setListingImportStatus(nextStatus)
    onUpdate({
      importedProperties: nextProperties,
      listingImportStatus: nextStatus,
      nextAction: nextProperties.length ? 'Controler puis valider les annonces de la demo.' : 'Importer les annonces de la demo depuis la fiche Projet.',
    })
  }

  function markImportedPropertyReady(index: number) {
    const nextProperties = form.importedProperties.map((property, propertyIndex) => (
      propertyIndex === index ? { ...property, listingReviewStatus: 'ready' as const } : property
    ))
    const nextStatus = getListingImportStatus(nextProperties)
    setForm((current) => ({ ...current, importedProperties: nextProperties }))
    setListingImportStatus(nextStatus)
    onUpdate({
      importedProperties: nextProperties,
      listingImportStatus: nextStatus,
      nextAction: nextStatus === 'ready'
        ? 'Annonces validees. Creer la demo moteur a l etape suivante.'
        : 'Terminer le controle manuel des annonces.',
    })
  }

  function validateImportedProperties() {
    if (!form.importedProperties.length) {
      setListingImportStatus('empty')
      setNotice('Aucune annonce fournie : non bloquant pour la demo.')
      setError('')
      onUpdate({
        importedProperties: [],
        listingImportStatus: 'empty',
        nextAction: 'Aucune annonce fournie. Creer la demo moteur ou poursuivre le controle.',
      })
      return
    }

    const blockers = getImportedPropertyValidationBlockers(form.importedProperties)
    if (blockers.length) {
      setListingImportStatus('error')
      setError(`Annonces incompletes : ${blockers.join(' ')}`)
      setNotice('')
      onUpdate({
        listingImportStatus: 'error',
        nextAction: 'Corriger les annonces incompletes avant validation groupee.',
      })
      return
    }

    const nextProperties = form.importedProperties.map((property) => ({ ...property, listingReviewStatus: 'ready' as const }))
    setForm((current) => ({ ...current, importedProperties: nextProperties }))
    setListingImportStatus('ready')
    setNotice('Toutes les annonces importees sont marquees pretes.')
    setError('')
    onUpdate({
      importedProperties: nextProperties,
      listingImportStatus: 'ready',
      nextAction: 'Annonces validees. Creer la demo moteur a l etape suivante.',
    })
  }

  function submitAgency() {
    const agencyName = form.agencyName.trim()
    const agencySlug = normalizeAgencySlug(project.generatedAgencyId || form.agencySlug)
    const readyImportedProperties = form.importedProperties.filter((property) => property.listingReviewStatus === 'ready')

    if (!agencyName) {
      setError("Ajoutez un nom d'agence.")
      return
    }

    if (!agencySlug) {
      setError('Ajoutez un slug agence.')
      return
    }

    if (!demoReadiness.ready) {
      setError(`Prerequis incomplets : ${demoReadiness.blockers.join(' ')}`)
      setNotice('')
      return
    }

    const existing = listRealEstateAgencyRuntimes().find((runtime) => runtime.modelConfig.agencySlug === agencySlug)
    if (existing && !canManageRealEstateAgency(agencySlug)) {
      setError('Ce slug est reserve a une agence de base.')
      return
    }

    try {
    const runtime = saveRealEstateAgencyConfig(toDuplicateInput(
      { ...form, agencyName, agencySlug, enabledModules: projectModulesEnabled },
      readyImportedProperties,
    ))
      onUpdate({
      status: 'demo-created',
      generatedAgencyId: runtime.modelConfig.agencySlug,
      liveRepoLink: runtime.routes.public,
      importedProperties: form.importedProperties,
      listingImportStatus: getListingImportStatus(form.importedProperties),
      demoReviewStatus: 'review-required',
      demoReviewChecks: [],
      demoReviewedAt: '',
      technicalStatus: 'vivante prête',
      nextAction: existing ? `Agence existante mise a jour : ${runtime.routes.public}` : `Nouvelle agence creee : ${runtime.routes.public}`,
    })
    setForm(createAgencyFormFromProject(project, runtime))
    setNotice(existing ? 'Agence existante mise à jour' : 'Nouvelle agence créée')
    setError('')
    } catch {
      setError('Impossible de creer ou mettre a jour la demo moteur. Les donnees du projet sont conservees.')
    }
  }

  return (
    <div className="admin-view project-detail project-agency-cockpit">
      <button className="back-link" type="button" onClick={() => onNavigate('/admin/projects')}>Retour projets</button>
      <header className="project-detail-header">
        <div>
          <p className="sd-eyebrow">Production agence immobiliere</p>
          <h1>{project.companyName}</h1>
          <p>{project.sector} - {project.city} - {getProjectSourceAdminLabel(project)}</p>
        </div>
        <StatusBadge status={project.status} />
      </header>

      <Card className="detail-block">
        <SectionTitle
          title="Workflow de production"
          text="Signature Digital prepare. Lovable modifie et valide. Signature Digital applique la version validee."
        />
        <div className="detail-grid">
          <Info label="1" value="Copier le prompt Lovable" />
          <Info label="2" value="Créer et modifier la démo dans Lovable" />
          <Info label="3" value="Après validation, demander le Visual Blueprint" />
          <Info label="4" value="Coller Visual Blueprint" />
          <Info label="5" value="Ajouter les biens depuis URL" />
          <Info label="6" value="Créer / mettre à jour la démo moteur" />
          <Info label="7" value="Ouvrir la démo moteur" />
        </div>
      </Card>
      <Card className="detail-block">
        <SectionTitle
          title="Créer la démo moteur depuis cette demande"
          text="La fiche Projet est le workflow principal : configuration agence, direction visuelle, données et lien de plateforme."
        />
        <div className="detail-grid">
          <Info label="Demande" value={project.companyName} />
          <Info label="Ville" value={project.city} />
          <Info label="Site actuel" value={clientBrief.agency.currentWebsite || 'Non renseigne'} href={clientBrief.agency.currentWebsite || undefined} />
          <Info label="Statut projet" value={projectStatusLabels[project.status]} />
          <Info label="Douleur" value={clientBrief.commercial.mainBlocker || 'Non renseignee'} />
          <Info label="Objectif" value={clientBrief.commercial.primaryGoal || 'Non renseigne'} />
        </div>
        <div className="field-grid">
          <TextInput label="Nom agence" value={form.agencyName} onChange={(value) => updateForm('agencyName', value)} />
          <TextInput
            label="Slug agence"
            value={form.agencySlug}
            onChange={(value) => updateForm('agencySlug', normalizeAgencySlug(value))}
          />
          <TextInput label="Ville" value={form.city} onChange={(value) => updateForm('city', value)} />
          <TextInput label="Site actuel" value={form.websiteUrl} onChange={(value) => updateForm('websiteUrl', value)} />
          <TextInput label="Email contact" value={form.email} onChange={(value) => updateForm('email', value)} />
          <TextInput label="Telephone contact" value={form.phone} onChange={(value) => updateForm('phone', value)} />
          <TextInput label="Logo URL optionnel" value={form.logoUrl} onChange={(value) => updateForm('logoUrl', value)} />
          <TextInput label="Adresse" value={form.address} onChange={(value) => updateForm('address', value)} />
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Prompt Lovable officiel"
          text={`Contrat ${lovablePrompt.version}. Les modifications visuelles se font dans Lovable avant l'extraction.`}
        />
        <TextArea label="Prompt a copier" value={lovablePrompt.prompt} onChange={() => undefined} />
        <div className="inline-actions">
          <Button onClick={copyPrompt}>Copier le prompt Lovable</Button>
          {copiedPrompt && <span className="copy-feedback">Prompt copie.</span>}
        </div>
        <div className="field-grid">
          <TextInput label="Lien Lovable" value={lovableLink} onChange={setLovableLink} placeholder="https://..." />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={saveLovableLink}>Enregistrer le lien Lovable</Button>
          {normalizedLovableLink && isValidExternalUrl(normalizedLovableLink) && (
            <Button variant="secondary" onClick={openLovableLink}>Ouvrir Lovable</Button>
          )}
          {lovableLinkNotice && <span className="copy-feedback">{lovableLinkNotice}</span>}
          {lovableLinkError && <span className="form-error">{lovableLinkError}</span>}
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Retour Lovable"
          text="Collez le retour structure complet : lien demo, VisualBlueprint v1, pack visuel minimal et capacites non supportees."
        />
        <TextArea
          label="Retour Lovable structure"
          value={lovableOutputRaw}
          onChange={setLovableOutputRaw}
          placeholder={formatLovableOutputExample()}
        />
        <div className="inline-actions">
          <Button variant="secondary" onClick={interpretAndValidateLovableOutput}>Interpreter et valider</Button>
          {normalizedLovableLink && isValidExternalUrl(normalizedLovableLink) && (
            <Button variant="secondary" onClick={openLovableLink}>Ouvrir Lovable</Button>
          )}
          {(hasLinkedAgency || willUpdateExistingAgency) ? (
            <Button variant="secondary" onClick={() => window.open(demoRoute, '_blank', 'noopener,noreferrer')}>
              Ouvrir la demo moteur
            </Button>
          ) : lovableOutputStatus === 'validated' && (
            <span className="copy-feedback">Le Blueprint est valide. L'agence sera creee a l'etape suivante.</span>
          )}
          {lovableOutputNotice && <span className="copy-feedback">{lovableOutputNotice}</span>}
        </div>
        <LovableOutputSummary
          output={currentLovableOutput}
          diagnostics={currentLovableOutputDiagnostics}
          blueprintDiagnostics={currentLovableOutput.visualBlueprint.diagnostics}
          status={lovableOutputStatus}
        />
      </Card>
      <Card className="detail-block">
        <SectionTitle
          title="Mode technique"
          text="Secours pour les anciens projets ou un ajustement manuel du VisualBlueprint brut."
        />
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => setShowTechnicalBlueprint((current) => !current)}>
            {showTechnicalBlueprint ? 'Masquer le Blueprint brut' : 'Afficher le Blueprint brut'}
          </Button>
        </div>
        {showTechnicalBlueprint && (
          <>
            <TextArea
              label="Visual Blueprint brut"
              value={visualBlueprint}
              onChange={updateTechnicalVisualBlueprint}
              placeholder={visualBlueprintPlaceholder}
            />
            <div className="inline-actions">
              <Button variant="secondary" onClick={interpretVisualBlueprint}>Interpreter le Blueprint technique</Button>
            </div>
          </>
        )}
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Annonces de la demo"
          text="Collez le lien d’une annonce pour pré-remplir une fiche bien. Vous pourrez corriger avant validation."
        />
        <div className="detail-grid">
          <Info label="Statut import" value={listingImportStatus} />
          <Info label="Annonces pretes" value={`${form.importedProperties.filter((property) => property.listingReviewStatus === 'ready').length}/${form.importedProperties.length}`} />
        </div>
        <div className="field-grid">
          <TextInput label="URL de l'annonce" value={propertyUrl} onChange={setPropertyUrl} placeholder="https://..." />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => void analyzePropertyUrl()} disabled={isAnalyzingPropertyUrl}>
            {isAnalyzingPropertyUrl ? 'Analyse en cours...' : "Analyser l'annonce"}
          </Button>
          <Button variant="secondary" onClick={validateImportedProperties}>
            Valider toutes les annonces
          </Button>
          {propertyUrlNotice && <span className="copy-feedback">{propertyUrlNotice}</span>}
          <span className="copy-feedback">{form.importedProperties.length} bien(s) importé(s)</span>
        </div>
        {propertyUrlDraft && (
          <>
            <div className="field-grid">
              <TextInput label="Titre" value={propertyUrlDraft.title} onChange={(value) => updatePropertyUrlDraft('title', value)} />
              <TextInput label="Type" value={propertyUrlDraft.type} onChange={(value) => updatePropertyUrlDraft('type', value)} />
              <TextInput label="Ville" value={propertyUrlDraft.city} onChange={(value) => updatePropertyUrlDraft('city', value)} />
              <TextInput label="Prix" value={propertyUrlDraft.price} onChange={(value) => updatePropertyUrlDraft('price', value)} />
              <TextInput label="Surface" value={propertyUrlDraft.surface} onChange={(value) => updatePropertyUrlDraft('surface', value)} />
              <TextInput label="Pièces" value={propertyUrlDraft.rooms} onChange={(value) => updatePropertyUrlDraft('rooms', value)} />
              <TextInput label="Chambres" value={propertyUrlDraft.bedrooms} onChange={(value) => updatePropertyUrlDraft('bedrooms', value)} />
              <TextInput label="Terrain" value={propertyUrlDraft.land} onChange={(value) => updatePropertyUrlDraft('land', value)} />
              <TextInput label="DPE" value={propertyUrlDraft.dpe} onChange={(value) => updatePropertyUrlDraft('dpe', value)} />
              <TextInput label="Référence" value={propertyUrlDraft.reference} onChange={(value) => updatePropertyUrlDraft('reference', value)} />
              <TextInput label="Image principale" value={propertyUrlDraft.imageUrl} onChange={(value) => updatePropertyUrlDraft('imageUrl', value)} />
              <TextInput label="URL source" value={propertyUrlDraft.sourceUrl} onChange={(value) => updatePropertyUrlDraft('sourceUrl', value)} />
            </div>
            <TextArea label="Galerie photos" value={propertyUrlDraft.gallery} onChange={(value) => updatePropertyUrlDraft('gallery', value)} />
            <TextArea label="Description" value={propertyUrlDraft.description} onChange={(value) => updatePropertyUrlDraft('description', value)} />
            <div className="inline-actions">
              <Button onClick={addPropertyUrlDraft}>Ajouter ce bien</Button>
            </div>
          </>
        )}
        {form.importedProperties.length > 0 && (
          <div className="admin-imported-properties">
            {form.importedProperties.map((property, index) => (
              <div className="admin-imported-property" key={`${property.id}-${index}`}>
                <div className="detail-grid">
                  <Info label="Controle" value={property.listingReviewStatus ?? 'review-required'} />
                  <Info label="Source" value={property.address || property.city || property.title} href={property.highlights.find((item) => item.startsWith('source: '))?.replace('source: ', '') || undefined} />
                </div>
                <div className="field-grid">
                  <TextInput label="Titre" value={property.title} onChange={(value) => updateImportedProperty(index, { title: value })} />
                  <TextInput label="Type" value={property.type} onChange={(value) => updateImportedProperty(index, { type: value })} />
                  <TextInput label="Ville/localisation" value={property.city} onChange={(value) => updateImportedProperty(index, { city: value, address: value })} />
                  <TextInput label="Prix" value={property.price} onChange={(value) => updateImportedProperty(index, { price: value, priceValue: parsePriceValue(value) })} />
                  <TextInput label="Surface" value={property.surface} onChange={(value) => updateImportedProperty(index, { surface: value })} />
                  <TextInput label="Pieces" value={property.rooms} onChange={(value) => updateImportedProperty(index, { rooms: value })} />
                  <TextInput label="Chambres" value={property.bedrooms ?? ''} onChange={(value) => updateImportedProperty(index, { bedrooms: value })} />
                  <TextInput label="Image principale" value={property.imageUrl} onChange={(value) => updateImportedProperty(index, { imageUrl: value, images: [value, ...property.images.filter((image) => image !== value)].filter(Boolean), photos: [value, ...property.photos.filter((image) => image !== value)].filter(Boolean) })} />
                </div>
                <TextArea label="Photos" value={property.images.join(', ')} onChange={(value) => updateImportedProperty(index, { images: parseListValue(value), photos: parseListValue(value) })} />
                <TextArea label="Description" value={property.description} onChange={(value) => updateImportedProperty(index, { description: value })} />
                <div className="inline-actions">
                  <Button variant="secondary" onClick={() => markImportedPropertyReady(index)}>Marquer prete</Button>
                  <Button variant="secondary" onClick={() => removeImportedProperty(index)}>Supprimer</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Réglages avancés"
          text="La configuration visuelle complète reste disponible si un ajustement manuel est nécessaire."
        />
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => setShowAdvancedSettings((current) => !current)}>
            {showAdvancedSettings ? 'Masquer les réglages avancés' : 'Afficher les réglages avancés'}
          </Button>
        </div>

        {showAdvancedSettings && (
          <>
            <SectionTitle
              title="Configuration visuelle"
              text="Réglages techniques complémentaires. Le VisualBlueprint reste la source principale des décisions visuelles."
            />
            <div className="field-grid">
              <SelectField label="Theme preset" value={form.themePreset} options={themePresetValues} onChange={(value) => updateForm('themePreset', value as RealEstateThemePreset)} />
              <SelectField label="Hero variant" value={form.heroVariant} options={heroVariantValues} onChange={(value) => updateForm('heroVariant', value as RealEstateHeroVariant)} />
              <TextInput label="Couleur principale" type="color" value={form.primaryColor} onChange={(value) => updateForm('primaryColor', value)} />
              <TextInput label="Couleur secondaire" type="color" value={form.secondaryColor} onChange={(value) => updateForm('secondaryColor', value)} />
              <TextInput label="Couleur accent" type="color" value={form.accentColor} onChange={(value) => updateForm('accentColor', value)} />
              <TextInput label="CTA principal" value={form.primaryCtaLabel} onChange={(value) => updateForm('primaryCtaLabel', value)} />
              <SelectField label="Mode" value={form.mode} options={modeValues} onChange={(value) => updateForm('mode', value as RealEstateAgencyMode)} />
              <SelectField label="Statut" value={form.status} options={statusValues} onChange={(value) => updateForm('status', value as RealEstateAgencyStatus)} />
              <TextInput label="Style visuel" value={form.visualStyle} onChange={(value) => updateForm('visualStyle', value)} />
              <TextInput label="Variant" value={form.variant} onChange={(value) => updateForm('variant', value)} />
              <TextArea label="Hero title" value={form.heroTitle} onChange={(value) => updateForm('heroTitle', value)} />
              <TextArea label="Hero subtitle" value={form.heroSubtitle} onChange={(value) => updateForm('heroSubtitle', value)} />
              <TextArea label="Ordre des sections" value={form.sectionOrder} onChange={(value) => updateForm('sectionOrder', value)} />
              <TextArea label="Douleur principale" value={form.painPoint} onChange={(value) => updateForm('painPoint', value)} />
              <TextArea label="Objectif principal" value={form.objective} onChange={(value) => updateForm('objective', value)} />
              <TextArea label="Ressenti souhaite" value={form.desiredFeeling} onChange={(value) => updateForm('desiredFeeling', value)} />
            </div>

            <div className="admin-agency-modules">
              {moduleLabels.map(([key, label]) => (
                <label className="admin-agency-module" key={key}>
                  <input
                    type="checkbox"
                    checked={form.enabledModules[key]}
                    onChange={(event) => updateForm('enabledModules', { ...form.enabledModules, [key]: event.target.checked })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title={hasLinkedAgency || willUpdateExistingAgency ? 'Mettre à jour la démo moteur' : 'Créer la démo moteur'}
          text="Signature Digital applique la direction et les données validées. L’activation commerciale reste suivie séparément dans le projet."
        />
        {notice && <p className="copy-feedback">{notice}</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="detail-grid">
          <Info label="Route demo" value={publicRoute} />
          <Info label="AgencyId" value={normalizeAgencySlug(form.agencySlug)} />
          <Info label="Identite" value={demoReadiness.summary.identity === 'ready' ? 'prete' : 'incomplete'} />
          <Info label="Blueprint" value={demoReadiness.summary.blueprint === 'validated' ? 'valide' : 'invalide'} />
          <Info label="Pack visuel" value={demoReadiness.summary.visualPack} />
          <Info label="Annonces pretes" value={`${demoReadiness.summary.listingsReady}/${demoReadiness.summary.listingsTotal}`} />
          <Info label="Modules actifs" value={`${demoReadiness.summary.modulesActive}`} />
          <Info label="Capacites non supportees" value={`${demoReadiness.summary.unsupportedCapabilities}`} />
          <Info label="Mode" value={form.mode} />
          <Info label="Statut technique agence" value={form.status} />
        </div>
        {demoReadiness.blockers.length > 0 && (
          <div className="form-error">
            {demoReadiness.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}
          </div>
        )}
        {demoReadiness.warnings.length > 0 && (
          <div className="copy-feedback">
            {demoReadiness.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          </div>
        )}
        <div className="inline-actions">
          <Button onClick={submitAgency} disabled={!demoReadiness.ready}>{hasLinkedAgency || willUpdateExistingAgency ? 'Mettre à jour la démo moteur' : 'Créer la démo moteur'}</Button>
          {normalizedAgencySlug && (
            <Button variant="secondary" onClick={() => window.open(demoRoute, '_blank', 'noopener,noreferrer')}>
              Ouvrir la démo moteur
            </Button>
          )}
          {project.generatedAgencyId && <span className="copy-feedback">Agence creee : /demo/{project.generatedAgencyId}</span>}
        </div>
      </Card>
      <Card className="detail-block">
        <SectionTitle
          title="Controle avant envoi"
          text="Checklist courte avant de transmettre la demo au client. Les controles visuels restent manuels."
        />
        <div className="detail-grid">
          <Info label="Statut revue" value={getDemoReviewStatusLabel(project.demoReviewStatus)} />
          <Info label="Progression" value={`${demoReviewReadiness.progress.passed}/${demoReviewReadiness.progress.total}`} />
          <Info label="Lien client" value={project.generatedAgencyId ? demoRoute : 'Agence non creee'} href={project.generatedAgencyId ? demoRoute : undefined} />
        </div>
        <div className="admin-imported-properties">
          <div className="admin-imported-property">
            <p className="sd-eyebrow">Automatique</p>
            {demoReviewReadiness.checks.filter((check) => check.type === 'automatic').map((check) => (
              <Info key={check.id} label={check.label} value={`${check.status} - ${check.detail}`} />
            ))}
          </div>
          <div className="admin-imported-property">
            <p className="sd-eyebrow">Manuel</p>
            {demoReviewReadiness.checks.filter((check) => check.type === 'manual').map((check) => (
              <label className="admin-agency-module" key={check.id}>
                <input
                  type="checkbox"
                  checked={check.status === 'passed'}
                  disabled={!check.required}
                  onChange={(event) => toggleDemoReviewCheck(check.id, event.target.checked)}
                />
                <span>{check.label} - {check.detail}</span>
              </label>
            ))}
          </div>
        </div>
        {demoReviewReadiness.blockers.length > 0 && (
          <div className="form-error">
            {demoReviewReadiness.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}
          </div>
        )}
        {demoReviewReadiness.warnings.length > 0 && (
          <div className="copy-feedback">
            {demoReviewReadiness.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          </div>
        )}
        <div className="inline-actions">
          <Button onClick={prepareClientLink} disabled={!demoReviewReadiness.ready || !project.generatedAgencyId}>
            Preparer le lien client
          </Button>
          {project.demoReviewStatus === 'ready-to-send' && project.status === 'client-review' && project.generatedAgencyId && (
            <Button variant="secondary" onClick={() => void copyDemoLink()}>Copier le lien de demo</Button>
          )}
          {copiedDemoLink && <span className="copy-feedback">Lien copie.</span>}
        </div>
      </Card>
      <Card className="detail-block">
        <SectionTitle
          title="Validation client"
          text="Validation commerciale et statut technique agence restent separes. Aucun email ni paiement n est declenche ici."
        />
        <div className="detail-grid">
          <Info label="Validation commerciale" value={project.status} />
          <Info label="Statut technique agence" value={linkedAgency?.modelConfig.status ?? 'Agence absente'} />
          <Info label="Acces client" value={project.clientSpaceCreated ? 'crees' : 'a creer'} />
          <Info label="Activation" value={activationReadiness.ready ? 'possible' : 'bloquee'} />
        </div>
        {activationReadiness.blockers.length > 0 && (
          <div className="form-error">
            {activationReadiness.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}
          </div>
        )}
        {activationReadiness.warnings.length > 0 && (
          <div className="copy-feedback">
            {activationReadiness.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          </div>
        )}
        <div className="inline-actions">
          <Button variant="secondary" onClick={approveClientDemo} disabled={project.status !== 'client-review'}>
            Client valide
          </Button>
          <Button variant="secondary" onClick={requestClientChanges} disabled={!project.generatedAgencyId}>
            Client demande modifications
          </Button>
          <Button variant="secondary" onClick={createClientAccess} disabled={project.status !== 'approved'}>
            Creer les acces
          </Button>
          <Button onClick={activateAgency} disabled={!activationReadiness.ready}>
            Activer l'agence
          </Button>
          {project.generatedAgencyId && (
            <Button variant="secondary" onClick={() => window.open(demoRoute, '_blank', 'noopener,noreferrer')}>
              Ouvrir la plateforme
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function LovableOutputSummary({
  output,
  diagnostics,
  blueprintDiagnostics,
  status,
}: {
  output: LovableDemoOutput
  diagnostics: LovableOutputParseResult['diagnostics']
  blueprintDiagnostics: VisualBlueprintDiagnostic[]
  status: Project['lovableOutputStatus']
}) {
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.level === 'warning').length
    + blueprintDiagnostics.filter((diagnostic) => diagnostic.level === 'warning').length
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.level === 'error').length
    + blueprintDiagnostics.filter((diagnostic) => diagnostic.level === 'error').length
  const blockingDiagnostics = [
    ...diagnostics.filter((diagnostic) => diagnostic.level === 'warning' || diagnostic.level === 'error'),
    ...blueprintDiagnostics
      .filter((diagnostic) => diagnostic.level === 'warning' || diagnostic.level === 'error')
      .map((diagnostic) => ({
        level: diagnostic.level,
        section: 'visualBlueprint',
        property: diagnostic.property,
        message: diagnostic.message,
      })),
  ]
  const colorCount = Object.values(output.visualPack.colors).filter(Boolean).length
  const typography = [
    output.visualPack.typography.heading,
    output.visualPack.typography.body,
    output.visualPack.typography.source,
  ].filter(Boolean).join(' / ')

  return (
    <>
      <div className="detail-grid">
        <Info label="Statut retour" value={status} />
        <Info label="Lien demo" value={output.demo.url || 'Absent'} href={output.demo.url || undefined} />
        <Info label="Blueprint" value={output.visualBlueprint.normalized ? 'Valide' : 'Invalide ou absent'} />
        <Info label="Logo" value={output.visualPack.logo.status} href={output.visualPack.logo.url} />
        <Info label="Couleurs" value={`${colorCount} couleur(s)`} />
        <Info label="Typographies" value={typography || 'Non renseignees'} />
        <Info label="Images home" value={`${output.visualPack.homeImages.length} image(s)`} />
        <Info label="Capacites non supportees" value={`${output.unsupportedCapabilities.length} element(s)`} />
        <Info label="Diagnostics" value={`${warningCount} warning(s), ${errorCount} erreur(s)`} />
      </div>
      {blockingDiagnostics.length > 0 && (
        <ul className="admin-diagnostics">
          {blockingDiagnostics.slice(0, 8).map((diagnostic, index) => (
            <li key={`${diagnostic.section}-${diagnostic.property}-${index}`} data-level={diagnostic.level}>
              <strong>{diagnostic.level}</strong> - {diagnostic.section}
              {diagnostic.property ? `.${diagnostic.property}` : ''} : {diagnostic.message}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function mergeLovableOutputIntoDemoAssets(
  demoAssets: Project['demoAssets'],
  output: LovableDemoOutput,
): Project['demoAssets'] {
  const imageReferences = output.visualPack.homeImages
    .map((image) => [image.role, image.url, image.sourceUrl].filter(Boolean).join(' - '))
    .join('\n')
  const visualMood = [
    output.visualPack.typography.heading ? `heading: ${output.visualPack.typography.heading}` : '',
    output.visualPack.typography.body ? `body: ${output.visualPack.typography.body}` : '',
    Object.entries(output.visualPack.colors).map(([key, value]) => `${key}: ${value}`).join('\n'),
  ].filter(Boolean).join('\n')

  return {
    ...demoAssets,
    logoUrl: output.visualPack.logo.url || demoAssets.logoUrl,
    logoNotes: output.visualPack.logo.status,
    visualMood: visualMood || demoAssets.visualMood,
    imageReferences: imageReferences || demoAssets.imageReferences,
  }
}

function getLovableOutputStatus(result: LovableOutputParseResult): Project['lovableOutputStatus'] {
  if (result.diagnostics.some((diagnostic) => diagnostic.level === 'error')) return 'invalid'
  return result.output.visualBlueprint.normalized ? 'validated' : 'parsed'
}

function getBlockingLovableDiagnostics(
  result: LovableOutputParseResult,
  blueprintDiagnostics: VisualBlueprintDiagnostic[],
) {
  return [
    ...result.diagnostics.filter((diagnostic) => diagnostic.level === 'error'),
    ...blueprintDiagnostics.filter((diagnostic) => diagnostic.level === 'error'),
  ]
}

function getLovableWarningCount(
  result: LovableOutputParseResult,
  blueprintDiagnostics: VisualBlueprintDiagnostic[],
) {
  return result.diagnostics.filter((diagnostic) => diagnostic.level === 'warning').length
    + blueprintDiagnostics.filter((diagnostic) => diagnostic.level === 'warning').length
}

function getDemoReviewStatusLabel(status: DemoReviewStatus) {
  const labels: Record<DemoReviewStatus, string> = {
    'not-started': 'Non demarre',
    'review-required': 'Controle requis',
    'ready-to-send': 'Prete a envoyer',
    'changes-required': 'Corrections requises',
  }

  return labels[status]
}

function getListingImportStatus(properties: RealEstateProperty[]): ListingImportStatus {
  if (!properties.length) return 'empty'
  return properties.every((property) => property.listingReviewStatus === 'ready') ? 'ready' : 'review-required'
}

function getImportedPropertyValidationBlockers(properties: RealEstateProperty[]) {
  return properties.flatMap((property, index) => {
    const label = property.title || `Annonce ${index + 1}`
    const blockers: string[] = []

    if (!property.title.trim()) blockers.push(`${label}: titre manquant.`)
    if (!property.type.trim()) blockers.push(`${label}: type manquant.`)
    if (!property.city.trim() && !property.address.trim()) blockers.push(`${label}: localisation manquante.`)
    if (!property.price.trim()) blockers.push(`${label}: prix manquant.`)
    if (!property.surface.trim()) blockers.push(`${label}: surface manquante.`)

    return blockers
  })
}

function mergeProjectModules(base: RealEstateEnabledModules, projectModules: readonly string[] = []): RealEstateEnabledModules {
  const enabled = new Set(projectModules)

  return {
    ...base,
    estimation: base.estimation || enabled.has('estimation') || enabled.has('callback_request') || enabled.has('lead_form'),
    sellerSpace: base.sellerSpace || enabled.has('seller_space'),
    agentSpace: base.agentSpace || enabled.has('professional_space'),
    ownerSpace: base.ownerSpace || enabled.has('professional_space'),
    publicProperties: base.publicProperties || enabled.has('property_listings'),
    propertyDetail: base.propertyDetail || enabled.has('property_detail') || enabled.has('visit_request'),
    visits: base.visits || enabled.has('visit_request'),
    documents: base.documents || enabled.has('documents'),
    reports: base.reports || enabled.has('reports'),
    reviews: base.reviews || enabled.has('agency_value_page'),
  }
}

function createAgencyFormFromProject(project: Project, runtime?: RealEstateAgencyRuntime): AgencyFormState {
  if (runtime) {
    const runtimeForm = createFormFromRuntime(runtime)

    return {
      ...runtimeForm,
      importedProperties: project.importedProperties?.length ? project.importedProperties : runtimeForm.importedProperties,
      enabledModules: mergeProjectModules(runtimeForm.enabledModules, project.modulesEnabled),
    }
  }

  const clientBrief = resolveProjectClientBrief(project)
  const painPoint = clientBrief.commercial.mainBlocker || "Clarifier la valeur de l'agence des les premieres secondes."
  const objective = clientBrief.commercial.primaryGoal || 'Generer plus de demandes qualifiees.'
  const desiredFeeling = clientBrief.perception.primaryPerception || 'trust'
  const agencySlug = normalizeAgencySlug([clientBrief.agency.companyName, clientBrief.agency.city].filter(Boolean).join(' '))

  return {
    agencyName: clientBrief.agency.companyName,
    city: clientBrief.agency.city,
    agencySlug,
    email: clientBrief.contact.email,
    phone: clientBrief.contact.phone,
    address: clientBrief.agency.city,
    websiteUrl: clientBrief.agency.currentWebsite,
    logoUrl: project.demoAssets.logoUrl,
    primaryColor: '#19191d',
    secondaryColor: '#f7f2ea',
    accentColor: '#b08d57',
    painPoint,
    objective,
    desiredFeeling,
    visualStyle: desiredFeeling,
    variant: 'premium-editorial',
    themePreset: 'premium_light',
    heroVariant: 'premium',
    heroTitle: buildHeroTitle(project, objective),
    heroSubtitle: buildHeroSubtitle(painPoint, objective, desiredFeeling),
    primaryCtaLabel: 'Estimer mon bien',
    sectionOrder: 'hero, properties, trust, estimation, sellerSpace, reviews, contact',
    visualBlueprint: project.visualBlueprint ?? '',
    importedProperties: project.importedProperties ?? [],
    mode: 'demo',
    status: 'demo_ready',
    enabledModules: mergeProjectModules(getDefaultRealEstateEnabledModules(), project.modulesEnabled),
  }
}

function createFormFromRuntime(runtime: RealEstateAgencyRuntime): AgencyFormState {
  const { modelConfig } = runtime

  return {
    agencyName: modelConfig.agencyName,
    city: modelConfig.city,
    agencySlug: modelConfig.agencySlug,
    email: modelConfig.email,
    phone: modelConfig.phone,
    address: modelConfig.address,
    websiteUrl: modelConfig.websiteUrl,
    logoUrl: modelConfig.logoUrl,
    primaryColor: modelConfig.primaryColor,
    secondaryColor: modelConfig.secondaryColor,
    accentColor: modelConfig.accentColor,
    painPoint: modelConfig.painPoint,
    objective: modelConfig.objective,
    desiredFeeling: modelConfig.visualStyle,
    visualStyle: modelConfig.visualStyle,
    variant: modelConfig.variant,
    themePreset: modelConfig.themePreset,
    heroVariant: modelConfig.heroVariant,
    heroTitle: modelConfig.heroTitle,
    heroSubtitle: modelConfig.heroSubtitle,
    primaryCtaLabel: modelConfig.primaryCtaLabel,
    sectionOrder: modelConfig.sectionOrder,
    visualBlueprint: modelConfig.visualBlueprint ?? '',
    importedProperties: modelConfig.importedProperties ?? [],
    mode: modelConfig.mode,
    status: modelConfig.status,
    enabledModules: modelConfig.enabledModules,
  }
}

function toDuplicateInput(form: AgencyFormState, readyImportedProperties: RealEstateProperty[]): DuplicateRealEstateAgencyInput {
  return {
    agencyName: form.agencyName,
    city: form.city,
    agencySlug: normalizeAgencySlug(form.agencySlug),
    logoUrl: form.logoUrl,
    colors: {
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      accentColor: form.accentColor,
    },
    email: form.email,
    phone: form.phone,
    address: form.address,
    websiteUrl: form.websiteUrl,
    painPoint: form.painPoint,
    objective: form.objective,
    visualStyle: form.visualStyle,
    variant: form.variant,
    themePreset: form.themePreset,
    heroVariant: form.heroVariant,
    heroTitle: form.heroTitle,
    heroSubtitle: form.heroSubtitle,
    primaryCtaLabel: form.primaryCtaLabel,
    sectionOrder: form.sectionOrder,
    visualBlueprint: form.visualBlueprint,
    importedProperties: readyImportedProperties.length ? readyImportedProperties : undefined,
    enabledModules: form.enabledModules,
    status: form.status,
    mode: form.mode,
    propertyLimit: readyImportedProperties.length ? readyImportedProperties.length : 2,
  }
}

function buildHeroTitle(project: Project, objective: string) {
  const agencyName = project.companyName || 'Votre agence'
  if (objective) return `${agencyName} - une experience immobiliere pensee pour ${objective.toLowerCase()}.`
  return `${agencyName}, une agence qui inspire confiance.`
}

function buildHeroSubtitle(painPoint: string, objective: string, desiredFeeling: string) {
  return [
    painPoint ? `Repondre a l'enjeu : ${painPoint}.` : '',
    objective ? `Objectif : ${objective}.` : '',
    desiredFeeling ? `Impression recherchee : ${desiredFeeling}.` : '',
  ].filter(Boolean).join(' ')
}

function parseVisualBlueprint(value: string): Partial<AgencyFormState> {
  const next: Partial<AgencyFormState> = {}
  const blueprint = parseVisualBlueprintV1(value)
  if (!blueprint) return next

  next.visualBlueprint = value.trim()

  const logoUrl = blueprint.brand.logoUrl
  if (logoUrl) next.logoUrl = logoUrl

  const primaryColor = blueprint.brand.primaryColor
  if (primaryColor && isHexColor(primaryColor)) next.primaryColor = primaryColor

  const accentColor = blueprint.brand.accentColor
  if (accentColor && isHexColor(accentColor)) next.accentColor = accentColor

  const heroLayout = blueprint.hero.layout
  if (heroLayout) {
    const heroVariant = heroVariantAliases[heroLayout.toLowerCase()]
    if (heroVariant) next.heroVariant = heroVariant
  }

  const heroTitle = blueprint.hero.title
  if (heroTitle) next.heroTitle = heroTitle

  const heroSubtitle = blueprint.hero.subtitle
  if (heroSubtitle) next.heroSubtitle = heroSubtitle

  const primaryCtaLabel = blueprint.hero.cta
  if (primaryCtaLabel) next.primaryCtaLabel = primaryCtaLabel

  const sectionOrder = blueprint.sections.sectionOrder
  if (sectionOrder) next.sectionOrder = sectionOrder

  const themePreset = blueprint.brand.themePreset
  if (themePreset && themePresetValues.includes(themePreset as RealEstateThemePreset)) {
    next.themePreset = themePreset as RealEstateThemePreset
  }

  return next
}

function createImportedProperty(row: Record<string, string | string[]>, agencyId: string, index: number): RealEstateProperty {
  const title = getTextValue(row.title) || `Bien importe ${index + 1}`
  const id = `${normalizeAgencySlug(title) || 'bien'}-${index + 1}`
  const galleryImages = getListValue(row.gallery)
  const imageUrl = getTextValue(row.imageUrl) || galleryImages[0] || ''
  const images = [...new Set([imageUrl, ...galleryImages])].filter(Boolean)
  const highlights = parseListValue(getTextValue(row.highlights) || getTextValue(row.features))
  const extraHighlights = [getTextValue(row.land), getTextValue(row.dpe)].filter(Boolean)
  const sourceUrl = getTextValue(row.sourceUrl)

  return {
    id,
    agencyId,
    title,
    address: getTextValue(row.address) || getTextValue(row.city),
    city: getTextValue(row.city),
    price: getTextValue(row.price),
    priceValue: parsePriceValue(getTextValue(row.price)),
    surface: getTextValue(row.surface),
    rooms: getTextValue(row.rooms),
    bedrooms: getTextValue(row.bedrooms),
    type: getTextValue(row.type) || 'Bien',
    description: getTextValue(row.description),
    highlights: [...highlights, ...extraHighlights, sourceUrl ? `source: ${sourceUrl}` : ''].filter(Boolean),
    imageUrl,
    images,
    photos: images,
    documents: [],
    visits: [],
    reports: [],
    offers: [],
    progress: 20,
    assignedAgentId: 'camille-aurel',
    sellerId: `seller-${id}`,
    isTemporary: true,
    listingReviewStatus: 'review-required',
  }
}

function createPropertyUrlFormState(draft: ExtractedPropertyDraft): PropertyUrlFormState {
  return {
    ...draft,
    gallery: draft.gallery.join('\n'),
  }
}

function propertyUrlFormToPropertyRow(draft: PropertyUrlFormState): Record<string, string | string[]> {
  return {
    title: draft.title,
    type: draft.type,
    city: draft.city,
    price: draft.price,
    surface: draft.surface,
    rooms: draft.rooms,
    bedrooms: draft.bedrooms,
    land: draft.land,
    dpe: draft.dpe,
    description: draft.description,
    imageUrl: draft.imageUrl,
    gallery: draft.gallery.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    highlights: [draft.reference].filter(Boolean),
  }
}

function cleanValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, '')
}

function getTextValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function getListValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return parseListValue(value)
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function parseListValue(value?: string) {
  if (!value) return []
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => cleanValue(item))
    .filter(Boolean)
}

function parsePriceValue(value?: string) {
  if (!value) return 0
  const withoutCents = value.trim().replace(/([,.]\d{2})(\s?€|\s?eur)?$/i, '')
  const numericValue = Number(withoutCents.replace(/[^\d]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">{value}</a>
      ) : (
        <strong>{value || 'Non renseigne'}</strong>
      )}
    </div>
  )
}
