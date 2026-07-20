import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'src/golden-demos/golden-demos.manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function readJson(relativePath) {
  const path = join(root, relativePath)
  assert(existsSync(path), `Missing file: ${relativePath}`)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8'))
}

function sha256(relativePath) {
  return createHash('sha256').update(readFileSync(join(root, relativePath))).digest('hex')
}

assert(Array.isArray(manifest), 'Golden demo manifest must be an array.')
assert(manifest.length >= 2, 'At least two golden demo slots must be declared.')

for (const demo of manifest) {
  assert(demo.slug && typeof demo.slug === 'string', 'Each demo needs a slug.')
  assert(['complete', 'partial', 'blocked'].includes(demo.status), `${demo.slug}: invalid status ${demo.status}.`)
  assert(demo.route === `/golden/${demo.slug}`, `${demo.slug}: route must be /golden/${demo.slug}.`)
  assert(!demo.route.includes('agencyId'), `${demo.slug}: route must not depend on agencyId.`)

  const metadata = readJson(demo.metadataPath)
  const normalized = readJson(demo.normalizedOutputPath)
  const imageManifest = readJson(demo.imageManifestPath)
  const businessData = readJson(demo.businessDataPath)

  assert(metadata?.status === demo.status, `${demo.slug}: metadata status mismatch.`)
  assert(normalized?.status === demo.status, `${demo.slug}: normalized status mismatch.`)
  assert(imageManifest?.status === demo.status, `${demo.slug}: image manifest status mismatch.`)
  assert(businessData?.status === demo.status, `${demo.slug}: business data status mismatch.`)

  if (demo.status === 'complete') {
    assert(demo.lovableOutputPath, `${demo.slug}: complete demo requires lovable-output.yaml.`)
    assert(metadata?.sourceHash, `${demo.slug}: complete demo requires sourceHash.`)
    assert(normalized?.visualBlueprint, `${demo.slug}: complete demo requires normalized VisualBlueprint.`)
    assert(normalized?.visualPack, `${demo.slug}: complete demo requires normalized VisualPack.`)
    assert(normalized?.publicPage, `${demo.slug}: complete demo requires normalized PublicPageConfig.`)
    assert(businessData?.properties?.length > 0, `${demo.slug}: complete demo requires fixed properties.`)
  } else {
    assert(demo.missing?.length > 0, `${demo.slug}: incomplete demo must list missing elements.`)
    assert(metadata?.sourceHash === null, `${demo.slug}: incomplete demo must not invent sourceHash.`)
  }

  for (const capturePath of [...(demo.lovableCapturePaths ?? []), ...(demo.sdCapturePaths ?? [])]) {
    assert(existsSync(join(root, capturePath)), `${demo.slug}: missing capture ${capturePath}.`)
  }

  for (const image of imageManifest?.images ?? []) {
    assert(image.path && existsSync(join(root, image.path)), `${demo.slug}: missing image path ${image.path}.`)
    if (image.sha256 && image.path && existsSync(join(root, image.path))) {
      assert(sha256(image.path) === image.sha256, `${demo.slug}: hash mismatch for ${image.path}.`)
    }
  }
}

if (failures.length) {
  console.error('Golden demo verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Golden demo verification passed for ${manifest.length} demo slots.`)
