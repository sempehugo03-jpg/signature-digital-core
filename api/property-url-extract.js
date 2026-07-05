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
  const gallery = uniqueUrls([...readAllMeta(html, 'og:image'), ...readImages(jsonLd), ...readHtmlImages(html)], sourceUrl)
  const canonicalUrl = readCanonical(html) || sourceUrl
  const rawTitle = readMeta(html, 'og:title') || readJsonLdText(jsonLd, ['name', 'headline']) || readTitle(html)
  const title = cleanTitle(rawTitle)
  const description = cleanDescription(readMeta(html, 'og:description') || readJsonLdText(jsonLd, ['description']))
  const imageUrl = normalizeImageUrl(readMeta(html, 'og:image'), sourceUrl) || gallery[0] || ''
  const city = cleanCity(readJsonLdCity(jsonLd) || readMeta(html, 'og:locality') || inferCity(`${title} ${description} ${canonicalUrl}`))
  const type = cleanPropertyType(readJsonLdType(jsonLd)) || inferPropertyType(`${title} ${description}`)

  return {
    sourceUrl,
    title,
    price: cleanPrice(readJsonLdPrice(jsonLd) || readRegex(text, /(\d[\d\s.]{4,}\s?(?:EUR|€))/i)),
    city,
    surface: cleanSurface(readJsonLdSize(jsonLd) || readRegex(text, /(\d{2,4}(?:[,.]\d{1,2})?\s?(?:m2|m²))/i)),
    type,
    description,
    imageUrl,
    gallery,
    rooms: cleanCount(readRegex(text, /(\d+\s?(?:pièces|pieces|p\.))/i), 'pièces'),
    bedrooms: cleanCount(readRegex(text, /(\d+\s?(?:chambres?|ch\.))/i), 'chambres'),
    land: cleanSurface(readRegex(text, /(?:terrain|parcelle)\s*:?\s*(\d{2,6}(?:[,.]\d{1,2})?\s?(?:m2|m²))/i)),
    dpe: cleanDpe(readRegex(text, /DPE\s*:?\s*([A-G])/i)),
    reference: cleanReference(readRegex(text, /(?:référence|reference|ref\.?)\s*:?\s*([A-Za-z0-9-]+)/i)),
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
    const city = address.addressLocality || address.addressRegion || recordString(toRecord(item), 'addressLocality')
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

function recordString(record, key) {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function readImages(items) {
  return flattenJsonLd(items).flatMap((item) => {
    const image = toRecord(item).image
    if (Array.isArray(image)) return image.filter((value) => typeof value === 'string')
    if (typeof image === 'string') return [image]
    if (image && typeof image === 'object') {
      const url = toRecord(image).url
      return typeof url === 'string' ? [url] : []
    }
    return []
  })
}

function readHtmlImages(html) {
  const images = []
  const imgPattern = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi
  for (const match of html.matchAll(imgPattern)) {
    images.push(match[1])
  }

  const srcsetPattern = /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi
  for (const match of html.matchAll(srcsetPattern)) {
    images.push(...match[1].split(',').map((item) => item.trim().split(/\s+/)[0]))
  }

  return images
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
  return decodeHtmlEntities(String(value || ''))
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/&agrave;/g, 'à')
    .replace(/&aacute;/g, 'á')
    .replace(/&acirc;/g, 'â')
    .replace(/&auml;/g, 'ä')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&euml;/g, 'ë')
    .replace(/&icirc;/g, 'î')
    .replace(/&iuml;/g, 'ï')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ouml;/g, 'ö')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&ucirc;/g, 'û')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Eacute;/g, 'É')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

function cleanTitle(value) {
  return cleanHtmlEntities(value)
    .replace(/\s*[-|]\s*(?:vente|location)?\s*(?:maison|appartement|terrain)?\s*$/i, '')
    .replace(/\s*[-|]\s*[^-|]{2,35}$/i, '')
    .trim()
}

