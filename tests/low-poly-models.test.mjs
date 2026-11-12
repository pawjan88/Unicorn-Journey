import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import { LowPolyAssets } from '../dist/low-poly-models.js';
import { HORSES } from '../dist/characters.js';
const assets=new LowPolyAssets();
function inspect(model){
  let vertices=0,sprites=0,mapped=0;
  model.traverse(part=>{if(part.isSprite)sprites++;if(part.isMesh){vertices+=part.geometry.attributes.position.count;if(part.material.map)mapped++;assert(part.material.flatShading,'facets remain visible');}});
  assert.equal(sprites,0,'characters are volumetric models, not sprites');assert.equal(mapped,0,'character appearance is lit geometry rather than a picture on a plane');assert(vertices>30);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());assert(size.x>.25&&size.y>.3&&size.z>.15,'model has volume in all three axes');
}
for(const horse of HORSES){
  const pony=assets.unicorn(horse),rider=assets.rider(horse);inspect(pony);inspect(rider);
  for(const model of [pony,rider]){
    const colors=new Set();model.traverse(part=>{if(part.isMesh)colors.add('#'+part.material.color.getHexString());});
    for(const color of [horse.coat,horse.hooves,horse.horn])assert(colors.has(color),'menu model and first-person model share the selected palette');
  }
  const before=rider.userData.hornTip.getWorldPosition(new THREE.Vector3());rider.userData.head.rotation.y=-2.35;
  const after=rider.userData.hornTip.getWorldPosition(new THREE.Vector3());assert(before.distanceTo(after)>.1,'spell origin is attached to the rotating 3D horn');
}
for(const weapon of ['sword','axe']){
  const troll=assets.troll(weapon);inspect(troll);assert(troll.getObjectByName('helmet'));assert(troll.getObjectByName('shield'));assert(troll.getObjectByName(weapon));
}
for(const kind of ['small','triceratops','diplodocus','tyrannosaurus'])inspect(assets.dinosaur(kind));
for(const model of [assets.dragon(),assets.witch(),assets.pterodactyl()])inspect(model);
const trees=[assets.tree(7),assets.tree(3,true),assets.fern(),assets.castle(),assets.volcano(),assets.cave()];trees.forEach(inspect);
const batch=assets.forestChunk(3,'dino');assert(batch.children.some(mesh=>mesh.isInstancedMesh),'repeated scenery is batched');assert(batch.children.length<30,'scenery remains within a bounded draw-call budget');
assets.dispose();console.log('PASS: volumetric low-poly characters and scenery, visible facets, matching horse palettes, rotating horn origin, armor and weapons, batched environments');
