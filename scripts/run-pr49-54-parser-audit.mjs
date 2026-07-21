import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const git = 'C:\\Program Files\\Git\\cmd\\git.exe'
const fixturePath = join(root, 'src/golden-demos/cote-particuliers-tarbes/lovable-output.yaml')
const source = readFileSync(fixturePath, 'utf8')
const states = [
  ['pre-pr49', '9eec8d7b0db67d7963ae2748d268d0d47cace5a6'],
  ['pr49', '6434117c03f25a6eb7a3c464e9fc462024acddbb'],
  ['pr50', 'c0f4f7f354f67754c3a19fff499cece1baf8b1bb'],
  ['pr51', '898c803b946cc5e205002437f323dc590ff44e51'],
  ['pr52', 'ec1ba0e16ebe2a144b157bf16df76b9ec823937c'],
  ['pr53', '01667d5dc77f170662d6d9c7099f14a1f2dfdd45'],
  ['pr54', '2042dddc2897f46fc4212a1a9ac7577a47887a90'],
  ['current', 'origin/main'],
]

const diagnosticsRoot = join(root, 'docs/regression-audit/pr49-54/diagnostics')
mkdirSync(diagnosticsRoot, { recursive: true })
const summary = []

for (const [name, sha] of states) {
  const tempDir = join(root, `.tmp-parser-${name}`)
  rmSync(tempDir, { recursive: true, force: true })
  mkdirSync(join(tempDir, 'src/lib'), { recursive: true })
  const result = { name, sha, parserAvailable: true, error: '', metrics: null }

  try {
    for (const file of ['lovableOutput.ts', 'visualBlueprint.ts', 'publicPageConfig.ts']) {
      const content = execFileSync(git, ['show', `${sha}:src/lib/${file}`], { cwd: root, encoding: 'utf8' })
      writeFileSync(join(tempDir, 'src/lib', file), content)
    }

    const lovableOutputCopy = join(tempDir, 'src/lib/lovableOutput.ts')
    writeFileSync(
      lovableOutputCopy,
      readFileSync(lovableOutputCopy, 'utf8')
        .replaceAll("from './visualBlueprint'", "from './visualBlueprint.ts'")
        .replaceAll("from './publicPageConfig'", "from './publicPageConfig.ts'"),
    )

    const { parseLovableOutput } = await import(`${pathToFileURL(lovableOutputCopy).href}?state=${name}-${Date.now()}`)
    const parsed = parseLovableOutput(source)
    const output = parsed.output
    const visualPack = output.visualPack ?? {}
    const publicPage = output.publicPage
    result.metrics = {
      visualBlueprintRecognized: Boolean(output.visualBlueprint?.raw && output.visualBlueprint?.normalized),
      visualBlueprintRawLength: output.visualBlueprint?.raw?.length ?? 0,
      visualPackRecognized: Boolean(visualPack && Object.values(visualPack.colors ?? visualPack.palette ?? {}).filter(Boolean).length > 0),
      colorCount: new Set(Object.values(visualPack.colors ?? visualPack.palette ?? {}).filter(Boolean)).size,
      typographyHeading: visualPack.typography?.heading ?? '',
      typographyBody: visualPack.typography?.body ?? '',
      visualPackImageRoleCount: Object.values(visualPack.imageRoles ?? {}).filter(Boolean).length,
      publicPageSections: publicPage?.sections?.length ?? 0,
      publicPageActiveSections: publicPage?.sections?.filter((section) => section.enabled).length ?? 0,
      publicPageImageRoleCount: Object.values(publicPage?.imageRoles ?? {}).filter(Boolean).length,
      heroTitle: publicPage?.sections?.find((section) => section.type === 'hero')?.title ?? '',
      heroDescription: publicPage?.sections?.find((section) => section.type === 'hero')?.description ?? '',
      heroPrimaryCta: publicPage?.sections?.find((section) => section.type === 'hero')?.primaryCta?.label ?? '',
      heroImageRole: publicPage?.sections?.find((section) => section.type === 'hero')?.imageRole ?? '',
      heroImageUrl: publicPage?.imageRoles?.hero ?? visualPack.imageRoles?.hero ?? visualPack.heroImageUrl ?? '',
      propertiesTitle: publicPage?.sections?.find((section) => section.type === 'properties')?.title ?? '',
      mobileOrder: publicPage?.sections?.map((section) => `${section.mobileOrder ?? section.desktopOrder ?? ''}:${section.id}`).join(',') ?? '',
      unsupportedCapabilities: output.unsupportedCapabilities?.length ?? 0,
      diagnostics: parsed.diagnostics?.length ?? 0,
      errors: parsed.diagnostics?.filter((diagnostic) => diagnostic.level === 'error').length ?? 0,
      warnings: parsed.diagnostics?.filter((diagnostic) => diagnostic.level === 'warning').length ?? 0,
    }
    writeFileSync(join(diagnosticsRoot, `${name}.json`), `${JSON.stringify({ ...result, diagnostics: parsed.diagnostics }, null, 2)}\n`)
  } catch (error) {
    result.parserAvailable = false
    result.error = error instanceof Error ? error.message : String(error)
    writeFileSync(join(diagnosticsRoot, `${name}.json`), `${JSON.stringify(result, null, 2)}\n`)
  } finally {
    summary.push(result)
    rmSync(tempDir, { recursive: true, force: true })
  }
}

writeFileSync(join(diagnosticsRoot, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary.map((entry) => ({ name: entry.name, sha: entry.sha, parserAvailable: entry.parserAvailable, metrics: entry.metrics, error: entry.error })), null, 2))
