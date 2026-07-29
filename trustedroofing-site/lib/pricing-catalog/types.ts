export const ROOFING_FIELD_SHINGLE_NAMES={good:"GAF Timberline HDZ",better:"Malarkey Vista",best:"Malarkey Legacy"}as const;
export type CatalogStatus="draft"|"approved"|"retired";
export type PricingCatalogVersion={id:string;name:string;source_file:string|null;effective_date:string|null;status:CatalogStatus;created_at:string};
export type PricingCatalogItem={id:string;catalog_version_id:string;category:string;subcategory:string|null;name:string;supplier:string|null;price:number|null;currency:string;unit:string;coverage:number|null;coverage_unit:string|null;quote_required:boolean;source_reference:string|null;notes:string|null;active:boolean;created_at:string};
export type PricingRateItem={id:string;catalog_version_id:string;trade:string;rate_type:string;name:string;rate:number;currency:string;unit:string;source_reference:string|null;active:boolean;created_at:string};
export type PricingColourOption={id:string;catalog_version_id:string;category:string;product_name:string;colour_name:string;source_reference:string|null;active:boolean;created_at:string};
