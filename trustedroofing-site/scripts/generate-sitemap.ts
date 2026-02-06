import { listProjects } from "../lib/db";

async function run() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustedroofing.ca";
  const projects = await listProjects({});
  const paths = [
    "",
    "/services",
    "/services/roofing",
    "/services/roof-repair",
    "/projects",
    "/quote",
    ...projects.map((project) => `/projects/${project.slug}`)
  ];
  const urls = paths.map((path) => `${baseUrl}${path}`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((url) => `<url><loc>${url}</loc></url>`)
    .join("")}</urlset>`;
  process.stdout.write(xml);
}

run();
