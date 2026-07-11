# Public Property Detail System

## Role

The public property detail page is the official conversion page for one property in a Signature Immobilier agency.
It uses the existing shared `PropertyDetail` component and does not create a separate public, private or agency-specific detail engine.

## Route

Official route:

```text
/demo/:agencySlug/bien/:propertyId
```

The route is resolved by `src/App.tsx` and rendered by `OpusDomusTemplate` with `view="bien"`.

## Shared Public / Private Architecture

`PropertyDetail` remains the common detail component.

Public rendering is selected when no template session exists.
Private rendering remains selected through the existing session roles:

- seller;
- agent;
- owner.

The public branch focuses on discovery and conversion.
The private branch keeps the existing operational panels and actions.

## Public Block Order

The public rendering follows this order:

1. gallery;
2. title, city and price;
3. key features;
4. description;
5. highlights / amenities;
6. location;
7. agent or agency contact;
8. visit request form;
9. similar properties.

Empty sections are hidden when the source data is missing.

## Public Data

The public page may use:

- property title;
- property type;
- city;
- public price label;
- surface;
- rooms;
- bedrooms;
- description;
- highlights;
- public property images;
- assigned active agent contact data when available;
- agency contact data as fallback.

The location block displays the city and keeps the detailed address for the agency exchange unless a future explicit publication flag is added.

## Private Data

The public rendering must not expose:

- documents;
- internal visit list;
- reports;
- offers;
- seller identity;
- private seller access;
- agent or owner actions;
- archive/edit/share controls.

These remain behind the existing session-based private rendering.

## Visit Request

The visit request form is intentionally simple:

- name;
- email;
- phone;
- message / availability.

It reuses the existing `requests` workflow through `completeRepositoryAction()` and `createRequest()`.
The request is linked to the active agency and property.

## Similar Properties

Similar properties are calculated locally from public properties of the same agency.
The current property is excluded.

The deterministic score favors:

- same type;
- same city;
- close price;
- close surface.

The block is limited to 3 properties and reuses `PublicPropertyCard`.
If no similar property exists, the section is hidden.

## Collection Return

When a user opens a property from `/demo/:agencySlug/biens`, the current collection route and query string are stored in session storage for the agency.
The detail page uses that value for its "Retour aux biens" action.
Browser back remains the primary way to preserve history.

## Visual System

The public detail consumes:

- `AgencyIdentity`;
- agency CSS tokens;
- public navigation;
- `PublicPropertyCardConfig` for similar properties.

It does not define a new visual theme engine or a new detail variant system.

## Limits

This PR intentionally does not add:

- favorites;
- buyer accounts;
- property comparison;
- AI recommendations;
- external map providers;
- virtual tours;
- video galleries;
- new CRM logic.
