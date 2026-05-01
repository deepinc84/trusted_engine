import { permanentRedirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Geo posts",
  description: "Geo post archive has moved to the published projects collection.",
  path: "/geo-posts",
  robots: {
    index: false,
    follow: true
  }
});

export default function GeoPostsPage() {
  permanentRedirect("/services");
}
