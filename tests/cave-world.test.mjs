import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {LowPolyAssets} from '../dist/low-poly-models.js';
import {CaveWorld,caveCeilingAt,caveSectionAt,caveWidthAt} from '../dist/cave-world.js';

const assets=new LowPolyAssets(),scene=new THREE.Scene(),world=new CaveWorld(assets,scene);
for(let d=0;d<=388;d++)assert(caveCeilingAt(d)>=14);
for(let d=194;d<=226;d++)assert(caveCeilingAt(d)>=35,'rainbow flight has a tall roof above the entire arc');
assert(caveCeilingAt(312)>=29,'the giant turtle fits in the lake chamber');
assert(caveWidthAt(260)>20,'lake chamber has broad depth beyond the path');
world.lake.mesh.geometry.computeBoundingBox();const lakeBounds=world.lake.mesh.geometry.boundingBox;
assert(lakeBounds.max.z>=-194&&lakeBounds.min.z<=-226,'lake lies beneath the entire rainbow bridge');assert(lakeBounds.max.z===-178&&lakeBounds.min.z===-350);
assert.equal(caveSectionAt(20),'volcanic-tunnels');assert.equal(caveSectionAt(180),'mushroom-grotto');assert.equal(caveSectionAt(290),'underground-lake');assert.equal(caveSectionAt(378),'heart-chamber');assert.equal(caveSectionAt(396),'sunlit-clearing');
assert(world.scenery.children.length<30,'static scenery is batched');assert(world.crystalCount>200);assert(world.mushroomCount>50);
const pos=world.vault.geometry.attributes.position;let furthest=0;
for(let i=0;i<pos.count;i++){
 const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);furthest=Math.max(furthest,-z);
 assert(!(Math.abs(x)<2.3&&y<4),'no cave wall or ceiling crosses the riding corridor');
}
assert.equal(furthest,388,'vault ends before the finish so the rider exits into daylight');
scene.updateMatrixWorld(true);const camera=new THREE.PerspectiveCamera(64,16/9,.06,600);camera.position.set(0,2.05,-380.3);camera.rotation.x=-.055;camera.updateMatrixWorld(true);
const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
assert(world.heartSegments.every(gem=>frustum.intersectsObject(gem)),'all three heart segments are visible from the guardian stopping point');
const game={distance:68,boss:{hp:3,done:false},vents:[{z:68,elapsed:1,cleared:false}]};
world.update(game,2,1/60);const moving=world.diagnostics();assert.equal(moving.steamPuffs,24);assert(moving.lavaOffset<0);
const held=world.steam.instanceMatrix.array.slice();world.update(game,2,0);assert.deepEqual(world.steam.instanceMatrix.array,held,'paused scene has no independent steam clock');
game.vents[0].cleared=true;game.distance=378;game.boss.hp=2;world.update(game,3,1/60);assert.equal(world.diagnostics().heartCharge,1);assert.equal(world.diagnostics().steamPuffs,0);assert(world.heartSegments[0].material.emissiveIntensity>.7);assert(world.heartSegments[1].material.emissiveIntensity<.2);
game.boss.done=true;game.boss.hp=0;game.distance=396;world.update(game,4,1/60);assert.equal(world.diagnostics().heartCharge,3);assert.equal(world.diagnostics().section,'sunlit-clearing');assert(world.heartSegments.every(gem=>gem.material.emissiveIntensity>.7));
assets.dispose();
console.log('PASS: three cave biomes, clear vaulted corridor and rainbow roof, broad lake, batched scenery, pause-safe steam, three-step crystal heart and sunny exit');
