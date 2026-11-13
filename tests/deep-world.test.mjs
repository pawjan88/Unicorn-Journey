import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {LowPolyAssets} from '../dist/low-poly-models.js';
const assets=new LowPolyAssets();
for(const episode of ['forest','dino']){
  const deep=assets.deepForest(episode,[30,74.4]);const bounds=new THREE.Box3().setFromObject(deep);
  assert(deep.userData.treeCount>1200);assert(bounds.min.x< -95&&bounds.max.x>95&&bounds.min.z< -600,'trees fill the deep plan beyond the track-side strip');assert(deep.children.length<15,'dense background stays batched');
}
const ptero=assets.pterodactyl();assert(ptero.getObjectByName('long-beak'));assert(ptero.getObjectByName('bony-crest'));assert.equal(ptero.userData.wings.length,2);const psize=new THREE.Box3().setFromObject(ptero).getSize(new THREE.Vector3());assert(psize.x>3.5,'long membranous fingers form a broad pterosaur silhouette');
const stego=assets.stegosaurus();let plates=0,spikes=0;stego.traverse(part=>{if(part.name==='back-plate')plates++;if(part.name==='tail-spike')spikes++;});assert.equal(plates,9);assert.equal(spikes,4);assert.equal(stego.userData.legs.length,4);
const giant=assets.giganotosaurus();giant.scale.setScalar(3.15);const big=new THREE.Box3().setFromObject(giant).getSize(new THREE.Vector3());assert(big.y>9&&big.z>20);assert(giant.getObjectByName('hinged-jaw'));giant.userData.jaw.rotation.x=.7;assert(giant.userData.jaw.rotation.x>0);
const lava=assets.obstacle('lava',30);lava.userData.lava.geometry.computeBoundingBox();const width=lava.userData.lava.geometry.boundingBox.getSize(new THREE.Vector3()).x;assert.equal(width,180,'lava river continues through both sides of the forest');assert(lava.userData.lava.geometry.attributes.uv);assert.equal(lava.userData.streaks.length,16);
assets.dispose();console.log('PASS: wide deep forests, pterosaur anatomy, plated stegosaurus herds, giant scale and jaw, continuous textured lava rivers');
