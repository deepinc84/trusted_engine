import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
export function generateProposalToken(){return randomBytes(32).toString("base64url")}
export function hashProposalToken(token:string){return createHash("sha256").update(token,"utf8").digest("hex")}
export function tokenHashesEqual(a:string,b:string){const x=Buffer.from(a,"hex"),y=Buffer.from(b,"hex");return x.length===y.length&&timingSafeEqual(x,y)}
export function proposalTokenExpiry(now=new Date()){const configured=Number(process.env.PROPOSAL_TOKEN_EXPIRY_DAYS??30),days=Number.isFinite(configured)&&configured>0?configured:30;return new Date(now.getTime()+days*86400000)}
export function proposalBaseUrl(){const value=process.env.NEXT_PUBLIC_PROPOSAL_BASE_URL??process.env.NEXT_PUBLIC_SITE_URL;if(!value)throw new Error("NEXT_PUBLIC_PROPOSAL_BASE_URL is required to send proposals.");return value.replace(/\/$/,"")}
export function proposalCustomerUrl(token:string){return `${proposalBaseUrl()}/proposal/${encodeURIComponent(token)}`}
export type TokenRecord={id:string;proposal_id:string;proposal_revision:number;token_hash:string;expires_at:string;revoked_at:string|null};
export function tokenIsUsable(record:TokenRecord|undefined,token:string,now=new Date(),expectedProposalId?:string){if(!record||(expectedProposalId&&record.proposal_id!==expectedProposalId)||record.revoked_at||new Date(record.expires_at)<=now)return false;return tokenHashesEqual(record.token_hash,hashProposalToken(token))}
