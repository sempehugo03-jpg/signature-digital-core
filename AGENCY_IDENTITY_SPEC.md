# Agency Identity Spec

## 1. Definition

Agency Identity is the single visual identity applied to every real estate agency instance in Signature Digital.

It is derived from:

- the agency configuration
- the VisualBlueprint when available
- the shared real estate visual system
- the default Signature Digital design system as fallback

Agency Identity controls:

- colors
- typography mood
- button style
- card style
- section backgrounds
- spacing
- image treatment
- general visual atmosphere

The identity belongs to the agency, not to a page.

## 2. Product Rule

One agency has one identity.

Every public and private page must inherit it automatically:

- home
- property list
- property detail
- estimation
- contact
- seller space
- agent space
- owner space
- documents
- timeline
- notifications
- dashboard

No page should feel like a different product.

## 3. Technical Rule

Real estate pages must read the shared Agency Identity at the page root.

The root must receive:

- the shared page classes
- the visual system classes
- the CSS variables generated from the VisualBlueprint

Components then consume tokens instead of hard-coded visual decisions.

Allowed:

- CSS variables from the visual system
- default design system variables
- reusable visual variants

Forbidden:

- client-specific colors hard-coded in a page
- page-specific button styling outside the shared identity
- page-specific spacing systems
- agency-specific exceptions

## 4. Fallback

If no VisualBlueprint exists, the real estate engine keeps the default Signature Digital visual system.

If a Blueprint field is missing, the engine uses the nearest supported token or variant.

If a Blueprint field is unknown, it is ignored.

The platform must never break because of an incomplete visual identity.

## 5. Adding A New Page

Any new real estate page must:

1. Use the shared Agency Identity root.
2. Keep the existing business logic separate from visual styling.
3. Use existing component classes and design tokens.
4. Avoid hard-coded colors, radii, shadows, and spacing.
5. Verify mobile layout with no horizontal overflow.

A new page must not create a new theme.

## 6. Adding A New Component

Any new real estate component must:

1. Use Agency Identity tokens for colors, borders, shadows, spacing, and buttons.
2. Support fallback values from the default design system.
3. Avoid client-specific variants.
4. Reuse existing variants before adding a new one.
5. Stay compatible with future agencies.

If a requested visual style is not covered, add a reusable token or variant, not an exception.

## 7. Maintenance Rule

Lovable provides direction.

Signature Digital applies that direction through Agency Identity.

The real estate engine never imports Lovable code.

The engine never creates a page, component, or style for one specific agency.

New agency = config + Blueprint + reusable visual system.

Never a fork.

## 8. Definition Of Done

Agency Identity propagation is valid only if:

- public pages inherit the agency identity
- private seller, agent, and owner pages inherit the same identity
- forms, cards, dashboards, timelines, documents, and modals use the shared tokens
- missing Blueprint fields fall back cleanly
- no business logic changes are required
- no route changes are required
- no client-specific exception is added
- mobile remains readable with no horizontal overflow
- existing agencies without Blueprint remain functional
