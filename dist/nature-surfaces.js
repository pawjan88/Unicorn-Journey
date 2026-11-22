import * as THREE from './vendor/three.module.js';

const folder=new URL('./assets/nature/',import.meta.url);
export function surfaceTexture(file){
  let loaded;
  const ready=new Promise(resolve=>{loaded=resolve;});
  const tex=new THREE.TextureLoader().load(new URL(file,folder).href,loaded,undefined,()=>loaded(null));
  tex.userData.ready=ready;return tex;
}

export function landscapeSurface(material,asset,x,y,strength=.65){
  if(typeof document==='undefined')return material;
  function load(channel){
    const texture=surfaceTexture(asset+'-'+channel+'.jpg');
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(x,y);texture.anisotropy=4;
    if(channel==='color')texture.colorSpace=THREE.SRGBColorSpace;
    return texture;
  }
  material.map=load('color');material.normalMap=load('normal');
  material.normalScale.setScalar(strength);
  return material;
}

export function daylight(scene,outdoors){
  const sky=new THREE.TextureLoader().load(new URL('sky.jpg',folder).href);
  sky.mapping=THREE.EquirectangularReflectionMapping;sky.colorSpace=THREE.SRGBColorSpace;
  if(outdoors){scene.background=sky;scene.backgroundIntensity=.84;}
  return sky;
}
