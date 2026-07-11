import {
  parseVisualBlueprintV1Result,
  type VisualBlueprintDiagnostic,
  type VisualBlueprintV1,
} from './visualBlueprint'

export const LOVABLE_OUTPUT_VERSION = 'v1'

export type LovableOutputDiagnosticLevel = 'info' | 'warning' | 'error'

export type LovableOutputDiagnostic = {
  level: LovableOutputDiagnosticLevel
  section: 'root' | 'demo' | 'visualBlueprint' | 'visualPack' | 'unsupportedCapabilities'
  property?: string
  value?: string
  message: string
}

export type LovableLogoStatus = 'found' | 'missing' | 'proposed'
export type LovableTypographySource = 'detected' | 'proposed' | 'fallback'
export type LovableHomeImageRole = 'hero' | 'section' | 'background' | 'gallery'
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

export type LovableVisualPack = {
  logo: {
    status: LovableLogoStatus
    url?: string
  }
  colors: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    surface?: string
    text?: string
  }
  typography: {
    heading?: string
    body?: string
    source: LovableTypographySource
  }
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
    visualMood?: string
    imageReferences?: string
    reusableImages?: Array<{ url?: string; fileName?: string }>
    websiteScreenshots?: Array<{ url?: string; fileName?: string }>
  }
}

const allowedRootSections = new Set(['LovableOutput', 'version', 'demo', 'visualBlueprint', 'visualPack', 'unsupportedCapabilities'])
const logoStatuses: LovableLogoStatus[] = ['found', 'missing', 'proposed']
const typographySources: LovableTypographySource[] = ['detected', 'proposed', 'fallback']
const imageRoles: LovableHomeImageRole[] = ['hero', 'section', 'background', 'gallery']
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
    diagnostics.push(createDiagnostic('error', 'root', 'LovableOutput', '', 'Collez le retour Lovable complet avant interpretation.'))
  }

  collectUnknownRootSections(source, diagnostics)

  const version = readRootScalar(source, 'version')
  if (!version) {
    diagnostics.push(createDiagnostic('error', 'root', 'version', '', 'La version du retour Lovable est absente.'))
  } else if (version !== LOVABLE_OUTPUT_VERSION) {
    diagnostics.push(createDiagnostic('error', 'root', 'version', version, `Version LovableOutput inconnue. Version attendue : ${LOVABLE_OUTPUT_VERSION}.`))
  }

  const demo = parseDemoSection(readTopLevelSection(source, 'demo'), diagnostics)
  const visualBlueprint = parseVisualBlueprintSection(readBlockScalar(source, 'visualBlueprint'), diagnostics)
  const visualPack = parseVisualPackSection(readTopLevelSection(source, 'visualPack'), diagnostics)
  const unsupportedCapabilities = parseUnsupportedCapabilities(readTopLevelSection(source, 'unsupportedCapabilities'), diagnostics)

  const output: LovableDemoOutput = {
    version: LOVABLE_OUTPUT_VERSION,
    demo,
    visualBlueprint,
    visualPack,
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

  if (!output.demo.url) {
    diagnostics.push(createDiagnostic('error', 'demo', 'url', '', 'Le lien de demo Lovable est obligatoire.'))
  } else if (!isValidHttpUrl(output.demo.url)) {
    diagnostics.push(createDiagnostic('error', 'demo', 'url', output.demo.url, 'Le lien de demo Lovable doit etre une URL http(s) valide.'))
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

  if (output.visualPack.logo.status === 'found' && !output.visualPack.logo.url) {
    diagnostics.push(createDiagnostic('warning', 'visualPack', 'logo.url', '', 'Le logo est marque "found" mais aucune URL officielle n est fournie.'))
  }

  if (output.visualPack.logo.url && !isValidHttpUrl(output.visualPack.logo.url)) {
    diagnostics.push(createDiagnostic('warning', 'visualPack', 'logo.url', output.visualPack.logo.url, 'L URL du logo est invalide.'))
  }

  Object.entries(output.visualPack.colors).forEach(([key, value]) => {
    if (value && !isHexColor(value)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `colors.${key}`, value, 'La couleur doit etre un hexadeximal #RGB ou #RRGGBB.'))
    }
  })

  if (!output.visualPack.typography.heading && !output.visualPack.typography.body && output.visualPack.typography.source !== 'fallback') {
    diagnostics.push(createDiagnostic('info', 'visualPack', 'typography', '', 'Aucune typographie detectee ou proposee.'))
  }

  output.visualPack.homeImages.forEach((image, index) => {
    if (!isValidHttpUrl(image.url)) {
      diagnostics.push(createDiagnostic('warning', 'visualPack', `homeImages.${index}.url`, image.url, 'L image de home doit utiliser une URL http(s) valide.'))
    }
  })

  return diagnostics
}

