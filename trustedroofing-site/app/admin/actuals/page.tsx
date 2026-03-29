import { listProjects } from "@/lib/db";

export default async function ActualsAdminPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "updated";
  let projects = await listProjects({ include_unpublished: true, limit: 500 });

  if (q) {
    const lower = q.toLowerCase();
    projects = projects.filter((project) =>
      (project.address_private ?? "").toLowerCase().includes(lower) ||
      (project.title ?? "").toLowerCase().includes(lower) ||
      (project.neighborhood ?? "").toLowerCase().includes(lower)
    );
  }

  if (sort === "margin") {
    projects.sort((a, b) => (b.actual_gross_margin_percent ?? -999) - (a.actual_gross_margin_percent ?? -999));
  } else {
    projects.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  }

  return (
    <section className="section">
      <h1 className="hero-title">Actual data admin tab</h1>
      <form method="GET" style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input className="input" name="q" defaultValue={q} placeholder="Search by address / project" />
        <select className="input" name="sort" defaultValue={sort}>
          <option value="updated">Sort by completion</option>
          <option value="margin">Sort by actual margin</option>
        </select>
        <button className="button" type="submit">Apply</button>
      </form>
      <div className="card-grid" style={{ marginTop: 20 }}>
        {projects.map((project) => (
          <article key={project.id} className="card">
            <h3>{project.title}</h3>
            <p>{project.address_private ?? "Address unavailable"}</p>
            <p>Actual total cost: {project.actual_total_cost ?? "N/A"}</p>
            <p>Actual sale price: {project.actual_sale_price ?? "N/A"}</p>
            <p>Actual gross margin: {project.actual_gross_margin_percent ?? "N/A"}</p>
            <form method="POST" action={`/admin/actuals/${project.id}`} style={{ display: "grid", gap: 6 }}>
              <input className="input" name="actual_sale_price" defaultValue={project.actual_sale_price ?? ""} placeholder="Actual sale price" />
              <input className="input" name="actual_material_cost" defaultValue={project.actual_material_cost ?? ""} placeholder="Actual material cost" />
              <input className="input" name="actual_labor_cost" defaultValue={project.actual_labor_cost ?? ""} placeholder="Actual labor cost" />
              <button className="button" type="submit">Quick update actuals</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
