# Trusted estimator deployment runbook

## Production deployment

1. Back up the target Supabase project and record its project reference.
2. Compare the hostname in `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` with the intended project; never print keys.
3. Confirm Vercel Production variables for Supabase, `ADMIN_TOKEN`, public/proposal URLs, Resend, sender email, expiry, and private bucket overrides.
4. Apply the pricing-catalogue schema/import only if it is not already present. The combined estimator SQL deliberately excludes pricing seed data.
5. For a new estimator deployment, apply `supabase/deploy/trusted_estimator_0015_to_0028.sql`. If 0015–0021 are verified as deployed, apply `trusted_estimator_0022_to_0028.sql`.
6. Do not run a bundle speculatively. Inspect `app_schema_migrations` and schema objects first; backfill history only with `record_schema_migration_if_objects_exist` and repository checksums.
7. Confirm the bundle completes its transaction and `NOTIFY pgrst, 'reload schema'`; reload PostgREST manually if its cache remains stale.
8. Confirm `proposal-assets`, `project-images`, `tender-documents`, and `project-documents` exist and are private.
9. Confirm an approved pricing catalogue with active products and rates.
10. Configure active Good, Better, and Best roofing-system versions referencing that approved catalogue.
11. Run `npm run verify:production-readiness`; resolve every blocker before deployment.
12. Deploy the matching Git commit to Vercel.
13. Open the protected `/admin/system-status` page.
14. Run connection, schema, synthetic PDF, URL, email-configuration, and temporary storage tests. Storage tests delete their object in `finally`.
15. Create a clearly synthetic test job without real customer information.
16. Generate and inspect a synthetic proposal and PDF.
17. Explicitly send a readiness email only to an administrator-controlled address.
18. Test the existing customer proposal acceptance route.
19. Convert the accepted synthetic proposal into a project.
20. Create, send, and approve a synthetic change order.
21. Confirm signed proposal and change-order PDFs remain downloadable and locked.
22. Search Vercel logs using the displayed correlation IDs; resolve actionable operational-error rows.
23. Inspect public proposal and change-order output for internal costs, source references, secrets, and PII leakage.

## Rollback

* Stop the Vercel deployment or redeploy the previous known-good commit first.
* Do not delete accepted proposals, acceptances, projects, or approved change orders.
* Restore the Supabase backup for a full rollback, or apply a separately reviewed forward-only corrective migration.
* Revoke affected customer tokens if a delivery/security issue occurred.
* Preserve operational-error and delivery-attempt records for diagnosis.
* Reload PostgREST and rerun readiness checks after recovery.

## Known access limitation

`ADMIN_TOKEN` remains a shared administrator secret. Middleware protects all `/admin/*` routes, but this is not staff-level authentication, attribution, role separation, or revocation. Individual staff authentication remains required future hardening.
