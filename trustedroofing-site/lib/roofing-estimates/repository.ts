import { getServiceClient } from "@/lib/db";
import { applyManualOverride, calculateSystem, DEFAULT_ROOFING_SYSTEMS, type CalculatedOption, type RoofingMeasurements, type RoofingSystem } from "./pricing";
import { refreshCatalogRoofingSystem, type CatalogRoofingSystem } from "@/lib/pricing-catalog/roofing-systems";
import{blankSoftMetalScopes,type SoftMetalScope}from"@/lib/soft-metals/domain";import{calculateSoftMetalScopes,getSoftMetalScopes,saveSoftMetalScopes}from"@/lib/soft-metals/repository";
import{blankVinylScope,type VinylScope}from"@/lib/vinyl-siding/domain";import{calculateVinyl,getVinylScope,saveVinylScope}from"@/lib/vinyl-siding/repository";
import{blankHardieScope,type HardieScope}from"@/lib/hardie-siding/domain";import{calculateHardie,getHardieScope,saveHardieScope}from"@/lib/hardie-siding/repository";

export type EstimateScope="roofing"|"soft_metals"|"vinyl_siding"|"hardie_siding"|"custom";
export type EstimateDraft = { id?: string; scopeMode?:"roofing"|"soft_metals"|"combined"|"multi_trade"; selectedScopes?:EstimateScope[]; softMetalScopes?:SoftMetalScope[]; vinylScope?:VinylScope; hardieScope?:HardieScope; customer: { id?: string; firstName: string; lastName: string; email: string; phone: string }; property: { id?: string; addressLine1: string; addressLine2: string; city: string; province: string; postalCode: string }; measurements: RoofingMeasurements; systems: RoofingSystem[]; options?: CalculatedOption[]; updatedAt?: string };
const mocks = new Map<string, EstimateDraft>();
export type CustomerChoice = { customer: EstimateDraft["customer"]; properties: EstimateDraft["property"][] };
export const blankMeasurements: RoofingMeasurements = { roofAreaSqft: 0, squares: 0, pitch: "4/12", complexity: "moderate", existingLayers: 1, eaves: 0, rakes: 0, valleys: 0, hips: 0, ridges: 0, wallTransitions: 0, plumbingVents: 0, goosenecks: 0, staticVents: 0, stories: 1, deckingAllowance: 0, accessDifficulty: "standard", internalNotes: "" };
export function newDraft(systems: RoofingSystem[] = DEFAULT_ROOFING_SYSTEMS): EstimateDraft { return { scopeMode:"roofing",selectedScopes:["roofing"],softMetalScopes:blankSoftMetalScopes(),vinylScope:blankVinylScope(),hardieScope:blankHardieScope(), customer: { firstName: "", lastName: "", email: "", phone: "" }, property: { addressLine1: "", addressLine2: "", city: "Calgary", province: "AB", postalCode: "" }, measurements: { ...blankMeasurements }, systems: structuredClone(systems) }; }
export function selectedEstimateScopes(draft:Pick<EstimateDraft,"selectedScopes"|"scopeMode">):EstimateScope[]{if(draft.selectedScopes?.length)return[...new Set(draft.selectedScopes)];if(draft.scopeMode==="soft_metals")return["soft_metals"];if(draft.scopeMode==="combined")return["roofing","soft_metals"];return["roofing"]}
export async function listCustomerChoices(): Promise<CustomerChoice[]> {
  const db = getServiceClient(); if (!db) return [];
  const { data, error } = await db.from("estimate_customers").select("id,first_name,last_name,email,phone,estimate_properties(id,address_line1,address_line2,city,province,postal_code)").order("last_name");
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ customer: { id: c.id, firstName: c.first_name, lastName: c.last_name, email: c.email ?? "", phone: c.phone ?? "" }, properties: (c.estimate_properties ?? []).map((p: any) => ({ id: p.id, addressLine1: p.address_line1, addressLine2: p.address_line2 ?? "", city: p.city, province: p.province, postalCode: p.postal_code ?? "" })) }));
}

function validate(draft: EstimateDraft) {
  const scopes=selectedEstimateScopes(draft);
  if (!draft.customer.firstName.trim() || !draft.customer.lastName.trim()) throw new Error("Customer first and last name are required.");
  if (!draft.property.addressLine1.trim()) throw new Error("Property address is required.");
  if (!scopes.length) throw new Error("Enable at least one estimate scope.");
  if (scopes.includes("roofing") && draft.measurements.roofAreaSqft <= 0 && draft.measurements.squares <= 0) throw new Error("Roof area or squares is required.");
  if (scopes.includes("roofing") && draft.systems.length !== 3) throw new Error("Good, Better and Best system snapshots are required.");
  if(scopes.includes("soft_metals")&&!draft.softMetalScopes?.some(s=>s.enabled))throw new Error("Enable at least one soft-metal scope.");
  if(scopes.includes("vinyl_siding")&&!draft.vinylScope?.enabled)throw new Error("Enable the vinyl siding scope.");
  if(scopes.includes("hardie_siding")&&!draft.hardieScope?.enabled)throw new Error("Enable the James Hardie scope.");
}

