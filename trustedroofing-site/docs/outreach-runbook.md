# Trusted Engine outreach runbook

The outreach subsystem is separate from transactional Resend email.

Required production environment variables:

- `OUTREACH_SMTP_HOST`
- `OUTREACH_SMTP_PORT`
- `OUTREACH_SMTP_SECURE`
- `OUTREACH_SMTP_USER`
- `OUTREACH_SMTP_PASSWORD`
- `OUTREACH_FROM_EMAIL`
- `OUTREACH_FROM_NAME`
- `OUTREACH_WORKER_SECRET`
- `OUTREACH_POSTAL_ADDRESS`
- `OUTREACH_PUBLIC_BASE_URL`
- `OUTREACH_CONTACT_PHONE` (optional)

Apply migrations `0034_outreach_campaigns.sql` and `0035_outreach_default_campaign.sql` before enabling the worker.

The seeded campaign is disabled by default. Do not activate it until prospect source evidence has been verified and the unsubscribe URL is live.

Worker endpoint: `POST /api/outreach/worker` with `Authorization: Bearer <OUTREACH_WORKER_SECRET>`.

A HostPapa cron job can call the worker after the production deployment is live.
