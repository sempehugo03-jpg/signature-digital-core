# Public Property Collection System

## Role

The public property collection is the official full listing page for Signature Immobilier agencies.
It complements the home page: the home keeps a limited selection, while `/demo/:agencySlug/biens` exposes the full public collection.

The collection does not create a second property engine. It reuses:

- the agency runtime resolved from the public route;
- the existing `agencyId`-scoped property data;
- `AgencyIdentity`;
- the public navigation system;
- the PR9 `PublicPropertyCard`;
- the existing property detail route.

## Route

Official route:

```text
/demo/:agencySlug/biens
```

The route is resolved by `src/App.tsx` and rendered by `OpusDomusTemplate` with `view="biens"`.

## Data Source and Isolation

The page reads `templateImmobilierConfig.properties` after the agency runtime has been configured.
The collection filters the list by the active `templateImmobilierConfig.agencyId`.

No property from another agency should be displayed by the collection page.

## Search

Search is local and deterministic.
It checks the reliable public fields currently available on `RealEstateProperty`:

- title;
- type;
- city;
- address;
- description.

Search normalizes case, repeated spaces and accents.

## Filters

The collection supports only filters backed by reliable existing data:

- property type;
- city/location;
- minimum price;
- maximum price;
- minimum surface;
- minimum rooms.

Missing property values are ignored safely. If a numeric filter is active and a property lacks the required numeric value, that property is excluded for that filter.

## Sorts

Supported sorts:

- default order;
- price ascending;
- price descending;
- surface ascending;
- surface descending.

No "most recent" sort is exposed because `RealEstateProperty` does not currently provide a reliable public creation date.

## Pagination

The collection uses local pagination with a stable page size.
It avoids infinite scroll and keeps the interaction predictable on mobile.

## URL State

The following collection state is preserved in the URL query string when active:

- `q`;
- `type`;
- `location`;
- `priceMin`;
- `priceMax`;
- `surfaceMin`;
- `roomsMin`;
- `sort`;
- `page`.

This allows browser back/forward and keeps the search context when returning from a property detail page.

## Card Reuse

The page must use `PublicPropertyCard`.
Card appearance remains driven by:

- VisualBlueprint v1;
- Agency Identity;
- the PR9 public property card resolver.

Do not create a list-specific card component.

## Empty States

The page handles:

- no public properties for the agency;
- no result after search or filters;
- properties with missing images through the existing card fallback;
- partial property data through the existing card formatting.

## Limits

This system intentionally does not provide:

- map search;
- favorites;
- alerts;
- comparison;
- buyer accounts;
- remote search;
- recommendations;
- advanced filters.

New buyer-facing features belong to future product decisions and must not be added by extending this page opportunistically.
