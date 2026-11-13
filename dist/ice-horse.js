import * as THREE from './vendor/three.module.js';

const maneColors=[0xf0fcff,0xb7e9ff,0x8fd9f1,0xd6e7ff,0xa6d9f9,0x75c6ea];
const rainbowColors=[0xf28b95,0xf3ac6d,0xf4d77d,0x8fc8ab,0x7ab6d2,0xb39cce];

// Replace only this model's material references. Other horses retain their paint.
export function crystallizeHorse(assets,root,horse){
  if(!horse.crystal)return root;
  const coat=new THREE.Color(horse.coat).getHex(),horn=new THREE.Color(horse.horn).getHex(),hooves=new THREE.Color(horse.hooves).getHex();
  const glass=(color,name,opacity=.73)=>assets.mat(color,{name,metalness:.28,roughness:.12,shininess:100,specular:0xe2faff,emissive:color,emissiveIntensity:.045,transparent:true,opacity,depthWrite:false});
  if(!assets.geometries.iceHorseMane)assets.geometries.iceHorseMane=new THREE.ConeGeometry(1,1,5);
  root.traverse(part=>{
    if(!part.isMesh||!part.material.color)return;
    const color=part.material.color.getHex(),maneIndex=rainbowColors.indexOf(color);
    if(color===coat)part.material=glass(horse.coat,'ice-unicorn-coat');
    else if(color===horn)part.material=glass(horse.horn,'ice-unicorn-horn',.90);
    else if(color===hooves)part.material=glass(horse.hooves,'ice-unicorn-hooves',.88);
    else if(maneIndex>=0){
      part.material=glass(maneColors[maneIndex],'ice-unicorn-mane-'+maneIndex,.86);
      if(part.geometry===assets.geometries.rock){part.geometry=assets.geometries.iceHorseMane;part.scale.y*=1.65;}
    }else if([0xf6ddca,0xeab1a6,0xe9b4a8].includes(color))part.material=glass(0xc6eefb,'ice-unicorn-face',.8);
    else if(color===0x9b7f7a)part.material=assets.mat(0x527b96,{name:'ice-unicorn-nostrils'});
    if(part.material.name.startsWith('ice-unicorn-')){part.castShadow=false;part.receiveShadow=false;}
  });
  const frost=assets.mat(0xeffdff,{name:'ice-unicorn-facet-inlay',metalness:.18,roughness:.19,transparent:true,opacity:.55,depthWrite:false,emissive:0xc4f6ff,emissiveIntensity:.08});
  const head=root.userData.head;
  for(const side of [-1,1]){
    const facet=assets.mesh(head,'rock',frost,side*.276,.065,.035,.014,.16,.105);facet.rotation.x=-.35;facet.name='ice-face-facet';facet.castShadow=facet.receiveShadow=false;
  }
  const rearFacet=assets.mesh(head,'rock',frost,0,.045,-.327,.095,.15,.012);rearFacet.rotation.z=.22;rearFacet.name='ice-head-facet';rearFacet.castShadow=rearFacet.receiveShadow=false;
  if(root.userData.kind==='unicorn')for(const side of [-1,1]){
    const facet=assets.mesh(root,'rock',frost,side*.407,1.03,-.08,.014,.25,.23);facet.rotation.x=-.3;facet.name='ice-body-facet';facet.castShadow=facet.receiveShadow=false;
  }
  root.userData.crystal=true;root.userData.coatOpacity=.73;
  return root;
}
