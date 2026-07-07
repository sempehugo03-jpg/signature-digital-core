# Design Grammar Spec

## 1. Purpose

Design Grammar is the centralized layer that translates the emotion coming from VisualBlueprint and Agency Identity into reusable visual rules.

It does not create a new design.

It does not create client-specific exceptions.

It gives every page and component a shared emotional direction before visual tokens are applied.

## 2. Product Rule

Signature Digital must never style each page independently.

The flow is:

VisualBlueprint / Agency Identity

-> Design Grammar family

-> reusable visual rules

-> visual system tokens and components

Every future page or component must use this grammar instead of inventing its own visual mood.

## 3. Families

The first version defines four families.

### editorial_luxury

Intent:

Create desire, status, and premium confidence.

Rules:

- imageScale: cinematic
- spacing: airy
- typography: editorial_serif
- contrast: high
- cardDensity: editorial
- buttonMood: gold_statement
- sectionRhythm: magazine

Use for:

- luxury
- editorial
- premium
- navy / ivory / gold
- cinematic visual directions

### modern_premium

Intent:

Make the agency feel clear, efficient, reliable, and commercially premium.

Rules:

- imageScale: balanced
- spacing: balanced
- typography: modern_sans
- contrast: balanced
- cardDensity: structured
- buttonMood: confident
- sectionRhythm: systematic

Use for:

- modern
- clean
- structured
- sharp
- performance-oriented visual directions

Fallback family:

modern_premium.

### warm_local_trust

Intent:

Reassure sellers through proximity, warmth, clarity, and visible accompaniment.

Rules:

- imageScale: human
- spacing: warm
- typography: warm_serif
- contrast: soft
- cardDensity: comfortable
- buttonMood: soft_trust
- sectionRhythm: reassuring

Use for:

- local trust
- human
- warm
- reassuring
- proximity-driven visual directions

### minimal_prestige

Intent:

Signal prestige through restraint, precision, silence, and selective emphasis.

Rules:

- imageScale: restrained
- spacing: minimal
- typography: quiet_sans
- contrast: quiet
- cardDensity: reduced
- buttonMood: discreet
- sectionRhythm: spacious

Use for:

- minimal
- sober
- prestige
- quiet luxury
- restrained visual directions

## 4. Mapping

The Design Grammar resolver reads signals from:

- Agency Identity
- VisualBlueprint brand fields
- hero layout and overlay
- property card style
- section mood and rhythm
- button mood
- typography mood
- imagery mood

Known signals are mapped to one of the four families.

Unknown or missing signals fall back to modern_premium.

## 5. How Pages Use It

A page should not hard-code emotion.

Correct:

1. Read Agency Identity.
2. Resolve Design Grammar.
3. Use the resulting family and rules to select existing reusable variants.
4. Apply visual system tokens.

Incorrect:

- add a special color for one agency
- add one-off spacing for one page
- create a fixed card style outside the grammar
- bypass Agency Identity

## 6. How Components Use It

A component should use Design Grammar rules as intent, not as raw CSS.

Examples:

- imageScale chooses image ratio and crop intensity
- spacing chooses compact, balanced, or airy rhythm
- typography chooses title hierarchy
- cardDensity chooses content density
- buttonMood chooses CTA strength
- sectionRhythm chooses repeated section pacing

Components must keep fallbacks.

If a grammar field is unsupported, the component uses the closest existing variant.

## 7. Maintenance Rule

New agency = no exception.

New emotion = map to an existing family first.

If none of the four families can express the direction, add a reusable family or reusable rule only after product validation.

Never add:

- client-specific classes
- city-specific rules
- agency-name conditions
- page-specific emotional systems

## 8. Definition Of Done

Design Grammar is valid only if:

- it exposes the four official families
- it maps VisualBlueprint / Agency Identity to one family
- it falls back to modern_premium
- it is reusable by pages and components
- it does not change business logic
- it does not require page rewrites
- it does not break agencies without Blueprint
- it is documented for future components
