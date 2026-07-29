import { createHash } from "node:crypto";
import { calculateProposalSelection, type ProposalDraft } from "./domain";

export type AcceptanceInput = { selectedTier?: string; selectedSoftScopeIds?: string[]; scopeColours?: Record<string, string>; colour?: string; signerLegalName: string; signerEmail: string; signatureType: "typed" | "drawn"; signatureData: string; authorityAccepted: boolean; termsAccepted: boolean };

export function validateAcceptance(snapshot: ProposalDraft, input: AcceptanceInput) {
  if (snapshot.status !== "sent") throw new Error("This proposal revision is not available for acceptance.");
  if (!input.signerLegalName.trim() || !/^\S+@\S+\.\S+$/.test(input.signerEmail)) throw new Error("Signer name and a valid email are required.");
  if (snapshot.options.some(o => o.included) && !input.colour?.trim()) throw new Error("A shingle colour selection is required.");
  if (!input.signatureData.trim()) throw new Error("An electronic signature is required.");
  if (!input.authorityAccepted || !input.termsAccepted) throw new Error("Both required acknowledgements must be accepted.");
  const totals = calculateProposalSelection(snapshot, input);
  const scopeColours: Record<string, string> = {};
  for (const scope of totals.selectedSoftScopes) {
    const colour = scope.colourSelection.mode === "fixed" ? scope.colourSelection.value : input.scopeColours?.[scope.id];
    if (!colour?.trim()) throw new Error(`${scope.title} colour confirmation is required.`);
    scopeColours[scope.id] = colour.trim();
  }
  return { ...totals, scopeColours };
}

export function acceptanceIntegrity(snapshot: ProposalDraft, totals: ReturnType<typeof validateAcceptance>, input: AcceptanceInput, acceptedAt: string) {
  return createHash("sha256").update(JSON.stringify({ proposalNumber: snapshot.proposalNumber, revision: snapshot.revisionNumber, option: totals.option, selectedSoftScopes: totals.selectedSoftScopes, declinedSoftScopes: totals.declinedSoftScopes, scopeColours: totals.scopeColours, colour: input.colour, signer: input.signerLegalName, total: totals.total, acceptedAt })).digest("hex");
}

export function signedPdfDetails(snapshot: ProposalDraft, input: AcceptanceInput, acceptedAt: string) {
  const totals = validateAcceptance(snapshot, input);
  return { proposal: snapshot, selectedOption: totals.option, selectedColour: input.colour?.trim() ?? "", selectedSoftScopes: totals.selectedSoftScopes, declinedSoftScopes: totals.declinedSoftScopes, scopeColours: totals.scopeColours, signerLegalName: input.signerLegalName, signatureType: input.signatureType, signatureData: input.signatureData, acceptedAt, subtotal: totals.subtotal, gst: totals.gst, total: totals.total, acknowledgements: { authority: true, terms: true }, integrityHash: acceptanceIntegrity(snapshot, totals, input, acceptedAt) };
}
