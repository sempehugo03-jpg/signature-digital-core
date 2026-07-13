# Email Event Contract

PR 33 prepares automatic emails without sending real emails.

## Scope

The system resolves product events into professional French email drafts and stores them in a local outbox.

No provider is connected in this PR:

- no Resend;
- no SendGrid;
- no Gmail API;
- no SMTP;
- no API key;
- no real delivery.

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
- support/admin can be added later when a provider exists.

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
  createdAt
  updatedAt
}
```

Statuses:

- `draft`
- `ready`
- `simulated`
- `cancelled`
- `error`

There is intentionally no `sent` status in this PR.

## Idempotence

The idempotency key is derived from:

- event;
- project id when available;
- agency id when available;
- recipient email;
- account role when available;
- invitation URL when available.

An existing non-cancelled item with the same key is reused.

## Triggered Events

Reliable events currently connected:

- after tunnel/project creation: `project-request-received`;
- client link prepared: `demo-ready`;
- revised client link prepared after changes: `revised-demo-ready`;
- client changes recorded: `client-changes-recorded`;
- account invitation link copied: `account-invitation`;
- owner setup link copied: `owner-account-setup`.

## Admin Preview

`/admin/emails` lets an admin:

- see the outbox;
- filter by event and status;
- open an email;
- preview subject, preheader, body and CTA;
- copy the full content;
- cancel an item;
- mark an item as simulated.

It is not an email editor.

## Future Provider

A future PR may connect a provider by consuming `EmailOutboxItem` entries with status `ready`.

Provider integration must:

- keep the central event contract;
- keep idempotence;
- never expose provider secrets in the browser;
- write delivery results back to the outbox;
- avoid changing the product events unless the product workflow changes.
