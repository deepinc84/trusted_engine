const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustedroofing.ca";

const staticPaths = [
  "",
  "/services",
  "/services/roofing",
  "/services/roof-repair",
  "/services/solar",
  "/projects",
  "/quote"
];

const knownProjectSlugs = [
  "signal-hill-roof-replacement",
  "mahogany-storm-repair",
  "bridgeland-exterior-refresh"
];

// TODO: replace with direct Supabase query once CI environment has DB credentials.
const urls = [
  ...staticPaths,
  ...knownProjectSlugs.map((slug) => `/projects/${slug}`)
].map((path) => `${baseUrl}${path}`);

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
  .map((url) => `<url><loc>${url}</loc></url>`)
  .join("")}</urlset>`;

process.stdout.write(xml);
