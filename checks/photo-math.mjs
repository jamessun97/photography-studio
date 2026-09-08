import assert from 'node:assert/strict';
import { relativeEV, printCm, cropRect, adjustPixels } from '../app/photo-math.ts';
assert.equal(relativeEV(4,1/125,400),0);
assert.equal(relativeEV(4,1/500,1600),0);
assert.equal(relativeEV(8,1/125,400),-2);
assert.equal(printCm(2400,300),20.32);
for(const ratio of [null,1,1.5,2/3])for(const zoom of [1,2,3])for(const x of [0,50,100])for(const y of [0,50,100]){const r=cropRect(2400,1600,ratio,zoom,x,y);assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=2400.0001&&r.y+r.height<=1600.0001);if(ratio)assert.ok(Math.abs(r.width/r.height-ratio)<.0001);}
const base={exposure:0,contrast:0,shadows:0,highlights:0,warmth:0,tint:0,saturation:100};
const pixels=new Uint8ClampedArray([0,0,0,255,128,70,220,255,255,255,255,255]);const before=Array.from(pixels);const hist=adjustPixels(pixels,base);assert.deepEqual(Array.from(pixels),before);assert.equal(hist.histogram.reduce((a,b)=>a+b,0),3);
const gray=new Uint8ClampedArray([200,60,80,255]);adjustPixels(gray,{...base,saturation:0});assert.equal(gray[0],gray[1]);assert.equal(gray[1],gray[2]);
console.log('PASS: exposure equivalence, print size, crop boundaries, identity transform, histogram, grayscale');
