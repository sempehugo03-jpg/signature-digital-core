import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = 'src/golden-demos/cote-particuliers-tarbes/lovable-output.yaml'
const outputPath = 'src/golden-demos/cote-particuliers-tarbes/normalized-output.json'
const diagnosticsPath = 'docs/regression-audit/pr49-54/diagnostics/current-parser.json'
const tempDir = join(root, '.tmp-golden-parser')

const source = readFileSync(join(root, sourcePath), 'utf8')
const sourceHash = createHash('sha256').update(source).digest('hex')

rmSync(tempDir, { recursive: true, force: true })
mkdirSync(join(tempDir, 'src/lib'), { recursive: true })

for (const file of ['lovableOutput.ts', 'visualBlueprint.ts', 'publicPageConfig.ts']) {
  cpSync(join(root, 'src/lib', file), join(tempDir, 'src/lib', file))
}

const lovableOutputCopy = join(tempDir, 'src/lib/lovableOutput.ts')
writeFileSync(
  lovableOutputCopy,
  readFileSync(lovableOutputCopy, 'utf8')
    .replaceAll("from './visualBlueprint'", "from './visualBlueprint.ts'")
    .replaceAll("from './publicPageConfig'", "from './publicPageConfig.ts'"),
)

const { parseLovableOutput } = await import(pathToFileURL(lovableOutputCopy).href)
const result = parseLovableOutput(source)
const output = result.output
const normalized = {
  status: 'complete',
  normalizedBy: 'parseLovableOutput',
  sourcePath,
  sourceHash,
  checks: {
    visualBlueprintRecognized: Boolean(output.visualBlueprint.raw && output.visualBlueprint.normalized),
    visualPackRecognized: Boolean(output.visualPack && Object.values(output.visualPack.colors).filter(Boolean).length > 0),
    publicPageSections: output.publicPage?.sections.length ?? 0,
    activePublicPageSections: output.publicPage?.sections.filter((section) => section.enabled).length ?? 0,
    visualPackImageRoles: Object.keys(output.visualPack.imageRoles ?? {}),
    publicPageImageRoles: Object.keys(output.publicPage?.imageRoles ?? {}),
    unsupportedCapabilities: output.unsupportedCapabilities.length,
    diagnostics: result.diagnostics.length,
    errors: result.diagnostics.filter((diagnostic) => diagnostic.level === 'error').length,
    warnings: result.diagnostics.filter((diagnostic) => diagnostic.level === 'warning').length,
  },
  visualBlueprint: output.visualBlueprint,
  visualPack: output.visualPack,
  publicPage: output.publicPage,
  unsupportedCapabilities: output.unsupportedCapabilities,
  diagnostics: result.diagnostics,
  output,
}

mkdirSync(dirname(join(root, outputPath)), { recursive: true })
mkdirSync(dirname(join(root, diagnosticsPath)), { recursive: true })
writeFileSync(join(root, outputPath), `${JSON.stringify(normalized, null, 2)}\n`)
writeFileSync(join(root, diagnosticsPath), `${JSON.stringify(result.diagnostics, null, 2)}\n`)
rmSync(tempDir, { recursive: true, force: true })

const failures = []
if (!normalized.checks.visualBlueprintRecognized) failures.push('VisualBlueprint non reconnu')
if (!normalized.checks.visualPackRecognized) failures.push('VisualPack non reconnu')
if (normalized.checks.publicPageSections !== 9) failures.push(`publicPage.sections=${normalized.checks.publicPageSections}, attendu 9`)
if (normalized.checks.visualPackImageRoles.length < 8) failures.push(`VisualPack.imageRoles=${normalized.checks.visualPackImageRoles.length}, attendu >=8`)
if (normalized.checks.unsupportedCapabilities !== 5) failures.push(`unsupportedCapabilities=${normalized.checks.unsupportedCapabilities}, attendu 5`)

if (failures.length) {
  console.error('Normalisation Cote Particuliers invalide:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Normalized ${sourcePath}`)
console.log(`SHA-256 ${sourceHash}`)
console.log(JSON.stringify(normalized.checks, null, 2))
