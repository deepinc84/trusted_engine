import MegaEstimator from "../MegaEstimator";
import {getCompanyDefaults,getMegaEstimate} from "@/lib/mega-estimator/repository";
import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:{id:string}}){const [estimate,companyDefaults]=await Promise.all([getMegaEstimate(params.id),getCompanyDefaults()]);if(!estimate)notFound();return <MegaEstimator estimateId={estimate.id} initial={estimate.snapshot} companyDefaults={companyDefaults}/>}
