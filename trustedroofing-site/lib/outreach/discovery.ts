import { getServiceClient } from "@/lib/db";

type Market = {
  metro: string;
  province: string;
  slug: string;
  tier: 1 | 2 | 3 | 4;
};

type ProvinceSweep = {
  provinceName: string;
  province: string;
  maxPages: number;
  tier: 1 | 2 | 3 | 4;
};

type Candidate = {
  company_name: string;
  metro: string;
  province: string;
  source_url: string;
  market_tier: number;
  priority: "A" | "B" | "C" | "D";
};

const DIRECTORY_BASE = "https://www.doineedaroofer.com";
const YELLOWPAGES_BASE = "https://www.yellowpages.ca";

// Calgary is intentionally excluded from sales prospecting because it overlaps
// Trusted Roofing & Exteriors' home market.
const MARKETS: Market[] = [
  { metro: "Toronto", province: "ON", slug: "toronto", tier: 1 },
  { metro: "Mississauga", province: "ON", slug: "mississauga", tier: 1 },
  { metro: "Brampton", province: "ON", slug: "brampton", tier: 1 },
  { metro: "Vaughan", province: "ON", slug: "vaughan", tier: 1 },
  { metro: "Markham", province: "ON", slug: "markham", tier: 1 },
  { metro: "Richmond Hill", province: "ON", slug: "richmond-hill", tier: 1 },
  { metro: "Edmonton", province: "AB", slug: "edmonton", tier: 1 },
  { metro: "Hamilton", province: "ON", slug: "hamilton", tier: 2 },
  { metro: "Kitchener", province: "ON", slug: "kitchener", tier: 2 },
  { metro: "Waterloo", province: "ON", slug: "waterloo", tier: 2 },
  { metro: "Cambridge", province: "ON", slug: "cambridge", tier: 2 },
  { metro: "Ottawa", province: "ON", slug: "ottawa", tier: 2 },
  { metro: "Vancouver", province: "BC", slug: "vancouver", tier: 2 },
  { metro: "Surrey", province: "BC", slug: "surrey", tier: 2 },
  { metro: "Burnaby", province: "BC", slug: "burnaby", tier: 2 },
  { metro: "Richmond", province: "BC", slug: "richmond", tier: 2 },
  { metro: "Coquitlam", province: "BC", slug: "coquitlam", tier: 2 },
  { metro: "Langley", province: "BC", slug: "langley", tier: 2 },
  { metro: "Abbotsford", province: "BC", slug: "abbotsford", tier: 2 },
  { metro: "Winnipeg", province: "MB", slug: "winnipeg", tier: 2 },
  { metro: "Regina", province: "SK", slug: "regina", tier: 3 },
  { metro: "Saskatoon", province: "SK", slug: "saskatoon", tier: 3 },
  { metro: "Halifax", province: "NS", slug: "halifax", tier: 3 },
  { metro: "Dartmouth", province: "NS", slug: "dartmouth", tier: 3 },
  { metro: "Victoria", province: "BC", slug: "victoria", tier: 3 },
  { metro: "Kelowna", province: "BC", slug: "kelowna", tier: 3 },
  { metro: "London", province: "ON", slug: "london", tier: 4 },
  { metro: "Windsor", province: "ON", slug: "windsor", tier: 4 },
  { metro: "Barrie", province: "ON", slug: "barrie", tier: 4 },
  { metro: "Oshawa", province: "ON", slug: "oshawa", tier: 4 },
  { metro: "Oakville", province: "ON", slug: "oakville", tier: 4 },
  { metro: "Burlington", province: "ON", slug: "burlington", tier: 4 },
  { metro: "St. Catharines", province: "ON", slug: "st-catharines", tier: 4 },
  { metro: "Kingston", province: "ON", slug: "kingston", tier: 4 },
  { metro: "Guelph", province: "ON", slug: "guelph", tier: 4 },
  { metro: "Nanaimo", province: "BC", slug: "nanaimo", tier: 4 },
  { metro: "Kamloops", province: "BC", slug: "kamloops", tier: 4 },
  { metro: "Red Deer", province: "AB", slug: "red-deer", tier: 4 },
  { metro: "Lethbridge", province: "AB", slug: "lethbridge", tier: 4 },
  { metro: "Grande Prairie", province: "AB", slug: "grande-prairie", tier: 4 },
  { metro: "Medicine Hat", province: "AB", slug: "medicine-hat", tier: 4 },
  { metro: "Fredericton", province: "NB", slug: "fredericton", tier: 4 },
  { metro: "Moncton", province: "NB", slug: "moncton", tier: 4 },
  { metro: "Saint John", province: "NB", slug: "saint-john", tier: 4 },
  { metro: "St. John's", province: "NL", slug: "st-johns", tier: 4 },
  { metro: "Charlottetown", province: "PE", slug: "charlottetown", tier: 4 },
  { metro: "Quebec City", province: "QC", slug: "quebec-city", tier: 4 },
  { metro: "Montreal", province: "QC", slug: "montreal", tier: 4 },
  { metro: "Laval", province: "QC", slug: "laval", tier: 4 },
  { metro: "Longueuil", province: "QC", slug: "longueuil", tier: 4 },
  { metro: "Gatineau", province: "QC", slug: "gatineau", tier: 4 },
  { metro: "Sherbrooke", province: "QC", slug: "sherbrooke", tier: 4 },
];

