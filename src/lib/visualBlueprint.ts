export type VisualBlueprintSectionName =
  | 'brand'
  | 'layout'
  | 'hero'
  | 'header'
  | 'navigation'
  | 'footer'
  | 'sidebar'
  | 'container'
  | 'grid'
  | 'sections'
  | 'propertyCards'
  | 'buttons'
  | 'typography'
  | 'images'
  | 'forms'
  | 'dashboard'
  | 'mobileNavigation'
  | 'responsive'

export type VisualBlueprintV1 = Record<VisualBlueprintSectionName, Record<string, string>> & {
  version: 'v1'
  raw: string
}

const visualBlueprintSections = new Set<VisualBlueprintSectionName>([
  'brand',
  'layout',
  'hero',
  'header',
  'navigation',
  'footer',
  'sidebar',
  'container',
  'grid',
  'sections',
  'propertyCards',
  'buttons',
  'typography',
  'images',
  'forms',
  'dashboard',
  'mobileNavigation',
  'responsive',
])

export function parseVisualBlueprintV1(value?: string): VisualBlueprintV1 | null {
  if (!value) return null

  const lines = value.split(/\r?\n/)
  const hasRoot = lines.some((line) => line.trim() === 'VisualBlueprint:')
  const hasVersion = lines.some((line) => line.trim() === 'version: v1')

  if (!hasRoot || !hasVersion) return null

  const blueprint: VisualBlueprintV1 = {
    version: 'v1',
    raw: value,
    brand: {},
    layout: {},
    hero: {},
    header: {},
    navigation: {},
    footer: {},
    sidebar: {},
    container: {},
    grid: {},
    sections: {},
    propertyCards: {},
    buttons: {},
    typography: {},
    images: {},
    forms: {},
    dashboard: {},
    mobileNavigation: {},
    responsive: {},
  }
  let currentSection: VisualBlueprintSectionName | '' = ''

  lines.forEach((line) => {
    const sectionMatch = line.match(/^\s{2}([A-Za-z][A-Za-z0-9_-]*)\s*:\s*$/)
    if (sectionMatch) {
      const section = sectionMatch[1] as VisualBlueprintSectionName
      currentSection = visualBlueprintSections.has(section) ? section : ''
      return
    }

    if (!currentSection) return

    const fieldMatch = line.match(/^\s{4}([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/)
    if (!fieldMatch) return

    const rawValue = cleanVisualBlueprintValue(fieldMatch[2])
    if (!rawValue) return

    blueprint[currentSection][fieldMatch[1]] = rawValue
  })

  return blueprint
}

export function cleanVisualBlueprintValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, '')
}

