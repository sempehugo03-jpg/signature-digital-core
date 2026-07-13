# Real Email Delivery

Signature Digital reuses the existing `/api/send-email` endpoint for real delivery.

## Existing System Found

The endpoint is `api/send-email.js`.

It uses:

- `nodemailer`;
- Gmail SMTP;
- `smtp.gmail.com`;
- port `465`;
- `secure: true`.

The PR33 outbox had neutralized real delivery by storing generated emails as drafts/simulations only. PR33.1 reconnects the outbox to this endpoint.

## Environment

Live delivery requires:

- `EMAIL_PROVIDER=gmail`
- `EMAIL_FROM`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `ADMIN_NOTIFICATION_EMAIL`

If any variable is missing, the endpoint returns:

```json
{
  "ok": true,
  "status": "simulated",
  "provider": "simulation"
}
```

This is intentional for local and preview environments.

## Browser Flow

The browser never sends SMTP credentials.

It sends only:

- event type;
- project id if present;
- agency id if present;
- idempotency key;
- resolved recipient;
- subject;
- body.

The endpoint validates the payload and sends through Gmail only when the server variables are complete.

## Retry

Retry happens from `/admin/emails` against the same outbox item.

The retry:

- keeps the same idempotency key;
- increments `attemptCount`;
- updates `lastError`;
- writes `providerMessageId` and `sentAt` when live delivery succeeds.

## Business Safety

Email delivery is never the source of truth.

For public requests:

1. the request is recorded first;
2. outbox items are created second;
3. delivery is attempted third.

If delivery fails, the request remains stored and the admin can retry from the outbox.
