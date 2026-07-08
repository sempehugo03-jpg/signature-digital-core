# Design Grammar Spec

## 1. Definition

Design Grammar is the translation dictionary between Lovable artistic intent, Agency Identity, and Signature Digital visual decisions.

It does not replace VisualBlueprint.

It does not replace Agency Identity.

It completes them by answering one question:

What emotion must the engine produce?

Then it translates that emotion into reusable visual rules for Signature Digital components.

## 2. Why It Exists

Lovable provides artistic intent.

Signature Digital must never copy Lovable HTML, CSS, routes, or product logic.

The engine must understand the direction and translate it using its own components.

Before Design Grammar, the engine could apply colors and isolated tokens.

With Design Grammar, it can reason in reusable visual decisions:

- images
- typography
- spacing
- cards
- buttons
- sections
- density
- contrast
- storytelling

## 3. Official Families

The first Design Grammar version contains four reusable emotional families.

### editorial_luxury

Intent:

Produce desire, status, and premium confidence through editorial pacing.

Translation:

- Images: dominant, immersive, editorial crop
- Typography: elegant serif, strong hierarchy
- Spacing: generous, slow, premium
- Cards: airy, low density, image first
- Buttons: sober, premium statement
- Sections: storytelling rhythm
- Contrast: high

### modern_premium

Intent:

Produce clarity, confidence, and commercial premium value.

Translation:

- Images: balanced and clean
- Typography: modern sans, clear hierarchy
- Spacing: balanced and efficient
- Cards: structured, medium density
- Buttons: confident and direct
- Sections: systematic rhythm
- Contrast: balanced

Fallback:

modern_premium is the default if no clear emotion can be detected.

### warm_local_trust

Intent:

Produce reassurance, proximity, and trust through warmer pacing.

Translation:

- Images: human, natural, reassuring
- Typography: warm editorial mood
- Spacing: comfortable
- Cards: readable and approachable
- Buttons: soft guidance
- Sections: trust building rhythm
- Contrast: soft

### minimal_prestige

Intent:

Produce prestige through restraint, silence, and selective emphasis.

Translation:

- Images: restrained and precise
- Typography: quiet sans, selective hierarchy
- Spacing: spacious and minimal
- Cards: reduced density
- Buttons: discreet precision
- Sections: editorial pauses
- Contrast: quiet

## 4. Mapping Logic

The Design Grammar resolver reads signals from:

- VisualBlueprint brand fields
- VisualBlueprint layout fields
- hero layout and overlay
- property card style
- section mood and spacing
- button style
- image mood
- Agency Identity fields

It maps those signals to one official family.

Unknown fields are ignored.

Incomplete Blueprints fall back to modern_premium.

## 5. How An Emotion Is Translated

An emotion is never applied directly as CSS.

It is translated into decisions.

Example:

```text
editorial_luxury
```

becomes:

```text
images.scale = dominant
typography.mood = elegant_serif
spacing.scale = generous
cards.density = low
buttons.mood = premium_statement
sections.rhythm = storytelling
```

Components then decide how to express those rules with existing variants and tokens.

## 6. How Components Should Use It

Components should read the Design Grammar output, not raw Lovable instructions.

Correct:

```text
VisualBlueprint -> Agency Identity -> Design Grammar -> component variants
```

Incorrect:

```text
VisualBlueprint -> raw CSS in component
```

Each component should map grammar decisions to reusable variants.

Examples:

- Hero uses image scale, typography, contrast, and storytelling.
- Property cards use cards, images, typography, and density.
- Property detail uses images, spacing, typography, and buttons.
- Estimation uses buttons, spacing, contrast, and rhythm.
- Private spaces use cards, density, typography, and section rhythm.

## 7. Adding A New Emotion

A new emotion can be added only if the four families cannot express it.

Before adding one:

1. Check if it maps to an existing family.
2. Check if a small rule extension is enough.
3. Confirm it is reusable across multiple agencies.
4. Document its emotional intent.
5. Add translation rules for every required domain.

Never add a family for one agency.

Never add a family named after a city, brand, or client.

## 8. Anti-Exception Rules

The Design Grammar must never know:

- Laguerre
- Citya
- Orpi
- a city-specific exception
- an agency-specific condition

It only knows intentions.

New agency = configuration.

New style = reusable grammar or variant.

Never a fork.

## 9. Definition Of Done

Design Grammar is valid when:

- it exposes a centralized dictionary
- it supports editorial_luxury, modern_premium, warm_local_trust, and minimal_prestige
- it translates VisualBlueprint / Agency Identity into reusable visual decisions
- it falls back to modern_premium
- it does not modify pages
- it does not modify business logic
- it does not depend on Lovable code
- it is documented for future components
- agencies without Blueprint continue to work
