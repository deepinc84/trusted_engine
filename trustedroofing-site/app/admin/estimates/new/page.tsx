import AdminTabs from "@/app/admin/_components/AdminTabs";
import EstimateEditor from "../EstimateEditor";
import { listCustomerChoices, newDraft } from "@/lib/roofing-estimates/repository";
export default async function NewEstimatePage(){const choices=await listCustomerChoices();return <section className="section admin-shell"><div className="admin-hero"><div><p className="admin-kicker">Internal estimating</p><h1 className="hero-title">New roofing estimate</h1><p className="hero-subtitle">Customer, property, measurements, and three complete system options.</p></div></div><AdminTabs currentPath="/admin/estimates"/><EstimateEditor initial={newDraft()} customerChoices={choices}/></section>}
