import {
  parseVisualBlueprintV1Result,
  type VisualBlueprintDiagnostic,
  type VisualBlueprintV1,
} from './visualBlueprint'
import {
  normalizePublicPageConfig,
  supportedPublicPageImageRoles,
  supportedPublicPageSectionTypes,
  type PublicPageImageRole,
  type PublicPageConfig,
  type PublicPageSectionType,
} from './publicPageConfig'

export const LOVABLE_OUTPUT_VERSION = 'v1'

export type LovableOutputDiagnosticLevel = 'info' | 'warning' | 'error'

export type LovableOutputDiagnostic = {
  level: LovableOutputDiagnosticLevel
  section: 'root' | 'demo' | 'visualBlueprint' | 'visualPack' | 'publicPage' | 'unsupportedCapabilities'
  property?: string
  value?: string
  message: string
}

export type LovableLogoStatus = 'found' | 'missing' | 'proposed'
export type LovableTypographySource = 'detected' | 'proposed' | 'fallback'
export type LovableHomeImageRole = PublicPageImageRole | 'section' | 'background' | 'gallery'
export type UnsupportedCapabilityCategory =
  | 'composition'
  | 'navigation'
  | 'hero'
  | 'section'
  | 'property-card'
  | 'typography'
  | 'animation'
  | 'other'
export type UnsupportedCapabilityImportance = 'low' | 'medium' | 'high'

export type LovableDemoReference = {
  url: string
  projectId?: string
  reference?: string
  status?: string
}

export type LovableVisualBlueprintOutput = {
  raw: string
  normalized: VisualBlueprintV1 | null
  diagnostics: VisualBlueprintDiagnostic[]
}

export type LovableVisualPalette = {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  surface?: string
  text?: string
  [name: string]: string | undefined
}

export type LovableVisualPack = {
  logoUrl?: string
  heroImageUrl?: string
  logo: {
    status: LovableLogoStatus
    url?: string
  }
  palette: LovableVisualPalette
  colors: LovableVisualPalette
  imageRoles?: Partial<Record<PublicPageImageRole, string>>
  typography: {
    heading?: string
    body?: string
    displayWeight?: string
    displayTracking?: string
    italicAccent?: boolean
    bodyWeight?: string
    bodySize?: string
    eyebrowCase?: string
    eyebrowTracking?: string
    eyebrowSize?: string
    headlineScale?: string
    verticalRhythm?: string
    source: LovableTypographySource
  }
  sectionImages: Array<{
    role: LovableHomeImageRole
    url: string
    alt?: string
    description?: string
    sourceUrl?: string
  }>
  homeImages: Array<{
    role: LovableHomeImageRole
    url: string
    alt?: string
    description?: string
    sourceUrl?: string
  }>
}

export type UnsupportedCapability = {
  label: string
  description?: string
  category: UnsupportedCapabilityCategory
  importance: UnsupportedCapabilityImportance
}

export type LovableDemoOutput = {
  version: typeof LOVABLE_OUTPUT_VERSION
  demo: LovableDemoReference
  visualBlueprint: LovableVisualBlueprintOutput
  visualPack: LovableVisualPack
  publicPage?: PublicPageConfig
  unsupportedCapabilities: UnsupportedCapability[]
  diagnostics: LovableOutputDiagnostic[]
}

export type LovableOutputParseResult = {
  output: LovableDemoOutput
  diagnostics: LovableOutputDiagnostic[]
}

type LegacyLovableProject = {
  lovableOutput?: LovableDemoOutput
  lovableLink?: string
  visualBlueprint?: string
  demoAssets?: {
    logoUrl?: string
    logoNotes?: string
    heroImageUrl?: string
    visualMood?: string
    typographyHeading?: string
    typographyBody?: string
    imageReferences?: string
    sectionImageReferences?: string
    reusableImages?: Array<{ url?: string; fileName?: string }>
    websiteScreenshots?: Array<{ url?: string; fileName?: string }>
  }
}

const allowedRootSections = new Set(['lovableoutput', 'version', 'demo', 'visualblueprint', 'visualpack', 'publicpage', 'unsupportedcapabilities'])
const logoStatuses: LovableLogoStatus[] = ['found', 'missing', 'proposed']
const typographySources: LovableTypographySource[] = ['detected', 'proposed', 'fallback']
const imageRoles: LovableHomeImageRole[] = ['hero', 'agency', 'method', 'sellerSpace', 'proof', 'contact', 'advisorPortrait', 'localArea', 'section', 'background', 'gallery']
const unsupportedCategories: UnsupportedCapabilityCategory[] = [
  'composition',
  'navigation',
  'hero',
  'section',
  'property-card',
  'typography',
  'animation',
  'other',
]
const unsupportedImportances: UnsupportedCapabilityImportance[] = ['low', 'medium', 'high']
const colorKeys = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'] as const

export function parseLovableOutput(raw: string): LovableOutputParseResult {
  const diagnostics: LovableOutputDiagnostic[] = []
  const source = raw.trim()

  if (!source) {
    diagnostics.push(createDiagnostic('error', 'visualBlueprint', 'raw', '', 'Collez au moins le bloc VisualBlueprint avant interpretation.'))
  }

  collectUnknownRootSections(source, diagnostics)

  const version = readRootScalar(source, 'version')
  if (!version) {
    diagnostics.push(createDiagnostic('warning', 'root', 'version', '', 'Version du retour Lovable absente : le VisualBlueprint peut quand meme etre valide.'))
  } else if (version !== LOVABLE_OUTPUT_VERSION) {
    diagnostics.push(createDiagnostic('warning', 'root', 'version', version, `Version LovableOutput inconnue. Version attendue : ${LOVABLE_OUTPUT_VERSION}.`))
  }

  const demo = parseDemoSection(readTopLevelSection(source, 'demo'), diagnostics, source)
  const visualBlueprintSource =
    readBlockScalar(source, 'visualBlueprint')
    || extractVisualBlueprintFromText(source)
    || extractDirectVisualBlueprintFromText(source)
  const visualBlueprint = parseVisualBlueprintSection(visualBlueprintSource, diagnostics)
  const visualPackSection = readTopLevelSection(source, 'visualPack')
  const visualPackMarkdown = extractMarkdownSection(source, ['C. Pack visuel', 'Pack visuel', 'VisualPack'], ['D. Capacites non supportees', 'D. Capacités non supportées', 'Capacites non supportees', 'Capacités non supportées'])
  const visualPack = parseVisualPackSection(visualPackSection, diagnostics, visualPackMarkdown || source)
  const publicPage = extractPublicPageConfig(source, diagnostics)
  const unsupportedSection = readTopLevelSection(source, 'unsupportedCapabilities')
  const unsupportedMarkdown = extractMarkdownSection(source, ['D. Capacites non supportees', 'D. Capacités non supportées', 'Capacites non supportees', 'Capacités non supportées'], [])
  const unsupportedCapabilities = parseUnsupportedCapabilities(unsupportedSection || unsupportedMarkdown, diagnostics)

  const output: LovableDemoOutput = {
    version: LOVABLE_OUTPUT_VERSION,
    demo,
    visualBlueprint,
    visualPack,
    publicPage,
    unsupportedCapabilities,
    diagnostics: [],
  }
  const validationDiagnostics = validateLovableOutput(output)
  const allDiagnostics = [...diagnostics, ...validationDiagnostics]

  return {
    output: {
      ...output,
      diagnostics: allDiagnostics,
    },
    diagnostics: allDiagnostics,
  }
}

