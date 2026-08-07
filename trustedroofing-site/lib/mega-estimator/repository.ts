import { getServiceClient } from "@/lib/db";
import {defaultRates,type WorksheetDefaults} from "./worksheet";

export type MegaEstimateSummary={id:string;estimateNumber:string;customer:string;property:string;status:string;updatedAt:string;finalPrice:number|null};
export type MegaEstimateRecord=MegaEstimateSummary&{snapshot:Record<string,unknown>};

export async function listMegaEstimates(search=""):Promise<MegaEstimateSummary[]>{
  const db=getServiceClient();if(!db)return [];
  let query=db.from("mega_estimates").select("id,estimate_number,customer_name,property_address,status,updated_at,final_price").order("updated_at",{ascending:false});
  if(search.trim())query=query.or(`customer_name.ilike.%${search.trim()}%,property_address.ilike.%${search.trim()}%,estimate_number.ilike.%${search.trim()}%`);
  const {data,error}=await query;if(error)throw error;
  return (data??[]).map((r:any)=>({id:r.id,estimateNumber:r.estimate_number,customer:r.customer_name,property:r.property_address,status:r.status,updatedAt:r.updated_at,finalPrice:r.final_price===null?null:Number(r.final_price)}));
}
export async function getMegaEstimate(id:string):Promise<MegaEstimateRecord|null>{const db=getServiceClient();if(!db)return null;const{data,error}=await db.from("mega_estimates").select("*").eq("id",id).maybeSingle();if(error)throw error;if(!data)return null;return{id:data.id,estimateNumber:data.estimate_number,customer:data.customer_name,property:data.property_address,status:data.status,updatedAt:data.updated_at,finalPrice:data.final_price===null?null:Number(data.final_price),snapshot:data.snapshot??{}}}
export async function saveMegaEstimate(input:{id?:string;customer:string;property:string;finalPrice:number;snapshot:Record<string,unknown>}):Promise<MegaEstimateRecord>{const db=getServiceClient();if(!db)throw new Error("Estimate storage is not configured.");const row={customer_name:input.customer||"Customer not entered",property_address:input.property||"Property not entered",final_price:input.finalPrice,snapshot:input.snapshot,updated_at:new Date().toISOString()};if(input.id){const{data,error}=await db.from("mega_estimates").update(row).eq("id",input.id).select("*").single();if(error)throw error;return{id:data.id,estimateNumber:data.estimate_number,customer:data.customer_name,property:data.property_address,status:data.status,updatedAt:data.updated_at,finalPrice:Number(data.final_price),snapshot:data.snapshot}}const{data,error}=await db.from("mega_estimates").insert(row).select("*").single();if(error)throw error;return{id:data.id,estimateNumber:data.estimate_number,customer:data.customer_name,property:data.property_address,status:data.status,updatedAt:data.updated_at,finalPrice:Number(data.final_price),snapshot:data.snapshot}}
export async function getCompanyDefaults():Promise<WorksheetDefaults>{
  const fallback=()=>structuredClone(defaultRates);
  const db=getServiceClient();
  if(!db)return fallback();
  try{
    const{data,error}=await db.from("mega_company_defaults").select("value").eq("key","roofing").maybeSingle();
    // A missing 0030 table must not prevent a blank estimate from opening. The
    // save-default action still reports the migration problem explicitly.
    if(error)return fallback();
    return data?.value??fallback();
  }catch{return fallback()}
}
export async function saveCompanyDefaults(value:WorksheetDefaults,actor:string){const db=getServiceClient();if(!db)throw new Error("Company-default storage is not configured.");const previous=await getCompanyDefaults();const{error:auditError}=await db.from("mega_company_default_audit").insert({key:"roofing",previous_value:previous,new_value:value,changed_by:actor});if(auditError)throw auditError;const{error}=await db.from("mega_company_defaults").upsert({key:"roofing",value,updated_at:new Date().toISOString(),updated_by:actor});if(error)throw error;return value}
