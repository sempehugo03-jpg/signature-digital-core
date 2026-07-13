# Agency contact and legal identity

## Role

`AgencyContactAndLegalIdentity` centralizes the public contact details, legal identity and useful links for each real estate agency.

It is the source used by public display, contact links and agency email recipients.

The full legal text pages are intentionally left for PR 37.

## Structure

The contract is defined in `src/lib/agencyContactLegalIdentity.ts`.

It contains:

- `publicContact`: public phone, public email and recipient emails for contact, estimation, visit and callback requests;
- `postalAddress`: address lines, postal code, city, country and optional map URL;
- `openingHours`: simple day-by-day opening hours;
- `socialLinks`: Facebook, Instagram, LinkedIn, YouTube and one optional extra link;
- `professionalIdentity`: legal name, trade name, legal form, SIREN/registration, RCS city, VAT, share capital, professional card, guarantee, insurance, mediator and fees URL;
- `publication`: publication director;
- `legalDocumentLinks`: future legal notice, privacy, terms and fees links.

## Fallbacks

Existing fields remain compatible:

- `email` becomes `publicEmail` fallback;
- `phone` becomes `publicPhone` fallback;
- `address` and `city` become postal address fallback;
- active owner/agency email can be used as a recipient fallback when available.

No global admin email is used as a client-facing agency contact unless explicitly configured elsewhere.

## Validation

`validateAgencyLegalIdentity()` returns:

- normalized data;
- missing required fields;
- warnings;
- resolved recipients.

Essential fields are:

- public email;
- public phone;
- address;
- city.

Demo agencies are not blocked. Active agencies show admin warnings if essential fields are missing.

## Public display

The template reads the resolved identity through Agency Identity.

The public display uses it in:

- common footer;
- contact section;
- property detail agency/agent card;
- phone and email links;
- fees and future legal links.

Absent fields are hidden. No placeholder legal or professional data is generated.

## Email recipients

Public requests resolve recipients from the contract:

- estimation request -> `estimationRecipientEmail`;
- visit request -> `visitRecipientEmail`;
- contact request -> `contactFormRecipientEmail`;
- callback request -> `callbackRecipientEmail`.

Each recipient falls back to public email when possible. If no valid recipient exists, diagnostics remain visible in admin and the outbox does not invent an address.

## Admin

Templates maintenance exposes:

`Coordonnees et identite legale`

The block edits public contact, recipients, address, opening hours, social links, fees/legal links and professional identity.

## Voluntary limits

This PR does not:

- write definitive legal notices;
- invent SIREN, card numbers or insurance details;
- add cookie management;
- integrate a map provider;
- change custom domains;
- start PR 37.
