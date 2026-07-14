import { getVisualBlueprintCapabilityValues } from './visualBlueprint'

export type EngineCapabilityCatalog = ReturnType<typeof resolveEngineCapabilities>

export function resolveEngineCapabilities() {
  const values = getVisualBlueprintCapabilityValues()

  return {
    version: 'v1',
    visualBlueprintRoot: 'VisualBlueprint:',
    compositions: values.compositionPreset,
    navigation: {
      surface: values.navigationSurface,
      density: values.navigationDensity,
      behavior: values.navigationBehavior,
      logoMode: values.navigationLogoMode,
      mobileStyle: values.mobileNavigation,
      visibility: values.navigationVisibility,
    },
    hero: {
      layout: values.heroLayout,
      surface: values.heroSurface,
      height: values.heroHeight,
      headlineScale: values.heroHeadlineScale,
      alignment: values.alignment,
      imageTreatment: values.imageTreatment,
      ctaPosition: values.position,
    },
    sections: {
      supportedSections: ['hero', 'properties', 'method', 'sellerSpace', 'reviews', 'contact', 'trust', 'estimation'],
      proofVariant: values.proofVariant,
      spacing: values.spacing,
      mood: values.visualVariants,
    },
    propertyCards: {
      variant: values.propertyCardVariant,
      orientation: values.propertyCardOrientation,
      imageRatio: values.propertyCardImageRatio,
      density: values.propertyCardDensity,
      pricePosition: values.propertyCardPricePosition,
      radius: values.propertyCardRadius,
      border: values.propertyCardBorder,
      shadow: values.propertyCardShadow,
      hover: values.propertyCardHover,
    },
    proof: {
      variant: values.proofVariant,
    },
    buttons: {
      variant: values.buttonVariant,
      shape: values.buttonShape,
      size: values.buttonSize,
      hover: values.buttonHover,
    },
    forms: {
      variant: values.formVariant,
      layout: values.formLayout,
      fieldStyle: values.formFieldStyle,
      density: values.spacing,
    },
    dashboard: {
      style: values.dashboardStyle,
      density: values.dashboardDensity,
      navigation: values.dashboardNavigation,
      cards: values.dashboardCards,
    },
    responsive: {
      mobileSpacing: values.spacing,
      cardBehavior: ['stacked', 'carousel', 'grid', 'compact'],
    },
    animations: {
      motionLevel: values.motionLevel,
      cardHover: values.propertyCardHover,
      buttonHover: values.buttonHover,
    },
    forbidden: [
      'video hero',
      'parallax',
      'new component',
      'custom workflow',
      'new route',
      'property import',
      'authentication',
      'permissions',
      'code changes',
    ],
  }
}

export function formatEngineCapabilitiesForAssistant(catalog = resolveEngineCapabilities()) {
  return JSON.stringify(catalog, null, 2)
}
