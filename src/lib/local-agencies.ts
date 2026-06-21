export type AgencyColors = {
  primary: string
  secondary: string
  accent: string
}

export type AdminAgency = {
  id: string
  name: string
  sector: string
  city: string
  status: string
  colors: AgencyColors
}

export const localAgencies: AdminAgency[] = [
  {
    id: 'signature-immobilier',
    name: 'Signature Immobilier',
    sector: 'Immobilier',
    city: 'Tarbes',
    status: 'Démo active',
    colors: {
      primary: 'bleu nuit',
      secondary: 'crème',
      accent: 'doré doux',
    },
  },
]
