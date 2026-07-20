import goldenDemosManifestRaw from './golden-demos.manifest.json?raw'

export type GoldenDemoStatus = 'complete' | 'partial' | 'blocked'

export type GoldenDemoManifestEntry = {
  slug: string
  name: string
  status: GoldenDemoStatus
  sourceType: string
  route: string
  lovableOutputPath: string | null
  normalizedOutputPath: string
  metadataPath: string
  imageManifestPath: string
  businessDataPath: string
  lovableCapturePaths: string[]
  sdCapturePaths: string[]
  missing: string[]
  notes: string
}

export const goldenDemos = JSON.parse(goldenDemosManifestRaw) as GoldenDemoManifestEntry[]

export function getGoldenDemoBySlug(slug: string) {
  return goldenDemos.find((demo) => demo.slug === slug)
}