// Province sweeps are intentionally much larger than the city seed list. A full
// pass represents several thousand public roofing-directory listings. To avoid a
// single serverless request doing hundreds of network calls, each discovery run
// scans one page window across every province. Repeated runs advance automatically.
const PROVINCE_SWEEPS: ProvinceSweep[] = [
  { provinceName: "Ontario", province: "ON", maxPages: 180, tier: 1 },
  { provinceName: "Alberta", province: "AB", maxPages: 70, tier: 1 },
  { provinceName: "British Columbia", province: "BC", maxPages: 90, tier: 2 },
  { provinceName: "Manitoba", province: "MB", maxPages: 25, tier: 2 },
  { provinceName: "Saskatchewan", province: "SK", maxPages: 25, tier: 3 },
  { provinceName: "Nova Scotia", province: "NS", maxPages: 18, tier: 3 },
  { provinceName: "New Brunswick", province: "NB", maxPages: 12, tier: 4 },
  { provinceName: "Newfoundland and Labrador", province: "NL", maxPages: 8, tier: 4 },
  { provinceName: "Prince Edward Island", province: "PE", maxPages: 4, tier: 4 },
  { provinceName: "Quebec", province: "QC", maxPages: 90, tier: 4 },
];

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ucirc;/g, "û")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç");
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeSlug(slug: string) {
  return decodeURIComponent(slug)
    .replace(/-\d+$/, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.length <= 3 && /^[a-z]+$/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace(/\bLtd\b/g, "Ltd.")
    .replace(/\bInc\b/g, "Inc.");
}

function normalizeCompany(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function looksLikeProspect(name: string) {
  const value = name.toLowerCase();
  if (name.length < 3 || name.length > 180) return false;
  if (/do i need a roofer|claim listing|request a quote|browse directory|roofing contractors association|yellow pages|pages jaunes/.test(value)) return false;
  return /(roof|roofing|roofer|roofs|toit|toiture|toitures|couvreur|couvreurs|shingle|exterior|exteriors|siding|building envelope|sheet metal)/i.test(name);
}

function priorityForTier(tier: number): Candidate["priority"] {
  if (tier <= 2) return "A";
  if (tier === 3) return "B";
  return "C";
}

function extractDirectoryNames(html: string, market: Market): Candidate[] {
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  const anchor = /<a\b[^>]*href=["'](\/directory\/[^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchor.exec(html))) {
    const href = match[1];
    const inner = match[2];
    const heading = inner.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    let name = heading ? stripTags(heading[1]) : "";

    if (!name || name.length > 180) {
      const slug = href.split("/").filter(Boolean).pop() ?? "";
      const suffix = `-${market.slug}`;
      const companySlug = slug.endsWith(suffix) ? slug.slice(0, -suffix.length) : slug;
      name = humanizeSlug(companySlug);
    }

    name = name.replace(/\s+[★☆]+.*$/, "").replace(/\s+Reviews verified.*$/i, "").trim();
    if (!looksLikeProspect(name)) continue;
    const key = normalizeCompany(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    candidates.push({
      company_name: name,
      metro: market.metro,
      province: market.province,
      source_url: `${DIRECTORY_BASE}/${market.province}/${market.slug}`,
      market_tier: market.tier,
      priority: priorityForTier(market.tier),
    });
  }

  return candidates;
}

function extractYellowPagesNames(html: string, sweep: ProvinceSweep, sourceUrl: string): Candidate[] {
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  const patterns = [
    /<a\b[^>]*class=["'][^"']*listing__name--link[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    /<h3\b[^>]*class=["'][^"']*listing__name[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      const name = stripTags(match[1] ?? "").trim();
      if (!looksLikeProspect(name)) continue;
      if (/calgary/i.test(name)) continue;
      const key = normalizeCompany(name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        company_name: name,
        metro: sweep.provinceName,
        province: sweep.province,
        source_url: sourceUrl,
        market_tier: sweep.tier,
        priority: priorityForTier(sweep.tier),
      });
    }
    if (candidates.length) break;
  }

  return candidates;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "TrustedEngineProspectDiscovery/1.0 (+https://trustedexteriors.ca)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchMarket(market: Market) {
  const urls = [`${DIRECTORY_BASE}/${market.province}/${market.slug}`, `${DIRECTORY_BASE}/${market.slug}`];
  let best: Candidate[] = [];
  let sourceUrl = urls[0];

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const candidates = extractDirectoryNames(html, market).map((candidate) => ({ ...candidate, source_url: url }));
      if (candidates.length > best.length) {
        best = candidates;
        sourceUrl = url;
      }
    } catch {
      // A failed market must not abort the whole discovery run.
    }
  }

  return { market, sourceUrl, candidates: best };
}

