import { permanentRedirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Project updates",
  description: "Project updates are available on service pages.",
  path: "/geo-posts",
  robots: {
    index: false,
    follow: true
  }
});

export default function GeoPostsPage() {
  permanentRedirect("/services");
}
