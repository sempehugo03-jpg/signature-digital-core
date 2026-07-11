export type ResponsiveMode = 'mobile' | 'tablet' | 'desktop'

export type ResponsiveContract = {
  modes: Record<ResponsiveMode, {
    label: string
    minWidth: number
    maxWidth?: number
  }>
  narrowSafetyMaxWidth: number
  containerPadding: Record<ResponsiveMode, string>
  sectionSpacing: Record<ResponsiveMode, string>
  touchTarget: string
}

export const responsiveContract: ResponsiveContract = {
  modes: {
    mobile: {
      label: 'Mobile',
      minWidth: 0,
      maxWidth: 767,
    },
    tablet: {
      label: 'Tablette',
      minWidth: 768,
      maxWidth: 1199,
    },
    desktop: {
      label: 'Desktop',
      minWidth: 1200,
    },
  },
  narrowSafetyMaxWidth: 360,
  containerPadding: {
    mobile: '1.25rem',
    tablet: '2rem',
    desktop: 'clamp(2.5rem, 5vw, 4rem)',
  },
  sectionSpacing: {
    mobile: 'clamp(4rem, 14vw, 6rem)',
    tablet: 'clamp(5rem, 8vw, 7rem)',
    desktop: 'clamp(6rem, 10vw, 9rem)',
  },
  touchTarget: '44px',
}