export function validateLovableOutput(output: LovableDemoOutput): LovableOutputDiagnostic[] {
  const diagnostics: LovableOutputDiagnostic[] = []
  const visualPack = normalizeLovableVisualPack(output.visualPack)

  if (!output.demo.url) {
    diagnostics.push(createDiagnostic('warning', 'demo', 'url', '', 'Lien Lovable absent : il est facultatif pour creer la demo SD.'))
  } else if (!isValidHttpUrl(output.demo.url)) {
    diagnostics.push(createDiagnostic('warning', 'demo', 'url', output.demo.url, 'Lien Lovable invalide : il sera ignore pour creer la demo SD.'))
  }

  if (!output.visualBlueprint.raw) {
    diagnostics.push(createDiagnostic('error', 'visualBlueprint', 'raw', '', 'Le VisualBlueprint v1 est obligatoire.'))
  } else {
    if (!output.visualBlueprint.raw.trim().startsWith('VisualBlueprint:')) {
      diagnostics.push(createDiagnostic('error', 'visualBlueprint', 'raw', '', 'Le VisualBlueprint doit commencer par "VisualBlueprint:".'))
    }
    if (!/version:\s*v1\b/.test(output.visualBlueprint.raw)) {
      diagnostics.push(createDiagnostic('error', 'visualBlueprint', 'version', '', 'Le VisualBlueprint doit declarer "version: v1".'))
    }
    if (!output.visualBlueprint.normalized) {
      diagnostics.push(createDiagnostic('error', 'visualBlueprint', 'raw', '', 'Le parseur VisualBlueprint v1 n a pas pu normaliser le contenu.'))
    }
  }

  if (visualPack.logo.status === 'found' && !visualPack.logo.url && !visualPack.logoUrl) {
    diagnostics.push(createDiagnostic('warning', 'visualPack', 'logo.url', '', 'Le logo est marque "found" mais aucune URL officielle n est fournie.'))
  }

  const logoUrl = visualPack.logoUrl || visualPack.logo.url
  if (logoUrl && !isValidHttpUrl(logoUrl)) {
    diagnostics.push(createDiagnostic('warning', 'visualPack', 'logoUrl', logoUrl, 'L URL du logo est invalide.'))
  }

  if (visualPack.heroImageUrl && !isValidHttpUrl(visualPack.heroImageUrl)) {
    diagnostics.push(createDiagnostic('warning', 'visualPack', 'heroImageUrl', visualPack.heroImageUrl, 'L image Hero doit utiliser une URL http(s) valide.'))
  }

  Object.entries(visualPack.colors).forEach(([key, value]) => {
    if (value && !isHexColor(value)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `colors.${key}`, value, 'La couleur doit etre un hexadeximal #RGB ou #RRGGBB.'))
    }
  })

  if (!visualPack.typography.heading && !visualPack.typography.body && visualPack.typography.source !== 'fallback') {
    diagnostics.push(createDiagnostic('info', 'visualPack', 'typography', '', 'Aucune typographie detectee ou proposee.'))
  }

  visualPack.homeImages.forEach((image, index) => {
    if (!isValidHttpUrl(image.url)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `homeImages.${index}.url`, image.url, 'L image de home doit utiliser une URL http(s) valide.'))
    }
  })

  visualPack.sectionImages.forEach((image, index) => {
    if (!isValidHttpUrl(image.url)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `sectionImages.${index}.url`, image.url, 'L image de section doit utiliser une URL http(s) valide.'))
    }
  })

  return diagnostics
}

export function resolveProjectLovableOutput(project: LegacyLovableProject): LovableDemoOutput {
  if (project.lovableOutput) {
    const normalizedOutput = normalizeLovableDemoOutput(project.lovableOutput)
    const diagnostics = normalizedOutput.diagnostics?.length
      ? normalizedOutput.diagnostics
      : validateLovableOutput(normalizedOutput)

    return {
      ...normalizedOutput,
      diagnostics,
    }
  }

  const imageReferences = splitTextList(project.demoAssets?.imageReferences ?? '')
  const reusableImages = project.demoAssets?.reusableImages ?? []
  const websiteScreenshots = project.demoAssets?.websiteScreenshots ?? []
  const homeImages = [
    ...imageReferences.map((url) => ({ role: 'section' as const, url })),
    ...reusableImages.map((asset) => ({ role: 'section' as const, url: asset.url ?? '', alt: asset.fileName })),
    ...websiteScreenshots.map((asset) => ({ role: 'background' as const, url: asset.url ?? '', alt: asset.fileName })),
  ].filter((image) => image.url)

  const visualBlueprint = parseVisualBlueprintSection(project.visualBlueprint ?? '', [])

  return {
    version: LOVABLE_OUTPUT_VERSION,
    demo: {
      url: project.lovableLink ?? '',
    },
    visualBlueprint,
    visualPack: {
      logoUrl: project.demoAssets?.logoUrl || undefined,
      heroImageUrl: project.demoAssets?.heroImageUrl || undefined,
      logo: {
        status: project.demoAssets?.logoUrl ? 'found' : 'missing',
        url: project.demoAssets?.logoUrl || undefined,
      },
      palette: {},
      colors: {},
      typography: {
        heading: project.demoAssets?.typographyHeading || undefined,
        body: project.demoAssets?.typographyBody || undefined,
        source: 'fallback',
      },
      sectionImages: splitTextList(project.demoAssets?.sectionImageReferences ?? '')
        .map((url) => ({ role: 'section' as const, url })),
      homeImages,
    },
    unsupportedCapabilities: [],
    diagnostics: [],
  }
}

