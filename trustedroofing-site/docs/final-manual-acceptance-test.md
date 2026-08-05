# Final estimator manual acceptance test

Record **Pass / Fail / Blocked**, tester, date, and a correlation ID for every row. Use synthetic customer data only.

| Area | Prerequisite | Exact action | Expected result / database verification | Failure behaviour | Result |
|---|---|---|---|---|---|
| A. Deployment | Backup and pricing catalogue | Apply the ordered bundle, reload PostgREST | `app_schema_migrations` and readiness RPC agree through 0028 | Transaction stops; no premature history row | ___ |
| B. System Status | Admin token | Open `/admin/system-status`; run connection, schema, PDF and temporary storage tests | Actual env names, functions and four private buckets are ready | Safe fix and correlation ID; temp object deleted | ___ |
| C. New Job | Synthetic customer | Create new and existing-customer jobs; double-click Create | One customer/property/estimate; setup in `ui_completion_state`; workspace opens | Invalid customer/property rejected without reassignment | ___ |
| D. Roofing Estimate | Roofing job | Save/reload measurements and local products; test missing systems | Snapshots/results reconstruct; local fallback remains available | Actionable warning, not page crash | ___ |
| E. Soft Metals | Enabled scopes | Complete eavestrough, downspout, fascia and soffit | Enabled `estimate_scopes` and snapshots only | Disabled scope is excluded | ___ |
| F. Vinyl | Vinyl job | Select product, colour, accessories; save/reload | Vinyl snapshot and price remain identical | Missing/stale item is actionable | ___ |
| G. James Hardie | Hardie job | Select profile, colour and accessories | Hardie snapshot/result persists | No supplier price appears publicly | ___ |
| H. Specification/Tender | Specification job | Complete details, documents, compliance, alternates, allowances, unit rates | Tender records reference the same estimate | Residential job shows no tender controls | ___ |
| I. Images and Plans | Private buckets ready | Upload, annotate, add plan/photo page | Original plus version/instance records; private signed access | Failed upload preserves job data | ___ |
| J. Pricing | Completed scopes | Exercise fixed $100, percentage, margin, manual, below-cost reason | Rounded scope/proposal totals agree | Missing costs block send, not measurements | ___ |
| K. Proposal Builder | Ready estimate | Click Build Proposal twice; reorder/edit; refresh | One draft, preferred ID set, estimate snapshot unchanged | Sent/accepted content requires revision | ___ |
| L. Proposal Send | Synthetic inbox | Preview PDF, send, force one delivery failure, retry | Revision/token/PDF lock before email; attempt and retry reuse revision | No misleading success or duplicate revision | ___ |
| M. Customer Acceptance | Valid token | View, select, sign, submit twice | One acceptance, consumed token, integrity and signed PDF | Manipulation/duplicate/expired request rejected safely | ___ |
| N. Project Conversion | Accepted proposal | Click Create Project twice; open signed contract | One project references acceptance/revision/document; initial history/totals | Unaccepted conversion rejected | ___ |
| O. Production and Schedule | Project | Update status, colours, material order and dates | Operational rows/history change; accepted snapshot does not | Invalid transition rejected | ___ |
| P. Change Orders | Project | Create addition, send/approve; deduction/decline; revise sent order | Sequential numbers, immutable locks; only approved totals included | Failed delivery offers retry; decline changes no total | ___ |
| Q. PDFs | All document states | Compare web, draft, sent and signed PDFs including long/image content | Same selections/totals, hashes and page numbers; no internal data | Generation failure preserves lock and is retryable | ___ |
| R. Mobile | Phone-sized browser | Complete core forms, camera upload and signing | No core horizontal scroll; touch targets and sticky actions usable | Record viewport and screenshot | ___ |
| S. Security and Sanitization | Browser dev tools/log access | Inspect public JSON/HTML/PDF and logs | No raw tokens, PII logs, supplier/material/labour cost or secrets | Revoke exposure and treat as release blocker | ___ |
| T. Rollback and Cleanup | Test IDs recorded | Revoke tokens, run cleanup command, verify backup/rollback steps | Synthetic records/objects removed without touching real records | Stop and restore backup if migration rollback is needed | ___ |

Browser and live Supabase/Resend checks are intentionally manual and must not be marked passed from unit-test output.
