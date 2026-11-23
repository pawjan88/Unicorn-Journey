import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {LowPolyAssets} from '../dist/low-poly-models.js';
import {caveCrystal,caveGolem,crystalCrab,crystalLizard,caveBat,crystalTurtle,caveObstacle} from '../dist/cave-models.js';
const a=new LowPolyAssets();
const bounds=model=>new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
const crystal=caveCrystal(a);assert(bounds(crystal).y<.6,'collectibles stay small and readable');
const golem=caveGolem(a),guardian=caveGolem(a,true);
assert.equal(golem.userData.legs.length,2);assert(golem.userData.arm);assert.equal(guardian.userData.kind,'obsidian-guardian');assert.equal(guardian.userData.crystalSegments.length,3);
assert(bounds(guardian).y>4.2);assert(bounds(golem).y<2.5);assert.notEqual(guardian.userData.crystalSegments[0].material,golem.userData.crystalSegments[0].material,'boss hit lighting does not alter ordinary enemies');
const crab=crystalCrab(a);assert.equal(crab.userData.legs.length,8);assert(bounds(crab).x>1.3);
const lizard=crystalLizard(a);assert.equal(lizard.userData.legs.length,4);assert(lizard.userData.tail);assert(bounds(lizard).y<1);
const bat=caveBat(a);assert.equal(bat.userData.wings.length,2);assert(bounds(bat).x>1.8);assert(a.geometries.caveBatWing,'wing mesh belongs to the shared asset owner');
const turtle=crystalTurtle(a),size=bounds(turtle);assert.equal(turtle.userData.legs.length,4);assert(turtle.userData.head);assert(size.y>2.1&&size.y<2.8);assert(size.z>6.6&&size.z<8);turtle.scale.setScalar(3.15);assert(bounds(turtle).z>20,'cinematic crossing remains huge');
for(const kind of ['chasm','column']){const obstacle=caveObstacle(a,kind,30),size=bounds(obstacle);assert(size.x>=4.4&&size.x<5.5);assert(size.y<.8,'jump obstacles fit the established clearance');assert.equal(obstacle.userData.kind,kind);}
for(const actor of [golem,guardian,crab,lizard,bat,turtle])actor.traverse(mesh=>{if(mesh.isMesh){assert(mesh.geometry.attributes.normal);assert(mesh.material.isMeshStandardMaterial);assert.equal(mesh.material.flatShading,false);}});
a.dispose();console.log('PASS: volumetric cave enemies, independent guardian hit crystals, eight-legged crab, lizards, membrane bats, giant turtle and jumpable cave obstacles');
