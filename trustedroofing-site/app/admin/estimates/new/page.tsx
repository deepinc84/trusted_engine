import MegaEstimator from "../MegaEstimator";
import {getCompanyDefaults,getMaterialCatalog} from "@/lib/mega-estimator/repository";
export const dynamic="force-dynamic";
export default async function Page(){const[companyDefaults,productCatalog]=await Promise.all([getCompanyDefaults(),getMaterialCatalog()]);return <MegaEstimator companyDefaults={companyDefaults} productCatalog={productCatalog}/>}