export function formatLovableOutputExample(): string {
  return `LovableOutput:
  version: v1

  demo:
    url: "https://demo-lovable.example"

  visualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        primaryColor: "#111827"
        accentColor: "#B08D57"

  visualPack:
    logoUrl: "https://example.com/logo.svg"
    heroImageUrl: "https://example.com/home-hero.jpg"
    palette:
      primary: "#111827"
      accent: "#B08D57"
      background: "#FFFFFF"
      text: "#111827"
    typography:
      heading: "Playfair Display"
      body: "Inter"
      source: detected
    sectionImages:
      - role: section
        url: "https://example.com/home-method.jpg"
        alt: "Equipe en agence"
        sourceUrl: "https://example.com"

  unsupportedCapabilities:
    - category: section
      importance: medium
      label: "Timeline animee"
      description: "La demo Lovable montre une frise animee non supportee par le moteur actuel."`
}

function parseDemoSection(section: string, diagnostics: LovableOutputDiagnostic[], raw: string): LovableDemoReference {
  const values = parseKeyValues(section)
  const url = readString(values.url) || extractFirstUrl(raw, /(demo|lovable|preview|maquette|projet)/i, false)

  if (!section.trim()) {
    diagnostics.push(createDiagnostic('warning', 'demo', 'demo', '', 'Section demo absente : le lien Lovable est facultatif.'))
  }

  return {
    url,
    projectId: readOptionalString(values.projectId),
    reference: readOptionalString(values.reference),
    status: readOptionalString(values.status),
  }
}

function parseVisualBlueprintSection(raw: string, diagnostics: LovableOutputDiagnostic[]): LovableVisualBlueprintOutput {
  const blueprintRaw = raw.trim()
  if (!blueprintRaw) {
    diagnostics.push(createDiagnostic('error', 'visualBlueprint', 'raw', '', 'La section visualBlueprint est absente.'))
  }

  const parsed = parseVisualBlueprintV1Result(blueprintRaw)
  const normalizedRaw = parsed.blueprint?.raw ?? blueprintRaw

  return {
    raw: normalizedRaw,
    normalized: parsed.blueprint,
    diagnostics: parsed.diagnostics,
  }
}

function parseVisualPackSection(section: string, diagnostics: LovableOutputDiagnostic[], markdownFallback = ''): LovableVisualPack {
  const hasStructuredSection = Boolean(section.trim())
  const fallbackPack = parseMarkdownVisualPack(markdownFallback, diagnostics)

  if (!hasStructuredSection && !hasExtractedVisualPack(fallbackPack)) {
    diagnostics.push(createDiagnostic('warning', 'visualPack', 'visualPack', '', 'La section visualPack est absente.'))
  }

  const rootValues = parseKeyValues(section)
  const logoValues = parseKeyValues(readNestedSection(section, 'logo'))
  const colorValues = {
    ...parseKeyValues(readNestedSection(section, 'colors')),
    ...parseKeyValues(readNestedSection(section, 'palette')),
  }
  const typographySection = readNestedSection(section, 'typography')
  const typographyValues = parseKeyValues(typographySection)
  const typographyDisplayValues = parseKeyValues(readNestedSection(typographySection, 'display'))
  const typographyBodyValues = parseKeyValues(readNestedSection(typographySection, 'body'))
  const typographyEyebrowValues = parseKeyValues(readNestedSection(typographySection, 'eyebrow'))
  const visualPackImageRoles = parseVisualPackImageRoles(readNestedSection(section, 'imageRoles'), diagnostics)
  const rootLogoUrl = readOptionalString(rootValues.logoUrl)
  const heroImageUrl = readOptionalString(rootValues.heroImageUrl) || visualPackImageRoles.hero
  const nestedLogoUrl = readOptionalString(logoValues.url)
  const logoStatus = normalizeEnum(logoValues.status, logoStatuses, rootLogoUrl || nestedLogoUrl ? 'found' : 'missing', diagnostics, 'visualPack', 'logo.status')
  const typographySource = normalizeEnum(typographyValues.source, typographySources, 'fallback', diagnostics, 'visualPack', 'typography.source')
  const colors: LovableVisualPalette = { ...fallbackPack.colors }
  const roleImages = imageRolesToEntries(visualPackImageRoles)
  const structuredHomeImages = mergeImageEntries(parseHomeImages(readListSection(section, 'homeImages'), diagnostics), roleImages.homeImages)
  const structuredSectionImages = mergeImageEntries(parseImageList(readListSection(section, 'sectionImages'), diagnostics, 'sectionImages'), roleImages.sectionImages)
  const headingTypography = readOptionalString(typographyValues.heading)
    || readOptionalString(typographyValues.display)
    || readOptionalString(typographyDisplayValues.family)
    || fallbackPack.typography.heading
  const bodyTypography = readOptionalString(typographyValues.body)
    || readOptionalString(typographyValues.sans)
    || readOptionalString(typographyBodyValues.family)
    || fallbackPack.typography.body
  const resolvedTypographySource = headingTypography || bodyTypography
    ? readOptionalString(typographyValues.source) ? typographySource : 'detected'
    : fallbackPack.typography.source

  Object.entries(colorValues).forEach(([key, rawValue]) => {
    const value = readOptionalString(rawValue)
    if (!value) return
    const normalizedKey = normalizePaletteKey(key)
    colors[normalizedKey] = value
    const semanticKey = colorKeys.includes(key as typeof colorKeys[number]) ? key : mapPaletteSemanticKey(key)
    if (semanticKey && !colors[semanticKey]) colors[semanticKey] = value
  })

  return {
    logoUrl: rootLogoUrl || nestedLogoUrl || fallbackPack.logoUrl,
    heroImageUrl: heroImageUrl || fallbackPack.heroImageUrl,
    logo: {
      status: rootLogoUrl || nestedLogoUrl ? logoStatus : fallbackPack.logo.status,
      url: nestedLogoUrl || rootLogoUrl || fallbackPack.logo.url,
    },
    palette: colors,
    colors,
    imageRoles: Object.keys(visualPackImageRoles).length ? visualPackImageRoles : fallbackPack.imageRoles,
    typography: {
      heading: headingTypography,
      body: bodyTypography,
      displayWeight: readOptionalString(typographyDisplayValues.weight) || fallbackPack.typography.displayWeight,
      displayTracking: readOptionalString(typographyDisplayValues.tracking) || fallbackPack.typography.displayTracking,
      italicAccent: parseBooleanText(typographyDisplayValues.italicAccent) ?? fallbackPack.typography.italicAccent,
      bodyWeight: readOptionalString(typographyBodyValues.weight) || fallbackPack.typography.bodyWeight,
      bodySize: readOptionalString(typographyBodyValues.size) || fallbackPack.typography.bodySize,
      eyebrowCase: readOptionalString(typographyEyebrowValues.case) || fallbackPack.typography.eyebrowCase,
      eyebrowTracking: readOptionalString(typographyEyebrowValues.tracking) || fallbackPack.typography.eyebrowTracking,
      eyebrowSize: readOptionalString(typographyEyebrowValues.size) || fallbackPack.typography.eyebrowSize,
      headlineScale: readOptionalString(typographyValues.headlineScale) || fallbackPack.typography.headlineScale,
      verticalRhythm: readOptionalString(typographyValues.verticalRhythm) || fallbackPack.typography.verticalRhythm,
      source: resolvedTypographySource,
    },
    sectionImages: mergeImageEntries(structuredSectionImages, fallbackPack.sectionImages),
    homeImages: mergeImageEntries(structuredHomeImages, fallbackPack.homeImages),
  }
}

