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

type PropertyUrlExtractResponse = {
  ok?: boolean
  property?: Partial<ExtractedPropertyDraft>
}

export async function extractPropertyFromUrl(url: string): Promise<ExtractedPropertyDraft> {
  const sourceUrl = normalizePropertyUrl(url)

  try {
    const response = await fetch('/api/property-url-extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl }),
    })
    const payload = await response.json() as PropertyUrlExtractResponse

    if (response.ok && payload.ok && payload.property) {
      return normalizeExtractedDraft(sourceUrl, payload.property)
    }
  } catch {
    return createEmptyDraft(sourceUrl)
  }

  return createEmptyDraft(sourceUrl)
}

function normalizePropertyUrl(url: string) {
  const parsedUrl = new URL(url.trim())
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Unsupported property URL')
  }
  return parsedUrl.toString()
}

function normalizeExtractedDraft(sourceUrl: string, value: Partial<ExtractedPropertyDraft>): ExtractedPropertyDraft {
  const gallery = Array.isArray(value.gallery) ? value.gallery.filter(Boolean) : []

  return {
    sourceUrl: value.sourceUrl || sourceUrl,
    title: value.title || '',
    price: value.price || '',
    city: value.city || '',
    surface: value.surface || '',
    type: value.type || '',
    description: value.description || '',
    imageUrl: value.imageUrl || gallery[0] || '',
    gallery,
    rooms: value.rooms || '',
    bedrooms: value.bedrooms || '',
    land: value.land || '',
    dpe: value.dpe || '',
    reference: value.reference || '',
    canonicalUrl: value.canonicalUrl || sourceUrl,
    extractionStatus: value.extractionStatus || (hasExtractedValue(value) ? 'partial' : 'empty'),
  }
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

function hasExtractedValue(value: Partial<ExtractedPropertyDraft>) {
  return Boolean(value.title || value.description || value.imageUrl || value.price || value.city || value.surface)
}