export async function listEstimateDrafts() {
  const db = getServiceClient();
  if (!db) return [...mocks.values()];
  const { data, error } = await db.from("estimates").select("id,updated_at,estimate_customers(first_name,last_name),estimate_properties(address_line1,city)").eq("status", "draft").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, updatedAt: row.updated_at, customer: { firstName: row.estimate_customers?.first_name ?? "", lastName: row.estimate_customers?.last_name ?? "", email: "", phone: "" }, property: { addressLine1: row.estimate_properties?.address_line1 ?? "", addressLine2: "", city: row.estimate_properties?.city ?? "", province: "AB", postalCode: "" }, measurements: blankMeasurements, systems: [] } as EstimateDraft));
}

export async function getEstimateDraft(id: string): Promise<EstimateDraft | null> {
  const db = getServiceClient(); if (!db) return mocks.get(id) ?? null;
  const { data: estimate, error } = await db.from("estimates").select("id,updated_at,scope,selected_scopes,customer_id,property_id,estimate_customers(*),estimate_properties(*),roofing_measurements(*),estimate_system_snapshots(tier,configuration),estimate_option_results(tier,breakdown,calculated_price,final_price)").eq("id", id).single();
  if (error) { if (error.code === "PGRST116") return null; throw error; }
  const c: any = estimate.estimate_customers, p: any = estimate.estimate_properties, m: any = estimate.roofing_measurements;
  const softMetalScopes=await getSoftMetalScopes(id);const vinylScope=await getVinylScope(id);const hardieScope=await getHardieScope(id);
  return { id, updatedAt: estimate.updated_at, scopeMode:estimate.scope as any,selectedScopes:estimate.selected_scopes?.length?estimate.selected_scopes:selectedEstimateScopes({scopeMode:estimate.scope as any}), softMetalScopes:softMetalScopes.length?softMetalScopes:blankSoftMetalScopes(),vinylScope:vinylScope??blankVinylScope(),hardieScope:hardieScope??blankHardieScope(), customer: { id: estimate.customer_id, firstName: c.first_name, lastName: c.last_name, email: c.email ?? "", phone: c.phone ?? "" }, property: { id: estimate.property_id, addressLine1: p.address_line1, addressLine2: p.address_line2 ?? "", city: p.city, province: p.province, postalCode: p.postal_code ?? "" }, measurements: { roofAreaSqft: Number(m.roof_area_sqft), squares: Number(m.squares), pitch: m.pitch, complexity: m.complexity, existingLayers: m.existing_layers, eaves: Number(m.eaves), rakes: Number(m.rakes), valleys: Number(m.valleys), hips: Number(m.hips), ridges: Number(m.ridges), wallTransitions: Number(m.wall_transitions), plumbingVents: m.plumbing_vents, goosenecks: m.goosenecks, staticVents: m.static_vents, stories: m.stories, deckingAllowance: Number(m.decking_allowance), accessDifficulty: m.access_difficulty, internalNotes: m.internal_notes }, systems: estimate.estimate_system_snapshots.sort((a: any,b: any) => ["good","better","best"].indexOf(a.tier)-["good","better","best"].indexOf(b.tier)).map((s: any) => s.configuration as RoofingSystem) };
}

