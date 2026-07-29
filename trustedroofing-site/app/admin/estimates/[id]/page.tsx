import { notFound } from "next/navigation";
import AdminTabs from "@/app/admin/_components/AdminTabs";
import EstimateEditor from "../EstimateEditor";
import { getEstimateDraft, listCustomerChoices } from "@/lib/roofing-estimates/repository";
export default async function EditEstimatePage({params}:{params:{id:string}}){const [estimate,choices]=await Promise.all([getEstimateDraft(params.id),listCustomerChoices()]);if(!estimate)notFound();return <section className="section admin-shell"><div className="admin-hero"><div><p className="admin-kicker">Draft estimate</p><h1 className="hero-title">Edit roofing estimate</h1><p className="hero-subtitle">Changes remain isolated to this estimate&apos;s system snapshots.</p></div></div><AdminTabs currentPath="/admin/estimates"/><EstimateEditor initial={estimate} customerChoices={choices}/></section>}
