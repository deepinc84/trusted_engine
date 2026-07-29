import { customerFacingProposal, type ProposalDraft } from "./domain";

export type DocumentOrientation = "portrait" | "landscape";
export type DocumentBlockKind = "heading" | "paragraph" | "bullet" | "option" | "scope" | "price" | "acceptance" | "signature";
export type DocumentBlock = { id:string; kind:DocumentBlockKind; title?:string; lines:string[]; badge?:string; price?:number; keepTogether?:boolean; pageBreakBefore?:boolean };
export type DocumentSection = { id:string; type:string; title:string; orientation:DocumentOrientation; pageBreakBefore:boolean; blocks:DocumentBlock[] };
export type SignedDocumentDetails = { selectedOption?:{tier:string}; selectedSoftScopes:Array<{id:string;title:string}>; declinedSoftScopes:Array<{id:string;title:string}>; scopeColours:Record<string,string>; signerLegalName:string; signerEmail?:string; signatureType?:"typed"|"drawn"; signatureData?:string; acceptedAt:string; integrityHash:string };
export type ProposalDocument = { kind:"proposal"|"accepted"; title:string; proposalNumber:string; revisionNumber:number; proposalDate:string; expiryDate:string; customerName:string; propertyAddress:string; estimatorName:string; cover:{source:string;storagePath?:string|null;attribution:string;caption:string;crop:{x:number;y:number};zoom:number}; sections:DocumentSection[]; subtotal:number;gst:number;total:number; signed?:SignedDocumentDetails };

const money=(n:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(n);
const plain=(value:unknown)=>String(value??"").replace(/<[^>]*>/g,"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").trim();
const paragraphs=(content:string)=>plain(content).split(/\n{2,}|\n/).map(x=>x.trim()).filter(Boolean);

export function buildProposalDocument(proposal:ProposalDraft,signed?:SignedDocumentDetails):ProposalDocument {
  const p=customerFacingProposal(proposal), sections:DocumentSection[]=[];
  for(const section of p.sections.sort((a,b)=>a.displayOrder-b.displayOrder)){
    const blocks:DocumentBlock[]=[];
    if(section.type==="cover"){
      blocks.push({id:"cover-title",kind:"heading",title:section.title,lines:[p.customer.name,`${p.property.address}, ${p.property.city}, ${p.property.province}`,`Proposal ${p.proposalNumber} · Revision ${p.revisionNumber}`,`Proposal date: ${p.proposalDate}`,`Valid until: ${p.expiryDate}`,`Estimator: ${p.estimatorName}`],keepTogether:true});
    } else if(section.type==="options"){
      if(section.content)blocks.push({id:`${section.type}-intro`,kind:"paragraph",lines:paragraphs(section.content)});
      for(const option of p.options)blocks.push({id:`option-${option.tier}`,kind:"option",title:`${option.tierLabel}: ${option.productName}`,badge:[option.recommended?"Recommended":"",option.mostPopular?"Most popular":"",signed?.selectedOption?.tier===option.tier?"Selected":""].filter(Boolean).join(" · "),lines:[option.description,...option.components.map(x=>`• ${plain(x)}`),option.warranty],price:option.price,keepTogether:true});
    } else if(["eavestrough","downspouts","fascia","soffit"].includes(section.type)){
      for(const scope of p.softMetalScopes.filter(x=>x.type===section.type)){
        const state=signed?.selectedSoftScopes.some(x=>x.id===scope.id)?"Selected":signed?.declinedSoftScopes.some(x=>x.id===scope.id)?"Declined":scope.status.replaceAll("_"," ");
        blocks.push({id:`scope-${scope.id}`,kind:"scope",title:scope.title,badge:state,lines:[scope.description,...Object.entries(scope.summary).filter(([,v])=>v!==false&&v!==null&&v!=="").map(([k,v])=>`${plain(k)}: ${plain(v)}`),...(signed?.scopeColours[scope.id]?[`Confirmed colour: ${plain(signed.scopeColours[scope.id])}`]:[])],price:scope.price,keepTogether:true});
      }
    } else if(section.type==="pricing"){
      blocks.push({id:"price-summary",kind:"price",title:section.title,lines:[`Subtotal|${money(p.subtotal)}`,`GST|${money(p.gst)}`,`Total|${money(p.total)}`,`Valid until|${p.expiryDate}`],keepTogether:true});
    } else if(section.type==="terms"){
      blocks.push({id:"terms-copy",kind:"paragraph",title:section.title,lines:paragraphs(section.content)});
      blocks.push({id:"unsigned-acceptance",kind:"acceptance",title:"Contract acceptance",lines:[`Customer: ${p.customer.name}`,`Property: ${p.property.address}`,`Proposal: ${p.proposalNumber}`,`Proposal total: ${money(p.total)}`,"Product and colour selection: ____________________","Customer signature: ____________________","Trusted signature: ____________________",`Proposal valid until: ${p.expiryDate}`],keepTogether:true});
    } else {
      blocks.push({id:`${section.type}-copy`,kind:"paragraph",title:section.title,lines:paragraphs(section.content)});
    }
    sections.push({id:`section-${section.type}`,type:section.type,title:section.title,orientation:section.orientation??"portrait",pageBreakBefore:section.type==="cover"||section.pageBreakBefore===true,blocks});
  }
  if(signed)sections.push({id:"signed-acceptance",type:"signed_acceptance",title:"Accepted Proposal",orientation:"portrait",pageBreakBefore:true,blocks:[{id:"accepted-contract",kind:"acceptance",title:"Accepted Proposal",lines:[`Proposal: ${p.proposalNumber} · Revision ${p.revisionNumber}`,`Signer: ${plain(signed.signerLegalName)}`,`Signer email: ${plain(signed.signerEmail)}`,`Accepted: ${plain(signed.acceptedAt)}`,`Selected roofing: ${signed.selectedOption?.tier??"Not applicable"}`,`Selected scopes: ${signed.selectedSoftScopes.map(x=>plain(x.title)).join(", ")||"None"}`,`Declined optional scopes: ${signed.declinedSoftScopes.map(x=>plain(x.title)).join(", ")||"None"}`,...Object.entries(signed.scopeColours).map(([id,c])=>`${plain(id)} colour: ${plain(c)}`),`Subtotal: ${money(p.subtotal)}`,`GST: ${money(p.gst)}`,`Final total: ${money(p.total)}`,"Acknowledgements: authority confirmed; proposal terms accepted",`Integrity reference: ${plain(signed.integrityHash)}`],keepTogether:true},{id:"signature",kind:"signature",title:"Electronic signature",lines:[signed.signatureType==="drawn"?"Drawn signature captured securely":`/ ${plain(signed.signerLegalName)} /`,"Trusted Roofing & Exteriors: ____________________"],keepTogether:true}]});
  return{kind:signed?"accepted":"proposal",title:signed?"Accepted Proposal":"Exterior Proposal",proposalNumber:p.proposalNumber,revisionNumber:p.revisionNumber,proposalDate:p.proposalDate,expiryDate:p.expiryDate,customerName:p.customer.name,propertyAddress:`${p.property.address}, ${p.property.city}, ${p.property.province}`,estimatorName:p.estimatorName,cover:{source:p.coverImage.source,storagePath:p.coverImage.storagePath,attribution:plain(p.coverImage.attribution),caption:plain(p.coverImage.caption),crop:p.coverImage.crop,zoom:p.coverImage.zoom},sections,subtotal:p.subtotal,gst:p.gst,total:p.total,signed:signed?{...signed,signatureData:undefined}:undefined};
}
