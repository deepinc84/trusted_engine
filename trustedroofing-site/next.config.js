<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
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

=======
>>>>>>> main
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
<<<<<<< codex/set-up-foundation-for-trustedroofing-site-bbrh8t
    remotePatterns
=======
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
>>>>>>> main
  }
};

module.exports = nextConfig;
