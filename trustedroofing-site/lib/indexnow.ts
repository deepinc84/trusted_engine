const DEFAULT_SITE_URL = "https://trustedroofingcalgary.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

export const INDEXNOW_KEY = "a83cd4eb25104c578ab3ebff033216a6";
export const INDEXNOW_KEY_PATH = `/${INDEXNOW_KEY}.txt`;

function normalizeSiteUrl(value: string | undefined) {
  return (value && value.trim().length > 0 ? value : DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function getIndexNowKeyLocation() {
  return `${getSiteUrl()}${INDEXNOW_KEY_PATH}`;
}

export function getIndexNowHost() {
  return new URL(getSiteUrl()).host;
}

function isAllowedIndexNowUrl(url: URL | null, allowedHost: string): url is URL {
  return url instanceof URL && url.host === allowedHost;
}

export function normalizeIndexNowUrls(urls: string[]) {
  const allowedHost = getIndexNowHost();

  return [...new Set(urls)]
    .map((url) => {
      try {
        return new URL(url);
      } catch {
        return null;
      }
    })
    .filter((url): url is URL => isAllowedIndexNowUrl(url, allowedHost))
    .map((url) => url.toString());
}

export function buildProjectIndexNowUrls(slug: string) {
  const siteUrl = getSiteUrl();

  return normalizeIndexNowUrls([
    `${siteUrl}/`,
    `${siteUrl}/projects`,
    `${siteUrl}/projects/${slug}`
  ]);
}

export function buildGeoPostIndexNowUrls(slug: string) {
  const siteUrl = getSiteUrl();

  return normalizeIndexNowUrls([
    `${siteUrl}/`,
    `${siteUrl}/projects`,
    `${siteUrl}/geo-posts/${slug}`
  ]);
}

export async function submitIndexNowUrls(urls: string[]) {
  const normalizedUrls = normalizeIndexNowUrls(urls);

  if (normalizedUrls.length === 0) {
    return {
      ok: true,
      submitted: false,
      skipped: true,
      reason: "No valid same-host URLs to submit.",
      endpoint: INDEXNOW_ENDPOINT,
      urlCount: 0
    };
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      host: getIndexNowHost(),
      key: INDEXNOW_KEY,
      keyLocation: getIndexNowKeyLocation(),
      urlList: normalizedUrls
    }),
    cache: "no-store"
  });

  const bodyText = await response.text();

  return {
    ok: response.ok,
    submitted: response.ok,
    status: response.status,
    endpoint: INDEXNOW_ENDPOINT,
    keyLocation: getIndexNowKeyLocation(),
    urlCount: normalizedUrls.length,
    urls: normalizedUrls,
    body: bodyText || null
  };
}
