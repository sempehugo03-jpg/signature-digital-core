export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, message: 'Method not allowed.' })
    return
  }

  const body = await readBody(request)

  try {
    const sourceUrl = normalizePropertyUrl(body.url || '')
    const html = await fetchHtml(sourceUrl)

    if (!html) {
      response.status(200).json({ ok: true, property: createEmptyDraft(sourceUrl) })
      return
    }

    response.status(200).json({ ok: true, property: extractPropertyFromHtml(sourceUrl, html) })
  } catch {
    response.status(200).json({ ok: false, message: 'Extraction impossible depuis cette URL.' })
  }
}

async function readBody(request) {
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body
  try {
    return JSON.parse(request.body)
  } catch {
    return {}
  }
}

function normalizePropertyUrl(url) {
  const parsedUrl = new URL(String(url).trim())
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Unsupported URL')
  }
  return parsedUrl.toString()
}

async function fetchHtml(sourceUrl) {
  try {
    const result = await fetch(sourceUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 SignatureDigitalPropertyImporter/1.0',
      },
    })
    if (!result.ok) return ''
    const contentType = result.headers.get('content-type') || ''
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) return ''
    return await result.text()
  } catch {
    return ''
  }
}

function extractPropertyFromHtml(sourceUrl, html) {
  const jsonLd = readJsonLd(html)
  const text = stripHtml(html)
  const gallery = uniqueValues([...readAllMeta(html, 'og:image'), ...readImages(jsonLd)])
  const canonicalUrl = readCanonical(html) || sourceUrl
  const title = readMeta(html, 'og:title') || readJsonLdText(jsonLd, ['name', 'headline']) || readTitle(html)
  const description = readMeta(html, 'og:description') || readJsonLdText(jsonLd, ['description'])
  const imageUrl = readMeta(html, 'og:image') || gallery[0] || ''

  return {
    sourceUrl,
    title,
    price: readJsonLdPrice(jsonLd) || readRegex(text, /(\d[\d\s.]{4,}\s?(?:EUR|€))/i),
    city: readJsonLdCity(jsonLd) || readMeta(html, 'og:locality'),
    surface: readJsonLdSize(jsonLd) || readRegex(text, /(\d{2,4}\s?(?:m2|m²))/i),
    type: readJsonLdType(jsonLd) || inferPropertyType(`${title} ${description}`),
    description,
    imageUrl,
    gallery,
    rooms: readRegex(text, /(\d+\s?(?:pièces|pieces|p\.))/i),
    bedrooms: readRegex(text, /(\d+\s?(?:chambres?|ch\.))/i),
    land: readRegex(text, /(?:terrain|parcelle)\s*:?\s*(\d{2,6}\s?(?:m2|m²))/i),
    dpe: readRegex(text, /DPE\s*:?\s*([A-G])/i),
    reference: readRegex(text, /(?:référence|reference|ref\.?)\s*:?\s*([A-Za-z0-9-]+)/i),
    canonicalUrl,
    extractionStatus: 'partial',
  }
}

function createEmptyDraft(sourceUrl) {
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

function readMeta(html, property) {
  return cleanHtmlEntities(
    matchFirst(html, [
      new RegExp(`<meta[^>]+property=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escapeRegExp(property)}["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+name=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${escapeRegExp(property)}["'][^>]*>`, 'i'),
    ]),
  )
}

function readAllMeta(html, property) {
  const values = []
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'gi'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escapeRegExp(property)}["'][^>]*>`, 'gi'),
  ]
  patterns.forEach((pattern) => {
    for (const match of html.matchAll(pattern)) {
      if (match[1]) values.push(cleanHtmlEntities(match[1]))
    }
  })
  return values
}

function readCanonical(html) {
  return cleanHtmlEntities(matchFirst(html, [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i,
  ]))
}

function readTitle(html) {
  return cleanHtmlEntities(matchFirst(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]))
}

function readJsonLd(html) {
  const items = []
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  for (const match of html.matchAll(pattern)) {
    try {
      const parsed = JSON.parse(match[1].trim())
      if (Array.isArray(parsed)) items.push(...parsed)
      else if (Array.isArray(parsed?.['@graph'])) items.push(...parsed['@graph'])
      else if (parsed) items.push(parsed)
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }
  return items
}

function readJsonLdText(items, keys) {
  for (const item of flattenJsonLd(items)) {
    const record = toRecord(item)
    for (const key of keys) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }
  return ''
}

function readJsonLdPrice(items) {
  for (const item of flattenJsonLd(items)) {
    const record = toRecord(item)
    const offers = toRecord(record.offers)
    const price = record.price || offers.price || toRecord(offers.priceSpecification).price
    const currency = record.priceCurrency || offers.priceCurrency || ''
    if (typeof price === 'string' || typeof price === 'number') return `${price}${currency ? ` ${currency}` : ''}`
  }
  return ''
}

function readJsonLdCity(items) {
  for (const item of flattenJsonLd(items)) {
    const address = toRecord(toRecord(item).address)
    const city = address.addressLocality || address.addressRegion
    if (typeof city === 'string' && city.trim()) return city.trim()
  }
  return ''
}

function readJsonLdSize(items) {
  for (const item of flattenJsonLd(items)) {
    const record = toRecord(item)
    const floorSize = toRecord(record.floorSize)
    const value = floorSize.value || record.floorSize || record.size
    const unit = floorSize.unitText || floorSize.unitCode || 'm2'
    if (typeof value === 'string' || typeof value === 'number') return `${value} ${unit}`
  }
  return ''
}

function readJsonLdType(items) {
  for (const item of flattenJsonLd(items)) {
    const type = toRecord(item)['@type']
    const types = Array.isArray(type) ? type : [type]
    const realEstateType = types.find((value) => typeof value === 'string' && /apartment|house|residence|realestate/i.test(value))
    if (typeof realEstateType === 'string') return realEstateType
  }
  return ''
}

function readImages(items) {
  return flattenJsonLd(items).flatMap((item) => {
    const image = toRecord(item).image
    if (Array.isArray(image)) return image.filter((value) => typeof value === 'string')
    if (typeof image === 'string') return [image]
    return []
  })
}

function flattenJsonLd(items) {
  return items.flatMap((item) => {
    const record = toRecord(item)
    const graph = record['@graph']
    return Array.isArray(graph) ? [item, ...graph] : [item]
  })
}

function toRecord(value) {
  return value && typeof value === 'object' ? value : {}
}

function matchFirst(value, patterns) {
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function readRegex(value, pattern) {
  return value.match(pattern)?.[1]?.trim() || ''
}

function inferPropertyType(value) {
  if (/maison|villa/i.test(value)) return 'Maison'
  if (/appartement|studio|duplex/i.test(value)) return 'Appartement'
  if (/terrain/i.test(value)) return 'Terrain'
  return ''
}

function stripHtml(html) {
  return cleanHtmlEntities(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
}

function cleanHtmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
