# Production readiness manual verification

1. Deploy migration `0028_deployment_readiness_and_migration_history.sql`.
2. Open `/admin/system-status` using existing administrator authorization.
3. In a disposable database, omit one migration and verify its exact missing objects are blocked.
4. Verify the current production schema and migration checksums.
5. Verify all required buckets exist and are private.
6. Verify an approved catalogue with active products and rates.
7. Verify active Good, Better, and Best roofing systems.
8. Run the synthetic in-memory PDF check.
9. Run write/read/hash/delete against each private bucket and confirm no test object remains.
10. Explicitly send one test email to an administrator address.
11. Load the Jobs dashboard.
12. Open an incomplete roofing job.
13. Confirm missing roofing-system configuration shows an actionable warning rather than a crash.
14. Create a synthetic proposal.
15. Send it to the administrator test address.
16. Accept it through the unchanged proposal token route.
17. Convert it to a project.
18. Create and send a change order.
19. Approve it through the unchanged change-order token route.
20. Search Vercel logs using a displayed correlation ID.
21. Inspect operational errors for redacted tokens, keys, signatures, bodies, and customer information.
22. Confirm public HTML and PDFs expose no internal pricing.
23. Run `npm run verify:production-readiness`.
24. Run lint, type-check, tests, and build.
25. Review and rehearse the rollback section of the deployment runbook.