function cleanDescription(value) {
  return cleanHtmlEntities(value)
    .replace(/\s*(?:voir plus|en savoir plus|contactez-nous).*$/i, '')
    .trim()
}

function cleanPrice(value) {
  const numeric = String(value || '').replace(/[^\d]/g, '')
  if (!numeric || numeric.length < 4) return ''
  return `${Number(numeric).toLocaleString('fr-FR')} €`
}

function cleanSurface(value) {
  const match = String(value || '').replace(',', '.').match(/(\d{1,6}(?:\.\d{1,2})?)/)
  if (!match) return ''
  const surface = Number(match[1])
  if (!Number.isFinite(surface) || surface <= 0) return ''
  return `${surface.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} m²`
}

function cleanCount(value, label) {
  const match = String(value || '').match(/(\d+)/)
  if (!match) return ''
  return `${match[1]} ${label}`
}

function cleanDpe(value) {
  const dpe = String(value || '').trim().toUpperCase()
  return /^[A-G]$/.test(dpe) ? dpe : ''
}

function cleanReference(value) {
  return String(value || '').trim().replace(/[^\w-]/g, '')
}

function cleanPropertyType(value) {
  const normalized = cleanHtmlEntities(value).toLowerCase()
  if (/realestatelisting|realestateagent|webpage|breadcrumb/.test(normalized)) return ''
  if (/apartment|appartement|studio|duplex/.test(normalized)) return 'Appartement'
  if (/house|maison|villa/.test(normalized)) return 'Maison'
  if (/land|terrain/.test(normalized)) return 'Terrain'
  return cleanHtmlEntities(value)
}

function inferCity(value) {
  const cleanValue = cleanHtmlEntities(value)
  const postalMatch = cleanValue.match(/\b\d{5}\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ' -]{2,40})/)
  if (postalMatch) return postalMatch[1]
  const parentheticalDepartmentMatch = cleanValue.match(/\b([A-ZÀ-Ÿ][A-Za-zÀ-ÿ' -]{2,40})\s*\(\d{2,3}\)/)
  if (parentheticalDepartmentMatch) return parentheticalDepartmentMatch[1]
  const cityMatch = cleanValue.match(/\b(?:à|a|sur|secteur|ville de)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ' -]{2,40})/)
  if (cityMatch) return cityMatch[1]
  const slugMatch = cleanValue.match(/\/([a-zà-ÿ-]+)-\d{5}(?:\/|$)/i)
  if (slugMatch) return slugMatch[1].split('-').map(capitalize).join(' ')
  return ''
}

function cleanCity(value) {
  const city = cleanHtmlEntities(value)
    .replace(/\d{5}/g, '')
    .replace(/^.*\b(?:appartement|maison|terrain|villa|studio|duplex)\s+/i, '')
    .replace(/[,|/-].*$/g, '')
    .trim()
  if (!city || city.length < 2 || city.length > 60) return ''
  return city
}

function uniqueUrls(values, sourceUrl) {
  const source = new URL(sourceUrl)
  return [...new Set(values.map((value) => normalizeImageUrl(value, source)).filter(Boolean))]
    .sort((left, right) => imagePriority(right) - imagePriority(left))
}

function normalizeImageUrl(value, source) {
  const rawValue = cleanHtmlEntities(value)
  if (!rawValue) return ''
  try {
    const imageUrl = new URL(rawValue, source).toString()
    if (/favicon|apple-touch-icon|logo/i.test(imageUrl)) return ''
    if (/\/map\/|map-bg|marker/i.test(imageUrl)) return ''
    if (!/\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(imageUrl)) return ''
    return imageUrl
  } catch {
    return ''
  }
}

function capitalize(value) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : ''
}

function imagePriority(value) {
  if (/\/biens?\//i.test(value)) return 3
  if (/annonce|property|vente|location/i.test(value)) return 2
  return 1
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
