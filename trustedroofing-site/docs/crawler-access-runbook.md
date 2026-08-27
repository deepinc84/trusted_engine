# Crawler access runbook

The application deliberately permits search and SEO audit crawlers on every
public landing page. Only API, administration, test, and private solar routes
are excluded in `robots.txt`.

## Diagnose a crawler error

Run each check against both the apex and `www` host. A successful landing-page
request ends at a `200` response, and `robots.txt` must also return `200`.

```bash
curl -IL --max-redirs 5 https://trustedroofingcalgary.com/
curl -IL --max-redirs 5 https://www.trustedroofingcalgary.com/
curl -i https://www.trustedroofingcalgary.com/robots.txt
curl -IL -A 'SemrushBot/7~bl' --max-redirs 5 https://www.trustedroofingcalgary.com/
curl -IL -A 'AhrefsBot/7.0' --max-redirs 5 https://www.trustedroofingcalgary.com/
```

Interpret the result before changing application code:

- `200`: the route is accessible. Re-run the campaign or inspect the exact URL
  configured in the audit tool.
- `301`, `307`, or `308`: follow the redirect chain and confirm it terminates at
  the canonical `www` URL with `200` rather than looping.
- `401`, `403`, or a challenge page: the request was stopped before the public
  Next.js route. Review Vercel Deployment Protection and the project's Firewall
  event log. Remove protection from the production domain or add a narrowly
  scoped verified-bot/bot user-agent allow rule. Do not allow bots into `/admin`
  or `/api`.
- `429`: inspect rate-limiting and Firewall events for the request. Public
  marketing pages have no application rate limiter, so a production `429`
  normally points to an edge rule.
- `5xx`: inspect the matching Vercel function/deployment logs and deployment
  health.

## After changing edge settings

Repeat the commands above from a network outside the office/VPN, then use the
crawler's live URL test before re-running the full campaign. `robots.txt` can
express crawl permission, but it cannot bypass Vercel Deployment Protection,
Firewall rules, DNS/proxy restrictions, or an upstream challenge.
