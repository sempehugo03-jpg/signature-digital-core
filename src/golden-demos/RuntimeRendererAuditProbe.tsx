import { useEffect, useState } from 'react'
import type { RealEstateAgencyRuntime } from '../data/realEstateAgencyConfig'
import { resolveAgencyIdentity } from '../lib/agencyIdentity'
import { buildPublicPageImageRoles, sortPublicPageSections } from '../lib/publicPageConfig'

type AuditProbeProps = {
  runtime: RealEstateAgencyRuntime
  mode: string
  sourceHash: string
}

export function RuntimeRendererAuditProbe({ runtime, mode, sourceHash }: AuditProbeProps) {
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSnapshot(createRuntimeSnapshot(runtime, mode, sourceHash))
    }, 750)

    return () => window.clearTimeout(timer)
  }, [mode, runtime, sourceHash])

  if (!snapshot) return null

  return (
    <script
      id="runtime-audit-json"
      type="application/json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForScript(snapshot) }}
    />
  )
}

function createRuntimeSnapshot(runtime: RealEstateAgencyRuntime, mode: string, sourceHash: string) {
  const agencyIdentity = resolveAgencyIdentity(runtime.agencyConfig)
  const contract = agencyIdentity.renderContract
  const publicPageConfig = runtime.agencyConfig.publicPageConfig
  const imageRoles = buildPublicPageImageRoles({
    heroImage: agencyIdentity.assets.heroImage,
    sectionImages: agencyIdentity.assets.sectionImages,
    configuredRoles: publicPageConfig?.imageRoles,
    source: publicPageConfig?.source,
  })

  return {
    capturedAt: new Date().toISOString(),
    route: window.location.pathname,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    mode,
    sourceHash,
    renderContract: {
      hero: contract.hero,
      navigation: contract.navigation,
      footer: contract.footer,
      sections: contract.sections,
      propertyCards: contract.propertyCards,
      forms: contract.forms,
      buttons: contract.buttons,
      dashboard: contract.dashboard,
      palette: contract.palette,
      typography: contract.typography,
      layout: contract.layout,
      images: contract.images,
      tokens: contract.tokens,
      debugRows: contract.debugRows,
      diagnostics: contract.diagnostics,
    },
    publicPage: {
      source: publicPageConfig?.source ?? 'missing',
      sections: publicPageConfig?.sections ?? [],
      desktopOrder: publicPageConfig ? sortPublicPageSections(publicPageConfig, 'desktop').map((section) => section.id) : [],
      mobileOrder: publicPageConfig ? sortPublicPageSections(publicPageConfig, 'mobile').map((section) => section.id) : [],
      imageRoles,
    },
    dom: collectDomSnapshot(),
  }
}

