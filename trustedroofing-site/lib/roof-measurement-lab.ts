import { inflateSync } from "node:zlib";

export const SQFT_PER_M2 = 10.7639104167;
export const LAB_CONSTANTS = {
  workingCropPaddingMeters: 2,
  dsmMedianWindowMeters: 0.4,
  spikeThresholdMeters: 1.5,
  heightResidualToleranceMeters: 0.3,
  refinementInitialHeightToleranceMeters: 0.35,
  refinementRecoveryHeightToleranceMeters: 0.5,
  refinementMaxIterations: 8,
  segmentCenterSearchRadiusMeters: 2,
  microFacetAreaM2: 3,
  microFacetCombinedRmsMeters: 0.12,
  coplanarMergeRmsMeters: 0.1,
  pitchToleranceDegrees: 5,
  azimuthToleranceDegrees: 12,
  minimumPlaneAreaM2: 1,
  polygonSimplificationMeters: 0.15,
  planeMergePitchDegrees: 2,
  planeMergeAzimuthDegrees: 5,
  planeMergeHeightMeters: 0.15,
  ridgeVerticalToleranceMeters: 0.15,
  ridgeGradeToleranceDegrees: 3,
  edgeClassificationAngularToleranceDegrees: 20,
  edgeMergeDirectionDegrees: 5,
  edgeMergeGapMeters: 0.2
} as const;

