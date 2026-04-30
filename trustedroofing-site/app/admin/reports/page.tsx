import AdminTabs from "@/app/admin/_components/AdminTabs";
import { listAdminInstantQuotes, listProjects } from "@/lib/db";

export default async function ReportsPage() {
  const [quotes, projects] = await Promise.all([
    listAdminInstantQuotes({ status: "all", is_marketing: "all", limit: 2000 }),
    listProjects({ include_unpublished: true, limit: 2000 })
  ]);

  const quoteOnly = quotes.filter((q) => !q.has_contact_submission && !q.project_id).length;
  const leadSubmitted = quotes.filter((q) => q.has_contact_submission && !q.project_id).length;
  const linkedProject = quotes.filter((q) => !!q.project_id).length;
  const marketingCount = quotes.filter((q) => q.is_marketing).length;

  const validProfitProjects = projects.filter((project) => project.actual_gross_profit !== null);
  const avgActualMargin = validProfitProjects.length
    ? validProfitProjects.reduce((sum, project) => sum + (project.actual_gross_margin_percent ?? 0), 0) / validProfitProjects.length
    : 0;
  const totalActualProfit = validProfitProjects.reduce((sum, project) => sum + (project.actual_gross_profit ?? 0), 0);

  const byService = new Map<string, { count: number; profit: number }>();
  for (const project of projects) {
    const key = project.service_slug;
    const row = byService.get(key) ?? { count: 0, profit: 0 };
    row.count += 1;
    row.profit += project.actual_gross_profit ?? 0;
    byService.set(key, row);
  }

  return (
    <section className="section">
      <h1 className="hero-title">Lifecycle and profitability reporting</h1>
      <AdminTabs currentPath="/admin/reports" />
      <div className="card-grid" style={{ marginTop: 20 }}>
        <article className="card"><h3>Quote only</h3><p>{quoteOnly}</p></article>
        <article className="card"><h3>Lead submitted</h3><p>{leadSubmitted}</p></article>
        <article className="card"><h3>Linked to project</h3><p>{linkedProject}</p></article>
        <article className="card"><h3>Marketing tagged quotes</h3><p>{marketingCount}</p></article>
        <article className="card"><h3>Total actual gross profit</h3><p>${Math.round(totalActualProfit).toLocaleString()}</p></article>
        <article className="card"><h3>Average actual margin</h3><p>{avgActualMargin.toFixed(2)}%</p></article>
      </div>
      <div style={{ marginTop: 24 }}>
        <h2 className="homev3-title" style={{ fontSize: "1.5rem" }}>Revenue/profitability by service type</h2>
        <div className="card-grid" style={{ marginTop: 12 }}>
          {Array.from(byService.entries()).map(([service, value]) => (
            <article className="card" key={service}>
              <h3>{service}</h3>
              <p>Projects: {value.count}</p>
              <p>Profit: ${Math.round(value.profit).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