function parseHomeImages(section: string, diagnostics: LovableOutputDiagnostic[]): LovableVisualPack['homeImages'] {
  return parseImageList(section, diagnostics, 'homeImages')
}

function parseVisualPackImageRoles(section: string, diagnostics: LovableOutputDiagnostic[]): Partial<Record<PublicPageImageRole, string>> {
  const values = parseKeyValues(section)
  const roles: Partial<Record<PublicPageImageRole, string>> = {}

  Object.entries(values).forEach(([role, rawUrl]) => {
    const url = readOptionalString(rawUrl)
    if (!url) return
    if (!supportedPublicPageImageRoles.includes(role as PublicPageImageRole)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `imageRoles.${role}`, role, 'Role image VisualPack inconnu ignore.'))
      return
    }
    if (!isPublicImageUrl(url)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `imageRoles.${role}`, url, 'Image ignoree : fournissez une URL publique http(s), pas un chemin local ou src/assets.'))
      return
    }
    roles[role as PublicPageImageRole] = url
  })

  return roles
}

function imageRolesToEntries(imageRoleValues: Partial<Record<PublicPageImageRole, string>>): Pick<LovableVisualPack, 'homeImages' | 'sectionImages'> {
  const homeImages: LovableVisualPack['homeImages'] = []
  const sectionImages: LovableVisualPack['sectionImages'] = []

  Object.entries(imageRoleValues).forEach(([role, url]) => {
    if (!url) return
    const image = { role: role as PublicPageImageRole, url }
    if (role === 'hero') {
      homeImages.push(image)
    } else {
      sectionImages.push(image)
    }
  })

  return { homeImages, sectionImages }
}

function parseMarkdownVisualPack(section: string, diagnostics: LovableOutputDiagnostic[]): LovableVisualPack {
  const colors = extractMarkdownColors(section)
  const typography = extractMarkdownTypography(section)
  const urls = extractUrlEntries(section)
  const logoUrl = urls.find((entry) => entry.role === 'logo')?.url
  const heroImageUrl = urls.find((entry) => entry.role === 'hero')?.url
  const sectionImages = urls
    .filter((entry) => entry.role === 'section' || entry.role === 'background' || entry.role === 'gallery')
    .map((entry) => ({
      role: entry.role === 'gallery' ? 'gallery' as const : entry.role === 'background' ? 'background' as const : 'section' as const,
      url: entry.url,
      description: entry.description,
    }))
  const homeImages = urls
    .filter((entry) => entry.role === 'hero' || entry.role === 'section' || entry.role === 'background' || entry.role === 'gallery')
    .map((entry) => ({
      role: entry.role === 'logo' ? 'section' as const : entry.role,
      url: entry.url,
      description: entry.description,
    }))
  const mentionsLogo = /logo|wordmark|logotype/i.test(section)
  const mentionsImages = /(image|photo|visuel|hero|section|portrait)/i.test(section)

  if (mentionsImages && !homeImages.length && !heroImageUrl) {
    diagnostics.push(createDiagnostic('info', 'visualPack', 'images', '', 'Images descriptives uniquement, URL publique absente.'))
  }

  return {
    logoUrl,
    heroImageUrl,
    logo: {
      status: logoUrl ? 'found' : mentionsLogo ? 'proposed' : 'missing',
      url: logoUrl,
    },
    palette: colors,
    colors,
    imageRoles: {},
    typography,
    sectionImages,
    homeImages,
  }
}

function hasExtractedVisualPack(visualPack: LovableVisualPack) {
  return Boolean(
    visualPack.logoUrl
    || visualPack.heroImageUrl
    || Object.values(visualPack.colors).filter(Boolean).length
    || visualPack.typography.heading
    || visualPack.typography.body
    || Object.values(visualPack.imageRoles ?? {}).filter(Boolean).length
    || visualPack.sectionImages.length
    || visualPack.homeImages.length
    || visualPack.logo.status !== 'missing',
  )
}

function extractMarkdownColors(section: string): LovableVisualPalette {
  const colors: LovableVisualPalette = {}
  const matches = [...section.matchAll(/(?:^|\n)\s*(?:[-*]\s*)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 _/-]{1,42})\s*(?:[:\-–—])?\s*(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)\b/g)]

  matches.forEach((match) => {
    const label = match[1].trim()
    const color = match[2].toUpperCase()
    const key = normalizePaletteKey(label)
    colors[key] = color

    const semantic = mapPaletteSemanticKey(label)
    if (semantic && !colors[semantic]) colors[semantic] = color
  })

  return colors
}

