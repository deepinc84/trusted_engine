import Link from "next/link";
import CtaBand from "@/components/ui/CtaBand";
import NeighborhoodChips from "@/components/ui/NeighborhoodChips";
import PageContainer from "@/components/ui/PageContainer";
import PageHero from "@/components/ui/PageHero";
import ProjectCard from "@/components/ProjectCard";
import { listProjects, listServices } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

const faqs = [
  { question: "Are these real completed projects in Calgary?", answer: "Yes. This section is intended for real completed work, not stock examples. As more projects are published, the value of the page grows because homeowners can compare scope, materials, and neighbourhood context in a practical way." },
  { question: "Why is the projects page useful if the archive is still growing?", answer: "Even a small project library helps homeowners understand how work is scoped, what materials are being used, and how similar homes are priced. The goal is transparency, not volume for its own sake." },
  { question: "Will project pages show pricing?", answer: "They are meant to support pricing context, not replace a proper quote. Over time the project section will make it easier to compare scope, location, and material trends before a homeowner asks for a final proposal." },
  { question: "Can I filter projects by service or neighbourhood?", answer: "Yes. The directory is structured so homeowners can compare projects by service category and neighbourhood relevance. That makes it easier to find examples that feel close to your own house and scope." },
  { question: "Do project examples replace an inspection?", answer: "No. They help you understand scope and set expectations, but every house has its own access, ventilation, drainage, and material considerations that still need to be reviewed." },
  { question: "Will more Calgary-area projects be added over time?", answer: "Yes. The page is designed to expand as more completed work is published from Calgary and surrounding areas like Airdrie, Chestermere, and Cochrane." }
];

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
      <PageHero eyebrow="Projects" title="Real completed work, with more Calgary projects on the way" description="This page is meant to help homeowners compare scope, materials, and neighbourhood context instead of trying to guess from generic gallery photos." />
      <section className="ui-page-section"><PageContainer><div className="ui-detail-grid"><article className="ui-card"><h2>Why this page exists</h2><p>A useful project page should help a homeowner answer practical questions. What was the scope? What material direction did that job take? Was it a full replacement, a targeted repair, or part of a broader exterior update? This section is being built as a transparency tool, not a vanity gallery.</p><p>As the archive grows, homeowners will be able to compare similar homes, check neighbourhood relevance, and understand how real project history supports the instant quote system. Limited inventory today does not change the purpose. It simply means the library is still early.</p></article><article className="ui-card"><h2>How to use the directory</h2><ul><li>Filter by service first if you want to compare similar scopes.</li><li>Use neighbourhood chips to find work that feels locally relevant.</li><li>Look at material choices and project summaries to build better questions before your site visit.</li><li>Use the quote tool afterward to compare your home against real project-backed pricing trends.</li></ul></article></div></PageContainer></section>
      <section className="ui-page-section ui-page-section--soft"><PageContainer><article className="ui-card"><h2>What homeowners will see here over time</h2><p>Each published project is intended to add real educational value. That includes service type, neighbourhood context, material direction, and a clear summary of what was done. As more projects are added from Calgary, Airdrie, Chestermere, and Cochrane, the page becomes a stronger planning resource because the comparisons get more relevant.</p><p>If you are reviewing materials before comparing project examples, the manufacturer references for <a href="https://www.gaf.ca/residential-roofing/shingles/timberline-hd" target="_blank" rel="noreferrer">GAF Timberline HD</a> and <a href="https://malarkeyroofing.com/products/shingles/legacy" target="_blank" rel="noreferrer">Malarkey Legacy</a> are useful places to start.</p></article></PageContainer></section>
      <section className="ui-page-section"><PageContainer><NeighborhoodChips chips={serviceChips} /><NeighborhoodChips chips={neighborhoodChips} />{projects.length ? <div className="ui-grid ui-grid--projects" style={{ marginTop: 20 }}>{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <article className="ui-card" style={{ marginTop: 20 }}><h2>Project cards will populate here as more completed work is published</h2><p>The structure is in place for project cards, neighbourhood filters, and future data expansion. If you do not see a close match yet, the instant quote page is still the fastest way to get a realistic budget range based on comparable completed work.</p><Link href="/online-estimate" className="button">Start instant quote</Link></article>}</PageContainer></section>
      <section className="ui-page-section ui-page-section--soft"><PageContainer><article className="ui-card"><h2>Frequently asked questions</h2>{/* Schema note: apply FAQ schema to this section only if this page is used as a Q&A resource. */}<div className="ui-list-links" style={{ display: "grid", gap: 20 }}>{faqs.map((item) => <div key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div></article></PageContainer></section>
      <CtaBand title="Want to compare your house to similar local work?" body="Use the instant quote tool first, then we can line that range up against the most relevant completed projects." />
    </>
  );
}
