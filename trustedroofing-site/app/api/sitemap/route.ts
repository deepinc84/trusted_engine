import { listProjects } from "@/lib/db";

function buildUrlset(urls: string[]) {
  const entries = urls
    .map((url) => `<url><loc>${url}</loc></url>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustedroofing.ca";
  const projects = await listProjects({});
  const corePages = [
    "",
    "/services",
    "/services/roofing",
    "/services/roof-repair",
    "/services/solar",
    "/projects",
    "/quote"
  ];
  const projectPages = projects.map((project) => `/projects/${project.slug}`);
  const urls = [...corePages, ...projectPages].map((path) =>
    `${baseUrl}${path}`
  );
  return new Response(buildUrlset(urls), {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
