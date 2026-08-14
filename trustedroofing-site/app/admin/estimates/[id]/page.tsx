import MegaEstimator from "../MegaEstimator";
import {getCompanyDefaults,getMaterialCatalog,getMegaEstimate} from "@/lib/mega-estimator/repository";
import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:{id:string}}){const [estimate,companyDefaults,productCatalog]=await Promise.all([getMegaEstimate(params.id),getCompanyDefaults(),getMaterialCatalog()]);if(!estimate)notFound();return <MegaEstimator estimateId={estimate.id} initial={estimate.snapshot} companyDefaults={companyDefaults} productCatalog={productCatalog}/>}
