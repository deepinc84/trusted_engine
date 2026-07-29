import AdminTabs from "@/app/admin/_components/AdminTabs";
import EstimateEditor from "../EstimateEditor";
import { listCustomerChoices, newDraft } from "@/lib/roofing-estimates/repository";
import { loadCatalogRoofingSystems } from "@/lib/pricing-catalog/roofing-systems";
import type { ComponentKey } from "@/lib/roofing-estimates/pricing";
export const dynamic = "force-dynamic";

const emptyRequirements = Object.fromEntries(["fieldShingles","starterShingles","ridgeCaps","iceWater","underlayment","dripEdge","rakeEdge","valleyMetal","vents","goosenecks","plumbingBoots"].map(key=>[key,0])) as Record<ComponentKey,number>;
export default async function NewEstimatePage({searchParams}:{searchParams:{catalogVersionId?:string;testDraft?:string}}){
  const [choices,systems]=await Promise.all([listCustomerChoices(),loadCatalogRoofingSystems({versionId:searchParams.catalogVersionId,allowDraft:searchParams.testDraft==="1",requirements:emptyRequirements})]);
  return <section className="section admin-shell"><div className="admin-hero"><div><p className="admin-kicker">Internal estimating</p><h1 className="hero-title">New roofing estimate</h1><p className="hero-subtitle">Using {systems[0].catalogVersion.name} ({systems[0].catalogVersion.status}). Catalogue costs remain internal.</p></div></div><AdminTabs currentPath="/admin/estimates"/><EstimateEditor initial={newDraft(systems)} customerChoices={choices}/></section>
}
