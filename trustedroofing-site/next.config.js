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
      { source: "/services/roofing/roof-repair", destination: "/services/roof-repair", permanent: true },
      { source: "/services/roofing/roof-replacement", destination: "/services/roof-replacement", permanent: true },
      { source: "/services/roofing/roof-inspection", destination: "/services/roof-inspection-maintenance", permanent: true },
      { source: "/services/roofing/roof-maintenance", destination: "/services/roof-inspection-maintenance", permanent: true },
      { source: "/services/roof-replacements", destination: "/services/roof-replacement", permanent: true },
      { source: "/services/roof-replacement-calgary", destination: "/services/roof-replacement", permanent: true },
      { source: "/services/residential-roofing", destination: "/services/roof-replacement", permanent: true },
      { source: "/services/asphalt-shingles", destination: "/services/roof-replacement", permanent: true },
      { source: "/services/asphalt-shingle-roofing", destination: "/services/roof-replacement", permanent: true },
      { source: "/services/shingle-roofing", destination: "/services/roof-replacement", permanent: true },
      { source: "/services/roof-repairs", destination: "/services/roof-repair", permanent: true },
      { source: "/services/leak-repair", destination: "/services/roof-repair", permanent: true },
      { source: "/services/roof-leak-repair", destination: "/services/roof-repair", permanent: true },
      { source: "/services/emergency-roof-repair", destination: "/services/roof-repair", permanent: true },
      { source: "/services/storm-damage-roof-repair", destination: "/services/roof-repair", permanent: true },
      { source: "/services/hail-damage-roof-repair", destination: "/services/roof-repair", permanent: true },
      { source: "/services/roof-inspection", destination: "/services/roof-inspection-maintenance", permanent: true },
      { source: "/services/roof-inspections", destination: "/services/roof-inspection-maintenance", permanent: true },
      { source: "/services/roof-maintenance", destination: "/services/roof-inspection-maintenance", permanent: true },
      { source: "/services/roof-maintenance-calgary", destination: "/services/roof-inspection-maintenance", permanent: true },
      { source: "/services/hail-damage-roof-inspection", destination: "/services/roof-inspection-maintenance", permanent: true },
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
