const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseHostname = (() => {
  if (!supabaseUrl) return null;

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
})();

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com"
  }
];

if (supabaseHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
    pathname: "/storage/v1/object/public/**"
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns
  },
  async redirects() {
    return [
      {
        source: "/geo-posts",
        destination: "/services",
        permanent: true
      },
      {
        source: "/geo-posts/:path*",
        destination: "/services",
        permanent: true
      },
      {
        source: "/quote",
        destination: "/online-estimate",
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