function collectDomSnapshot() {
  const root = document.querySelector<HTMLElement>('.od-public-home')
  const hero = document.querySelector<HTMLElement>('.od-hero')
  const heroTitle = document.querySelector<HTMLElement>('.od-hero-content h1')
  const heroCopy = document.querySelector<HTMLElement>('.od-hero-content')
  const heroImage = document.querySelector<HTMLImageElement>('.od-hero-image')
  const nav = document.querySelector<HTMLElement>('.od-public-nav')
  const navLogo = document.querySelector<HTMLImageElement>('.od-brand-logo')
  const properties = document.querySelector<HTMLElement>('#properties-selection')
  const propertyCards = Array.from(document.querySelectorAll<HTMLElement>('.od-property-card, .od-public-property-card'))
  const footer = document.querySelector<HTMLElement>('.od-agency-footer')
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.od-public-home > .od-public-section'))
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('.od-public-home img'))

  return {
    root: elementSnapshot(root, ['--od-render-heading-font', '--od-render-body-font', '--od-render-content-width']),
    navigation: elementSnapshot(nav, ['--od-render-nav-height', '--od-render-nav-background', '--od-render-nav-color', '--od-render-nav-logo-size']),
    navigationLogo: imageSnapshot(navLogo),
    hero: elementSnapshot(hero, ['--od-render-hero-height', '--od-render-hero-min-height', '--od-render-hero-content-gap']),
    heroTitle: {
      ...elementSnapshot(heroTitle, [
        '--od-render-heading-font',
        '--od-render-display-weight',
        '--od-render-display-tracking',
        '--od-token-title-size',
      ]),
      text: heroTitle?.innerText ?? '',
      textContent: heroTitle?.textContent ?? '',
      lines: (heroTitle?.innerText ?? '').split('\n').filter(Boolean),
    },
    heroCopy: elementSnapshot(heroCopy, ['--od-render-text-image-columns', '--od-render-hero-copy-gap', '--od-render-hero-cta-margin']),
    heroImage: imageSnapshot(heroImage),
    heroDescription: document.querySelector<HTMLElement>('.od-hero-content p')?.innerText ?? '',
    heroEyebrow: document.querySelector<HTMLElement>('.od-hero-content span')?.innerText ?? '',
    heroCtas: Array.from(document.querySelectorAll<HTMLButtonElement>('.od-hero-actions button')).map((button) => ({
      text: button.innerText,
      className: button.className,
      rect: rectSnapshot(button),
      computed: pickComputedStyle(button, ['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'opacity', 'display']),
    })),
    sections: sections.map((section) => ({
      id: section.id,
      className: section.className,
      text: compactText(section.innerText),
      rect: rectSnapshot(section),
      order: getComputedStyle(section).order,
      backgroundColor: getComputedStyle(section).backgroundColor,
      color: getComputedStyle(section).color,
    })),
    properties: {
      ...elementSnapshot(properties, ['--od-render-card-image-fit', '--od-render-card-image-position']),
      title: properties?.querySelector('h2')?.textContent ?? '',
      cardCount: propertyCards.length,
    },
    cards: propertyCards.map((card) => ({
      className: card.className,
      title: card.querySelector('h3')?.textContent ?? '',
      image: imageSnapshot(card.querySelector('img')),
      rect: rectSnapshot(card),
      computed: pickComputedStyle(card, ['display', 'gridTemplateColumns', 'backgroundColor', 'borderRadius', 'boxShadow', 'borderTopWidth']),
    })),
    footer: {
      ...elementSnapshot(footer, ['--od-render-footer-background', '--od-render-footer-color', '--od-render-footer-columns']),
      present: Boolean(footer),
      text: compactText(footer?.innerText ?? ''),
    },
    images: images.map((image) => imageSnapshot(image)),
    imageErrors: images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    bodyScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.documentElement.clientWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }
}

function elementSnapshot(element: Element | null | undefined, variables: string[]) {
  if (!element) return { present: false }
  const computed = getComputedStyle(element)
  return {
    present: true,
    tagName: element.tagName.toLowerCase(),
    className: element.getAttribute('class') ?? '',
    rect: rectSnapshot(element),
    computed: pickComputedStyle(element, [
      'display',
      'position',
      'width',
      'height',
      'minHeight',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'gap',
      'fontFamily',
      'fontSize',
      'fontWeight',
      'letterSpacing',
      'lineHeight',
      'backgroundColor',
      'color',
      'overflow',
      'objectFit',
      'objectPosition',
    ]),
    variables: Object.fromEntries(variables.map((name) => [name, computed.getPropertyValue(name).trim()])),
  }
}

function imageSnapshot(image: HTMLImageElement | Element | null | undefined) {
  if (!(image instanceof HTMLImageElement)) return { present: false }
  const computed = getComputedStyle(image)
  return {
    present: true,
    src: image.getAttribute('src') ?? '',
    currentSrc: image.currentSrc,
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    broken: image.complete && image.naturalWidth === 0,
    rect: rectSnapshot(image),
    computed: {
      objectFit: computed.objectFit,
      objectPosition: computed.objectPosition,
      aspectRatio: computed.aspectRatio,
      width: computed.width,
      height: computed.height,
      display: computed.display,
    },
  }
}

function rectSnapshot(element: Element | null | undefined) {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top),
    bottom: Math.round(rect.bottom),
  }
}

function pickComputedStyle(element: Element, names: string[]) {
  const computed = getComputedStyle(element)
  const computedRecord = computed as unknown as Record<string, string>
  return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(toCssPropertyName(name)) || computedRecord[name] || '']))
}

function toCssPropertyName(name: string) {
  return name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 500)
}

function escapeJsonForScript(value: unknown) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
}
