import type { RealEstateProperty } from '../data/realEstateTemplate'

export type PublicPropertyCollectionSort =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'surface-asc'
  | 'surface-desc'

export type PublicPropertyCollectionFilters = {
  query: string
  type: string
  location: string
  priceMin: string
  priceMax: string
  surfaceMin: string
  roomsMin: string
}

export type PublicPropertyCollectionState = PublicPropertyCollectionFilters & {
  sort: PublicPropertyCollectionSort
  page: number
}

export type PublicPropertyCollectionResult = {
  allCount: number
  filteredCount: number
  page: number
  pageSize: number
  pageCount: number
  properties: RealEstateProperty[]
  visibleProperties: RealEstateProperty[]
  typeOptions: string[]
  locationOptions: string[]
}

const defaultCollectionState: PublicPropertyCollectionState = {
  query: '',
  type: '',
  location: '',
  priceMin: '',
  priceMax: '',
  surfaceMin: '',
  roomsMin: '',
  sort: 'default',
  page: 1,
}

export const publicPropertyCollectionPageSize = 9

export function createDefaultPublicPropertyCollectionState(): PublicPropertyCollectionState {
  return { ...defaultCollectionState }
}

export function parsePublicPropertyCollectionState(params: URLSearchParams): PublicPropertyCollectionState {
  return sanitizePublicPropertyCollectionState({
    query: params.get('q') ?? '',
    type: params.get('type') ?? '',
    location: params.get('location') ?? '',
    priceMin: params.get('priceMin') ?? '',
    priceMax: params.get('priceMax') ?? '',
    surfaceMin: params.get('surfaceMin') ?? '',
    roomsMin: params.get('roomsMin') ?? '',
    sort: parseSort(params.get('sort')),
    page: parsePositiveInteger(params.get('page'), 1),
  })
}

