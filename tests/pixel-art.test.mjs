import assert from 'node:assert/strict';
import {PIXEL_PALETTE,quantizePixels} from '../dist/pixel-art.js';
const allowed=new Set(PIXEL_PALETTE.map(hex=>hex.toLowerCase()));
const source=new Uint8ClampedArray(256*4);
for(let i=0;i<256;i++){source.set([i,255-i,(i*71)%256,i],i*4);}
const result=quantizePixels(source);
for(let i=0;i<256;i++){
  assert.equal(result[i*4+3],i<120?0:255,'binary alpha prevents fuzzy sprite borders');
  if(i>=120){const hex='#'+[0,1,2].map(j=>result[i*4+j].toString(16).padStart(2,'0')).join('');assert(allowed.has(hex));}
}
const once=Uint8ClampedArray.from(result);quantizePixels(result);assert.deepEqual(result,once,'palette conversion is stable across cached menu images');
console.log('PASS: shared pixel palette, stable colour conversion and crisp alpha borders');
