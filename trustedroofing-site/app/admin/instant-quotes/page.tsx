import Link from "next/link";
import { listAdminInstantQuotes, listLeadsByInstantQuoteIds } from "@/lib/db";

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

  return (
    <section className="section">
      <h1 className="hero-title">Instant quote dashboard</h1>
      <p className="hero-subtitle">Shows all quote events including quote-only records that never submitted contact info.</p>
      <form method="GET" style={{ display: "grid", gap: 8, maxWidth: 720, marginTop: 16 }}>
        <input className="input" name="q" defaultValue={q} placeholder="Search by address" />
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" type="date" name="from" defaultValue={from} />
          <input className="input" type="date" name="to" defaultValue={to} />
          <select className="input" name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="quote_only">Quote only</option>
            <option value="lead_submitted">Lead submitted</option>
            <option value="linked_project">Linked project</option>
          </select>
          <select className="input" name="is_marketing" defaultValue={isMarketing}>
            <option value="all">All tags</option>
            <option value="marketing">Marketing</option>
            <option value="internal">Internal</option>
          </select>
          <button className="button" type="submit">Apply filters</button>
        </div>
      </form>

      <div className="card-grid" style={{ marginTop: 20 }}>
        {quotes.map((quote) => {
          const state = quote.project_id
            ? "linked project"
            : (quote.has_contact_submission || leadIds.has(quote.id))
              ? "lead submitted"
              : "quote only";

          return (
            <article key={quote.id} className="card">
              <h3>{quote.address}</h3>
              <p style={{ marginTop: 6 }}>Range: {quote.quote_low ?? "N/A"} - {quote.quote_high ?? "N/A"}</p>
              <p>Service: {quote.service_type ?? "unknown"}</p>
              <p>Timestamp: {new Date(quote.created_at).toLocaleString("en-CA")}</p>
              <p>Status: <strong>{state}</strong></p>
              <p>Tag: {quote.is_marketing ? "marketing" : "internal"}</p>
              {quote.project_id ? <p>Project: <Link href={`/admin/projects/${quote.project_id}/edit`}>{quote.project_id}</Link></p> : null}
              <form method="POST" action={`/admin/instant-quotes/${quote.id}`} style={{ marginTop: 8 }}>
                <input type="hidden" name="is_marketing" value={quote.is_marketing ? "false" : "true"} />
                <button className="button" type="submit">Mark as {quote.is_marketing ? "internal" : "marketing"}</button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