export function resolveProjectLovableOutput(project: LegacyLovableProject): LovableDemoOutput {
  if (project.lovableOutput) {
    const diagnostics = project.lovableOutput.diagnostics?.length
      ? project.lovableOutput.diagnostics
      : validateLovableOutput(project.lovableOutput)

    return {
      ...project.lovableOutput,
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
      logo: {
        status: project.demoAssets?.logoUrl ? 'found' : 'missing',
        url: project.demoAssets?.logoUrl || undefined,
      },
      colors: {},
      typography: {
        source: 'fallback',
      },
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
    logo:
      status: found
      url: "https://example.com/logo.svg"
    colors:
      primary: "#111827"
      accent: "#B08D57"
      background: "#FFFFFF"
      text: "#111827"
    typography:
      heading: "Playfair Display"
      body: "Inter"
      source: detected
    homeImages:
      - role: hero
        url: "https://example.com/home-hero.jpg"
        alt: "Facade de l agence"
        sourceUrl: "https://example.com"

  unsupportedCapabilities:
    - category: section
      importance: medium
      label: "Timeline animee"
      description: "La demo Lovable montre une frise animee non supportee par le moteur actuel."`
}

function parseDemoSection(section: string, diagnostics: LovableOutputDiagnostic[]): LovableDemoReference {
  const values = parseKeyValues(section)
  const url = readString(values.url)

  if (!section.trim()) {
    diagnostics.push(createDiagnostic('error', 'demo', 'demo', '', 'La section demo est absente.'))
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

  return {
    raw: blueprintRaw,
    normalized: parsed.blueprint,
    diagnostics: parsed.diagnostics,
  }
}

function parseVisualPackSection(section: string, diagnostics: LovableOutputDiagnostic[]): LovableVisualPack {
  if (!section.trim()) {
    diagnostics.push(createDiagnostic('warning', 'visualPack', 'visualPack', '', 'La section visualPack est absente.'))
  }

  const logoValues = parseKeyValues(readNestedSection(section, 'logo'))
  const colorValues = parseKeyValues(readNestedSection(section, 'colors'))
  const typographyValues = parseKeyValues(readNestedSection(section, 'typography'))
  const logoStatus = normalizeEnum(logoValues.status, logoStatuses, 'missing', diagnostics, 'visualPack', 'logo.status')
  const typographySource = normalizeEnum(typographyValues.source, typographySources, 'fallback', diagnostics, 'visualPack', 'typography.source')
  const colors: LovableVisualPack['colors'] = {}

  colorKeys.forEach((key) => {
    const value = readOptionalString(colorValues[key])
    if (value) colors[key] = value
  })

  return {
    logo: {
      status: logoStatus,
      url: readOptionalString(logoValues.url),
    },
    colors,
    typography: {
      heading: readOptionalString(typographyValues.heading),
      body: readOptionalString(typographyValues.body),
      source: typographySource,
    },
    homeImages: parseHomeImages(readListSection(section, 'homeImages'), diagnostics),
  }
}

function parseHomeImages(section: string, diagnostics: LovableOutputDiagnostic[]): LovableVisualPack['homeImages'] {
  return parseListItems(section).map((item, index) => ({
    role: normalizeEnum(item.role, imageRoles, 'section', diagnostics, 'visualPack', `homeImages.${index}.role`),
    url: readString(item.url),
    alt: readOptionalString(item.alt),
    description: readOptionalString(item.description),
    sourceUrl: readOptionalString(item.sourceUrl),
  })).filter((item) => item.url)
}

function parseUnsupportedCapabilities(section: string, diagnostics: LovableOutputDiagnostic[]): UnsupportedCapability[] {
  if (!section.trim()) return []

  return parseListItems(section).map((item, index) => ({
    label: readString(item.label),
    description: readOptionalString(item.description),
    category: normalizeEnum(item.category, unsupportedCategories, 'other', diagnostics, 'unsupportedCapabilities', `${index}.category`),
    importance: normalizeEnum(item.importance, unsupportedImportances, 'medium', diagnostics, 'unsupportedCapabilities', `${index}.importance`),
  })).filter((item) => item.label)
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
  const start = lines.findIndex((line) => new RegExp(`^\\s{2}${escapeRegExp(sectionName)}\\s*:\\s*$`).test(line) || new RegExp(`^${escapeRegExp(sectionName)}\\s*:\\s*$`).test(line))
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
  const start = lines.findIndex((line) => new RegExp(`^\\s{2}${escapeRegExp(sectionName)}\\s*:\\s*\\|\\s*$`).test(line) || new RegExp(`^${escapeRegExp(sectionName)}\\s*:\\s*\\|\\s*$`).test(line))
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
  const start = lines.findIndex((line) => new RegExp(`^\\s*${escapeRegExp(key)}\\s*:\\s*$`).test(line))
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
  raw.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || getIndent(line) > 2) return
    const match = line.trim().match(/^([A-Za-z][\w-]*)\s*:/)
    const section = match?.[1]
    if (section && !allowedRootSections.has(section)) {
      diagnostics.push(createDiagnostic('warning', 'root', section, '', 'Section inconnue dans le retour Lovable. Elle sera ignoree.'))
    }
  })
}

function readString(value?: string): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '')
}

function readOptionalString(value?: string): string | undefined {
  const trimmed = readString(value)

  return trimmed || undefined
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
