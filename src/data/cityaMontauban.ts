export const cityaAgencyId = 'citya-montauban'
export const cityaAgencySlug = 'citya-montauban'
export const cityaLovableMockupUrl = 'https://citya-signature-boost.lovable.app'
export const cityaLiveDemoPath = '/demo/citya-montauban'
export const cityaWebsiteUrl = 'https://www.citya.com/agences-immobilieres/montauban-82000'

export type CityaProperty = {
  id: string
  title: string
  city: string
  price: string
  surface: string
  rooms: string
  type: string
  transaction: 'location' | 'vente'
  description: string
  highlights: string[]
  imageLabel: string
  sourceUrl: string
  isTemporary: boolean
}

export const cityaAgency = {
  id: cityaAgencyId,
  slug: cityaAgencySlug,
  name: 'Citya Montauban',
  legalName: 'Citya Naudin',
  city: 'Montauban',
  address: '3 place Prax Paris, 82000 Montauban',
  phone: '05 63 26 21 00',
  email: 'montauban@citya.fr',
  websiteUrl: cityaWebsiteUrl,
  sourceNote: 'Données visibles sur le site Citya : copropriété, gérance, location, transaction, 28 biens en location et 23 biens en vente.',
}

export const cityaProperties: CityaProperty[] = [
  {
    id: 'citya-location-t1-30-6',
    title: 'Appartement 1 pièce 30.6 m²',
    city: 'Montauban (82000)',
    price: '450 € / mois',
    surface: '30.6 m²',
    rooms: '1 pièce',
    type: 'Appartement',
    transaction: 'location',
    description: 'Appartement une pièce à Montauban, présenté comme bien en location sur le site Citya. La photo est temporaire car l’URL directe n’est pas exposée dans la page récupérable.',
    highlights: ['Garage', 'Balcon', 'Location Citya Montauban'],
    imageLabel: 'Photo temporaire — Appartement 1 pièce Citya',
    sourceUrl: cityaWebsiteUrl,
    isTemporary: false,
  },
  {
    id: 'citya-location-t2-52-7',
    title: 'Appartement 2 pièces 52.7 m²',
    city: 'Montauban (82000)',
    price: '636,14 € / mois',
    surface: '52.7 m²',
    rooms: '2 pièces',
    type: 'Appartement',
    transaction: 'location',
    description: 'Appartement deux pièces à Montauban, repris depuis les derniers biens ajoutés visibles sur le site Citya Montauban.',
    highlights: ['Location', 'Surface confortable', 'Agence Citya Naudin'],
    imageLabel: 'Photo temporaire — Appartement 2 pièces Citya',
    sourceUrl: cityaWebsiteUrl,
    isTemporary: false,
  },
  {
    id: 'citya-location-t3-120-65',
    title: 'Appartement 3 pièces 120.65 m²',
    city: 'Montauban (82000)',
    price: '1 045 € / mois',
    surface: '120.65 m²',
    rooms: '3 pièces',
    type: 'Appartement',
    transaction: 'location',
    description: 'Grand appartement trois pièces à Montauban, issu des annonces visibles sur la page agence Citya.',
    highlights: ['Parking', 'Balcon', 'Meublé'],
    imageLabel: 'Photo temporaire — Appartement 3 pièces Citya',
    sourceUrl: cityaWebsiteUrl,
    isTemporary: false,
  },
  {
    id: 'citya-location-t3-87-14',
    title: 'Appartement 3 pièces 87.14 m²',
    city: 'Montauban (82000)',
    price: '772 € / mois',
    surface: '87.14 m²',
    rooms: '3 pièces',
    type: 'Appartement',
    transaction: 'location',
    description: 'Appartement trois pièces en location à Montauban, repris des informations publiques visibles sur le site Citya.',
    highlights: ['Location', 'Montauban', 'Bien réel visible'],
    imageLabel: 'Photo temporaire — Appartement 3 pièces',
    sourceUrl: cityaWebsiteUrl,
    isTemporary: false,
  },
  {
    id: 'citya-location-t2-34-99',
    title: 'Appartement 2 pièces 34.99 m²',
    city: 'Montauban (82000)',
    price: '575 € / mois',
    surface: '34.99 m²',
    rooms: '2 pièces',
    type: 'Appartement',
    transaction: 'location',
    description: 'Appartement deux pièces meublé à Montauban, basé sur les données publiques visibles dans la liste Citya.',
    highlights: ['Meublé', 'Terrasse', 'Location'],
    imageLabel: 'Photo temporaire — Appartement meublé',
    sourceUrl: cityaWebsiteUrl,
    isTemporary: false,
  },
]
