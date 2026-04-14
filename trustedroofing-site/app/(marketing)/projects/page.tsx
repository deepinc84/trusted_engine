import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import NeighborhoodChips from "@/components/ui/NeighborhoodChips";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ProjectCard from "@/components/ProjectCard";
import { listProjects, listServices } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import dynamicImport from "next/dynamic";

const FaqAccordion = dynamicImport(() => import("@/components/FaqAccordion"), {
  ssr: false,
  loading: () => <p className="homev3-copy">Loading FAQ…</p>
});

const faqs = [
  { question: "Are these real completed roofing and exterior projects in Calgary?", answer: "Yes. These are real completed jobs, not stock examples. Each project is tied to an actual scope, materials, and location so you can see how work is handled in real conditions." },
  { question: "Can I filter projects by roofing, siding, or eavestrough work?", answer: "Yes. You can filter by service type to compare similar scopes. That makes it easier to separate full roofing work from repairs, siding jobs, and drainage-related work." },
  { question: "Do project pages show what materials were used?", answer: "Where it matters, yes. The goal is to show how the job was actually put together, not just what it looks like at the end." },
  { question: "Can project examples help me compare my house to similar homes in Calgary?", answer: "Yes. Looking at similar homes and scopes helps you understand what your project might involve before you move forward." },
  { question: "Do project examples replace an on-site inspection?", answer: "No. Every house is different. These help you understand possibilities, but the final scope depends on the actual condition of your home." },
  { question: "Will more Calgary and area projects be added over time?", answer: "Yes. The page will continue to grow as more work is completed and published." }
];

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Projects",
  description: "A growing library of real Calgary-area exterior projects that helps homeowners compare scope, materials, and pricing context.",
  path: "/projects"
});

export default async function ProjectsPage({ searchParams }: { searchParams?: { service_slug?: string; neighborhood?: string } }) {
  const [services, projects] = await Promise.all([
    listServices(),
    listProjects({ service_slug: searchParams?.service_slug ?? null, neighborhood: searchParams?.neighborhood ?? null, include_unpublished: false, limit: 200 })
  ]);

  const serviceChips = [{ label: "All services", href: "/projects" }, ...services.map((service) => ({ label: service.title, href: `/projects?service_slug=${encodeURIComponent(service.slug)}` }))];
  const neighborhoods = Array.from(new Set(projects.map((project) => project.neighborhood).filter(Boolean))) as string[];
  const neighborhoodChips = neighborhoods.map((name) => ({ label: name, href: `/projects?neighborhood=${encodeURIComponent(name)}` }));

  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="Real Calgary Roofing and Exterior Projects"
        description="This page shows completed roofing and exterior work across Calgary and surrounding areas. No stock photos, no filler examples."
      />
      <section className="ui-page-section">
        <PageContainer>
          <article className="ui-card">
            <p>
              You can use these projects to compare what was actually done, what materials were used, and how similar homes were handled.
              Whether you’re looking at a full <Link href="/services/roofing">roof replacement</Link>, <Link href="/services/roof-repair">repair</Link>, <Link href="/services/gutters">eavestrough</Link>, or <Link href="/services/james-hardie-siding">siding work</Link>, this is meant to give you something real to compare against before you book a quote.
            </p>
          </article>
          <div className="ui-detail-grid" style={{ marginTop: 20 }}>
            <article className="ui-card">
              <h2>Real Calgary Roofing and Exterior Project Examples</h2>
              <p>A project page should do more than show a finished roof. It should show what actually happened on the house.</p>
              <p>What was replaced. What was repaired. What changed during the job.</p>
              <p>Some projects are straightforward. Others look simple from the ground but turn into full replacements once the roof is opened up. That’s normal, and it’s why seeing real jobs matters.</p>
              <p>Each project here is tied to a real home and a real scope. The goal is to give you a clearer idea of what work actually looks like in Calgary, not just what it’s supposed to look like in theory.</p>
            </article>
            <article className="ui-card">
              <h2>Compare Roof Replacement, Repair, Siding, and Eavestrough Work</h2>
              <p>Not every job starts the same way.</p>
              <p>Some homes need a full roof replacement because the shingles are worn out or failing. Others only need a repair after wind damage or a leak around a transition. Some issues come down to drainage, where eavestrough and downspout changes fix the problem. Other times it’s siding, soffit, or fascia that needs attention.</p>
              <p>That’s why filtering matters.</p>
              <p>If you’re looking at roofing, you should be able to compare roofing jobs, not scroll through unrelated work. Same goes for siding and eavestrough. A full replacement in Calgary should be compared against other real replacements, not mixed examples.</p>
              <p>If you know what you’re looking for, start with the service filters. If you’re not sure yet, look at projects in your area and see what’s actually happening on similar homes.</p>
            </article>
          </div>
          <div className="ui-detail-grid" style={{ marginTop: 20 }}>
            <article className="ui-card">
              <h2>How Project Examples Help You Plan</h2>
              <p>Project examples help because they show what actually happens on real houses.</p>
              <p>Two homes might both “need roofing,” but the scope can be completely different. Roof shape, ventilation, drainage, access, and how the original system was installed all change the outcome.</p>
              <p>Looking through real projects helps you figure out where your house likely sits. Repair, replacement, or something in between.</p>
              <p>It also helps you see how materials are actually used, not just how they’re marketed.</p>
              <p>This doesn’t replace an inspection, but it gives you a much better starting point. If you want a rough number first, use the <Link href="/online-estimate">instant quote tool</Link>, then compare that range against similar projects here.</p>
            </article>
            <article className="ui-card">
              <h2>Roofing Materials, Scope, and Neighbourhood Context</h2>
              <p>Material choice matters, but the scope around it matters just as much.</p>
              <p>A roof isn’t just shingles. It can involve ventilation changes, edge details, transitions, underlayment, and drainage corrections. On some homes, everything ties together clean. On others, different sections need to be rebuilt so the system actually works as one.</p>
              <p>Location also plays a role.</p>
              <p>Different parts of Calgary tend to show different patterns. Some neighbourhoods have older roofs with long-term wear. Others have newer homes where the issue is how the original install was done.</p>
              <p>Looking at <Link href="/service-areas">projects by area</Link> helps you see what’s common, what isn’t, and how similar homes are being handled.</p>
            </article>
          </div>
        </PageContainer>
      </section>
      <section className="ui-page-section"><PageContainer><NeighborhoodChips chips={serviceChips} /><NeighborhoodChips chips={neighborhoodChips} />{projects.length ? <div className="ui-grid ui-grid--projects" style={{ marginTop: 20 }}>{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <article className="ui-card" style={{ marginTop: 20 }}><h2>Project cards will populate here as more completed work is published</h2><p>The structure is in place for project cards, neighbourhood filters, and future data expansion. If you do not see a close match yet, the instant quote page is still the fastest way to get a realistic budget range based on comparable completed work.</p><Link href="/online-estimate" className="button">Start instant quote</Link></article>}</PageContainer></section>
      <CtaBand title="Want to compare your house to similar local work?" body="Start with the instant quote tool for a pricing range, then compare your home against similar projects to see what the scope and materials actually look like before moving forward." />
      <section className="ui-page-section ui-page-section--soft"><PageContainer><article className="ui-card"><h2>Project questions</h2><FaqAccordion items={faqs} /></article></PageContainer></section>
    </>
  );
}