export function createPublicPropertyCollectionSearch(state: PublicPropertyCollectionState) {
  const params = new URLSearchParams()
  const sanitized = sanitizePublicPropertyCollectionState(state)

  if (sanitized.query) params.set('q', sanitized.query)
  if (sanitized.type) params.set('type', sanitized.type)
  if (sanitized.location) params.set('location', sanitized.location)
  if (sanitized.priceMin) params.set('priceMin', sanitized.priceMin)
  if (sanitized.priceMax) params.set('priceMax', sanitized.priceMax)
  if (sanitized.surfaceMin) params.set('surfaceMin', sanitized.surfaceMin)
  if (sanitized.roomsMin) params.set('roomsMin', sanitized.roomsMin)
  if (sanitized.sort !== 'default') params.set('sort', sanitized.sort)
  if (sanitized.page > 1) params.set('page', String(sanitized.page))

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function sanitizePublicPropertyCollectionState(state: PublicPropertyCollectionState): PublicPropertyCollectionState {
  return {
    query: normalizeInput(state.query),
    type: normalizeInput(state.type),
    location: normalizeInput(state.location),
    priceMin: normalizeNumericInput(state.priceMin),
    priceMax: normalizeNumericInput(state.priceMax),
    surfaceMin: normalizeNumericInput(state.surfaceMin),
    roomsMin: normalizeNumericInput(state.roomsMin),
    sort: parseSort(state.sort),
    page: Math.max(1, Number.isFinite(state.page) ? Math.trunc(state.page) : 1),
  }
}

export function resolvePublicPropertyCollection(
  properties: RealEstateProperty[],
  state: PublicPropertyCollectionState,
  pageSize = publicPropertyCollectionPageSize,
): PublicPropertyCollectionResult {
  const agencyProperties = properties.filter((property) => Boolean(property.id))
  const filteredProperties = filterPublicProperties(agencyProperties, state)
  const sortedProperties = sortPublicProperties(filteredProperties, state.sort)
  const safePageSize = Math.max(1, pageSize)
  const pageCount = Math.max(1, Math.ceil(sortedProperties.length / safePageSize))
  const page = Math.min(Math.max(1, state.page), pageCount)
  const start = (page - 1) * safePageSize

  return {
    allCount: agencyProperties.length,
    filteredCount: sortedProperties.length,
    page,
    pageSize: safePageSize,
    pageCount,
    properties: sortedProperties,
    visibleProperties: sortedProperties.slice(start, start + safePageSize),
    typeOptions: uniqueSorted(agencyProperties.map((property) => property.type)),
    locationOptions: uniqueSorted(agencyProperties.map((property) => property.city || property.address)),
  }
}

export function filterPublicProperties(
  properties: RealEstateProperty[],
  state: PublicPropertyCollectionFilters,
): RealEstateProperty[] {
  const query = normalizeSearchText(state.query)
  const type = normalizeSearchText(state.type)
  const location = normalizeSearchText(state.location)
  const priceMin = parseNumericValue(state.priceMin)
  const priceMax = parseNumericValue(state.priceMax)
  const surfaceMin = parseNumericValue(state.surfaceMin)
  const roomsMin = parseNumericValue(state.roomsMin)

  return properties.filter((property) => {
    if (query && !createSearchableText(property).includes(query)) return false
    if (type && normalizeSearchText(property.type) !== type) return false
    if (location && normalizeSearchText(property.city || property.address) !== location) return false

    const price = property.priceValue || parseNumericValue(property.price)
    if (priceMin !== null && (!price || price < priceMin)) return false
    if (priceMax !== null && (!price || price > priceMax)) return false

    const surface = parseNumericValue(property.surface)
    if (surfaceMin !== null && (surface === null || surface < surfaceMin)) return false

    const rooms = parseNumericValue(property.rooms)
    if (roomsMin !== null && (rooms === null || rooms < roomsMin)) return false

    return true
  })
}

export function sortPublicProperties(
  properties: RealEstateProperty[],
  sort: PublicPropertyCollectionSort,
): RealEstateProperty[] {
  const indexed = properties.map((property, index) => ({ property, index }))
  const compareStable = (result: number, aIndex: number, bIndex: number) => result || aIndex - bIndex

  return indexed
    .sort((a, b) => {
      if (sort === 'price-asc') return compareStable(compareNumbers(readPrice(a.property), readPrice(b.property), 'asc'), a.index, b.index)
      if (sort === 'price-desc') return compareStable(compareNumbers(readPrice(a.property), readPrice(b.property), 'desc'), a.index, b.index)
      if (sort === 'surface-asc') return compareStable(compareNumbers(parseNumericValue(a.property.surface), parseNumericValue(b.property.surface), 'asc'), a.index, b.index)
      if (sort === 'surface-desc') return compareStable(compareNumbers(parseNumericValue(a.property.surface), parseNumericValue(b.property.surface), 'desc'), a.index, b.index)
      return a.index - b.index
    })
    .map((item) => item.property)
}

function parseSort(value: string | null): PublicPropertyCollectionSort {
  return value === 'price-asc'
    || value === 'price-desc'
    || value === 'surface-asc'
    || value === 'surface-desc'
    ? value
    : 'default'
}

function compareNumbers(a: number | null, b: number | null, direction: 'asc' | 'desc') {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'asc' ? a - b : b - a
}

function readPrice(property: RealEstateProperty) {
  return property.priceValue || parseNumericValue(property.price)
}

function createSearchableText(property: RealEstateProperty) {
  return normalizeSearchText([
    property.title,
    property.type,
    property.city,
    property.address,
    property.description,
  ].filter(Boolean).join(' '))
}

function uniqueSorted(values: string[]) {
  return [
    ...new Set(values.map((value) => normalizeInput(value)).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
}

function normalizeSearchText(value: string) {
  return normalizeInput(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizeInput(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, '')
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = value ? Number(value) : fallback
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback
}

function parseNumericValue(value?: string | number) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null
  if (!value) return null
  const normalized = value.replace(/[^\d]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
