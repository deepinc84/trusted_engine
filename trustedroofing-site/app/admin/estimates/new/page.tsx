import MegaEstimator from "../MegaEstimator";
import {getCompanyDefaults} from "@/lib/mega-estimator/repository";
export const dynamic="force-dynamic";
export default async function Page(){return <MegaEstimator companyDefaults={await getCompanyDefaults()}/>}
