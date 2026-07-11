import type { AgencyIdentity } from './agencyIdentity'

export type PublicFormVariant = 'minimal' | 'standard' | 'guided'
export type PublicFormDensity = 'compact' | 'standard' | 'airy'
export type PublicFormLayout = 'stacked' | 'split'
export type PublicFormFieldStyle = 'line' | 'bordered' | 'filled'

export type PublicFormConfig = {
  variant: PublicFormVariant
  density: PublicFormDensity
  layout: PublicFormLayout
  fieldStyle: PublicFormFieldStyle
  buttonStyle: string
  showPrivacyNotice: boolean
  className: string
}

export function resolvePublicForm(identity: AgencyIdentity, context: 'contact' | 'estimation' | 'visit-request' | 'login'): PublicFormConfig {
  const forms = identity.visualBlueprint?.forms
  const variant = resolveVariant(forms?.variant || forms?.style, context)
  const density = resolveDensity(forms?.density)
  const layout = resolveLayout(forms?.layout, context)
  const fieldStyle = resolveFieldStyle(forms?.fieldStyle)

  return {
    variant,
    density,
    layout,
    fieldStyle,
    buttonStyle: identity.visualBlueprint?.buttons.shape || 'default',
    showPrivacyNotice: context !== 'login',
    className: [
      'od-public-form',
      `od-public-form-context-${context}`,
      `od-public-form-variant-${variant}`,
      `od-public-form-density-${density}`,
      `od-public-form-layout-${layout}`,
      `od-public-form-field-${fieldStyle}`,
    ].join(' '),
  }
}

function resolveVariant(value: string | undefined, context: string): PublicFormVariant {
  const normalized = toClassValue(value)
  if (normalized === 'minimal' || normalized === 'standard' || normalized === 'guided') return normalized
  return context === 'estimation' ? 'guided' : 'standard'
}

function resolveDensity(value?: string): PublicFormDensity {
  const normalized = toClassValue(value)
  if (normalized === 'compact' || normalized === 'airy') return normalized
  return 'standard'
}

function resolveLayout(value: string | undefined, context: string): PublicFormLayout {
  const normalized = toClassValue(value)
  if (normalized === 'split') return 'split'
  return context === 'visit-request' ? 'split' : 'stacked'
}

function resolveFieldStyle(value?: string): PublicFormFieldStyle {
  const normalized = toClassValue(value)
  if (normalized === 'line' || normalized === 'filled') return normalized
  return 'bordered'
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
