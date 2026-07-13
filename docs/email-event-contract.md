# Email Event Contract

PR 33.1 keeps the PR33 outbox as the single email source and reconnects it to the existing server endpoint `/api/send-email`.

## Scope

The product flow is:

1. a business action succeeds;
2. an outbox item is created with status `ready`;
3. Signature Digital calls `/api/send-email`;
4. the outbox item becomes `sending`;
5. the endpoint returns `sent`, `simulated`, or `failed`;
6. the outbox stores the provider result.

An email failure must never cancel the business action that created the request, invitation, or project update.

## Provider

The existing provider is Gmail SMTP through `nodemailer` in `api/send-email.js`.

The endpoint is server-side only. The browser never receives or stores SMTP credentials.

Required server variables for live delivery:

- `EMAIL_PROVIDER=gmail`
- `EMAIL_FROM`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `ADMIN_NOTIFICATION_EMAIL`

When one of these variables is missing, the endpoint returns `simulated` instead of throwing. This keeps the workflow usable in local development and preview environments.

## Events

Official events:

- `project-request-received`
- `demo-ready`
- `client-changes-recorded`
- `revised-demo-ready`
- `activation-invitation`
- `payment-confirmed`
- `owner-account-setup`
- `agency-activated`
- `account-invitation`
- `account-invitation-owner`
- `account-invitation-agent`
- `account-invitation-seller`
- `estimation-request-client`
- `estimation-request-agency`
- `visit-request-client`
- `visit-request-agency`
- `contact-request-client`
- `contact-request-agency`
- `callback-request-client`
- `callback-request-agency`

Payment events are defined only for future use. They must not be triggered before a real payment confirmation.

## Variables

Allowed dynamic variables:

- `firstName`
- `lastName`
- `agencyName`
- `projectName`
- `demoUrl`
- `activationUrl`
- `invitationUrl`
- `role`
- `offerName`
- `installationPrice`
- `recurringPrice`
- `supportEmail`

Missing values use safe fallbacks. The system must not invent a recipient address.

## Recipients

Recipient resolution depends on the event:

- project events use the `ClientBrief` contact;
- account events use the invited owner, agent, or seller email;
- public request confirmations use the prospect email recorded in the request;
- agency notifications use the agency email or the server-side `admin` alias when relevant.

If the resolved email is missing or invalid, no outbox item is created.

## Outbox

The local outbox item is:

```ts
EmailOutboxItem {
  id
  event
  projectId?
  agencyId?
  recipient
  subject
  preheader
  body
  cta?
  idempotencyKey
  status
  provider?
  providerMessageId?
  sentAt?
  lastError?
  attemptCount
  deliveryMode?
  createdAt
  updatedAt
}
```

Statuses:

- `draft`
- `ready`
- `sending`
- `sent`
- `simulated`
- `cancelled`
- `failed`
- `error`

`simulated` is a delivery result, not a fake success. It means the server endpoint accepted the request but did not have live provider configuration.

## Idempotence

The idempotency key is derived from:

- event;
- project id when available;
- agency id when available;
- recipient email;
- account role when available;
- invitation URL when available.

An existing non-cancelled item with the same key is reused. Retry uses the same outbox item and increments `attemptCount`.

## Triggered Events

Reliable events currently connected:

- after tunnel/project creation: `project-request-received`;
- client link prepared: `demo-ready`;
- revised client link prepared after changes: `revised-demo-ready`;
- client changes recorded: `client-changes-recorded`;
- owner/agent/seller invitations: role-specific invitation events;
- estimation request: confirmation to the prospect and notification to the agency;
- visit request: confirmation to the prospect and notification to the agency;
- callback request: confirmation to the client and notification to Signature Digital.

Contact request events are part of the contract and are ready for the first explicit contact workflow that records a contact request.

## Admin Preview

`/admin/emails` lets an admin:

- see the outbox;
- filter by event and status;
- open an email;
- preview subject, preheader, body, CTA, provider result and errors;
- copy the full content;
- retry a failed or ready item;
- cancel an item;
- mark an item as simulated.

It is not an email editor.

## Security

Rules:

- endpoint is POST-only;
- no provider secret in React/Vite/browser code;
- no mailto fallback;
- no Gmail or Outlook client opened by the browser;
- no bank data in email payloads;
- provider errors are stored without secrets;
- `ADMIN_NOTIFICATION_EMAIL` is resolved on the server when the recipient email is `admin`;
- a failed email never rolls back a business action.
