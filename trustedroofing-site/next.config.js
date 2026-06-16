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
        destination: "/online-estimate",
        permanent: true
      },
      {
        source: "/geo-posts/:path*",
        destination: "/online-estimate",
        permanent: true
      },
      {
        source: "/quote",
        destination: "/online-estimate",
        permanent: true
      },
      { source: "/services/hardie-siding", destination: "/services/james-hardie-siding", permanent: true },
      { source: "/services/hardie-board-siding", destination: "/services/james-hardie-siding", permanent: true },
      { source: "/services/fiber-cement-siding", destination: "/services/james-hardie-siding", permanent: true },
      { source: "/services/gutters", destination: "/services/eavestrough", permanent: true },
      { source: "/services/eavestroughs", destination: "/services/eavestrough", permanent: true },
      { source: "/services/soft-metal", destination: "/services/eavestrough-soffit-fascia", permanent: true },
      { source: "/services/soft-metal-exteriors", destination: "/services/eavestrough-soffit-fascia", permanent: true },
      { source: "/services/fascia-soffit", destination: "/services/soffit-fascia", permanent: true },
      { source: "/services/vinyl-siding-calgary", destination: "/services/vinyl-siding", permanent: true }
    ];
  }
};

module.exports = nextConfig;