function extractMarkdownTypography(section: string): LovableVisualPack['typography'] {
  const typographySection = section
    .split(/\r?\n/)
    .filter((line) => /typograph|police|font|cormorant|inter|garamond/i.test(line))
    .join('\n') || section
  const pair = typographySection.match(/([A-Z][A-Za-zÀ-ÿ]+(?:\s+[A-Z][A-Za-zÀ-ÿ]+){0,3})\s*(?:\+|\/| et )\s*([A-Z][A-Za-zÀ-ÿ]+(?:\s+[A-Z][A-Za-zÀ-ÿ]+){0,3})/)

  if (pair) {
    return {
      heading: pair[1].trim(),
      body: pair[2].trim(),
      source: 'detected',
    }
  }

  const single = typographySection.match(/(?:heading|display|titre|serif)\s*[:\-–—]\s*["']?([^"'\n,;]+)/i)
  const body = typographySection.match(/(?:body|sans|texte|inter)\s*[:\-–—]\s*["']?([^"'\n,;]+)/i)

  return {
    heading: single?.[1]?.trim(),
    body: body?.[1]?.trim(),
    source: single || body ? 'detected' : 'fallback',
  }
}

function extractUrlEntries(section: string): Array<{ role: LovableHomeImageRole | 'logo'; url: string; description?: string }> {
  const urls = [...section.matchAll(/https?:\/\/[^\s)"'<>]+/gi)]

  return urls.map((match) => {
    const url = match[0].replace(/[.,;]+$/, '')
    const contextStart = Math.max(0, match.index - 140)
    const contextEnd = Math.min(section.length, match.index + url.length + 140)
    const context = section.slice(contextStart, contextEnd)

    return {
      role: normalizeInferredImageRole(inferImageRole(context, url), context, url),
      url,
      description: context.replace(/\s+/g, ' ').trim().slice(0, 180),
    }
  })
}

function inferImageRole(context: string, url: string): LovableHomeImageRole | 'logo' {
  const signal = `${context} ${url}`.toLowerCase()
  if (/logo|wordmark|logotype|favicon/.test(signal)) return 'logo'
  if (/hero|accueil|home|couverture|premier écran|premier ecran/.test(signal)) return 'hero'
  if (/portrait|equipe|équipe|agent|directeur|directrice/.test(signal)) return 'section'
  if (/background|fond/.test(signal)) return 'background'
  if (/gallery|galerie/.test(signal)) return 'gallery'
  return 'section'
}

function normalizeInferredImageRole(role: LovableHomeImageRole | 'logo', context: string, url: string): LovableHomeImageRole | 'logo' {
  if (role !== 'section') return role
  const signal = `${context} ${url}`.toLowerCase()
  if (/portrait|advisor|conseiller|conseillere|directeur|directrice|equipe|équipe/.test(signal)) return 'advisorPortrait'
  if (/agence|agency|story|histoire|local/.test(signal)) return 'agency'
  if (/methode|method|process|approche/.test(signal)) return 'method'
  if (/seller|vendeur|dashboard|suivi/.test(signal)) return 'sellerSpace'
  if (/proof|preuve|avis|review|temoignage|témoignage/.test(signal)) return 'proof'
  if (/contact|rendez-vous|rdv/.test(signal)) return 'contact'
  if (/quartier|ville|local-area|local area|tarbes|territoire/.test(signal)) return 'localArea'
  return role
}

function normalizePaletteKey(label: string) {
  const normalized = normalizeTextKey(label)
  return normalized || 'color'
}

function mapPaletteSemanticKey(label: string): keyof LovableVisualPalette | '' {
  const normalized = normalizeTextKey(label)
  if (/primary|principal|ink|encre|noir|black|texte|text/.test(normalized)) return 'primary'
  if (/secondary|secondaire|bone|cream|creme|beige|sand|sable/.test(normalized)) return 'secondary'
  if (/accent|bronze|brass|gold|or|cuivre|laiton/.test(normalized)) return 'accent'
  if (/background|fond|ivory|ivoire|white|blanc/.test(normalized)) return 'background'
  if (/surface|card|carte/.test(normalized)) return 'surface'
  return ''
}

function inferUnsupportedCategory(value: string): UnsupportedCapabilityCategory {
  const normalized = normalizeTextKey(value)
  if (/composition|layout|grille/.test(normalized)) return 'composition'
  if (/navigation|menu/.test(normalized)) return 'navigation'
  if (/hero|cover|couverture/.test(normalized)) return 'hero'
  if (/section|bloc/.test(normalized)) return 'section'
  if (/carte|card|bien/.test(normalized)) return 'property-card'
  if (/typo|font|police/.test(normalized)) return 'typography'
  if (/animation|motion|transition/.test(normalized)) return 'animation'
  return 'other'
}

function inferUnsupportedImportance(value: string): UnsupportedCapabilityImportance {
  const normalized = normalizeTextKey(value)
  if (/bloquant|critique|important|majeur|high/.test(normalized)) return 'high'
  if (/mineur|faible|low/.test(normalized)) return 'low'
  return 'medium'
}

function normalizeHeading(value: string) {
  return normalizeTextKey(value).replace(/^#+\s*/, '').replace(/^\w\.\s*/, '')
}

function normalizeTextKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mergeImageEntries<T extends LovableVisualPack['homeImages']>(primary: T, fallback: T): T {
  const merged = [...primary, ...fallback]
  return merged.filter((image, index, list) => image.url && list.findIndex((item) => item.url === image.url) === index) as T
}

function parseImageList(
  section: string,
  diagnostics: LovableOutputDiagnostic[],
  property: 'homeImages' | 'sectionImages',
): LovableVisualPack['homeImages'] {
  const parsedImages: LovableVisualPack['homeImages'] = []

  parseListItems(section).forEach((item, index) => {
    const url = readString(item.url)
    if (!url) return
    if (!isPublicImageUrl(url)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `${property}.${index}.url`, url, 'Image ignoree : fournissez une URL publique http(s), pas un chemin local ou src/assets.'))
      return
    }

    parsedImages.push({
      role: normalizeEnum(item.role, imageRoles, 'section', diagnostics, 'visualPack', `${property}.${index}.role`),
      url,
      alt: readOptionalString(item.alt),
      description: readOptionalString(item.description),
      sourceUrl: readOptionalString(item.sourceUrl),
    })
  })

  return parsedImages
}

function parseUnsupportedCapabilities(section: string, diagnostics: LovableOutputDiagnostic[]): UnsupportedCapability[] {
  if (!section.trim()) return []

  const structuredItems = parseListItems(section)
  if (!structuredItems.length || structuredItems.every((item) => !readString(item.label))) {
    return parseMarkdownUnsupportedCapabilities(section)
  }

  return structuredItems.map((item, index) => ({
    label: readString(item.label),
    description: readOptionalString(item.description),
    category: normalizeEnum(item.category, unsupportedCategories, 'other', diagnostics, 'unsupportedCapabilities', `${index}.category`),
    importance: normalizeEnum(item.importance, unsupportedImportances, 'medium', diagnostics, 'unsupportedCapabilities', `${index}.importance`),
  })).filter((item) => item.label)
}

function extractPublicPageConfig(raw: string, diagnostics: LovableOutputDiagnostic[]): PublicPageConfig | undefined {
  const structured = readPublicPageFromJson(raw, diagnostics)
  if (structured) return structured

  const fenced = extractFencedCode(raw)
  if (fenced) {
    const fencedStructured = readPublicPageFromJson(fenced, diagnostics)
    if (fencedStructured) return fencedStructured
  }

  const candidates = [
    readTopLevelSection(raw, 'publicPage'),
    readTopLevelSection(readTopLevelSection(raw, 'LovableOutput'), 'publicPage'),
    fenced ? readTopLevelSection(fenced, 'publicPage') : '',
    fenced ? readTopLevelSection(readTopLevelSection(fenced, 'LovableOutput'), 'publicPage') : '',
  ].filter((section, index, list) => section.trim() && list.indexOf(section) === index)

  for (const candidate of candidates) {
    const publicPage = parsePublicPageSection(candidate, diagnostics)
    if (publicPage) return publicPage
  }

  return undefined
}

function readPublicPageFromJson(raw: string, diagnostics: LovableOutputDiagnostic[]): PublicPageConfig | undefined {
  const json = raw.trim()
  if (!json || !json.startsWith('{')) return undefined

  try {
    const parsed = JSON.parse(json) as unknown
    if (!isRecordLike(parsed)) return undefined

    const publicPageValue = parsed.publicPage
      ?? (isRecordLike(parsed.LovableOutput) ? parsed.LovableOutput.publicPage : undefined)

    const publicPage = normalizePublicPageConfig(publicPageValue, 'lovable')
    diagnosePublicPageObject(publicPageValue, publicPage, diagnostics)

    return publicPage ? sanitizePublicPageImageRoles(publicPage, diagnostics) : undefined
  } catch {
    return undefined
  }
}

function parsePublicPageSection(section: string, diagnostics: LovableOutputDiagnostic[]): PublicPageConfig | undefined {
  if (!section.trim()) return undefined
  const rawSections = readIndentedSection(section, 'sections')
  const parsedSections = parseNestedListItems(rawSections)
  const imageRoles = parseKeyValues(readIndentedSection(section, 'imageRoles'))
  const publicPage = normalizePublicPageConfig({ sections: parsedSections, imageRoles }, 'lovable')
  diagnosePublicPageObject({ sections: parsedSections, imageRoles }, publicPage, diagnostics)

  if (!publicPage && rawSections.trim()) {
    diagnostics.push(createDiagnostic('warning', 'publicPage', 'sections', '', 'La configuration de page publique est presente mais aucune section reconnue n a ete conservee.'))
  }

  return publicPage ? sanitizePublicPageImageRoles(publicPage, diagnostics) : undefined
}

function sanitizePublicPageImageRoles(publicPage: PublicPageConfig, diagnostics: LovableOutputDiagnostic[]): PublicPageConfig {
  const imageRoles = publicPage.imageRoles
  if (!imageRoles) return publicPage

  const validImageRoles: Partial<Record<PublicPageImageRole, string>> = {}
  Object.entries(imageRoles).forEach(([role, rawUrl]) => {
    const url = readOptionalString(rawUrl)
    if (!url) return
    if (!isPublicImageUrl(url)) {
      diagnostics.push(createDiagnostic('warning', 'publicPage', `imageRoles.${role}`, url, 'Image ignoree : fournissez une URL publique http(s), pas un chemin local ou src/assets.'))
      return
    }
    validImageRoles[role as PublicPageImageRole] = url
  })

  return {
    ...publicPage,
    imageRoles: Object.keys(validImageRoles).length ? validImageRoles : undefined,
  }
}

function diagnosePublicPageObject(value: unknown, publicPage: PublicPageConfig | null, diagnostics: LovableOutputDiagnostic[]) {
  if (!isRecordLike(value)) return
  const rawSections = Array.isArray(value.sections) ? value.sections : []
  const keptIds = new Set(publicPage?.sections.map((section) => section.id) ?? [])

  rawSections.forEach((section, index) => {
    if (!isRecordLike(section)) {
      diagnostics.push(createDiagnostic('warning', 'publicPage', `sections.${index}`, '', 'Section publicPage invalide ignoree.'))
      return
    }

    const type = readUnknownString(section.type)
    const id = readUnknownString(section.id)
    const expectedId = id || `${type}-${readUnknownString(section.variant) || 'section'}`
    if (type && !supportedPublicPageSectionTypes.includes(type as PublicPageSectionType)) {
      diagnostics.push(createDiagnostic('warning', 'publicPage', `sections.${index}.type`, type, 'Type de section publicPage inconnu ignore.'))
      return
    }

    if (!type || !keptIds.has(expectedId)) {
      diagnostics.push(createDiagnostic('warning', 'publicPage', `sections.${index}`, id || type, 'Section publicPage invalide ignoree.'))
    }
  })

  if (isRecordLike(value.imageRoles)) {
    Object.keys(value.imageRoles).forEach((role) => {
      if (!supportedPublicPageImageRoles.includes(role as PublicPageImageRole)) {
        diagnostics.push(createDiagnostic('warning', 'publicPage', `imageRoles.${role}`, role, 'Role image publicPage inconnu ignore.'))
      }
    })
  }
}

function parseNestedListItems(section: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = []
  let current: Record<string, unknown> | null = null
  let nestedKey = ''
  let nestedIndent = -1

  section.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    if (trimmed.startsWith('- ')) {
      if (current) items.push(current)
      current = {}
      nestedKey = ''
      nestedIndent = -1
      assignYamlPair(current, trimmed.slice(2))
      return
    }

    if (!current) return
    const indent = getIndent(line)
    if (nestedKey && indent <= nestedIndent) {
      nestedKey = ''
      nestedIndent = -1
    }
    const pair = splitYamlPair(trimmed)
    if (!pair) return

    if (!pair.value) {
      current[pair.key] = {}
      nestedKey = pair.key
      nestedIndent = indent
      return
    }

    if (nestedKey && pair.key !== nestedKey && isRecordLike(current[nestedKey])) {
      ;(current[nestedKey] as Record<string, unknown>)[pair.key] = readString(pair.value)
      return
    }

    nestedKey = ''
    current[pair.key] = readString(pair.value)
  })

  if (current) items.push(current)
  return items
}

function assignYamlPair(target: Record<string, unknown>, value: string) {
  const pair = splitYamlPair(value)
  if (pair) target[pair.key] = readString(pair.value)
}

function splitYamlPair(value: string) {
  const separator = value.indexOf(':')
  if (separator < 1) return null
  return {
    key: value.slice(0, separator).trim(),
    value: value.slice(separator + 1).trim(),
  }
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeLovableDemoOutput(output: LovableDemoOutput): LovableDemoOutput {
  return {
    ...output,
    demo: output.demo ?? { url: '' },
    visualBlueprint: output.visualBlueprint ?? {
      raw: '',
      normalized: null,
      diagnostics: [],
    },
    visualPack: normalizeLovableVisualPack(output.visualPack),
    publicPage: output.publicPage ? normalizePublicPageConfig(output.publicPage, output.publicPage.source) ?? undefined : undefined,
    unsupportedCapabilities: Array.isArray(output.unsupportedCapabilities) ? output.unsupportedCapabilities : [],
    diagnostics: Array.isArray(output.diagnostics) ? output.diagnostics : [],
  }
}

function normalizeLovableVisualPack(visualPack: LovableDemoOutput['visualPack'] | undefined): LovableVisualPack {
  const logo = visualPack?.logo ?? { status: 'missing' as const }
  const palette = normalizePalette(visualPack?.palette ?? visualPack?.colors)
  const typography = visualPack?.typography ?? { source: 'fallback' as const }
  const headingTypography = readOptionalString(typography.heading)
  const bodyTypography = readOptionalString(typography.body)

  return {
    logoUrl: readOptionalString(visualPack?.logoUrl) || readOptionalString(logo.url),
    heroImageUrl: readOptionalString(visualPack?.heroImageUrl),
    logo: {
      status: logoStatuses.includes(logo.status) ? logo.status : 'missing',
      url: readOptionalString(logo.url) || readOptionalString(visualPack?.logoUrl),
    },
    palette,
    colors: palette,
    imageRoles: normalizeVisualPackImageRoles(visualPack?.imageRoles),
    typography: {
      heading: headingTypography,
      body: bodyTypography,
      displayWeight: readOptionalString(typography.displayWeight),
      displayTracking: readOptionalString(typography.displayTracking),
      italicAccent: Boolean(typography.italicAccent),
      bodyWeight: readOptionalString(typography.bodyWeight),
      bodySize: readOptionalString(typography.bodySize),
      eyebrowCase: readOptionalString(typography.eyebrowCase),
      eyebrowTracking: readOptionalString(typography.eyebrowTracking),
      eyebrowSize: readOptionalString(typography.eyebrowSize),
      headlineScale: readOptionalString(typography.headlineScale),
      verticalRhythm: readOptionalString(typography.verticalRhythm),
      source: typographySources.includes(typography.source) ? typography.source : headingTypography || bodyTypography ? 'detected' : 'fallback',
    },
    sectionImages: normalizeImageEntries(visualPack?.sectionImages),
    homeImages: normalizeImageEntries(visualPack?.homeImages),
  }
}

function normalizePalette(value: LovableVisualPalette | undefined): LovableVisualPalette {
  const palette: LovableVisualPalette = {}
  Object.entries(value ?? {}).forEach(([key, rawColor]) => {
    const color = readOptionalString(rawColor)
    if (color) palette[key] = color
  })
  return palette
}

function normalizeImageEntries(value: LovableVisualPack['homeImages'] | undefined): LovableVisualPack['homeImages'] {
  if (!Array.isArray(value)) return []

  return value
    .map((image) => ({
      role: imageRoles.includes(image.role) ? image.role : 'section',
      url: readString(image.url),
      alt: readOptionalString(image.alt),
      description: readOptionalString(image.description),
      sourceUrl: readOptionalString(image.sourceUrl),
    }))
    .filter((image) => image.url && isPublicImageUrl(image.url))
}

function normalizeVisualPackImageRoles(value: LovableVisualPack['imageRoles'] | undefined): LovableVisualPack['imageRoles'] {
  const roles: Partial<Record<PublicPageImageRole, string>> = {}
  Object.entries(value ?? {}).forEach(([role, rawUrl]) => {
    const url = readOptionalString(rawUrl)
    if (url && supportedPublicPageImageRoles.includes(role as PublicPageImageRole) && isPublicImageUrl(url)) {
      roles[role as PublicPageImageRole] = url
    }
  })

  return Object.keys(roles).length ? roles : undefined
}

function normalizeEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
  diagnostics: LovableOutputDiagnostic[],
  section: LovableOutputDiagnostic['section'],
  property: string,
): T {
  const normalized = readString(value).toLowerCase()
  if (!normalized) return fallback
  if (allowed.includes(normalized as T)) return normalized as T

  diagnostics.push(createDiagnostic('warning', section, property, normalized, `Valeur inconnue. Fallback applique : ${fallback}.`))

  return fallback
}

function readRootScalar(raw: string, key: string): string {
  const regex = new RegExp(`^\\s{0,2}${escapeRegExp(key)}\\s*:\\s*([^\\n]+)$`, 'im')
  const match = raw.match(regex)

  return readString(match?.[1])
}

function readTopLevelSection(raw: string, sectionName: string): string {
  const lines = raw.split(/\r?\n/)
  const start = lines.findIndex((line) => new RegExp(`^\\s{2}${escapeRegExp(sectionName)}\\s*:\\s*$`, 'i').test(line) || new RegExp(`^${escapeRegExp(sectionName)}\\s*:\\s*$`, 'i').test(line))
  if (start < 0) return ''

  const baseIndent = getIndent(lines[start])
  const collected: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() && getIndent(line) <= baseIndent && /^[A-Za-z][\w-]*\s*:/.test(line.trim())) break
    collected.push(line.slice(Math.min(line.length, baseIndent + 2)))
  }

  return collected.join('\n')
}

function readBlockScalar(raw: string, sectionName: string): string {
  const lines = raw.split(/\r?\n/)
  const start = lines.findIndex((line) => new RegExp(`^\\s{2}${escapeRegExp(sectionName)}\\s*:\\s*\\|\\s*$`, 'i').test(line) || new RegExp(`^${escapeRegExp(sectionName)}\\s*:\\s*\\|\\s*$`, 'i').test(line))
  if (start < 0) return ''

  const baseIndent = getIndent(lines[start])
  const collected: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() && getIndent(line) <= baseIndent && /^[A-Za-z][\w-]*\s*:/.test(line.trim())) break
    collected.push(line.slice(Math.min(line.length, baseIndent + 2)))
  }

  return collected.join('\n').trim()
}

