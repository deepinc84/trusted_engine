import { inflateSync } from "node:zlib";

export const SQFT_PER_M2 = 10.7639104167;
export const LAB_CONSTANTS = { minimumPlaneAreaM2: 1, polygonSimplificationM: .15, ridgeLevelToleranceDegrees: 5, edgeAngularToleranceDegrees: 20 } as const;

type Raster = { width:number;height:number;values:number[];bounds:[number,number,number,number];pixelWidthM:number;pixelHeightM:number;noData:number|null;bands:number };
const u16=(b:Buffer,o:number,l:boolean)=>l?b.readUInt16LE(o):b.readUInt16BE(o), u32=(b:Buffer,o:number,l:boolean)=>l?b.readUInt32LE(o):b.readUInt32BE(o);

/** Deliberately small, memory-only baseline TIFF reader for Google single-band strips. */
export function parseTiff(buffer:Buffer):Raster {
  const le=buffer.toString("ascii",0,2)==="II"; if(u16(buffer,2,le)!==42) throw new Error("Unsupported GeoTIFF byte order/header");
  const count=u16(buffer,u32(buffer,4,le),le), ifd=u32(buffer,4,le), tags=new Map<number,{type:number,count:number,offset:number}>();
  for(let i=0;i<count;i++){const o=ifd+2+i*12;tags.set(u16(buffer,o,le),{type:u16(buffer,o+2,le),count:u32(buffer,o+4,le),offset:u32(buffer,o+8,le)});}
  const vals=(id:number)=>{const t=tags.get(id);if(!t)return [] as number[];const size=t.type===3?2:t.type===12?8:4,o=t.count*size<=4?ifd+2+[...tags.keys()].indexOf(id)*12+8:t.offset;return Array.from({length:t.count},(_,i)=>t.type===3?u16(buffer,o+i*2,le):t.type===12?(le?buffer.readDoubleLE(o+i*8):buffer.readDoubleBE(o+i*8)):u32(buffer,o+i*4,le));};
  const width=vals(256)[0],height=vals(257)[0],bits=vals(258)[0]||8,compression=vals(259)[0]||1,sampleFormat=vals(339)[0]||1,bands=vals(277)[0]||1;
  const offsets=vals(273), lengths=vals(279), chunks=offsets.map((o,i)=>compression===8?inflateSync(buffer.subarray(o,o+lengths[i])):buffer.subarray(o,o+lengths[i]));
  if(![1,8].includes(compression)||bands!==1) throw new Error(`Unsupported TIFF layout (compression ${compression}, bands ${bands}); raster analysis requires single-band mask/DSM.`);
  const raw=Buffer.concat(chunks), n=width*height, values:number[]=[]; for(let i=0;i<n;i++){const o=i*bits/8;values.push(bits===32&&sampleFormat===3?(le?raw.readFloatLE(o):raw.readFloatBE(o)):bits===16?u16(raw,o,le):raw[o]);}
  const scale=vals(33550), tie=vals(33922); if(scale.length<2||tie.length<6)throw new Error("GeoTIFF is missing ModelPixelScale/ModelTiepoint metadata");
  const west=tie[3]-tie[0]*scale[0], north=tie[4]+tie[1]*scale[1], east=west+width*scale[0],south=north-height*scale[1], lat=(north+south)/2*Math.PI/180;
  const geographic=Math.abs(scale[0])<.01, pixelWidthM=geographic?scale[0]*111320*Math.cos(lat):scale[0],pixelHeightM=geographic?scale[1]*110540:scale[1];
  const ascii=tags.get(42113), noData=ascii?Number(buffer.toString("ascii",ascii.offset,ascii.offset+ascii.count).replace(/\0/g,"")):null;
  return {width,height,values,bounds:[west,south,east,north],pixelWidthM:Math.abs(pixelWidthM),pixelHeightM:Math.abs(pixelHeightM),noData:Number.isFinite(noData)?noData:null,bands};
}

export function haversine(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){const r=Math.PI/180,dLat=(b.latitude-a.latitude)*r,dLon=(b.longitude-a.longitude)*r,s=Math.sin(dLat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dLon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
export const pctDiff=(a:number,b:number)=>b?Math.abs(a-b)/Math.abs(b)*100:null;
export function components(mask:Raster, center:{latitude:number;longitude:number}) {const active=mask.values.map(v=>Number.isFinite(v)&&v>0),seen=new Uint8Array(active.length),out:{pixels:number[];distancePx:number}[]=[];const cx=(center.longitude-mask.bounds[0])/(mask.bounds[2]-mask.bounds[0])*mask.width,cy=(mask.bounds[3]-center.latitude)/(mask.bounds[3]-mask.bounds[1])*mask.height;
  for(let s=0;s<active.length;s++){if(!active[s]||seen[s])continue;const q=[s],pixels:number[]=[];seen[s]=1;let d=Infinity;for(let h=0;h<q.length;h++){const p=q[h],x=p%mask.width,y=Math.floor(p/mask.width);pixels.push(p);d=Math.min(d,Math.hypot(x-cx,y-cy));for(const n of [p-1,p+1,p-mask.width,p+mask.width])if(n>=0&&n<active.length&&active[n]&&!seen[n]&&Math.abs(n%mask.width-x)<=1){seen[n]=1;q.push(n)}}out.push({pixels,distancePx:d});}return out.sort((a,b)=>a.distancePx-b.distancePx);
}
export function pricing(areaSqft:number,facets:{areaSqft:number;pitchX12:number}[]){const count=facets.length,adj=!count||count<=5?0:count<=12?(count-5)*.01:Math.min(.07+(count-12)*.015,.2),base=areaSqft/100*580,pitch=facets.reduce((s,f)=>s+f.areaSqft/100*Math.max(0,f.pitchX12-6)*10,0),pre=base+pitch,center=pre*(1+adj);return {roofSquares:areaSqft/100,baseRate:580,basePrice:base,facetCount:count,facetAdjustment:adj,facetComplexityDollars:pre*adj,totalPitchSurcharge:pitch,center,low:Math.round(center*.94/50)*50,high:Math.round(center*1.06/50)*50};}
export function confidence(i:{quality:string;distance:number;coverage:number;maskDiff:number;areaDiff:number;planeCoverage:number;residual:number}){const imagery=i.quality==="HIGH"?15:i.quality==="MEDIUM"?10:5,location=i.distance<=5?15:i.distance<=10?8:0,coverage=i.coverage>=.97?15:i.coverage>=.93?12:i.coverage>=.85?8:i.coverage>=.75?4:0,mask=i.maskDiff<=3?15:i.maskDiff<=5?12:i.maskDiff<=10?8:i.maskDiff<=15?4:0,area=i.areaDiff<=2?20:i.areaDiff<=3?18:i.areaDiff<=5?15:i.areaDiff<=8?10:i.areaDiff<=12?5:0,planes=i.planeCoverage>=.9&&i.residual<=.35?20:i.planeCoverage>=.8&&i.residual<=.6?15:i.planeCoverage>=.65&&i.residual<=1?8:0,total=imagery+location+coverage+mask+area+planes;return {components:{imagery,location,googleCoverage:coverage,rasterAgreement:mask,areaAgreement:area,planeQuality:planes},total,label:total>=90?"VERY HIGH":total>=80?"HIGH":total>=70?"MEDIUM":"LOW"};}
