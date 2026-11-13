import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {LowPolyAssets} from '../dist/low-poly-models.js';
import {WinterWorld,winterSectionAt} from '../dist/winter-world.js';

const assets=new LowPolyAssets(),scene=new THREE.Scene(),world=new WinterWorld(assets,scene);
assert.equal(winterSectionAt(20),'snowy-forest');assert.equal(winterSectionAt(210),'frozen-lake');assert.equal(winterSectionAt(374),'castle-pass');assert.equal(winterSectionAt(396),'castle-courtyard');
assert(world.diagnostics().trees>600,'snowy trees extend well beyond the trackside');assert(world.diagnostics().staticBatches<35,'dense winter scenery remains batched');
world.lake.geometry.computeBoundingBox();const lakeBounds=world.lake.geometry.boundingBox;assert(lakeBounds.max.z>=-194&&lakeBounds.min.z<=-226,'frozen lake lies beneath the complete rainbow bridge');assert(lakeBounds.min.x< -50&&lakeBounds.max.x>50);
const corridor=new THREE.Box3(new THREE.Vector3(-2.3,.25,-387),new THREE.Vector3(2.3,4,0)),matrix=new THREE.Matrix4();
for(const group of [world.scenery,world.castle])for(const mesh of group.children){
 mesh.geometry.computeBoundingBox();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);const bounds=mesh.geometry.boundingBox.clone().applyMatrix4(matrix);assert(!bounds.intersectsBox(corridor),'static scenery keeps the riding corridor clear');}
}
const game={distance:382,boss:{hp:3,done:false},rescue:{freed:false}};
world.update(game,500,1/60);const locked=world.diagnostics();assert.equal(locked.gateOpen,false);assert.equal(locked.gateAngle,0);assert(locked.icePrisonsVisible);assert.deepEqual(locked.princessNames,['Elza','Anna']);assert(world.sisters.every(sister=>sister.actor.visible));
game.boss.hp=1;world.update(game,501,1/60);assert(!world.diagnostics().princessesFreed,'two hits cannot free the sisters');assert(world.diagnostics().icePrisonsVisible);
// The game emits rescue after the third hit. The view animates from that state.
game.boss={hp:0,done:true};game.rescue.freed=true;world.update(game,502,1/60);assert(world.diagnostics().princessesFreed);world.update(game,503,1/60);
const held=JSON.stringify(world.diagnostics()),positions=world.snowfall.geometry.attributes.position.array.slice(),arms=world.sisters.map(sister=>sister.actor.userData.rightArm.rotation.z);
world.update(game,503,0);assert.equal(JSON.stringify(world.diagnostics()),held);assert.deepEqual(world.snowfall.geometry.attributes.position.array,positions);assert.deepEqual(world.sisters.map(sister=>sister.actor.userData.rightArm.rotation.z),arms,'pause freezes snow, rescue and waving');
world.update(game,506,1/60);const free=world.diagnostics();assert.equal(free.rescueProgress,1);assert(!free.icePrisonsVisible);assert(free.gateAngle>1.4);assert(free.auroraStrength>locked.auroraStrength+.2);assert(world.sisters.every(sister=>sister.actor.userData.rightArm.rotation.z>1.8),'both sisters wave after rescue');
assert(free.princessPositions.every(position=>Math.abs(Math.abs(position.x)-2.8)<1e-7&&position.z===-403));
for(const y of Array.from(world.snowfall.geometry.attributes.position.array).filter((_,i)=>i%3===1))assert(y>=0&&y<15,'snowfall stays above the ground after earlier episodes have consumed several minutes');
// Final welcome must be visible from the actual finishing camera, not beyond it.
scene.updateMatrixWorld(true);const camera=new THREE.PerspectiveCamera(64,16/9,.06,700);camera.position.set(0,2.05,-394.3);camera.rotation.x=-.055;camera.updateMatrixWorld(true);
const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));for(const sister of world.sisters){const box=new THREE.Box3().setFromObject(sister.actor);assert(frustum.intersectsBox(box),'rescued princess remains visible from the courtyard finish');}
game.boss={hp:3,done:false};game.rescue.freed=false;game.distance=0;world.update(game,507,1/60);const replay=world.diagnostics();assert.equal(replay.gateAngle,0);assert(!replay.princessesFreed);assert(replay.icePrisonsVisible);assert.equal(replay.rescueProgress,0);assert.deepEqual(replay.princessPositions.map(({x,z})=>[x,z]),[[-4,-389],[4,-389]]);
assets.dispose();console.log('PASS: broad snowy forests, frozen rainbow lake, clear corridor, locked Elsa/Anna before third hit, rescue/gates/waves, pause, long-running snowfall, courtyard welcome and replay');
