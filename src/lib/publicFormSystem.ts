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

export type PublicFormContext = 'contact' | 'estimation' | 'visit-request' | 'login' | 'private-action'

export function resolvePublicForm(identity: AgencyIdentity, context: PublicFormContext): PublicFormConfig {
  const forms = identity.renderContract.forms
  const variant = context === 'estimation' && !identity.visualBlueprint?.forms.variant && !identity.visualBlueprint?.forms.style
    ? 'guided'
    : forms.variant
  const density = forms.density
  const layout = context === 'visit-request' && !identity.visualBlueprint?.forms.layout ? 'split' : forms.layout
  const fieldStyle = forms.fieldStyle

  return {
    variant,
    density,
    layout,
    fieldStyle,
    buttonStyle: forms.buttonStyle,
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
