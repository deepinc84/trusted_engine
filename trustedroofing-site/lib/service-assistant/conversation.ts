import { calculatePricing, pitchBand } from "./pricing-engine";
import { PRICING_POLICY } from "./pricing-policy";
import type { PricingRequest, ServiceState } from "./service-types";

export function initialServiceState(sessionId = crypto.randomUUID()): ServiceState {
  return { sessionId, inspectionRequired: false, roofRelated: false, pitchSource: "unknown", accessClass: "normal", accessMultiplier: 1, boomRequired: false, urgency: "routine", emergencyReasons: [], pricingComponents: [], aiProvider: "rules_fallback", confidence: 0, estimates: [] };
}

export function normalizeMessage(input: string, previous: ServiceState): ServiceState {
  const state = { ...previous, emergencyReasons: [...previous.emergencyReasons], estimates: [...previous.estimates] };
  const text = input.toLowerCase();
  state.problem = [state.problem, input].filter(Boolean).slice(-3).join(" ");
  if (/siding|sideing|vinly|brown metal thing/.test(text)) { state.service = /brown metal/.test(text) ? "fascia" : "siding"; state.intent = /replace|new/.test(text) ? "replacement" : "repair"; }
  if (/gutter|eaves\s?tr|eavstruf/.test(text)) { state.service = "eavestrough"; state.intent = "repair"; }
  if (/down\s?spout/.test(text)) { state.service = "downspout"; state.intent = "repair"; }
  if (/shingle|shingel|shingels|cap bundle/.test(text)) { state.service = "roofing"; state.roofRelated = true; state.intent = "repair"; }
  if (/stink pipe|roof vent|vent/.test(text)) { state.service = "roofing"; state.roofRelated = true; state.intent = "repair"; state.pricingRule = "roof_vent"; }
  if (/fascia|metal thing under the roof/.test(text)) { state.service = "fascia"; state.intent = "repair"; }
  if (/soffit/.test(text)) { state.service = "soffit"; state.intent = "repair"; }
  if (/window/.test(text)) state.service = "window";
  if (/whole new roof|replace (?:the |my )?roof|roof replacement/.test(text)) { state.replacementEstimateRequested = true; if (!state.service) { state.service = "roofing"; state.roofRelated = true; state.intent = "replacement"; } }
  if (/leak|leek|water intrusion|dripping|gets? wet|moisture/.test(text)) { state.inspectionRequired = true; state.intent = "inspection"; if (/ceiling|roof|attic|rain/.test(text)) state.roofRelated = true; }
  if (/inside (?:the )?shower|when i (?:take|have) a shower/.test(text)) { state.service = "window"; state.roofRelated = false; state.inspectionRequired = true; }
  const qty = text.match(/\b(\d+)\s*(?:pieces?|vents?|bundles?)\b/)?.[1] ?? ({ one:"1", two:"2", three:"3", four:"4" } as Record<string,string>)[text.match(/\b(one|two|three|four)\s+(?:pieces?|vents?|bundles?)/)?.[1] ?? ""];
  if (qty) state.quantity = Number(qty);
  const storeys = text.match(/\b(\d+)(?:st|nd|rd|th)?[- ]?(?:storey|story|floor)/)?.[1] ?? ({ second:"2", third:"3", fourth:"4" } as Record<string,string>)[text.match(/\b(second|third|fourth)[- ]floor/)?.[1] ?? ""];
  if (storeys) state.storeys = Number(storeys);
  if ((state.storeys ?? 0) >= 3) state.accessClass = "elevated";
  if (/narrow|fence|obstruct|difficult access/.test(text)) state.accessClass = "difficult";
  state.accessMultiplier = PRICING_POLICY.accessMultipliers[state.accessClass];
  const ratio = text.match(/(\d+(?:\.\d+)?)\s*\/\s*12/);
  if (ratio) { state.pitch = Number(ratio[1]); state.pitchSource = "customer_reported"; }
  else if (/very steep/.test(text)) { state.pitch = 10; state.pitchSource = "customer_description"; }
  else if (/\bsteep\b/.test(text)) { state.pitch = 7; state.pitchSource = "customer_description"; }
  else if (/walkable|moderate/.test(text)) { state.pitch = 5; state.pitchSource = "customer_description"; }
  state.pitchBand = pitchBand(state.pitch);
  if (/right now|actively|ongoing|still dripping|falling hazard|exposed|tarp/.test(text) && /water|drip|hazard|exposed|storm|tarp/.test(text)) { state.urgency = "emergency"; state.emergencyReasons = ["Condition appears active and may worsen before normal service."]; }
  else if (/tomorrow|selling|soon/.test(text) && state.urgency !== "emergency") state.urgency = "priority";
  state.confidence = state.service ? 0.82 : 0.35;
  return state;
}

export function priceState(state: ServiceState): ServiceState {
  let request: PricingRequest | undefined;
  if (state.inspectionRequired) request = { rule: state.roofRelated ? "roof_inspection" : "inspection", pitch: state.pitch, urgency: state.urgency, accessClass: state.accessClass, boomRequired: state.boomRequired };
  else if (state.service === "siding" && state.quantity) request = { rule: "siding_piece", quantity: state.quantity, accessClass: state.accessClass, urgency: state.urgency };
  else if (state.pricingRule === "roof_vent" && state.quantity) request = { rule: "roof_vent", quantity: state.quantity, pitch: state.pitch, accessClass: state.accessClass, urgency: state.urgency, boomRequired: state.boomRequired };
  if (!request) return state;
  const result = calculatePricing(request);
  return { ...state, pricingRule: request.rule, pricingComponents: result.components, calculatedLow: result.low, calculatedHigh: result.high };
}

export function rulesReply(state: ServiceState) {
  if (!state.service) return "Tell me what is happening at the property in your own words, and I’ll work out what information is actually needed.";
  if (!state.address) return state.inspectionRequired ? "This needs an inspection rather than a remote diagnosis. What is the service-property address?" : "Yes, we handle that type of work. What is the service-property address?";
  if (state.roofRelated && state.pitch == null) return "Google isn’t giving me a reliable roof slope yet. Would you describe it as fairly walkable, steep, very steep, or do you know the pitch ratio?";
  if (state.service === "window" && state.storeys === 2) return "The inspection is $395. Is the ground below the window clear, or are there fences, decks, lower roofs, or other obstructions?";
  if (state.calculatedLow != null) {
    const price = state.calculatedLow === state.calculatedHigh ? `$${state.calculatedLow.toLocaleString("en-CA")}` : `$${state.calculatedLow.toLocaleString("en-CA")}–$${state.calculatedHigh?.toLocaleString("en-CA")}`;
    return state.inspectionRequired ? `The inspection is ${price}. We’ll confirm the cause on site rather than claim a remote diagnosis.` : `Based on the details provided, the total is ${price}.`;
  }
  if (state.service === "siding" && !state.quantity) return "About how many siding pieces are affected?";
  return "I understand the issue. Could you tell me the approximate quantity and where on the building the work is located?";
}
