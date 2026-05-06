import Link from "next/link";
import AdminTabs from "@/app/admin/_components/AdminTabs";
import { listAdminInstantQuotes, listLeadsByInstantQuoteIds } from "@/lib/db";

function money(value: number | null) {
  return typeof value === "number" ? value.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }) : "N/A";
}

function preserveValue(value: string) {
  return value || undefined;
}

export default async function InstantQuotesAdminPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const status = typeof searchParams.status === "string" ? searchParams.status : "all";
  const isMarketing = typeof searchParams.is_marketing === "string" ? searchParams.is_marketing : "all";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const from = typeof searchParams.from === "string" ? searchParams.from : "";
  const to = typeof searchParams.to === "string" ? searchParams.to : "";

  const quotes = await listAdminInstantQuotes({
    status: status as "all" | "quote_only" | "lead_submitted" | "linked_project",
    is_marketing: isMarketing as "all" | "marketing" | "internal",
    q,
    from: from || null,
    to: to || null,
    limit: 500
  });
  const leads = await listLeadsByInstantQuoteIds(quotes.map((quote) => quote.id));
  const leadIds = new Set(leads.map((lead) => lead.instant_quote_id));
  const leadByQuoteId = new Map(leads.map((lead) => [lead.instant_quote_id, lead]));
  const quoteOnlyCount = quotes.filter((quote) => !quote.project_id && !quote.has_contact_submission && !leadIds.has(quote.id)).length;
  const leadCount = quotes.filter((quote) => !quote.project_id && (quote.has_contact_submission || leadIds.has(quote.id))).length;
  const linkedCount = quotes.filter((quote) => quote.project_id).length;
  const marketingCount = quotes.filter((quote) => quote.is_marketing).length;

  return (
    <section className="section admin-shell">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker">Lead intake</p>
          <h1 className="hero-title">Instant quote dashboard</h1>
          <p className="hero-subtitle">Search quote events, separate quote-only activity from real leads, and tag records for marketing follow-up.</p>
        </div>
        <Link href="/online-estimate" className="button button--ghost">Open public instant quote</Link>
      </div>
      <AdminTabs currentPath="/admin/instant-quotes" />

      <div className="admin-stat-grid" aria-label="Instant quote summary">
        <div className="admin-stat-card"><span>Quote-only events</span><strong>{quoteOnlyCount}</strong><em>No contact submitted</em></div>
        <div className="admin-stat-card admin-stat-card--success"><span>Leads submitted</span><strong>{leadCount}</strong><em>Contact available</em></div>
        <div className="admin-stat-card"><span>Linked projects</span><strong>{linkedCount}</strong><em>Converted to project</em></div>
        <div className="admin-stat-card admin-stat-card--warning"><span>Marketing tagged</span><strong>{marketingCount}</strong><em>Marked for campaigns</em></div>
      </div>

      <form method="GET" className="admin-filter-panel" aria-label="Instant quote filters">
        <label>
          <span>Search address</span>
          <input className="input" name="q" defaultValue={q} placeholder="Example: 123 Main St" />
        </label>
        <label>
          <span>From</span>
          <input className="input" type="date" name="from" defaultValue={preserveValue(from)} />
        </label>
        <label>
          <span>To</span>
          <input className="input" type="date" name="to" defaultValue={preserveValue(to)} />
        </label>
        <label>
          <span>Status</span>
          <select className="input" name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="quote_only">Quote only</option>
            <option value="lead_submitted">Lead submitted</option>
            <option value="linked_project">Linked project</option>
          </select>
        </label>
        <label>
          <span>Tag</span>
          <select className="input" name="is_marketing" defaultValue={isMarketing}>
            <option value="all">All tags</option>
            <option value="marketing">Marketing</option>
            <option value="internal">Internal</option>
          </select>
        </label>
        <div className="admin-filter-panel__actions">
          <button className="button" type="submit">Apply filters</button>
          <Link className="button button--ghost" href="/admin/instant-quotes">Reset</Link>
        </div>
      </form>

      <div className="admin-section-heading">
        <div>
          <p className="admin-kicker">Results</p>
          <h2 className="homev3-title">Quote events</h2>
        </div>
        <p>{quotes.length} record{quotes.length === 1 ? "" : "s"} shown. Tag buttons update the record and reload this dashboard.</p>
      </div>

      {quotes.length > 0 ? (
        <div className="admin-quote-table" role="table" aria-label="Instant quote records">
          <div className="admin-quote-table__head" role="row">
            <span>Address</span><span>Estimate</span><span>Status</span><span>Lead / project</span><span>Actions</span>
          </div>
          {quotes.map((quote) => {
            const lead = leadByQuoteId.get(quote.id);
            const state = quote.project_id
              ? "linked project"
              : (quote.has_contact_submission || leadIds.has(quote.id))
                ? "lead submitted"
                : "quote only";
            const statusClass = quote.project_id ? "is-live" : state === "lead submitted" ? "is-draft" : "";

            return (
              <article key={quote.id} className="admin-quote-row" role="row">
                <div role="cell">
                  <strong>{quote.address}</strong>
                  <span>{new Date(quote.created_at).toLocaleString("en-CA")} · {quote.service_type ?? "unknown service"}</span>
                </div>
                <div role="cell">
                  <strong>{money(quote.quote_low)} - {money(quote.quote_high)}</strong>
                  <span>{quote.is_marketing ? "Marketing" : "Internal"}</span>
                </div>
                <div role="cell">
                  <span className={`admin-status-pill ${statusClass}`}>{state}</span>
                </div>
                <div role="cell">
                  {quote.project_id ? (
                    <Link href={`/admin/projects/${quote.project_id}/edit`}>Open linked project</Link>
                  ) : lead ? (
                    <span>{lead.name ?? "Unnamed lead"} · {lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</span>
                  ) : (
                    <span className="admin-muted">No contact submitted</span>
                  )}
                </div>
                <div className="admin-action-row" role="cell">
                  <form method="POST" action={`/admin/instant-quotes/${quote.id}`}>
                    <input type="hidden" name="is_marketing" value={quote.is_marketing ? "false" : "true"} />
                    <button className="button" type="submit">Mark {quote.is_marketing ? "internal" : "marketing"}</button>
                  </form>
                  {quote.project_id ? <Link className="button button--ghost" href={`/admin/projects/${quote.project_id}/edit`}>Project</Link> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty-state">
          <strong>No instant quotes match these filters.</strong>
          <span>Use Reset to return to all records, or check that quote submissions are being saved.</span>
        </div>
      )}
    </section>
  );
}
