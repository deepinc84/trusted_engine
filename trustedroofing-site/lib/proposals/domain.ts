import type { EstimateDraft } from "@/lib/roofing-estimates/repository";
import { customerSoftMetalSummary, type SoftMetalScopeType } from "../soft-metals/domain";

export type ProposalOption = { tier: "good" | "better" | "best"; tierLabel: string; productName: string; description: string; warranty: string; components: string[]; price: number; included: boolean; displayOrder: number; recommended: boolean; mostPopular: boolean };
export type ProposalItemStatus = "included" | "required" | "optional" | "alternative" | "allowance" | "unit_rate" | "excluded" | "by_others" | "not_applicable" | "internal_only";
export type ProposalSoftMetalScope = { id: string; type: SoftMetalScopeType; title: string; description: string; summary: Record<string, unknown>; status: ProposalItemStatus; price: number; displayOrder: number; dependency?: { requires?: string; alternativeGroup?: string }; colourSelection: { mode: "fixed" | "customer"; value: string }; productionReady?: boolean; warnings?: string[] };
export type ProposalSection = { id?: string; type: "cover" | "summary" | "options" | "scope" | "eavestrough" | "downspouts" | "fascia" | "soffit" | "pricing" | "terms"; title: string; enabled: boolean; displayOrder: number; content: string; pageBreakBefore?:boolean; keepTogether?:boolean; orientation?:"portrait"|"landscape" };
export type ProposalImage = { id?: string; source: "street_view" | "upload" | "none"; storagePath?: string | null; signedUrl?: string | null; streetViewUrl?: string | null; attribution: string; caption: string; crop: { x: number; y: number }; zoom: number; rotation: number; width?: number | null; height?: number | null };
export type ProposalDraft = { id?: string; proposalNumber: string; estimateId: string; estimateType?: "roofing" | "soft_metals" | "combined"; revisionNumber: number; status: "draft" | "sent" | "accepted"; customer: { name: string; email: string; phone: string }; property: { address: string; city: string; province: string; postalCode: string }; measurements: { roofAreaSqft: number; squares: number; pitch: string; complexity: string; stories: number }; options: ProposalOption[]; softMetalScopes?: ProposalSoftMetalScope[]; sections: ProposalSection[]; subtotal: number; gst: number; total: number; expiryDate: string; proposalDate: string; estimatorName: string; coverImage: ProposalImage; requiresPricingConfiguration: boolean; createdAt?: string; updatedAt?: string };
export type ProposalSelection = { selectedTier?: string; selectedSoftScopeIds?: string[]; scopeColours?: Record<string, string> };

const roofingScope = ["Remove and dispose of existing shingles.", "Prepare and inspect the roof deck before installation.", "Treat required additional decking as additional work subject to approval.", "Install applicable ice-and-water protection and synthetic underlayment.", "Install configured drip edge, rake edge, and valley metal.", "Install starter shingles, field shingles, and hip and ridge caps.", "Install configured attic vents, goosenecks, plumbing boots, and flashing details.", "Complete magnetic cleanup and remove installation debris.", "Provide applicable Trusted workmanship and manufacturer warranty documentation."].join("\n");
const sectionNames: Record<SoftMetalScopeType, string> = { eavestrough: "Eavestrough", downspouts: "Downspouts", fascia: "Fascia", soffit: "Soffit" };
const mandatory = new Set<ProposalItemStatus>(["included", "required", "allowance", "unit_rate"]);
const hidden = new Set<ProposalItemStatus>(["not_applicable", "internal_only"]);
const unselectable = new Set<ProposalItemStatus>(["excluded", "by_others", "not_applicable", "internal_only"]);

