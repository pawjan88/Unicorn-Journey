import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {LowPolyAssets} from '../dist/low-poly-models.js';
import {snowflake,snowImp,iceDragon,frostKing,reindeer,snowyOwl,mammoth,winterSister,winterObstacle} from '../dist/winter-models.js';
const a=new LowPolyAssets(),size=model=>new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
const flake=snowflake(a);let arms=0;flake.traverse(part=>{if(part.name==='snowflake-arm')arms++;});assert.equal(arms,6);assert(size(flake).y<.7&&size(flake).x>.45);
const imp=snowImp(a),dragon=iceDragon(a),king=frostKing(a);assert(size(imp).y<1.8);assert(size(dragon).y<2);assert.equal(dragon.userData.wings.length,2);assert(size(king).y>4.3&&size(king).y<5.3);assert.equal(king.userData.crystalSegments.length,3);assert.equal(new Set(king.userData.crystalSegments.map(segment=>segment.material)).size,3);assert(king.userData.arm);
const deer=reindeer(a);assert.equal(deer.userData.legs.length,4);assert(size(deer).y>2.2);const owl=snowyOwl(a);assert.equal(owl.userData.wings.length,2);assert(size(owl).x>2);
const big=mammoth(a);assert.equal(big.userData.legs.length,4);assert(big.userData.head);assert(big.userData.trunk);const mammothSize=size(big);assert(mammothSize.y>2.2&&mammothSize.y<2.8);assert(mammothSize.z>5);let tusks=0;big.traverse(part=>{if(part.name==='curved-tusk')tusks++;});assert.equal(tusks,2);
const sisters=['elsa','anna'].map(id=>winterSister(a,id));
for(const [i,sister]of sisters.entries()){
 assert.equal(sister.userData.kind,i?'anna':'elsa');assert(sister.userData.leftArm&&sister.userData.rightArm&&sister.userData.head);assert.equal(sister.userData.legs.length,2);assert(size(sister).y>1.9&&size(sister).y<2.3);
 let braids=0;sister.traverse(part=>{if(part.name===(i?'anna-twin-braid':'elsa-side-braid'))braids++;});assert.equal(braids,i?14:7);
 const cape=sister.getObjectByName(i?'anna-magenta-cape':'elsa-translucent-cape');assert(cape);if(!i)assert(cape.material.transparent&&cape.material.opacity<.7);
}
for(const kind of ['ice-crack','snow-log']){const obstacle=winterObstacle(a,kind,30),s=size(obstacle);assert(s.x>=4.3&&s.x<5.2);assert(s.y<.8);assert.equal(obstacle.userData.kind,kind);}
for(const actor of [imp,dragon,king,deer,owl,big,...sisters])actor.traverse(mesh=>{if(mesh.isMesh){assert(mesh.geometry.attributes.normal);assert(mesh.material.flatShading);}});
a.dispose();console.log('PASS: golden six-arm snowflake, friendly ice enemies, three crown charges, winter animals, huge mammoth, Elsa/Anna braid and outfit silhouettes, and jumpable snow obstacles');
