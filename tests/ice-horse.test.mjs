import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {HORSES} from '../dist/characters.js';
import {LowPolyAssets} from '../dist/low-poly-models.js';

const ice=HORSES.find(horse=>horse.id==='ice');assert(ice?.crystal);assert.equal(ice.name,'Lodowa Iskierka');
for(const property of ['coat','hooves','horn'])assert.equal(new Set(HORSES.map(horse=>horse[property])).size,4);
const assets=new LowPolyAssets(),old=assets.unicorn(HORSES[0]),before=[];
old.traverse(part=>{if(part.isMesh)before.push({part,material:part.material,opacity:part.material.opacity,color:part.material.color.getHex()});});
for(const model of [assets.unicorn(ice),assets.rider(ice)]){
  assert(model.userData.crystal);let coat=0,eyes=0,clearHorn=0;
  model.traverse(part=>{
    if(!part.isMesh)return;
    assert(!part.material.map,'crystal is shaded volume, not painted artwork');assert.equal(part.material.flatShading,false);
    if(part.material.name==='ice-unicorn-coat'){coat++;assert(part.material.transparent);assert(part.material.opacity>.6&&part.material.opacity<.8);assert(!part.material.depthWrite);assert.equal(part.material.color.getHexString(),ice.coat.slice(1));}
    if(part.material.name==='ice-unicorn-horn'){clearHorn++;assert.equal(part.material.color.getHexString(),ice.horn.slice(1));}
    if(part.geometry===assets.geometries.eye&&!part.material.transparent)eyes++;
  });
  assert(coat>=4&&clearHorn===1&&eyes>=4,'blue glass body, consistent horn and legible opaque eyes');
  const tip=model.userData.hornTip,head=model.userData.head;
  model.updateMatrixWorld(true);const origin=tip.getWorldPosition(new THREE.Vector3());head.rotation.y=-2.35;model.updateMatrixWorld(true);assert(tip.getWorldPosition(new THREE.Vector3()).distanceTo(origin)>.1,'spell origin follows the crystalline head');
  assert.equal(head.userData.hornColor,ice.horn);assert.equal(head.scale.x,model.userData.kind==='rider'?.8:1);
}
for(const snapshot of before){assert.equal(snapshot.part.material,snapshot.material);assert.equal(snapshot.material.opacity,snapshot.opacity);assert.equal(snapshot.material.color.getHex(),snapshot.color);}
assets.dispose();console.log('PASS: fourth crystal unicorn has blue translucent volume, distinct palette, opaque eyes, rotating horn origin and isolated materials');
