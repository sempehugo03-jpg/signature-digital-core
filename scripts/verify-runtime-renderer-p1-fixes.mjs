import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const auditRoot = resolve(root, process.env.PR57_AUDIT_ROOT || 'docs/runtime-renderer-audit/cote-particuliers/pr57-after')
const oppositeRoot = resolve(root, process.env.PR57_OPPOSITE_ROOT || 'docs/runtime-renderer-audit/cote-particuliers/pr57-opposite')
const local1440 = readJson(join(auditRoot, 'images-locales-audit/dom-1440.json'))
const local390 = readJson(join(auditRoot, 'images-locales-audit/dom-390.json'))
const source1440 = readJson(join(auditRoot, 'source-originale/dom-1440.json'))
const opposite1440 = readJson(join(oppositeRoot, 'images-locales-audit/dom-1440.json'))

const checks = [
  check('Hero keeps full envelope class', hasClass(local1440.dom.hero?.className, 'od-hero-layout-full')),
  check('Hero keeps editorial-split variant class', hasClass(local1440.dom.hero?.className, 'od-public-page-hero-variant-editorial-split')),
  check('Hero content is complete', local1440.dom.heroTitle?.textContent === "L'immobilier signé, avec discrétion."),
  check('Hero image slot is present', Boolean(local1440.dom.heroImage?.present)),
  check('Hero local audit image loads', Number(local1440.dom.heroImage?.naturalWidth ?? 0) > 0),
  check('Hero original Lovable image remains unavailable', Number(source1440.dom.heroImage?.naturalWidth ?? 0) === 0),
  check('Secondary CTA is rendered', local1440.dom.heroCtas?.[1]?.text === 'Découvrir nos biens'),
  check('Secondary CTA is readable on dark hero', isLightColor(local1440.dom.heroCtas?.[1]?.computed?.color)),
  check('Reviews section is rendered when enabled', local1440.dom.sections.some((section) => section.id === 'reviews-editorial')),
  check('Reviews section is rendered on mobile when enabled', local390.dom.sections.some((section) => section.id === 'reviews-editorial')),
  check('Opposite proof keeps compact hero variant', hasClass(opposite1440.dom.hero?.className, 'od-public-page-hero-variant-compact')),
  check('Opposite proof does not become editorial-split', !hasClass(opposite1440.dom.hero?.className, 'od-public-page-hero-variant-editorial-split')),
  check('Disabled reviews fixture produces no DOM section', !opposite1440.dom.sections.some((section) => section.id === 'reviews-main')),
  check('Estimate CTA target stays on click map', local1440.dom.heroCtas?.[0]?.text === 'Estimer mon bien'),
  check('Properties CTA target stays on click map', local1440.dom.heroCtas?.[1]?.text === 'Découvrir nos biens'),
]

const failed = checks.filter((item) => !item.passed)
console.log(JSON.stringify({ auditRoot, checks }, null, 2))

if (failed.length) {
  console.error(`PR57 runtime renderer proof failed: ${failed.map((item) => item.name).join(', ')}`)
  process.exit(1)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function check(name, passed) {
  return { name, passed: Boolean(passed) }
}

function hasClass(className = '', expected) {
  return String(className).split(/\s+/).includes(expected)
}

function isLightColor(value = '') {
  const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return false
  const [, r, g, b] = match.map(Number)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 180
}