export type GeoKeys = {
  GTModelTypeGeoKey?: number;
  GTRasterTypeGeoKey?: number;
  ProjectedCSTypeGeoKey?: number;
  GeographicTypeGeoKey?: number;
  [key: string]: number | string | undefined;
};
export type RasterDiagnostic = {
  byteOrder: "II" | "MM";
  ifdOffset: number;
  ifdEntryCount: number;
  compression: number;
  layout: "tiles" | "strips";
  predictor: number;
  bitsPerSample: number[];
  sampleFormat: number[];
  samplesPerPixel: number;
  planarConfiguration: number;
  photometricInterpretation: number;
  width: number;
  height: number;
  pixelScale: number[];
  modelTiepoint: number[];
  modelTransformation: number[];
  georeferencingMethod: "TRANSFORMATION" | "PIXELSCALE + TIEPOINT";
  affineTransform: [number, number, number, number, number, number];
  pixelWidth: number;
  pixelHeight: number;
  pixelSizeSane: boolean;
  geoKeys: GeoKeys;
  geoDoubleParams: number[];
  geoAsciiParams: string;
  gdalMetadata: string;
  noData: number | null;
  tags: Record<string, number[] | string>;
};
export type Raster = {
  width: number;
  height: number;
  bands: number;
  values: number[][];
  bounds: [number, number, number, number];
  pixelWidthM: number;
  pixelHeightM: number;
  noData: number | null;
  transform: [number, number, number, number, number, number];
  pixelToWorld(col: number, row: number): { x: number; y: number };
  worldToPixel(x: number, y: number): { col: number; row: number };
  wgs84ToPixel(longitude: number, latitude: number): { col: number; row: number };
  diagnostic: RasterDiagnostic;
};
export type ComponentSummary={label:number;pixelCount:number;minX:number;maxX:number;minY:number;maxY:number;centroidX:number;centroidY:number;distanceFromTargetPixels:number};
type Entry = { type: number; count: number; valueOffset: number; entryOffset: number };
const TIFF_TYPES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
const TAG_NAMES: Record<number, string> = {256:"ImageWidth",257:"ImageLength",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",273:"StripOffsets",277:"SamplesPerPixel",278:"RowsPerStrip",279:"StripByteCounts",284:"PlanarConfiguration",317:"Predictor",322:"TileWidth",323:"TileLength",324:"TileOffsets",325:"TileByteCounts",339:"SampleFormat",33550:"ModelPixelScaleTag",33922:"ModelTiepointTag",34264:"ModelTransformationTag",34735:"GeoKeyDirectoryTag",34736:"GeoDoubleParamsTag",34737:"GeoAsciiParamsTag",42112:"GDAL_METADATA",42113:"GDAL_NODATA"};
const GEO_KEY_NAMES: Record<number,string>={1024:"GTModelTypeGeoKey",1025:"GTRasterTypeGeoKey",2048:"GeographicTypeGeoKey",3072:"ProjectedCSTypeGeoKey"};

export function createGeoTransform(matrix:number[]|null,scale:number[]|null,tie:number[]|null){
  let transform:[number,number,number,number,number,number],method:"TRANSFORMATION"|"PIXELSCALE + TIEPOINT";
  if(matrix?.length===16){transform=[matrix[0],matrix[1],matrix[3],matrix[4],matrix[5],matrix[7]];method="TRANSFORMATION"}
  else if(scale&&scale.length>=2&&tie&&tie.length>=6){transform=[scale[0],0,tie[3]-tie[0]*scale[0],0,-scale[1],tie[4]+tie[1]*scale[1]];method="PIXELSCALE + TIEPOINT"}
  else throw new Error("GeoTIFF contains no supported georeferencing transform");
  const pixelToWorld=(col:number,row:number)=>({x:transform[0]*col+transform[1]*row+transform[2],y:transform[3]*col+transform[4]*row+transform[5]});
  const det=transform[0]*transform[4]-transform[1]*transform[3];if(Math.abs(det)<1e-20)throw new Error("GeoTIFF georeferencing transform is not invertible");
  const worldToPixel=(x:number,y:number)=>{const dx=x-transform[2],dy=y-transform[5];return{col:(transform[4]*dx-transform[1]*dy)/det,row:(-transform[3]*dx+transform[0]*dy)/det}};
  return{transform,method,pixelToWorld,worldToPixel};
}

function parseGeoKeys(directory:number[],doubles:number[],ascii:string):GeoKeys{const out:GeoKeys={};if(directory.length<4)return out;for(let i=0;i<directory[3];i++){const o=4+i*4,key=directory[o],location=directory[o+1],count=directory[o+2],offset=directory[o+3];let value:number|string=offset;if(location===34736)value=doubles.slice(offset,offset+count)[0]??offset;else if(location===34737)value=ascii.slice(offset,offset+count).replace(/\|$/g,"");out[GEO_KEY_NAMES[key]||`GeoKey_${key}`]=value}return out}
function lonLatToUtm(longitude:number,latitude:number,epsg:number){const north=epsg>=32601&&epsg<=32660,south=epsg>=32701&&epsg<=32760;if(!north&&!south)throw new Error(`Raster CRS EPSG:${epsg} cannot currently be transformed from WGS84`);const zone=(north?epsg-32600:epsg-32700),a=6378137,e=.0818191908426215,k=.9996,lat=latitude*Math.PI/180,lon=longitude*Math.PI/180,lon0=(zone*6-183)*Math.PI/180,n=a/Math.sqrt(1-e*e*Math.sin(lat)**2),t=Math.tan(lat)**2,c=e*e/(1-e*e)*Math.cos(lat)**2,A=Math.cos(lat)*(lon-lon0),m=a*((1-e*e/4-3*e**4/64-5*e**6/256)*lat-(3*e*e/8+3*e**4/32+45*e**6/1024)*Math.sin(2*lat)+(15*e**4/256+45*e**6/1024)*Math.sin(4*lat)-35*e**6/3072*Math.sin(6*lat));return{x:k*n*(A+(1-t+c)*A**3/6+(5-18*t+t*t+72*c-58*e*e/(1-e*e))*A**5/120)+500000,y:k*(m+n*Math.tan(lat)*(A*A/2+(5-t+9*c+4*c*c)*A**4/24+(61-58*t+t*t+600*c-330*e*e/(1-e*e))*A**6/720))+(south?10000000:0)}}

/** Memory-only classic TIFF/GeoTIFF decoder used exclusively by the roof laboratory. */
export function parseTiff(buffer:Buffer):Raster {
  const signature=buffer.toString("ascii",0,2) as "II"|"MM",le=signature==="II",u16=(b:Buffer,o:number)=>le?b.readUInt16LE(o):b.readUInt16BE(o),u32=(b:Buffer,o:number)=>le?b.readUInt32LE(o):b.readUInt32BE(o);
  if(signature!=="II"&&signature!=="MM")throw new Error("Unsupported TIFF byte order signature");if(u16(buffer,2)!==42)throw new Error("Unsupported TIFF version (BigTIFF is not supported)");
  const ifdOffset=u32(buffer,4),entryCount=u16(buffer,ifdOffset),entries=new Map<number,Entry>();for(let i=0;i<entryCount;i++){const o=ifdOffset+2+i*12;entries.set(u16(buffer,o),{type:u16(buffer,o+2),count:u32(buffer,o+4),valueOffset:u32(buffer,o+8),entryOffset:o})}
  const rawBytes=(entry:Entry)=>{const size=TIFF_TYPES[entry.type];if(!size)throw new Error(`Unsupported TIFF field type ${entry.type}`);const length=entry.count*size;return length<=4?buffer.subarray(entry.entryOffset+8,entry.entryOffset+8+length):buffer.subarray(entry.valueOffset,entry.valueOffset+length)};
  const text=(tag:number)=>{const e=entries.get(tag);return e?rawBytes(e).toString("utf8").replace(/\0+$/g,""):""};
  const values=(tag:number):number[]=>{const e=entries.get(tag);if(!e)return[];const b=rawBytes(e),size=TIFF_TYPES[e.type],out:number[]=[];for(let i=0;i<e.count;i++){const o=i*size;switch(e.type){case 1:out.push(b[o]);break;case 3:out.push(u16(b,o));break;case 4:out.push(u32(b,o));break;case 5:out.push(u32(b,o)/u32(b,o+4));break;case 6:out.push(b.readInt8(o));break;case 8:out.push(le?b.readInt16LE(o):b.readInt16BE(o));break;case 9:out.push(le?b.readInt32LE(o):b.readInt32BE(o));break;case 10:{const numerator=le?b.readInt32LE(o):b.readInt32BE(o),denominator=le?b.readInt32LE(o+4):b.readInt32BE(o+4);out.push(numerator/denominator);break}case 11:out.push(le?b.readFloatLE(o):b.readFloatBE(o));break;case 12:out.push(le?b.readDoubleLE(o):b.readDoubleBE(o));break;default:out.push(NaN)}}return out};
  const width=values(256)[0],height=values(257)[0],samplesPerPixel=values(277)[0]||1,bits=values(258),bitsPerSample=bits.length?bits:Array(samplesPerPixel).fill(8),formats=values(339),sampleFormat=formats.length?formats:Array(samplesPerPixel).fill(1),compression=values(259)[0]||1,predictor=values(317)[0]||1,photo=values(262)[0]||1,planarConfiguration=values(284)[0]||1,tiled=entries.has(324);
  if(!width||!height)throw new Error("Invalid TIFF dimensions");if(![1,8,32946].includes(compression))throw new Error(`Unsupported TIFF compression ${compression}`);if(![1,2].includes(predictor))throw new Error(`Unsupported TIFF predictor ${predictor}`);if(bitsPerSample.some(x=>![1,8,16,32].includes(x)))throw new Error(`Unsupported bits per sample: ${bitsPerSample.join(",")}`);if(bitsPerSample.includes(1)&&!(samplesPerPixel===1&&bitsPerSample.length===1))throw new Error("Packed one-bit TIFF must be single-band");if(sampleFormat.some(x=>![1,2,3].includes(x)))throw new Error(`Unsupported sample format: ${sampleFormat.join(",")}`);if(![1,2].includes(planarConfiguration))throw new Error(`Unsupported PlanarConfiguration ${planarConfiguration}`);if(new Set(bitsPerSample).size!==1)throw new Error("Mixed bits per sample are unsupported");
  const offsets=values(tiled?324:273),byteCounts=values(tiled?325:279),tileWidth=tiled?values(322)[0]:width,tileHeight=tiled?values(323)[0]:(values(278)[0]||height);if(!offsets.length||offsets.length!==byteCounts.length)throw new Error(`TIFF ${tiled?"tile":"strip"} offsets/byte counts are missing or inconsistent`);
  const bitsEach=bitsPerSample[0],bytesEach=bitsEach/8,bands=Array.from({length:samplesPerPixel},()=>Array<number>(width*height).fill(NaN)),tilesAcross=Math.ceil(width/tileWidth),tilesDown=Math.ceil(height/tileHeight),chunksPerPlane=tilesAcross*tilesDown;
  offsets.forEach((offset,chunkIndex)=>{const packed=buffer.subarray(offset,offset+byteCounts[chunkIndex]),decoded=compression===1?Buffer.from(packed):inflateSync(packed),plane=planarConfiguration===2?Math.floor(chunkIndex/chunksPerPlane):0,spatialChunk=planarConfiguration===2?chunkIndex%chunksPerPlane:chunkIndex,chunkSamples=planarConfiguration===2?1:samplesPerPixel,tx=tiled?(spatialChunk%tilesAcross)*tileWidth:0,ty=tiled?Math.floor(spatialChunk/tilesAcross)*tileHeight:spatialChunk*tileHeight,rows=Math.min(tileHeight,height-ty),rowBits=tileWidth*chunkSamples*bitsEach,rowBytes=Math.ceil(rowBits/8);
    if(predictor===2){if(bitsEach===1)throw new Error("Predictor 2 is unsupported for packed one-bit samples");for(let y=0;y<rows;y++)for(let x=1;x<tileWidth;x++)for(let s=0;s<chunkSamples;s++){const o=y*rowBytes+(x*chunkSamples+s)*bytesEach,previous=o-chunkSamples*bytesEach;if(bytesEach===1)decoded[o]=(decoded[o]+decoded[previous])&255;else if(bytesEach===2){const v=(u16(decoded,o)+u16(decoded,previous))&65535;le?decoded.writeUInt16LE(v,o):decoded.writeUInt16BE(v,o)}else{const v=(u32(decoded,o)+u32(decoded,previous))>>>0;le?decoded.writeUInt32LE(v,o):decoded.writeUInt32BE(v,o)}}}
    for(let y=0;y<rows;y++)for(let x=0;x<Math.min(tileWidth,width-tx);x++)for(let localBand=0;localBand<chunkSamples;localBand++){const band=planarConfiguration===2?plane:localBand,index=(ty+y)*width+tx+x;let value:number;if(bitsEach===1){const bit=y*rowBits+x;value=(decoded[bit>>3]>>(7-(bit&7)))&1}else{const o=y*rowBytes+(x*chunkSamples+localBand)*bytesEach,format=sampleFormat[band]??sampleFormat[0];value=bytesEach===1?(format===2?decoded.readInt8(o):decoded[o]):bytesEach===2?(format===2?(le?decoded.readInt16LE(o):decoded.readInt16BE(o)):u16(decoded,o)):format===3?(le?decoded.readFloatLE(o):decoded.readFloatBE(o)):format===2?(le?decoded.readInt32LE(o):decoded.readInt32BE(o)):u32(decoded,o)}bands[band][index]=value}
  });
  const modelPixelScale=values(33550),modelTiepoint=values(33922),modelTransformation=values(34264),geoDoubleParams=values(34736),geoAsciiParams=text(34737),geoKeys=parseGeoKeys(values(34735),geoDoubleParams,geoAsciiParams),geo=createGeoTransform(modelTransformation.length?modelTransformation:null,modelPixelScale.length?modelPixelScale:null,modelTiepoint.length?modelTiepoint:null),corners=[geo.pixelToWorld(0,0),geo.pixelToWorld(width,0),geo.pixelToWorld(0,height),geo.pixelToWorld(width,height)],xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),bounds:[number,number,number,number]=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],modelType=Number(geoKeys.GTModelTypeGeoKey),geographic=modelType===2||Number(geoKeys.GeographicTypeGeoKey)>0||(bounds[0]>=-180&&bounds[2]<=180&&bounds[1]>=-90&&bounds[3]<=90),center=geo.pixelToWorld(width/2,height/2),xStep=geo.pixelToWorld(1,0),yStep=geo.pixelToWorld(0,1),pixelWidthWorld=Math.hypot(xStep.x-geo.pixelToWorld(0,0).x,xStep.y-geo.pixelToWorld(0,0).y),pixelHeightWorld=Math.hypot(yStep.x-geo.pixelToWorld(0,0).x,yStep.y-geo.pixelToWorld(0,0).y),latitude=center.y*Math.PI/180,pixelWidthM=geographic?Math.hypot((xStep.x-geo.pixelToWorld(0,0).x)*111320*Math.cos(latitude),(xStep.y-geo.pixelToWorld(0,0).y)*110540):pixelWidthWorld,pixelHeightM=geographic?Math.hypot((yStep.x-geo.pixelToWorld(0,0).x)*111320*Math.cos(latitude),(yStep.y-geo.pixelToWorld(0,0).y)*110540):pixelHeightWorld;
  const noDataText=text(42113),noData=noDataText?Number(noDataText):null,projected=Number(geoKeys.ProjectedCSTypeGeoKey),wgs84ToPixel=(longitude:number,latitudeValue:number)=>{let world:{x:number;y:number};if(geographic)world={x:longitude,y:latitudeValue};else if(projected===3857)world={x:longitude*20037508.34/180,y:Math.log(Math.tan((90+latitudeValue)*Math.PI/360))*20037508.34/Math.PI};else world=lonLatToUtm(longitude,latitudeValue,projected);return geo.worldToPixel(world.x,world.y)};
  const tags:Record<string,number[]|string>={};for(const[tag,entry]of entries){const name=`${TAG_NAMES[tag]||"UnknownTag"}_${tag}`;try{tags[name]=entry.type===2?text(tag):values(tag)}catch{tags[name]=`UNSUPPORTED_TYPE_${entry.type}_COUNT_${entry.count}`}}
  const diagnostic:RasterDiagnostic={byteOrder:signature,ifdOffset,ifdEntryCount:entryCount,compression,layout:tiled?"tiles":"strips",predictor,bitsPerSample,sampleFormat,samplesPerPixel,planarConfiguration,photometricInterpretation:photo,width,height,pixelScale:modelPixelScale,modelTiepoint,modelTransformation,georeferencingMethod:geo.method,affineTransform:geo.transform,pixelWidth:pixelWidthM,pixelHeight:pixelHeightM,pixelSizeSane:pixelWidthM>=.05&&pixelWidthM<=.25&&pixelHeightM>=.05&&pixelHeightM<=.25,geoKeys,geoDoubleParams,geoAsciiParams,gdalMetadata:text(42112),noData:Number.isFinite(noData)?noData:null,tags};
  return{width,height,bands:samplesPerPixel,values:bands,bounds,pixelWidthM,pixelHeightM,noData:Number.isFinite(noData)?noData:null,transform:geo.transform,pixelToWorld:geo.pixelToWorld,worldToPixel:geo.worldToPixel,wgs84ToPixel,diagnostic};
}

