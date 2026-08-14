# Estimator integration record trace

## Route map

- Job creation and workspace: `/admin/jobs`, `/admin/jobs/new`, `/admin/jobs/[id]` and its project/change-order actions.
- Compatibility entry points: `/admin/estimates*` and `/admin/proposals*` redirect into the job workspace; admin proposal APIs remain under `/admin/proposals/api`.
- Customer contract: `/proposal/[token]`, `/proposal/[token]/accept`, and `/proposal/[token]/signed-pdf`.
- Customer change order: `/change-order/[token]`, `/change-order/[token]/accept`, and `/change-order/[token]/signed-pdf`.
- Operations: `/admin/system-status` and its protected active-test endpoint.

## Record chain and immutable boundaries

`estimate_customers` → `estimate_properties` → `estimates` → scope measurement/result/snapshot tables → `proposals` → `proposal_revisions` → `proposal_access_tokens` → `proposal_acceptances` → signed `proposal_documents` → `projects` → `change_orders` → `change_order_revisions` → `change_order_access_tokens` → `change_order_acceptances` → signed change-order document → `project_total_snapshots`.

Customer/property IDs originate at job creation. Proposal rows reference the estimate but contain customer-safe snapshots. Sending locks a revision before delivery; retries reuse it. Acceptance references the exact token and revision and is atomic. Project conversion references the acceptance and signed document and is idempotent. Change-order customer output uses a locked revision snapshot, and only approved revisions enter server-derived project totals.

## Stabilization findings

Fixed: New Job setup controls were not persisted; existing properties could be reassigned to another customer; estimate saves lacked stale-tab rejection; Build Proposal created duplicate drafts; preferred proposal metadata was not maintained; send failures could leave mutable proposal/change-order content after creating public artifacts; change-order revised totals used the original rather than current approved contract base; project status reload used a project ID as an estimate ID; and the signed-contract admin action targeted a missing route.

Live blockers: storage permissions, PostgREST cache state, Resend delivery, and actual browser/mobile rendering require the disposable/production environments described in the acceptance test. No automated process should exercise those against production.
