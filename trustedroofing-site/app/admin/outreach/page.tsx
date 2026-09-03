import { listOutreachProspects, outreachDashboardStats } from "@/lib/outreach/repository";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  let prospects: any[] = [];
  let stats = { prospects:0, enrollments:0, messages:0, suppressions:0, won:0 };
  let error = "";

  try {
    [prospects, stats] = await Promise.all([listOutreachProspects(200), outreachDashboardStats()]);
  } catch (loadError) {
    error = loadError instanceof Error ? loadError.message : "Unable to load outreach";
  }

  return <main className="section admin-shell">
    <div className="admin-hero"><div><p className="admin-kicker">Trusted Engine sales</p><h1>Outreach</h1><p>Prospects, campaign activity, suppressions and sales outcomes.</p></div></div>
    <div className="estimate-panel"><p><b>{stats.prospects}</b> prospects · <b>{stats.enrollments}</b> enrolled · <b>{stats.messages}</b> messages · <b>{stats.suppressions}</b> suppressed · <b>{stats.won}</b> won</p>{error && <p>{error}</p>}</div>
    <div className="estimate-panel" style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th align="left">Company</th><th align="left">Market</th><th align="left">Email</th><th align="left">Priority</th><th align="left">Status</th></tr></thead><tbody>{prospects.map((prospect:any)=><tr key={prospect.id}><td>{prospect.company_name}</td><td>{[prospect.metro,prospect.province].filter(Boolean).join(", ")}</td><td>{prospect.email}</td><td>{prospect.priority}</td><td>{prospect.status}</td></tr>)}</tbody></table>
      {!prospects.length && !error && <p>No prospects imported yet.</p>}
    </div>
  </main>;
}