export function resampleMaskToRaster(mask:Raster,target:Raster):Raster{const values=Array<number>(target.width*target.height).fill(0);for(let row=0;row<target.height;row++)for(let col=0;col<target.width;col++){const world=target.pixelToWorld(col+.5,row+.5),source=mask.worldToPixel(world.x,world.y),x=Math.floor(source.col),y=Math.floor(source.row);if(x>=0&&y>=0&&x<mask.width&&y<mask.height)values[row*target.width+col]=mask.values[0][y*mask.width+x]>0?1:0}return{...target,bands:1,values:[values],noData:null,diagnostic:{...target.diagnostic,bitsPerSample:[8],sampleFormat:[1],samplesPerPixel:1,noData:null,tags:{sourceMaskTransform:mask.transform,targetTransform:target.transform}}}}

export function rgbDataUrl(r:Raster){if(r.bands<3)throw new Error(`RGB preview requires 3 bands; raster has ${r.bands}`);const step=Math.max(1,Math.ceil(Math.max(r.width,r.height)/300)),cells:string[]=[];for(let y=0;y<r.height;y+=step)for(let x=0;x<r.width;x+=step){const i=y*r.width+x,c=[0,1,2].map(b=>Math.max(0,Math.min(255,Math.round(r.values[b][i]))));cells.push(`<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="rgb(${c.join(" ")})"/>`)}const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r.width} ${r.height}">${cells.join("")}</svg>`;return`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
export function heatmapDataUrl(r:Raster){const step=Math.max(1,Math.ceil(Math.max(r.width,r.height)/180)),values=r.values[0];let lo=Infinity,hi=-Infinity;for(let i=0;i<values.length;i++){const v=values[i];if(Number.isFinite(v)&&v!==r.noData&&v>-9000){if(v<lo)lo=v;if(v>hi)hi=v}}if(!Number.isFinite(lo)||!Number.isFinite(hi))throw new Error("DSM heatmap has no valid elevations");const cells:string[]=[];for(let y=0;y<r.height;y+=step)for(let x=0;x<r.width;x+=step){const v=values[y*r.width+x];if(Number.isFinite(v)&&v!==r.noData&&v>-9000){const t=(v-lo)/Math.max(hi-lo,.001),h=240*(1-t);cells.push(`<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="hsl(${h} 85% 50%)"/>`)}}const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r.width} ${r.height}">${cells.join("")}</svg>`;return`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
export function haversine(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){const r=Math.PI/180,dLat=(b.latitude-a.latitude)*r,dLon=(b.longitude-a.longitude)*r,s=Math.sin(dLat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dLon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s))}
export const pctDiff=(a:number,b:number)=>b?Math.abs(a-b)/Math.abs(b)*100:null;
export function labelConnectedComponents(eligible:Uint8Array,width:number,height:number,connectivity:4|8=8,target?:{x:number;y:number}){if(eligible.length!==width*height)throw new Error("Connected-component eligibility length does not match raster dimensions");const labels=new Int32Array(eligible.length),queue=new Int32Array(eligible.length),components:ComponentSummary[]=[];let nextLabel=0;const offsets=connectivity===8?[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]:[ [0,-1],[-1,0],[1,0],[0,1] ];for(let start=0;start<eligible.length;start++){if(!eligible[start]||labels[start])continue;const label=++nextLabel;let head=0,tail=0,count=0,sumX=0,sumY=0,minX=width,maxX=0,minY=height,maxY=0,distance=Infinity;queue[tail++]=start;labels[start]=label;while(head<tail){const index=queue[head++],x=index%width,y=Math.floor(index/width);count++;sumX+=x;sumY+=y;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;if(target)distance=Math.min(distance,Math.hypot(x-target.x,y-target.y));for(const[dx,dy]of offsets){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const neighbour=ny*width+nx;if(eligible[neighbour]&&!labels[neighbour]){labels[neighbour]=label;queue[tail++]=neighbour}}}components.push({label,pixelCount:count,minX,maxX,minY,maxY,centroidX:sumX/count,centroidY:sumY/count,distanceFromTargetPixels:distance})}return{labels,components}}
export function components(mask:Raster,center:{latitude:number;longitude:number}){const values=mask.values[0],eligible=new Uint8Array(values.length);for(let i=0;i<values.length;i++)eligible[i]=Number.isFinite(values[i])&&values[i]>0?1:0;const p=mask.wgs84ToPixel(center.longitude,center.latitude),result=labelConnectedComponents(eligible,mask.width,mask.height,8,{x:p.col,y:p.row});return result.components.sort((a,b)=>a.distanceFromTargetPixels-b.distanceFromTargetPixels).map(component=>{const pixels:number[]=[];for(let i=0;i<result.labels.length;i++)if(result.labels[i]===component.label)pixels.push(i);return{...component,pixels,distancePx:component.distanceFromTargetPixels}})}
export function cropRasterForPixels(raster:Raster,pixels:number[],paddingMeters=LAB_CONSTANTS.workingCropPaddingMeters){if(!pixels.length)throw new Error("Cannot crop an empty raster component");let minX=raster.width,maxX=0,minY=raster.height,maxY=0;for(const index of pixels){const x=index%raster.width,y=Math.floor(index/raster.width);if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}const padX=Math.ceil(paddingMeters/raster.pixelWidthM),padY=Math.ceil(paddingMeters/raster.pixelHeightM);minX=Math.max(0,minX-padX);maxX=Math.min(raster.width-1,maxX+padX);minY=Math.max(0,minY-padY);maxY=Math.min(raster.height-1,maxY+padY);const width=maxX-minX+1,height=maxY-minY+1,values=raster.values.map(source=>{const target=Array<number>(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)target[y*width+x]=source[(minY+y)*raster.width+minX+x];return target}),origin=raster.pixelToWorld(minX,minY),transform=[raster.transform[0],raster.transform[1],origin.x,raster.transform[3],raster.transform[4],origin.y] as [number,number,number,number,number,number],geo=createGeoTransform([transform[0],transform[1],0,transform[2],transform[3],transform[4],0,transform[5],0,0,1,0,0,0,0,1],null,null),croppedPixels=pixels.map(index=>{const x=index%raster.width,y=Math.floor(index/raster.width);return(y-minY)*width+x-minX});return{raster:{...raster,width,height,values,bounds:[raster.pixelToWorld(minX,maxY+1).x,raster.pixelToWorld(minX,maxY+1).y,raster.pixelToWorld(maxX+1,minY).x,raster.pixelToWorld(maxX+1,minY).y] as [number,number,number,number],transform,pixelToWorld:geo.pixelToWorld,worldToPixel:geo.worldToPixel,diagnostic:{...raster.diagnostic,width,height,affineTransform:transform}},pixels:croppedPixels,offset:{x:minX,y:minY},width,height}}
export function pricing(areaSqft:number,facets:{areaSqft:number;pitchX12:number}[]){const count=facets.length,adj=!count||count<=5?0:count<=12?(count-5)*.01:Math.min(.07+(count-12)*.015,.2),base=areaSqft/100*580,pitch=facets.reduce((s,f)=>s+f.areaSqft/100*Math.max(0,f.pitchX12-6)*10,0),pre=base+pitch,center=pre*(1+adj);return{roofSquares:areaSqft/100,baseRate:580,basePrice:base,facetCount:count,facetAdjustment:adj,facetComplexityDollars:pre*adj,totalPitchSurcharge:pitch,center,low:Math.round(center*.94/50)*50,high:Math.round(center*1.06/50)*50}}
export function confidence(i:{quality:string;distance:number;coverage:number;maskDiff:number;areaDiff:number;planeCoverage:number;residual:number}){const imagery=i.quality==="HIGH"?15:i.quality==="MEDIUM"?10:5,location=i.distance<=5?15:i.distance<=10?8:0,coverage=i.coverage>=.97?15:i.coverage>=.93?12:i.coverage>=.85?8:i.coverage>=.75?4:0,mask=i.maskDiff<=3?15:i.maskDiff<=5?12:i.maskDiff<=10?8:i.maskDiff<=15?4:0,area=i.areaDiff<=2?20:i.areaDiff<=3?18:i.areaDiff<=5?15:i.areaDiff<=8?10:i.areaDiff<=12?5:0,planes=i.planeCoverage>=.98&&i.residual<=.1?20:i.planeCoverage>=.95&&i.residual<=.15?17:i.planeCoverage>=.9&&i.residual<=.2?13:i.planeCoverage>=.85&&i.residual<=.25?8:0,total=imagery+location+coverage+mask+area+planes;return{components:{imagery,location,googleCoverage:coverage,rasterAgreement:mask,areaAgreement:area,planeQuality:planes},total,label:total>=90?"VERY HIGH":total>=80?"HIGH":total>=70?"MEDIUM":"LOW"}}