function readNestedSection(section: string, key: string): string {
  return readIndentedSection(section, key)
}

function readListSection(section: string, key: string): string {
  return readIndentedSection(section, key)
}

function readIndentedSection(section: string, key: string): string {
  const lines = section.split(/\r?\n/)
  const start = lines.findIndex((line) => new RegExp(`^\\s*${escapeRegExp(key)}\\s*:\\s*$`, 'i').test(line))
  if (start < 0) return ''

  const baseIndent = getIndent(lines[start])
  const collected: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() && getIndent(line) <= baseIndent && /^[A-Za-z][\w-]*\s*:/.test(line.trim())) break
    collected.push(line.slice(Math.min(line.length, baseIndent + 2)))
  }

  return collected.join('\n')
}

function parseKeyValues(section: string): Record<string, string> {
  const values: Record<string, string> = {}
  section.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('- ')) return
    const separator = trimmed.indexOf(':')
    if (separator < 1) return
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (!value || value === '|') return
    values[key] = readString(value)
  })

  return values
}

function parseListItems(section: string): Array<Record<string, string>> {
  const items: Array<Record<string, string>> = []
  let current: Record<string, string> | null = null

  section.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    if (trimmed.startsWith('- ')) {
      if (current) items.push(current)
      current = {}
      const first = trimmed.slice(2)
      const separator = first.indexOf(':')
      if (separator > 0) {
        current[first.slice(0, separator).trim()] = readString(first.slice(separator + 1).trim())
      }
      return
    }

    if (!current) return
    const separator = trimmed.indexOf(':')
    if (separator > 0) {
      current[trimmed.slice(0, separator).trim()] = readString(trimmed.slice(separator + 1).trim())
    }
  })

  if (current) items.push(current)

  return items
}