function discoveryWindow() {
  // Advances every run/hour and wraps independently for each province. Each run
  // scans 4 pages per province, so the pool expands continuously without needing
  // a separate cursor table or manual import files.
  return Math.floor(Date.now() / 3_600_000);
}

async function fetchProvinceWindow(sweep: ProvinceSweep, windowId: number) {
  const pagesPerRun = 4;
  const start = ((windowId * pagesPerRun) % sweep.maxPages) + 1;
  const pages = Array.from({ length: pagesPerRun }, (_, index) => ((start - 1 + index) % sweep.maxPages) + 1);
  const results = await Promise.all(pages.map(async (page) => {
    const location = encodeURIComponent(`${sweep.provinceName} ${sweep.province}`);
    const url = `${YELLOWPAGES_BASE}/search/si/${page}/Roofers/${location}`;
    try {
      const html = await fetchHtml(url);
      return extractYellowPagesNames(html, sweep, url);
    } catch {
      return [];
    }
  }));
  return results.flat();
}

export async function discoverRoofingProspects() {
  const client = getServiceClient();
  if (!client) throw new Error("Supabase service client unavailable");

  const marketResults: Awaited<ReturnType<typeof fetchMarket>>[] = [];
  const marketConcurrency = 8;
  for (let i = 0; i < MARKETS.length; i += marketConcurrency) {
    const batch = MARKETS.slice(i, i + marketConcurrency);
    marketResults.push(...await Promise.all(batch.map(fetchMarket)));
  }

  const windowId = discoveryWindow();
  const provinceResults: Candidate[] = [];
  const provinceConcurrency = 5;
  for (let i = 0; i < PROVINCE_SWEEPS.length; i += provinceConcurrency) {
    const batch = PROVINCE_SWEEPS.slice(i, i + provinceConcurrency);
    const results = await Promise.all(batch.map((sweep) => fetchProvinceWindow(sweep, windowId)));
    provinceResults.push(...results.flat());
  }

  const allCandidates = [...marketResults.flatMap((result) => result.candidates), ...provinceResults]
    .filter((candidate) => candidate.metro.toLowerCase() !== "calgary")
    .sort((a, b) => a.market_tier - b.market_tier || a.metro.localeCompare(b.metro) || a.company_name.localeCompare(b.company_name));

  const uniqueCandidates: Candidate[] = [];
  const seen = new Set<string>();
  for (const candidate of allCandidates) {
    const key = normalizeCompany(candidate.company_name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueCandidates.push(candidate);
  }

  const { data: existing, error: existingError } = await client.from("outreach_prospects").select("company_name");
  if (existingError) throw existingError;
  const existingNames = new Set((existing ?? []).map((row: any) => normalizeCompany(row.company_name ?? "")).filter(Boolean));

  const { data: ranked } = await client.from("outreach_prospects").select("rank_order").not("rank_order", "is", null).order("rank_order", { ascending: false }).limit(1);
  let nextRank = Number(ranked?.[0]?.rank_order ?? 0) + 1;

  const rows = uniqueCandidates
    .filter((candidate) => !existingNames.has(normalizeCompany(candidate.company_name)))
    .map((candidate) => ({
      company_name: candidate.company_name,
      contact_name: null,
      email: null,
      website: null,
      metro: candidate.metro,
      province: candidate.province,
      source_url: candidate.source_url,
      consent_basis: "directory_discovery_only",
      consent_verified_at: null,
      website_observation: null,
      status: "discovered",
      priority: candidate.priority,
      notes: "Public roofing-directory discovery. Contact details and legal outreach basis must be independently verified before enrollment.",
      verification_status: "needs_source_review",
      rank_order: nextRank++,
      market_tier: candidate.market_tier,
      updated_at: new Date().toISOString(),
    }));

  let inserted = 0;
  const insertBatchSize = 250;
  for (let i = 0; i < rows.length; i += insertBatchSize) {
    const batch = rows.slice(i, i + insertBatchSize);
    const { error } = await client.from("outreach_prospects").insert(batch);
    if (error) throw error;
    inserted += batch.length;
  }

  return {
    city_markets_scanned: MARKETS.length,
    province_pages_scanned: PROVINCE_SWEEPS.length * 4,
    discovered_unique_this_run: uniqueCandidates.length,
    already_present: uniqueCandidates.length - rows.length,
    inserted,
    pool_strategy: "open_ended_multi_thousand",
  };
}