export async function saveEstimateDraft(input: EstimateDraft, actor: string): Promise<EstimateDraft> {
  validate(input);const selectedScopes=selectedEstimateScopes(input);const softMetalScopes=selectedScopes.includes("soft_metals")?await calculateSoftMetalScopes(input.softMetalScopes??[]):input.softMetalScopes??blankSoftMetalScopes();const vinylScope=selectedScopes.includes("vinyl_siding")?await calculateVinyl(input.vinylScope??blankVinylScope()):input.vinylScope??blankVinylScope();const hardieScope=selectedScopes.includes("hardie_siding")?await calculateHardie(input.hardieScope??blankHardieScope()):input.hardieScope??blankHardieScope();input={...input,selectedScopes,softMetalScopes,vinylScope,hardieScope}; const systems=selectedScopes.includes("roofing")?await Promise.all(input.systems.map(system=>(system as CatalogRoofingSystem).catalogVersion?refreshCatalogRoofingSystem(structuredClone(system) as CatalogRoofingSystem):system)):input.systems;input={...input,systems};const options = selectedScopes.includes("roofing")?systems.map((system) => calculateSystem(input.measurements, system)):[];
  const db = getServiceClient();
  if (!db) { const id = input.id ?? crypto.randomUUID(); const saved = { ...structuredClone(input), id, options, updatedAt: new Date().toISOString() }; mocks.set(id, saved); return saved; }
  let customerId = input.customer.id;
  if (customerId) { const { error } = await db.from("estimate_customers").update({ first_name: input.customer.firstName, last_name: input.customer.lastName, email: input.customer.email || null, phone: input.customer.phone || null, updated_at: new Date().toISOString() }).eq("id", customerId); if (error) throw error; }
  else { const { data, error } = await db.from("estimate_customers").insert({ first_name: input.customer.firstName, last_name: input.customer.lastName, email: input.customer.email || null, phone: input.customer.phone || null }).select("id").single(); if (error) throw error; customerId = data.id; }
  let propertyId = input.property.id;
  const propertyRow = { customer_id: customerId, address_line1: input.property.addressLine1, address_line2: input.property.addressLine2 || null, city: input.property.city, province: input.property.province, postal_code: input.property.postalCode || null, updated_at: new Date().toISOString() };
  if (propertyId) { const { error } = await db.from("estimate_properties").update(propertyRow).eq("id", propertyId); if (error) throw error; }
  else { const { data, error } = await db.from("estimate_properties").insert(propertyRow).select("id").single(); if (error) throw error; propertyId = data.id; }
  let id = input.id;
  if (id) { const { error } = await db.from("estimates").update({ customer_id: customerId, property_id: propertyId, scope:selectedScopes.length===1?selectedScopes[0]:"multi_trade",selected_scopes:selectedScopes, updated_by: actor, updated_at: new Date().toISOString() }).eq("id", id); if (error) throw error; }
  else { const { data, error } = await db.from("estimates").insert({ customer_id: customerId, property_id: propertyId, scope:selectedScopes.length===1?selectedScopes[0]:"multi_trade",selected_scopes:selectedScopes, created_by: actor, updated_by: actor }).select("id").single(); if (error) throw error; id = data.id; }
  if(selectedScopes.includes("soft_metals"))await saveSoftMetalScopes(id as string,softMetalScopes,actor);if(selectedScopes.includes("vinyl_siding"))await saveVinylScope(id as string,vinylScope,actor);if(selectedScopes.includes("hardie_siding"))await saveHardieScope(id as string,hardieScope,actor);
  const m = input.measurements;
  const { error: measurementError } = await db.from("roofing_measurements").upsert({ estimate_id: id, roof_area_sqft: m.roofAreaSqft, squares: m.squares, pitch: m.pitch, complexity: m.complexity, existing_layers: m.existingLayers, eaves: m.eaves, rakes: m.rakes, valleys: m.valleys, hips: m.hips, ridges: m.ridges, wall_transitions: m.wallTransitions, plumbing_vents: m.plumbingVents, goosenecks: m.goosenecks, static_vents: m.staticVents, stories: m.stories, decking_allowance: m.deckingAllowance, access_difficulty: m.accessDifficulty, internal_notes: m.internalNotes, updated_at: new Date().toISOString() }); if (measurementError) throw measurementError;
  for (const option of options) {
    const { data: snapshot, error: snapshotError } = await db.from("estimate_system_snapshots").upsert({ estimate_id: id, tier: option.system.tier, configuration: option.system }, { onConflict: "estimate_id,tier" }).select("id").single(); if (snapshotError) throw snapshotError;
    const { data: result, error: resultError } = await db.from("estimate_option_results").upsert({ estimate_id: id, system_snapshot_id: snapshot.id, tier: option.system.tier, breakdown: option.breakdown, calculated_price: option.calculatedPrice, final_price: option.finalPrice, calculated_at: new Date().toISOString() }, { onConflict: "estimate_id,tier" }).select("id").single(); if (resultError) throw resultError;
    const requested = input.options?.find((o) => o.system.tier === option.system.tier)?.override;
    if (requested && requested.newValue !== option.calculatedPrice) { const overridden = applyManualOverride(option, requested.newValue, requested.reason, actor); await db.from("estimate_option_results").update({ final_price: overridden.finalPrice }).eq("id", result.id); const { error } = await db.from("estimate_manual_overrides").insert({ estimate_id: id, option_result_id: result.id, original_calculated_value: option.calculatedPrice, new_value: overridden.finalPrice, reason: requested.reason, overridden_by: actor }); if (error) throw error; }
  }
  return { ...input, id, customer: { ...input.customer, id: customerId }, property: { ...input.property, id: propertyId }, options };
}
