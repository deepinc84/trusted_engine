import assert from "node:assert/strict";
import test from "node:test";
import { confidence, haversine, pricing } from "../lib/roof-measurement-lab";

test("lab pricing follows the isolated calibrated formula",()=>{const p=pricing(1000,Array.from({length:7},()=>({areaSqft:1000/7,pitchX12:7})));assert.equal(p.basePrice,5800);assert.equal(p.facetAdjustment,.02);assert.equal(Math.round(p.totalPitchSurcharge),100);assert.equal(Math.round(p.center),6018);assert.equal(p.low,5650);assert.equal(p.high,6400)});
test("confidence weights total exactly 100 for excellent inputs",()=>{const c=confidence({quality:"HIGH",distance:1,coverage:.98,maskDiff:1,areaDiff:1,planeCoverage:.95,residual:.2});assert.equal(c.total,100);assert.equal(c.label,"VERY HIGH");assert.deepEqual(c.components,{imagery:15,location:15,googleCoverage:15,rasterAgreement:15,areaAgreement:20,planeQuality:20})});
test("building-center distance uses meters",()=>{assert.ok(haversine({latitude:51,longitude:-114},{latitude:51.00001,longitude:-114})>1)});
