import { organizationSchema } from "@/lib/organization";

export default function OrganizationSchema() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />;
}
