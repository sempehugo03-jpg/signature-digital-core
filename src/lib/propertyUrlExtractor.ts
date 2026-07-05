export type ExtractedPropertyDraft = {
  sourceUrl: string
  title: string
  price: string
  city: string
  surface: string
  type: string
  description: string
  imageUrl: string
  gallery: string[]
  rooms: string
  bedrooms: string
  land: string
  dpe: string
  reference: string
  canonicalUrl: string
  extractionStatus: 'partial' | 'empty'
}

export async function extractPropertyFromUrl(url: string): Promise<ExtractedPropertyDraft> {
  const sourceUrl = normalizePropertyUrl(url)
  const emptyDraft = createEmptyDraft(sourceUrl)

  try {
    const response = await fetch(sourceUrl)
    if (!response.ok) return emptyDraft

    const html = await response.text()
    const document = new DOMParser().parseFromString(html, 'text/html')
    const jsonLd = readJsonLd(document)
    const pageText = document.body?.innerText ?? ''
    const ogImages = readOpenGraphImages(document)
    const jsonImages = readImages(jsonLd)
    const gallery = uniqueValues([...ogImages, ...jsonImages])
    const canonicalUrl = readCanonicalUrl(document) || sourceUrl
    const title = readMeta(document, 'og:title') || readJsonLdText(jsonLd, ['name', 'headline']) || document.title
    const description = readMeta(document, 'og:description') || readJsonLdText(jsonLd, ['description'])
    const imageUrl = readMeta(document, 'og:image') || gallery[0] || ''
    const price = readJsonLdPrice(jsonLd) || readRegex(pageText, /(\d[\d\s.]{4,}\s?(?:EUR|€))/i)
    const city = readJsonLdCity(jsonLd) || readMeta(document, 'og:locality') || ''
    const surface = readJsonLdSize(jsonLd) || readRegex(pageText, /(\d{2,4}\s?(?:m2|m²))/i)
    const rooms = readRegex(pageText, /(\d+\s?(?:pièces|pieces|p\.))/i)
    const bedrooms = readRegex(pageText, /(\d+\s?(?:chambres?|ch\.))/i)
    const land = readRegex(pageText, /(?:terrain|parcelle)\s*:?\s*(\d{2,6}\s?(?:m2|m²))/i)
    const dpe = readRegex(pageText, /DPE\s*:?\s*([A-G])/i)
    const reference = readRegex(pageText, /(?:référence|reference|ref\.?)\s*:?\s*([A-Za-z0-9-]+)/i)
    const type = readJsonLdType(jsonLd) || inferPropertyType(`${title} ${description}`)

    return {
      sourceUrl,
      title,
      price,
      city,
      surface,
      type,
      description,
      imageUrl,
      gallery,
      rooms,
      bedrooms,
      land,
      dpe,
      reference,
      canonicalUrl,
      extractionStatus: 'partial',
    }
  } catch {
    return emptyDraft
  }
}

function normalizePropertyUrl(url: string) {
  const parsedUrl = new URL(url.trim())
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Unsupported property URL')
  }
  return parsedUrl.toString()
}

function createEmptyDraft(sourceUrl: string): ExtractedPropertyDraft {
  return {
    sourceUrl,
    title: '',
    price: '',
    city: '',
    surface: '',
    type: '',
    description: '',
    imageUrl: '',
    gallery: [],
    rooms: '',
    bedrooms: '',
    land: '',
    dpe: '',
    reference: '',
    canonicalUrl: sourceUrl,
    extractionStatus: 'empty',
  }
}

function readMeta(document: Document, property: string) {
  const meta =
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) ||
    document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`)
  return meta?.content?.trim() ?? ''
}

function readOpenGraphImages(document: Document) {
  return Array.from(document.querySelectorAll<HTMLMetaElement>('meta[property="og:image"], meta[name="og:image"]'))
    .map((meta) => meta.content?.trim())
    .filter(Boolean)
}

function readCanonicalUrl(document: Document) {
  return document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href?.trim() ?? ''
}

function readJsonLd(document: Document): unknown[] {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'))
    .flatMap((script) => parseJsonLd(script.textContent ?? ''))
}

function parseJsonLd(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.['@graph'])) return parsed['@graph']
    return parsed ? [parsed] : []
  } catch {
    return []
  }
}

function readJsonLdText(items: unknown[], keys: string[]) {
  for (const item of flattenJsonLd(items)) {
    const record = toRecord(item)
    for (const key of keys) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }
  return ''
}

function readJsonLdPrice(items: unknown[]) {
  for (const item of flattenJsonLd(items)) {
    const record = toRecord(item)
    const offers = toRecord(record.offers)
    const price = record.price || offers.price || toRecord(offers.priceSpecification).price
    const currency = record.priceCurrency || offers.priceCurrency || ''
    if (typeof price === 'string' || typeof price === 'number') return `${price}${currency ? ` ${currency}` : ''}`
  }
  return ''
}

function readJsonLdCity(items: unknown[]) {
  for (const item of flattenJsonLd(items)) {
    const address = toRecord(toRecord(item).address)
    const city = address.addressLocality || address.addressRegion
    if (typeof city === 'string' && city.trim()) return city.trim()
  }
  return ''
}

function readJsonLdSize(items: unknown[]) {
  for (const item of flattenJsonLd(items)) {
    const record = toRecord(item)
    const floorSize = toRecord(record.floorSize)
    const value = floorSize.value || record.floorSize || record.size
    const unit = floorSize.unitText || floorSize.unitCode || 'm2'
    if (typeof value === 'string' || typeof value === 'number') return `${value} ${unit}`
  }
  return ''
}

function readJsonLdType(items: unknown[]) {
  for (const item of flattenJsonLd(items)) {
    const type = toRecord(item)['@type']
    const types = Array.isArray(type) ? type : [type]
    const realEstateType = types.find((value) => typeof value === 'string' && /apartment|house|residence|realestate/i.test(value))
    if (typeof realEstateType === 'string') return realEstateType
  }
  return ''
}

function readImages(items: unknown[]) {
  return flattenJsonLd(items).flatMap((item) => {
    const image = toRecord(item).image
    if (Array.isArray(image)) return image.filter((value): value is string => typeof value === 'string')
    if (typeof image === 'string') return [image]
    return []
  })
}

function flattenJsonLd(items: unknown[]): unknown[] {
  return items.flatMap((item) => {
    const record = toRecord(item)
    const graph = record['@graph']
    return Array.isArray(graph) ? [item, ...graph] : [item]
  })
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function readRegex(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1]?.trim() ?? ''
}

function inferPropertyType(value: string) {
  if (/maison|villa/i.test(value)) return 'Maison'
  if (/appartement|studio|duplex/i.test(value)) return 'Appartement'
  if (/terrain/i.test(value)) return 'Terrain'
  return ''
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}
