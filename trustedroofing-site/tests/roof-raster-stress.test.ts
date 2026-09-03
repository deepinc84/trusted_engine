import assert from "node:assert/strict";
import test from "node:test";
import { heatmapDataUrl, labelConnectedComponents, Raster } from "../lib/roof-measurement-lab";
import { reconstructRoof } from "../lib/roof-geometry";

function raster(width:number,height:number,values:number[]):Raster{return{width,height,bands:1,values:[values],bounds:[0,0,width*.1,height*.1],pixelWidthM:.1,pixelHeightM:.1,noData:null,transform:[.1,0,0,0,-.1,height*.1],pixelToWorld:(col,row)=>({x:col*.1,y:(height-row)*.1}),worldToPixel:(x,y)=>({col:x/.1,row:height-y/.1}),wgs84ToPixel:(longitude,latitude)=>({col:longitude/.1,row:height-latitude/.1}),diagnostic:{} as Raster["diagnostic"]}}

test("iterative 8-connected labeling handles a one-million-pixel mask",()=>{const width=1000,height=1000,eligible=new Uint8Array(width*height);eligible.fill(1,0,600_000);eligible.fill(1,800_000,850_000);const result=labelConnectedComponents(eligible,width,height,8);assert.equal(result.components.length,2);assert.equal(result.components[0].pixelCount,600_000);assert.equal(result.components[1].pixelCount,50_000);assert.equal(result.labels[599_999],1)});
test("heatmap extrema scan handles one million elevations without argument spreading",()=>{const width=1000,height=1000,values=Array.from({length:width*height},(_,i)=>100+(i%100)*.01);assert.match(heatmapDataUrl(raster(width,height,values)),/^data:image\/svg\+xml;base64,/)});
test("iterative region growing and contour tracing process 250,000 roof pixels",()=>{const width=500,height=500,values=Array.from({length:width*height},(_,i)=>10+(i%width)*.003),pixels=Array.from({length:width*height},(_,i)=>i),model=reconstructRoof(raster(width,height,values),pixels);assert.ok(model.facets.length>=1);assert.ok(model.facets[0].pixels.length>240_000);assert.ok(model.facets[0].polygon.length>=4)});