function collectUnknownRootSections(raw: string, diagnostics: LovableOutputDiagnostic[]) {
  if (extractDirectVisualBlueprintFromText(raw)) return

  raw.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || getIndent(line) !== 0) return
    const match = line.trim().match(/^([A-Za-z][\w-]*)\s*:/)
    const section = match?.[1]
    if (section && !allowedRootSections.has(section.toLowerCase())) {
      diagnostics.push(createDiagnostic('warning', 'root', section, '', 'Section inconnue dans le retour Lovable. Elle sera ignoree.'))
    }
  })
}

function extractVisualBlueprintFromText(raw: string): string {
  const lines = raw.split(/\r?\n/)
  const start = lines.findIndex((line) => line.trim() === 'VisualBlueprint:')
  if (start < 0) return ''

  const collected: string[] = []
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index]
    if (index > start && line.trim() && getIndent(line) === 0 && /^[A-Za-z][\w-]*\s*:/.test(line.trim())) break
    collected.push(line)
  }

  return collected.join('\n').trim()
}

function extractMarkdownSection(raw: string, headings: string[], stopHeadings: string[]): string {
  const lines = raw.split(/\r?\n/)
  const start = lines.findIndex((line) => {
    const normalized = normalizeHeading(line)
    return headings.some((heading) => normalized.includes(normalizeHeading(heading)))
  })
  if (start < 0) return ''

  const collected: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const normalized = normalizeHeading(line)
    if (stopHeadings.some((heading) => normalized.includes(normalizeHeading(heading)))) break
    collected.push(line)
  }

  return collected.join('\n').trim()
}

