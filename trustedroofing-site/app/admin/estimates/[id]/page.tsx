import MegaEstimator from "../MegaEstimator";
import {getMegaEstimate} from "@/lib/mega-estimator/repository";
import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:{id:string}}){const estimate=await getMegaEstimate(params.id);if(!estimate)notFound();return <MegaEstimator estimateId={estimate.id} initial={estimate.snapshot}/>}
