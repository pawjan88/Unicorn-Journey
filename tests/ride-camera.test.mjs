import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {RULES,skyHeightAt} from '../dist/rules.js';
import {riderCameraPose,skySlopeAt,EYE_HEIGHT,FOLLOW_DISTANCE} from '../dist/ride-camera.js';
import {LowPolyAssets} from '../dist/low-poly-models.js';

const length=RULES.bonusEnd-RULES.bonusStart;
const oldDistance=RULES.bonusStart+length*.75;
assert(EYE_HEIGHT+skyHeightAt(oldDistance)-skyHeightAt(oldDistance-FOLLOW_DISTANCE)<0,'reproduce the old camera sinking below the descending road');
for(const distance of [0,RULES.bonusStart,RULES.bonusEnd,RULES.length]){
  const view=riderCameraPose(distance);assert.equal(view.y,EYE_HEIGHT);assert.equal(view.z,FOLLOW_DISTANCE-distance);assert.equal(view.pitch,-.055);
}
const assets=new LowPolyAssets(),camera=new THREE.PerspectiveCamera(),mount=assets.rider();
mount.position.set(0,-.8,-1.36);mount.rotation.y=Math.PI;mount.scale.setScalar(.9);camera.add(mount);
let minEye=Infinity,minModel=Infinity;
for(let i=0;i<=320;i++){
  const distance=RULES.bonusStart+length*i/320,pose=riderCameraPose(distance);
  camera.position.set(0,pose.y,pose.z);camera.rotation.x=pose.pitch;camera.updateMatrixWorld(true);
  minEye=Math.min(minEye,pose.y-skyHeightAt(-pose.z)-.025);
  mount.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.visible)return;
    const vertices=mesh.geometry.attributes.position;
    for(let n=0;n<vertices.count;n++){
      const world=new THREE.Vector3().fromBufferAttribute(vertices,n).applyMatrix4(mesh.matrixWorld);
      minModel=Math.min(minModel,world.y-skyHeightAt(-world.z)-.025);
    }
  });
  if(i<160)assert(skySlopeAt(distance)>=-1e-10);else assert(skySlopeAt(distance)<=1e-10);
}
assert(minEye>1.4,'the actual eye position stays above the entire road');
assert(minModel>.25,'every visible rider-model vertex stays above the road, including descent');
assert(riderCameraPose(RULES.bonusStart+length*.75).pitch<-.8,'camera looks down the descent');
for(const end of [RULES.bonusStart,RULES.bonusEnd]){
  const before=riderCameraPose(end-.0001),after=riderCameraPose(end+.0001);
  assert(Math.abs(before.y-after.y)<.001);assert(Math.abs(before.z-after.z)<.001);assert(Math.abs(before.pitch-after.pitch)<.001,'entry and landing have no camera snap');
}
assets.dispose();console.log('PASS: reproduced old descent clipping; camera and complete rider stay above the rainbow; downhill view and continuous entry/landing');
