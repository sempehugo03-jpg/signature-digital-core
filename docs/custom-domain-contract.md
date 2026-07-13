# Custom Domain Contract

PR 34 prepares custom domains for Signature Immobilier agencies.

It does not buy domains, change DNS records, call Vercel, create SSL certificates, or change registrars.

## Ownership

The domain remains the client's property.

Signature Digital stores:

- the default Signature Digital URL;
- the optional custom hostname;
- DNS instructions;
- manual verification status;
- SSL status;
- the primary-domain choice;
- a guaranteed fallback URL.

## Structure

```ts
AgencyDomainConfig {
  agencyId
  defaultSubdomain
  customDomain?
  primaryDomain
  status
  verification
  sslStatus
  redirectMode
  createdAt
  updatedAt
}
```

Domain statuses:

- `not-configured`
- `pending-dns`
- `verifying`
- `verified`
- `error`
- `disabled`

SSL statuses:

- `pending`
- `active`
- `error`

Redirect modes:

- `custom-to-default`
- `default-to-custom`
- `none`

## Default URL

Every agency keeps a stable fallback URL:

```txt
PUBLIC_APP_URL/demo/:agencySlug
```

In the frontend, the exposed variable can be:

- `VITE_PUBLIC_APP_URL`
- `PUBLIC_APP_URL`

If none is configured, the current browser origin is used. The route `/demo/:agencySlug` remains supported and must not be removed.

## Custom Hostname

The admin can enter a domain or subdomain such as:

- `immobilier-dupont.fr`
- `agence.client.fr`

Normalization:

- lowercase;
- protocol removed;
- path removed;
- trailing slash removed;
- port removed.

Validation rejects:

- hostnames with paths;
- local domains;
- IP addresses;
- invalid hostnames;
- hostnames already used by another agency.

## DNS Instructions

DNS instructions are generated but never applied automatically.

Expected variables:

- `CUSTOM_DOMAIN_CNAME_TARGET`
- `CUSTOM_DOMAIN_APEX_TARGET`

Frontend previews can also use:

- `VITE_CUSTOM_DOMAIN_CNAME_TARGET`
- `VITE_CUSTOM_DOMAIN_APEX_TARGET`

If the values are absent, the admin displays explicit placeholders instead of inventing a Vercel target.

Rules:

- subdomain: `CNAME`;
- apex/root domain: `A` or `ALIAS` depending on the DNS provider;
- optional `www`: `CNAME`.

## Verification

Verification is manual in this PR.

The admin can:

- save the domain;
- show DNS instructions;
- mark verification in progress;
- mark the domain verified manually;
- disable the custom domain;
- return to the Signature Digital fallback URL.

No UI should claim that DNS or SSL were verified automatically.

## URL Resolution

`resolveAgencyPublicUrls()` returns:

- `defaultUrl`;
- `customUrl`;
- `primaryUrl`;
- `activationUrl`;
- `fallbackUrl`.

`primaryUrl` uses the custom domain only when:

- `customDomain` exists;
- domain status is `verified`;
- SSL status is `active`;
- `primaryDomain` is `custom`.

Otherwise, Signature Digital uses the default `/demo/:agencySlug` URL.

## Hostname Routing

`resolveAgencyByHostname()` can resolve a verified custom hostname to an agency.

It ignores:

- domains not verified;
- disabled domains;
- domains in error;
- domains without active SSL.

The regular `/demo/:agencySlug` route remains the authoritative fallback and continues to work.

## Future Vercel Integration

A future PR may connect:

- Vercel domain API;
- automatic verification checks;
- SSL provisioning status;
- redirects.

That integration must keep the same contract and must not store registrar secrets in the frontend.