function extractFirstUrl(raw: string, contextPattern?: RegExp, allowAny = true): string {
  const urls = extractUrlEntries(raw)
  const contextual = contextPattern
    ? urls.find((entry) => contextPattern.test(entry.description ?? '') || contextPattern.test(entry.url))
    : undefined

  return contextual?.url || (allowAny ? urls[0]?.url : '') || ''
}

function parseMarkdownUnsupportedCapabilities(section: string): UnsupportedCapability[] {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ''))
    .filter((line) => line && !/^aucun|none|néant|neant/i.test(line))
    .map((line) => ({
      label: line.slice(0, 120),
      description: line.length > 120 ? line : undefined,
      category: inferUnsupportedCategory(line),
      importance: inferUnsupportedImportance(line),
    }))
}

function extractDirectVisualBlueprintFromText(raw: string): string {
  const source = extractFencedCode(raw) || raw
  const lines = source.split(/\r?\n/)
  const hasVersion = lines.some((line) => line.trim() === 'version: v1')
  const hasKnownBlueprintSection = lines.some((line) => {
    const section = line.trim().match(/^([A-Za-z][\w-]*)\s*:/)?.[1]?.toLowerCase()

    return Boolean(section && ['brand', 'layout', 'hero', 'navigation', 'typography', 'sections', 'propertycards', 'buttons', 'forms', 'dashboard', 'responsive'].includes(section))
  })

  if (!hasVersion || !hasKnownBlueprintSection) return ''

  return source.trim()
}

function extractFencedCode(raw: string): string {
  const match = raw.match(/```(?:yaml|yml|text)?\s*([\s\S]*?)```/i)

  return match?.[1]?.trim() ?? ''
}

function readString(value?: string): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '')
}

function readUnknownString(value: unknown): string {
  return typeof value === 'string' ? readString(value) : ''
}

function readOptionalString(value?: string): string | undefined {
  const trimmed = readString(value)

  return trimmed || undefined
}

function parseBooleanText(value?: string): boolean | undefined {
  const trimmed = readString(value).toLowerCase()
  if (!trimmed) return undefined
  if (['true', 'yes', 'oui', '1'].includes(trimmed)) return true
  if (['false', 'no', 'non', '0'].includes(trimmed)) return false
  return undefined
}

function splitTextList(value: string): string[] {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isPublicImageUrl(value: string): boolean {
  if (/^\/?src\/assets\//i.test(value.trim())) return false
  return isValidHttpUrl(value)
}

function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
}

function getIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0
}

function createDiagnostic(
  level: LovableOutputDiagnosticLevel,
  section: LovableOutputDiagnostic['section'],
  property: string,
  value: string,
  message: string,
): LovableOutputDiagnostic {
  return {
    level,
    section,
    property,
    value,
    message,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