export function createProposalFromEstimate(estimate: EstimateDraft, input: { proposalNumber: string; actor: string; today?: string }): ProposalDraft {
  if (!estimate.id) throw new Error("A saved estimate is required.");
  const estimateType = estimate.scopeMode ?? "roofing";
  const hasRoofing = estimateType !== "soft_metals";
  const results = estimate.options ?? [];
  const options = hasRoofing ? estimate.systems.map((system, index): ProposalOption => ({ tier: system.tier, tierLabel: system.tierLabel, productName: system.productName, description: system.customerSummary, warranty: system.warrantyWording, components: Object.values(system.components).filter(c => c.quantity > 0).map(c => c.label), price: results.find(r => r.system.tier === system.tier)?.finalPrice ?? 0, included: true, displayOrder: index, recommended: false, mostPopular: system.tier === "better" })) : [];
  const enabledScopes = (estimate.softMetalScopes ?? []).filter(scope => scope.enabled);
  const softMetalScopes = enabledScopes.map((scope, index): ProposalSoftMetalScope => {
    const summary = structuredClone(scope.customerSummary ?? customerSoftMetalSummary(scope));
    return { id: `${scope.type}-${index}`, type: scope.type, title: sectionNames[scope.type], description: `${sectionNames[scope.type]} work as measured and saved in this estimate.`, summary, status: "included", price: (scope.result?.sellingPrice ?? 0) * 1.05, displayOrder: index, colourSelection: { mode: "fixed", value: String(summary.colour ?? "") }, productionReady: scope.productionReady === true, warnings: [...(scope.warnings ?? [])] };
  });
  const sections: ProposalSection[] = [{ type: "cover", title: "Exterior Proposal", enabled: true, displayOrder: 0, content: "Prepared for your home." }, { type: "summary", title: "Project Summary", enabled: true, displayOrder: 1, content: "Prepared from the measurements and saved scope selections for this property." }];
  if (hasRoofing) sections.push({ type: "options", title: "Roofing System Options", enabled: true, displayOrder: sections.length, content: "Compare the included roofing systems." });
  for (const item of softMetalScopes) sections.push({ type: item.type, title: item.title, enabled: true, displayOrder: sections.length, content: item.description });
  if (hasRoofing) sections.push({ type: "scope", title: "Roofing Scope", enabled: true, displayOrder: sections.length, content: roofingScope });
  sections.push({ type: "pricing", title: "Price Summary", enabled: true, displayOrder: sections.length, content: "Pricing includes GST as shown." }, { type: "terms", title: "Terms and Acceptance", enabled: true, displayOrder: sections.length, content: "Selected work: ____________________\nProduct and colour selections: ____________________\nPayment terms: To be confirmed in the final contract.\nCustomer signature: ____________________\nTrusted signature: ____________________" });
  const roofingTotal = Math.max(0, ...options.map(o => o.price));
  const mandatorySoftTotal = softMetalScopes.filter(s => mandatory.has(s.status)).reduce((sum, s) => sum + s.price, 0);
  const total = roofingTotal + mandatorySoftTotal, subtotal = total / 1.05, gst = total - subtotal;
  const today = input.today ?? new Date().toISOString().slice(0, 10), expiry = new Date(`${today}T00:00:00Z`); expiry.setUTCDate(expiry.getUTCDate() + 30);
  return { proposalNumber: input.proposalNumber, estimateId: estimate.id, estimateType, revisionNumber: 1, status: "draft", customer: { name: `${estimate.customer.firstName} ${estimate.customer.lastName}`.trim(), email: estimate.customer.email, phone: estimate.customer.phone }, property: { address: [estimate.property.addressLine1, estimate.property.addressLine2].filter(Boolean).join(", "), city: estimate.property.city, province: estimate.property.province, postalCode: estimate.property.postalCode }, measurements: { roofAreaSqft: estimate.measurements.roofAreaSqft, squares: estimate.measurements.squares, pitch: estimate.measurements.pitch, complexity: estimate.measurements.complexity, stories: estimate.measurements.stories }, options, softMetalScopes, sections, subtotal, gst, total, expiryDate: expiry.toISOString().slice(0, 10), proposalDate: today, estimatorName: input.actor, coverImage: { source: "none", attribution: "", caption: "Front of house", crop: { x: 50, y: 50 }, zoom: 1, rotation: 0 }, requiresPricingConfiguration: options.some(o => o.price <= 0) || (hasRoofing && estimate.systems.some(s => s.productionReady === false)) || softMetalScopes.some(s => !s.productionReady || s.price <= 0) };
}

export function calculateProposalSelection(p: ProposalDraft, selection: ProposalSelection) {
  const visibleOptions = p.options.filter(o => o.included);
  const option = visibleOptions.length ? visibleOptions.find(o => o.tier === selection.selectedTier) : undefined;
  if (visibleOptions.length && !option) throw new Error("Select one available roofing system.");
  const requested = new Set(selection.selectedSoftScopeIds ?? []), known = new Map((p.softMetalScopes ?? []).map(s => [s.id, s]));
  for (const id of requested) { const item = known.get(id); if (!item || unselectable.has(item.status)) throw new Error("An unavailable proposal item was selected."); }
  const selectedSoftScopes = (p.softMetalScopes ?? []).filter(item => mandatory.has(item.status) || requested.has(item.id));
  for (const item of selectedSoftScopes) if (item.dependency?.requires && !selectedSoftScopes.some(s => s.id === item.dependency!.requires)) throw new Error(`${item.title} requires another selected scope.`);
  const groups = new Map<string, number>(); for (const item of selectedSoftScopes) if (item.status === "alternative" && item.dependency?.alternativeGroup) groups.set(item.dependency.alternativeGroup, (groups.get(item.dependency.alternativeGroup) ?? 0) + 1);
  if ([...groups.values()].some(count => count > 1)) throw new Error("Only one item may be selected from an alternative group.");
  const declinedSoftScopes = (p.softMetalScopes ?? []).filter(item => (item.status === "optional" || item.status === "alternative") && !selectedSoftScopes.some(s => s.id === item.id));
  const total = (option?.price ?? 0) + selectedSoftScopes.reduce((sum, item) => sum + item.price, 0), subtotal = total / 1.05, gst = total - subtotal;
  return { option: option ? structuredClone(option) : undefined, selectedSoftScopes: structuredClone(selectedSoftScopes), declinedSoftScopes: structuredClone(declinedSoftScopes), subtotal, gst, total };
}

export function customerFacingProposal(p: ProposalDraft) {
  return { proposalNumber: p.proposalNumber, revisionNumber: p.revisionNumber, estimateType: p.estimateType, customer: p.customer, property: p.property, measurements: p.measurements, options: p.options.filter(o => o.included).sort((a, b) => a.displayOrder - b.displayOrder), softMetalScopes: (p.softMetalScopes ?? []).filter(s => !hidden.has(s.status)).sort((a, b) => a.displayOrder - b.displayOrder).map(s => ({ id:s.id, type:s.type, title:s.title, description:s.description, summary:structuredClone(s.summary), status:s.status, price:s.price, displayOrder:s.displayOrder, dependency:s.dependency ? structuredClone(s.dependency) : undefined, colourSelection:structuredClone(s.colourSelection) })), sections: p.sections.filter(s => s.enabled).sort((a, b) => a.displayOrder - b.displayOrder), subtotal: p.subtotal, gst: p.gst, total: p.total, expiryDate: p.expiryDate, proposalDate: p.proposalDate, estimatorName: p.estimatorName, coverImage: p.coverImage };
}
export function setRecommended(options: ProposalOption[], tier: string | null) { return options.map(o => ({ ...o, recommended: tier === o.tier })); }
