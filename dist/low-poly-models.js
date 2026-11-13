import * as THREE from './vendor/three.module.js';
import { HORSES } from './characters.js?v=17';
import {crystallizeHorse} from './ice-horse.js?v=17';
import {riverMeander,riverHeightAt,terrainHeightAt} from './environment-profile.js?v=14';

export const RAINBOW=[0xf28b95,0xf3ac6d,0xf4d77d,0x8fc8ab,0x7ab6d2,0xb39cce];
const up=new THREE.Vector3(0,1,0);
export function seeded(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}

// Every character is made of lit, volumetric geometry. No camera-facing artwork.
// The library owns shared geometry/materials, so scene swaps can release them once.
export class LowPolyAssets{
  constructor(){
    this.materials=new Map();
    this.geometries={
      round:new THREE.IcosahedronGeometry(1,1),rock:new THREE.IcosahedronGeometry(1,0),
      box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,7),
      taper:new THREE.CylinderGeometry(.65,1,1,7),cone:new THREE.ConeGeometry(1,1,7),
      eye:new THREE.SphereGeometry(1,8,6),shadow:new THREE.CircleGeometry(1,16),
    };
    const wing=new THREE.BufferGeometry();
    wing.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, 1.3,.15,.25, 1.05,-.05,-.4, 0,0,0, 1.05,-.05,-.4, .25,-.12,-.55],3));
    wing.computeVertexNormals();this.geometries.wing=wing;
    const leaf=new THREE.BufferGeometry();
    leaf.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, -.42,-.10,.7, 0,.10,1.3, 0,0,0, 0,.10,1.3, .42,-.1,.7, -.42,-.1,.7, 0,-.28,2.2, 0,.10,1.3, .42,-.1,.7, 0,.10,1.3, 0,-.28,2.2],3));
    leaf.computeVertexNormals();this.geometries.leaf=leaf;
    leaf.setAttribute('uv',new THREE.Float32BufferAttribute(Array.from(leaf.attributes.position.array).flatMap((value,index,array)=>index%3===0?[value/.84+.5,array[index+2]/2.2]:[]),2));
  }
  mat(color,options={}){
    const key=JSON.stringify([color,options]);
    if(!this.materials.has(key)){
      const {metalness=0,roughness=.82,...paint}=options;
      const Material=metalness>.1?THREE.MeshPhongMaterial:THREE.MeshLambertMaterial;
      this.materials.set(key,new Material({color,flatShading:true,...(metalness>.1?{shininess:(1-roughness)*80+15,specular:0x8d9695}:{}),...paint}));
    }
    return this.materials.get(key);
  }
  mesh(parent,kind,color,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,options={}){
    const mesh=new THREE.Mesh(this.geometries[kind]||kind,color?.isMaterial?color:this.mat(color,options));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  segment(parent,a,b,r,color,kind='cylinder'){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),vector=end.clone().sub(start);
    const mesh=this.mesh(parent,kind,color,0,0,0,r,vector.length(),r);
    mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(up,vector.normalize());return mesh;
  }
  shadow(parent,radius=1){
    const mesh=this.mesh(parent,'shadow',this.mat(0x244939,{transparent:true,opacity:.16,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),0,.018,0,radius, radius*.7,1);
    mesh.rotation.x=-Math.PI/2;mesh.castShadow=false;mesh.receiveShadow=false;return mesh;
  }
  eyes(parent,x,y,z,size=.065){
    for(const side of [-1,1]){
      this.mesh(parent,'eye',0x253834,side*x,y,z,size,size*1.22,size*.5);
      this.mesh(parent,'eye',0xfff9ed,side*x-size*.22,y+size*.34,z+size*.45,size*.23);
    }
  }
  horn(parent,color,height=.6,x=0,y=.6,z=.1){
    const cone=this.mesh(parent,'cone',this.mat(color,{metalness:.3,roughness:.35,emissive:color,emissiveIntensity:.12}),x,y,z,.075,height,.075);
    cone.rotation.x=.14;
    const tip=new THREE.Object3D();tip.position.y=.5;cone.add(tip);return tip;
  }
  unicornHead(horse){
    const head=new THREE.Group();head.name='unicorn-head';
    this.mesh(head,'round',horse.coat,0,.05,0,.29,.36,.34);
    this.mesh(head,'round',horse.coat,0,-.075,.32,.245,.205,.32);
    this.mesh(head,'round',0xf6ddca,0,-.13,.50,.22,.12,.12);
    for(const side of [-1,1]){
      const ear=this.mesh(head,'cone',horse.coat,side*.21,.43,-.11,.13,.43,.115);ear.rotation.z=-side*.26;
      const inner=this.mesh(head,'cone',0xeab1a6,side*.215,.43,-.065,.067,.27,.05);inner.rotation.z=-side*.26;
      this.mesh(head,'eye',0xfffbf2,side*.264,.12,.14,.045,.078,.082);
      this.mesh(head,'eye',0x273d48,side*.294,.13,.165,.027,.052,.052);
      this.mesh(head,'eye',0xffffff,side*.313,.155,.184,.013,.018,.016);
      this.mesh(head,'round',0xe9b4a8,side*.25,-.025,.26,.018,.044,.059);
      this.mesh(head,'rock',0x9b7f7a,side*.125,-.115,.592,.035,.022,.014);
    }
    const mane=[];
    for(let i=0;i<6;i++){
      const tuft=this.mesh(head,'rock',RAINBOW[i],0,.32-i*.07,-.23-i*.035,.18,.15,.17);tuft.rotation.x=i*.1;mane.push(tuft);
    }
    head.userData.hornTip=this.horn(head,horse.horn,.62,0,.59,.08);
    head.userData.coat=horse.coat;head.userData.hornColor=horse.horn;
    return head;
  }
  leg(parent,x,y,z,color,hoofColor,length=.65){
    const pivot=new THREE.Group();pivot.position.set(x,y,z);parent.add(pivot);
    this.mesh(pivot,'taper',color,0,-length*.43,0,.105,length*.83,.105);
    this.mesh(pivot,'box',hoofColor,0,-length+.07,.025,.23,.18,.26);
    return pivot;
  }
  unicorn(horse=HORSES[0]){
    const pony=new THREE.Group();pony.name='unicorn-'+horse.id;
    this.mesh(pony,'round',horse.coat,0,1.02,0,.43,.49,.76);
    this.segment(pony,[0,1.01,.38],[0,1.64,.52],.28,horse.coat,'taper');
    const head=this.unicornHead(horse);head.position.set(0,1.72,.53);pony.add(head);
    const legs=[];for(const x of [-.28,.28])for(const z of [-.45,.45])legs.push(this.leg(pony,x,.88,z,horse.coat,horse.hooves));
    for(let i=0;i<6;i++)this.mesh(pony,'rock',RAINBOW[i],.005,1.5-i*.11,.31-i*.045,.20,.15,.17);
    const tail=new THREE.Group();tail.position.set(0,1.13,-.65);pony.add(tail);
    for(let i=0;i<5;i++)this.segment(tail,[(i-2)*.045,0,0],[(i-2)*.06,-.4,-.35],.065,RAINBOW[i],'taper');
    this.shadow(pony,.75);
    pony.userData={kind:'unicorn',legs,head,tail,horseId:horse.id,hornTip:head.userData.hornTip};return crystallizeHorse(this,pony,horse);
  }
  rider(horse=HORSES[0]){
    const rider=new THREE.Group();rider.name='rider-unicorn-'+horse.id;
    this.mesh(rider,'round',horse.coat,0,-.27,-.11,.34,.63,.34);
    for(let i=0;i<6;i++)this.mesh(rider,'rock',RAINBOW[i],0,.18-i*.16,-.34,.15,.18,.14);
    const head=this.unicornHead(horse);head.position.y=.18;head.scale.setScalar(.8);rider.add(head);
    const hooves=[-1,1].map(side=>{const hoof=this.mesh(rider,'box',horse.hooves,side*.40,-.48,.38,.19,.18,.27);hoof.visible=false;return hoof;});
    rider.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;}});
    rider.userData={kind:'rider',head,hooves,hornTip:head.userData.hornTip,horseId:horse.id};return crystallizeHorse(this,rider,horse);
  }
  troll(weapon='sword',boss=false){
    const root=new THREE.Group();root.name=boss?'armored-troll-boss':'armored-troll';
    const skin=boss?0x799c87:0x8daf91,armor=this.mat(boss?0x617c90:0x7e9aa7,{metalness:.4,roughness:.55});
    this.mesh(root,'round',skin,0,.92,0,.44,.58,.30);
    this.mesh(root,'rock',armor,0,1.01,.03,.44,.42,.32);
    this.mesh(root,'round',skin,0,1.57,.03,.37,.36,.32);
    this.mesh(root,'round',skin,0,1.48,.34,.13,.11,.15);
    for(const side of [-1,1]){
      const ear=this.mesh(root,'cone',skin,side*.40,1.61,0,.13,.32,.11);ear.rotation.z=-side*1.1;
      this.segment(root,[side*.41,1.19,0],[side*.53,.76,.1],.16,skin);
      this.mesh(root,'rock',armor,side*.41,1.22,0,.23,.2,.25);
      this.leg(root,side*.22,.55,0,skin,0x425d61,.45);
    }
    this.eyes(root,.14,1.65,.327,.055);
    this.mesh(root,'box',0x52605e,0,1.41,.32,.18,.025,.035);
    this.mesh(root,'rock',armor,0,1.81,-.03,.41,.22,.36).name='helmet';
    this.mesh(root,'box',armor,0,1.68,.38,.06,.28,.06);
    this.mesh(root,'box',0xf0cf8c,0,1.93,.04,.08,.20,.09);
    const shield=this.mesh(root,'cylinder',armor,-.59,.84,.25,.32,.09,.38);shield.rotation.x=Math.PI/2;
    shield.name='shield';
    this.mesh(root,'rock',0xe9c47b,-.59,.84,.32,.10);
    const arm=new THREE.Group();arm.position.set(.57,.86,.03);arm.name=weapon;root.add(arm);
    this.segment(arm,[0,-.18,0],[0,.65,0],.05,0x8b674d);
    if(weapon==='axe'){
      const blade=this.mesh(arm,'box',armor,.12,.55,0,.44,.27,.08);blade.rotation.z=.12;
      this.mesh(arm,'rock',0xb8c8ce,-.14,.55,0,.20,.16,.05);
    }else{
      this.mesh(arm,'box',0xd5e1df,0,.47,0,.11,.76,.06);
      this.mesh(arm,'cone',0xd5e1df,0,.90,0,.075,.20,.04);
      this.mesh(arm,'box',0xe4c57d,0,.09,0,.37,.07,.08);
    }
    root.userData={kind:'troll',arm,baseScale:boss?2:1,weapon,armored:true};
    if(boss)root.scale.setScalar(2);this.shadow(root,.65);return root;
  }
  dragon(){
    const root=new THREE.Group();root.name='dragon';const color=0xb2a0ce;
    this.mesh(root,'round',color,0,.77,0,.40,.48,.52);
    this.mesh(root,'round',0xe7c9c1,0,.79,.35,.26,.33,.09);
    this.mesh(root,'round',color,0,1.35,.21,.34,.31,.34);
    this.mesh(root,'round',color,0,1.23,.50,.28,.17,.22);
    this.eyes(root,.16,1.43,.49,.056);
    for(const side of [-1,1]){
      const horn=this.mesh(root,'cone',0xf0d29b,side*.24,1.69,.1,.07,.27,.07);horn.rotation.z=-side*.35;
      this.leg(root,side*.26,.46,.08,color,0x7e6b98,.35);
      this.segment(root,[side*.33,.98,.18],[side*.48,.72,.4],.10,color);
    }
    this.segment(root,[0,.65,-.38],[0,.40,-1.02],.14,color,'taper');
    this.mesh(root,'cone',0xe7bf9d,0,.42,-1.03,.15,.20,.12).rotation.x=-Math.PI/2;
    const wings=[];for(const side of [-1,1]){
      const wing=new THREE.Group();wing.position.set(side*.28,1.15,-.10);root.add(wing);
      const membrane=this.mesh(wing,'wing',this.mat(0xd9b2ce,{side:THREE.DoubleSide}),0,0,0,side*.68,.65,.75);membrane.rotation.x=-.4;
      wings.push(wing);
    }
    this.shadow(root,.6);root.userData={kind:'dragon',wings};return root;
  }
  dinosaur(species='small'){
    if(species==='stegosaurus')return this.stegosaurus();
    const root=new THREE.Group();root.name=species;
    const color=species==='triceratops'?0x9eb9a1:species==='diplodocus'?0xd5ae80:species==='tyrannosaurus'?0x7fa58c:0xb2c792;
    const legs=[];
    if(species==='triceratops'){
      this.mesh(root,'round',color,0,.84,0,.62,.55,.87);
      const frill=this.mesh(root,'cylinder',0x749a81,0,1.13,.53,.70,.10,.66);frill.rotation.x=Math.PI/2;
      this.mesh(root,'round',color,0,.92,.89,.43,.33,.45);
      for(const side of [-1,1]){
        const horn=this.mesh(root,'cone',0xffeed3,side*.25,1.18,1.11,.075,.57,.075);horn.rotation.x=1.05;
        this.mesh(root,'eye',0x293f36,side*.37,1.02,.99,.048,.06,.05);
      }
      const horn=this.mesh(root,'cone',0xffeed3,0,1.05,1.32,.065,.26,.065);horn.rotation.x=.5;
      for(const x of [-.4,.4])for(const z of [-.48,.4])legs.push(this.leg(root,x,.57,z,color,0x6c8174,.47));
      this.segment(root,[0,.81,-.67],[0,.57,-1.25],.16,color,'taper');
    }else if(species==='diplodocus'){
      this.mesh(root,'round',color,0,.75,0,.55,.52,.85);
      this.segment(root,[0,1,.4],[0,2,.53],.22,color,'taper');
      this.mesh(root,'round',color,0,2.16,.67,.23,.21,.37);this.eyes(root,.135,2.24,.93,.042);
      for(const x of [-.35,.35])for(const z of [-.45,.45])legs.push(this.leg(root,x,.55,z,color,0x97795c,.46));
      this.segment(root,[0,.8,-.6],[0,.5,-1.8],.19,color,'taper');
      this.segment(root,[0,.5,-1.7],[0,.7,-2.1],.065,color,'taper');
      for(let i=0;i<4;i++)this.mesh(root,'rock',0xb38a66,0,.97+i*.26,.48,.23-i*.025,.15,.08);
    }else{
      const big=species==='tyrannosaurus';
      this.mesh(root,'round',color,0,big?1.30:.70,0,big?.61:.32,big?.73:.39,big?.70:.46);
      const head=new THREE.Group();head.position.set(0,big?2.16:1.20,big?.40:.25);root.add(head);
      this.mesh(head,'round',color,0,0,.15,big?.52:.30,big?.39:.22,big?.60:.38);
      this.mesh(head,'box',0x476f5a,0,-.17,big?.44:.29,big?.71:.39,.055,big?.58:.33);
      this.mesh(head,'round',color,0,-.25,.24,big?.47:.27,.15,big?.45:.3);
      this.eyes(head,big?.31:.18,.10,big?.60:.52,big?.075:.045);
      if(big)for(const side of [-1,1])for(let i=0;i<3;i++){
        const tooth=this.mesh(head,'cone',0xfff4d9,side*.22,-.20,.56-i*.16,.045,.12,.035);tooth.rotation.z=Math.PI;
      }
      for(const side of [-1,1]){
        legs.push(this.leg(root,side*(big?.40:.23),big?.94:.51,-.08,color,0x4d7563,big?.86:.43));
        this.segment(root,[side*(big?.48:.27),big?1.63:.91,.36],[side*(big?.54:.31),big?1.39:.73,.53],big?.08:.045,color);
      }
      this.segment(root,[0,big?1.15:.72,-.50],[0,big?.80:.50,big?-1.8:-1.1],big?.28:.13,color,'taper');
      for(let i=0;i<4;i++)this.mesh(root,'cone',0x719479,0,(big?1.8:1.01)-i*.13,-.22-i*.22,big?.13:.07,big?.20:.12,big?.12:.06);
      root.userData.head=head;
    }
    this.shadow(root,species==='tyrannosaurus'?.9:.7);
    root.userData={...root.userData,kind:species,legs};
    if(species==='tyrannosaurus')root.scale.setScalar(1.55);
    return root;
  }
  witch(){
    const root=new THREE.Group();root.name='witch';
    this.mesh(root,'cone',0x8e7bab,0,.50,0,.35,.83,.35);
    this.mesh(root,'round',0xe7c9ab,0,1.05,.05,.20,.23,.19);
    this.mesh(root,'cone',0x584f79,0,1.46,0,.30,.59,.29);
    this.mesh(root,'cylinder',0x584f79,0,1.18,0,.40,.055,.40);
    this.mesh(root,'round',0xe7c9ab,0,1.03,.26,.065,.05,.10);this.eyes(root,.08,1.11,.22,.035);
    this.segment(root,[-.2,.65,.1],[-.13,.35,.43],.07,0xe7c9ab);
    this.segment(root,[.2,.65,.1],[.13,.35,.43],.07,0xe7c9ab);
    this.segment(root,[0,.24,-.9],[0,.24,1.0],.035,0x936f4a);
    const broom=this.mesh(root,'cone',0xdbbd78,0,.24,-.82,.22,.63,.22);broom.rotation.x=-Math.PI/2;
    root.userData={kind:'witch'};return root;
  }
  pterodactyl(){
    const root=new THREE.Group();root.name='pterodactyl';
    this.mesh(root,'round',0xb28c78,0,0,-.05,.17,.20,.48);
    this.segment(root,[0,.06,.19],[0,.40,.48],.10,0xc2997e,'taper');
    this.mesh(root,'round',0xc2997e,0,.43,.58,.16,.16,.28);
    const beak=this.mesh(root,'cone',0xe6c08d,0,.42,1.06,.12,.92,.095);beak.rotation.x=Math.PI/2;beak.name='long-beak';
    this.segment(root,[0,.34,.64],[0,.32,1.42],.042,0xaa7a5e,'taper');
    const crest=this.mesh(root,'cone',0xa2786d,0,.66,.37,.16,.72,.05);crest.rotation.x=-.78;crest.name='bony-crest';
    this.eyes(root,.115,.49,.76,.034);
    for(const side of [-1,1]){
      this.segment(root,[side*.11,-.06,-.23],[side*.18,-.32,-.43],.032,0x9a7862);
      for(let i=0;i<3;i++)this.segment(root,[side*.18,-.32,-.43],[side*(.13+i*.05),-.38,-.25],.018,0xf4ddbb);
    }
    const tail=this.mesh(root,'cone',0xb28c78,0,-.03,-.68,.045,.50,.04);tail.rotation.x=-Math.PI/2;
    if(!this.geometries.pterosaurWing){
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.60,.26);shape.lineTo(2.3,-.02);shape.lineTo(1.70,-.44);shape.lineTo(1.03,-.69);shape.lineTo(.55,-.48);shape.lineTo(0,-.24);shape.closePath();
      const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(Math.PI/2);this.geometries.pterosaurWing=geometry;
    }
    const wings=[];for(const side of [-1,1]){
      const pivot=new THREE.Group();pivot.position.x=side*.10;root.add(pivot);
      this.mesh(pivot,'pterosaurWing',this.mat(0xcda88d,{side:THREE.DoubleSide}),0,0,0,side,1,1).name='wing-membrane';
      this.segment(pivot,[0,0,0],[side*.60,.04,.26],.032,0x8d6b5a);
      this.segment(pivot,[side*.60,.04,.26],[side*2.3,0,-.02],.022,0x8d6b5a);
      this.segment(pivot,[side*.60,.04,.26],[side*1.03,-.02,-.69],.014,0x9e7c66);
      wings.push(pivot);
    }
    root.scale.setScalar(.78);root.userData={kind:'pterodactyl',wings};return root;
  }
  stegosaurus(){
    const root=new THREE.Group();root.name='stegosaurus';const color=0xa3b987,legs=[];
    this.mesh(root,'round',color,0,.65,0,.46,.44,.80);
    this.segment(root,[0,.65,.58],[0,.49,.97],.13,color,'taper');
    this.mesh(root,'round',color,0,.47,1.10,.16,.16,.28);this.eyes(root,.105,.52,1.31,.033);
    for(const x of [-.28,.28])for(const z of [-.43,.40])legs.push(this.leg(root,x,.43,z,color,0x81936c,.35));
    if(!this.geometries.stegoPlate){const shape=new THREE.Shape();shape.moveTo(-.12,0);shape.lineTo(-.22,.24);shape.lineTo(0,.52);shape.lineTo(.22,.24);shape.lineTo(.12,0);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:false});geo.translate(0,0,-.0325);this.geometries.stegoPlate=geo;}
    for(let i=0;i<9;i++){const t=i/8,z=-.65+t*1.27,size=.55+Math.sin(t*Math.PI)*.65;const plate=this.mesh(root,'stegoPlate',i%2?0xcba680:0xb99076,(i%2?-.10:.10),.85+Math.sin(t*Math.PI)*.19,z,size,size,size);plate.rotation.y=Math.PI/2;plate.name='back-plate';}
    this.segment(root,[0,.60,-.65],[0,.42,-1.25],.13,color,'taper');this.segment(root,[0,.42,-1.2],[0,.36,-1.9],.06,color,'taper');
    for(const side of [-1,1])for(const z of [-1.4,-1.7]){const spike=this.mesh(root,'cone',0xf1dfb5,side*.12,.43,z,.04,.35,.04);spike.rotation.z=-side*1.1;spike.name='tail-spike';}
    this.shadow(root,.65);root.userData={kind:'stegosaurus',legs};return root;
  }
  giganotosaurus(){
    const root=new THREE.Group();root.name='giganotosaurus';const color=0x6e8e78;
    this.mesh(root,'round',color,0,1.55,-.12,.70,.84,1.18);
    this.segment(root,[0,1.75,.65],[0,2.32,1.06],.34,color,'taper');
    const head=new THREE.Group();head.position.set(0,2.55,1.13);root.add(head);
    this.mesh(head,'round',color,0,.10,.42,.40,.34,.83);
    this.mesh(head,'round',0x7e9a82,0,.03,1.0,.32,.22,.44);
    this.mesh(head,'box',0x61483e,0,-.12,.60,.59,.06,1.34);
    for(const side of [-1,1]){
      this.mesh(head,'eye',0xe9d5a1,side*.35,.24,.41,.045,.08,.095);
      this.mesh(head,'eye',0x263b31,side*.387,.25,.44,.022,.05,.05);
      this.mesh(head,'rock',0x5c7a65,side*.30,.38,.42,.19,.085,.24);
      this.mesh(head,'rock',0x455d4e,side*.18,.10,1.38,.05,.035,.025);
      for(let i=0;i<7;i++){const tooth=this.mesh(head,'cone',0xf4e8cd,side*.26,-.19,.2+i*.16,.045,.15,.035);tooth.rotation.z=Math.PI;}
    }
    const jaw=new THREE.Group();jaw.position.set(0,-.13,-.03);head.add(jaw);jaw.name='hinged-jaw';
    this.mesh(jaw,'round',color,0,-.14,.65,.34,.13,.82);
    this.mesh(jaw,'round',0x9c6e66,0,-.025,.65,.26,.035,.65);
    for(const side of [-1,1])for(let i=0;i<6;i++)this.mesh(jaw,'cone',0xf4e8cd,side*.24,.015,.25+i*.17,.032,.12,.028);
    const legs=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.47,1.18,-.12);root.add(leg);
      this.mesh(leg,'round',color,0,-.22,0,.31,.48,.37);this.segment(leg,[0,-.45,.04],[0,-1.01,.29],.15,color,'taper');this.mesh(leg,'round',0x597461,0,-1.07,.45,.28,.13,.49);legs.push(leg);
      this.segment(root,[side*.53,1.9,.68],[side*.66,1.49,1.00],.095,color);
    }
    this.segment(root,[0,1.55,-.85],[0,1.1,-2.2],.42,color,'taper');this.segment(root,[0,1.1,-2.1],[0,.81,-3.6],.22,color,'taper');this.segment(root,[0,.81,-3.5],[0,.65,-4.5],.075,color,'taper');
    for(let i=0;i<7;i++)this.mesh(root,'rock',0x587761,0,2.18-i*.15,-.25-i*.25,.12,.12,.17);
    this.shadow(root,2.1);root.userData={kind:'giganotosaurus',head,jaw,legs};return root;
  }
  creature(type,weapon,episode){
    if(episode==='dino')return this.dinosaur(type==='boss'?'tyrannosaurus':type==='dragon'?'diplodocus':'triceratops');
    return type==='dragon'?this.dragon():this.troll(weapon,type==='boss');
  }
  tree(seed=0,jungle=false){
    const root=new THREE.Group(),random=seeded(seed),height=5.2+random()*3;
    if(jungle){
      this.segment(root,[0,0,0],[.25,height*.55,0],.25,0xa08061,'taper');
      this.segment(root,[.25,height*.55,0],[0,height,0],.19,0xa08061,'taper');
      for(let i=0;i<7;i++){
        const frond=new THREE.Group();frond.position.y=height;frond.rotation.y=i*Math.PI*2/7;root.add(frond);
        const leaf=this.mesh(frond,'leaf',this.mat(i%2?0x629d7c:0x468469,{side:THREE.DoubleSide,name:'foliage'}),0,0,0,1.3,1,1.3);leaf.rotation.x=-.12;
      }
      for(let i=0;i<3;i++)this.mesh(root,'rock',0xbfa17b,Math.sin(i*2.1)*.25,height-.25,Math.cos(i*2.1)*.25,.19);
    }else{
      this.mesh(root,'taper',0x9c8267,0,height*.30,0,.24,height*.60,.24);
      const shades=seed%3===0?[0xd9ba78,0xe2ca91]:[0x82b196,0x5d947d];
      if(seed%4===0){
        for(let i=0;i<3;i++)this.mesh(root,'cone',this.mat(shades[i%2],{name:'foliage'}),0,height*.57+i*height*.16,0,2-i*.43,height*.48,2-i*.43);
      }else{
        this.mesh(root,'round',this.mat(shades[0],{name:'foliage'}),0,height*.75,0,2.0,height*.35,1.8);
        this.mesh(root,'round',this.mat(shades[1],{name:'foliage'}),-1.0,height*.68,.20,1.35,height*.23,1.4);
        this.mesh(root,'round',this.mat(shades[0],{name:'foliage'}),.9,height*.88,-.15,1.4,height*.25,1.3);
      }
    }
    return root;
  }
  fern(){
    const group=new THREE.Group();
    for(let i=0;i<7;i++){
      const frond=new THREE.Group();frond.rotation.y=i*Math.PI*2/7;frond.rotation.x=-.5;group.add(frond);
      this.mesh(frond,'leaf',this.mat(i%2?0x6fa980:0x458b71,{side:THREE.DoubleSide}),0,.15,0,.55,.6,.65);
    }
    return group;
  }
  batch(root){
    root.updateMatrixWorld(true);const groups=new Map(),result=new THREE.Group();
    root.traverse(mesh=>{if(!mesh.isMesh)return;const key=mesh.geometry.uuid+mesh.material.uuid;
      if(!groups.has(key))groups.set(key,{geometry:mesh.geometry,material:mesh.material,matrices:[]});
      if(mesh.isInstancedMesh){
        const local=new THREE.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,local);groups.get(key).matrices.push(mesh.matrixWorld.clone().multiply(local));}
      }else groups.get(key).matrices.push(mesh.matrixWorld.clone());
    });
    for(const {geometry,material,matrices}of groups.values()){
      const instance=new THREE.InstancedMesh(geometry,material,matrices.length);
      matrices.forEach((matrix,i)=>instance.setMatrixAt(i,matrix));instance.castShadow=!material.transparent;instance.receiveShadow=true;instance.computeBoundingSphere();result.add(instance);
    }
    return result;
  }
  forestChunk(index,episode='forest'){
    const root=new THREE.Group(),random=seeded(index*291+87),jungle=episode==='dino';
    for(const side of [-1,1]){
      for(let i=0;i<9;i++){
        const tree=this.tree(index*13+i,jungle);tree.position.set(side*(4.0+random()*13),0,-random()*16);tree.rotation.y=random()*6.28;root.add(tree);
      }
      for(let i=0;i<30;i++){
        const x=side*(2.65+random()*9),z=-random()*16;
        if(jungle&&i%3===0){const fern=this.fern();fern.position.set(x,0,z);fern.scale.setScalar(.6+random()*.6);root.add(fern);}
        else if(i%3===0)this.mesh(root,'rock',0x8d9d91,x,.10,z,.2+random()*.3,.15,.26);
        else{
          this.mesh(root,'taper',0x6b9c77,x,.13,z,.025,.25,.025);
          this.mesh(root,'rock',RAINBOW[i%6],x,.27,z,.10,.065,.10);
          this.mesh(root,'rock',0xf5df9b,x,.30,z,.035);
        }
      }
      if(jungle&&index%3===0){
        const silhouette=this.dinosaur('diplodocus');silhouette.position.set(side*12,0,-8);silhouette.rotation.y=side*.7;silhouette.scale.setScalar(1.7);
        silhouette.traverse(mesh=>{if(mesh.isMesh)mesh.material=this.mat(0x4c7d6a);});root.add(silhouette);
      }
    }
    return this.batch(root);
  }
  deepForest(episode='forest',lavaRows=[]){
    const root=new THREE.Group(),random=seeded(431),jungle=episode==='dino';let count=0;
    const colors=jungle?[0x4c795e,0x5a8769,0x6c9674]:[0x63866a,0x739577,0x8aa17a];
    for(let z=-15;z>-640;z-=14)for(const side of [-1,1]){
      const xs=Array.from({length:13},(_,i)=>19+i*6.7+random()*3);
      if(z< -135)xs.push(5.6+random(),10+random()*2,14+random()*2);
      if(z< -440)xs.push(1.8+random()*2);
      for(const baseX of xs){const x=side*baseX,worldZ=z+random()*7;
        if(lavaRows.some(row=>Math.abs(worldZ+row-riverMeander(x))<1.6))continue;
        const height=6+random()*4,ground=terrainHeightAt(x,worldZ);this.mesh(root,'taper',0x8b7e64,x,ground+height*.36,worldZ,.22,height*.72,.22);
        this.mesh(root,'rock',this.mat(colors[count%3],{name:'foliage'}),x,ground+height*.79,worldZ,2.1+random(),height*.30,2+random());
        if(count%2===0)this.mesh(root,'rock',this.mat(colors[(count+1)%3],{name:'foliage'}),x+1.2,ground+height*.65,worldZ+.6,1.6,height*.23,1.6);
        count++;
      }
    }
    const result=this.batch(root);result.children.forEach(mesh=>{mesh.castShadow=false;mesh.receiveShadow=false;});result.userData.treeCount=count;return result;
  }
  fence(){
    const root=new THREE.Group();
    for(const side of [-1,1]){
      this.mesh(root,'box',0x9b7657,side*2.08,.46,0,.18,.92,.18);
      this.mesh(root,'cone',0xc7a177,side*2.08,.97,0,.14,.16,.14);
    }
    for(const y of [.26,.64])this.mesh(root,'box',0xc7a177,0,y,0,4.34,.17,.13);
    this.mesh(root,'rock',0xe6a6b7,.68,.84,.0,.10);return root;
  }
  obstacle(kind,row=0){
    if(kind!=='lava'){
      const root=new THREE.Group();const trunk=this.mesh(root,'cylinder',0x947155,0,.30,0,.30,4.35,.30);trunk.rotation.z=Math.PI/2;
      for(const side of [-1,1]){const end=this.mesh(root,'cylinder',0xd7b487,side*2.19,.30,0,.26,.025,.26);end.rotation.z=Math.PI/2;
        const ring=this.mesh(root,'cylinder',0xb98c63,side*2.21,.30,0,.16,.03,.16);ring.rotation.z=Math.PI/2;}
      this.segment(root,[.45,.4,0],[.68,.75,.1],.075,0x947155);return root;
    }
    const root=new THREE.Group();root.name='lava-river';const steps=96;
    const ribbon=(bank=0)=>{
      const positions=[],uv=[],indices=[];
      for(let i=0;i<=steps;i++){const x=-90+180*i/steps,z=riverMeander(x),y=riverHeightAt(x,-row+z);
        for(const side of [-1,1]){const offset=bank?bank*(side<0?.56:.82):side*.525;positions.push(x,y+(bank?.08:0),z+offset);uv.push(x/4,(side+1)/2);}
        if(i<steps){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();this.geometries['river-'+row+'-'+bank]=geo;return geo;
    };
    const lava=new THREE.Mesh(ribbon(),this.mat(0xffffff,{name:'lava-flow',side:THREE.DoubleSide,emissive:0xef8d35,emissiveIntensity:.7}));lava.castShadow=false;lava.receiveShadow=false;root.add(lava);
    for(const side of [-1,1]){const bank=new THREE.Mesh(ribbon(side),this.mat(0x75836a,{side:THREE.DoubleSide}));bank.receiveShadow=true;root.add(bank);}
    const streaks=[];for(let i=0;i<16;i++){const streak=this.mesh(root,'rock',this.mat(0xffd18b,{emissive:0xf4b34c,emissiveIntensity:.7}),0,0,0,.34,.025,.09);streak.castShadow=false;streak.receiveShadow=false;streak.userData.seedX=-88+i*11.2;streaks.push(streak);}
    root.userData={lava,streaks,row};return root;
  }
  amber(){
    const root=new THREE.Group();this.mesh(root,'rock',this.mat(0xf3bc65,{metalness:.12,roughness:.35,emissive:0xe7a238,emissiveIntensity:.18}),0,0,0,.26,.36,.23);
    this.mesh(root,'rock',0xffefba,-.10,.14,.16,.045);return root;
  }
  rainbow(){
    const key='rainbow';
    if(!this.geometries[key]){
      const p=[],n=[],c=[];
      const append=(geometry,hex)=>{const geo=geometry.toNonIndexed(),color=new THREE.Color(hex);const pos=geo.attributes.position.array,norm=geo.attributes.normal.array;
        for(let i=0;i<pos.length;i+=3){p.push(pos[i],pos[i+1],pos[i+2]);n.push(norm[i],norm[i+1],norm[i+2]);c.push(color.r,color.g,color.b);}geometry.dispose();geo.dispose();};
      RAINBOW.forEach((hex,i)=>append(new THREE.TorusGeometry(.52-i*.061,.035,5,22,Math.PI),hex));
      for(const side of [-1,1])append(new THREE.IcosahedronGeometry(.15,1).scale(1,.6,.7).translate(side*.48,0,0),0xfffaed);
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(c,3));this.geometries[key]=geometry;
    }
    return new THREE.Mesh(this.geometries[key],this.mat(0xffffff,{vertexColors:true,roughness:.45,emissive:0x999999,emissiveIntensity:.12}));
  }
  castle(){
    const root=new THREE.Group();
    this.mesh(root,'box',0xf1dfba,0,3,0,11,6,6);
    this.mesh(root,'box',0x486b6c,0,1.7,3.03,2.1,3.4,.1);
    for(let i=-4;i<=4;i+=2)this.mesh(root,'box',0xf1dfba,i,6.3,2.8,1,1.1,.7);
    for(const [x,z,height]of [[-6,2,9],[6,2,9],[-3,-3,12],[3,-3,14]]){
      this.mesh(root,'cylinder',0xf1dfba,x,height/2,z,1.7,height,1.7);
      this.mesh(root,'cone',0x667c97,x,height+1.6,z,2.2,3.4,2.2);
      this.mesh(root,'box',0x486b6c,x,height*.7,z+1.62,.6,1.3,.12);
      this.segment(root,[x,height+3,z],[x,height+5,z],.05,0xd7b97d);
      this.mesh(root,'box',0xe8aa8d,x+.8,height+4.3,z,1.5,.7,.08);
    }
    return root;
  }
  cave(){
    const root=new THREE.Group();
    for(const side of [-1,1])for(let i=0;i<3;i++)this.mesh(root,'rock',0x798278,side*(2.95-i*.18),.8+i*1.2,-2,1.05,1.1,3.5);
    this.mesh(root,'rock',0x798278,0,4.1,-2,2.8,1.0,3.5);
    this.mesh(root,'box',0x243c3e,0,2,-7,5,4,.2);
    this.mesh(root,'box',0x85816b,0,-.05,-3.7,4.5,.1,8);
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const crystal=this.mesh(root,'cone',this.mat(0xecc27d,{emissive:0xd39b46,emissiveIntensity:.25}),side*(2.3+i*.15),.3+i*.15,-.2,.17,.6+i*.2,.17);crystal.rotation.z=-side*.2;
    }
    return root;
  }
  volcano(){
    const root=new THREE.Group();
    const geo=new THREE.CylinderGeometry(16,100,125,12,1,true).toNonIndexed();
    const colors=[],random=seeded(73),base=new THREE.Color();
    for(let i=0;i<geo.attributes.position.count;i+=3){base.setHex([0x8d8c7c,0x99937d,0x7f897b,0xa59b83][Math.floor(random()*4)]);for(let j=0;j<3;j++)colors.push(base.r,base.g,base.b);}
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));this.geometries.volcano=geo;
    this.mesh(root,geo,this.mat(0xffffff,{vertexColors:true,fog:false}),0,62.5,0);
    const crater=this.mesh(root,'cylinder',this.mat(0xedaa61,{emissive:0xd88d40,emissiveIntensity:.4,fog:false}),0,124,0,15.5,.3,15.5);
    crater.castShadow=false;
    for(let i=0;i<3;i++){
      const path=[];for(let j=0;j<7;j++){const t=j/6,h=124-t*87,r=16+t*58,angle=.25+i*.7+Math.sin(j*.7)*.035;path.push(new THREE.Vector3(Math.sin(angle)*r,h,Math.cos(angle)*r));}
      const lavaGeo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),15,1.0,4,false);this.geometries['lava-ribbon-'+i]=lavaGeo;
      this.mesh(root,lavaGeo,this.mat(0xe4a363,{emissive:0xcf893f,emissiveIntensity:.2,fog:false}));
    }
    const smoke=[];for(let i=0;i<6;i++){const puff=this.mesh(root,'round',this.mat(0xe1d9bf,{transparent:true,opacity:.4-i*.035,depthWrite:false,fog:false}),Math.sin(i)*5,132+i*11,Math.cos(i)*3,7+i*1.7,6+i*1.4,7+i*1.7);puff.castShadow=false;smoke.push(puff);}
    root.userData.smoke=smoke;return root;
  }
  dragonfly(){
    const root=new THREE.Group();this.mesh(root,'round',0x5a9eaf,0,0,0,.028,.03,.14);
    const wings=[];for(const side of [-1,1])for(const z of [-.055,.04]){
      const wing=this.mesh(root,'round',this.mat(0xc9e5df,{transparent:true,opacity:.6,depthWrite:false}),side*.1,.015,z,.12,.008,.035);wings.push(wing);
    }
    root.userData={kind:'dragonfly',wings};return root;
  }
  dispose(){Object.values(this.geometries).forEach(geometry=>geometry.dispose());this.materials.forEach(material=>material.dispose());}
}

// Menu cards are rendered from the same models as the game, then stored as PNGs.
export async function renderModelPreviews(){
  const assets=new LowPolyAssets(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setSize(480,280);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const result={};
  const render=(name,content,kind)=>{
    const scene=new THREE.Scene();scene.background=new THREE.Color(kind==='dino'?0xd4e5d5:0xedf1df);
    scene.add(new THREE.HemisphereLight(0xfff7e5,0x5b8275,2.2));const sun=new THREE.DirectionalLight(0xffefd7,3);sun.position.set(-4,9,6);scene.add(sun);
    const camera=new THREE.PerspectiveCamera(35,480/280,.1,200);
    if(kind==='horse'){camera.position.set(3.3,2.4,4.7);camera.lookAt(0,1.1,0);}else{camera.position.set(10,9,14);camera.lookAt(0,1.5,0);}
    scene.add(content);renderer.render(scene,camera);result[name]=renderer.domElement.toDataURL('image/png');
  };
  for(const horse of HORSES){
    const group=new THREE.Group();const pony=assets.unicorn(horse);group.add(pony);
    assets.mesh(group,'cylinder',0xc8d9be,0,-.09,0,1.3,.18,1.2);render('unicorn-portrait-'+horse.id,group,'horse');
  }
  for(const episode of ['forest','dino']){
    const group=new THREE.Group();assets.mesh(group,'cylinder',episode==='dino'?0x9bb9a0:0xb9cba8,0,-.4,0,6.5,.8,5.3);
    assets.mesh(group,'box',0xe4c695,0,.025,1.0,2.1,.06,8);
    for(const [x,z,seed]of [[-3,1,7],[3,-2,12],[-2.6,-3,4]]){const tree=assets.tree(seed,episode==='dino');tree.scale.setScalar(.65);tree.position.set(x,0,z);group.add(tree);}
    if(episode==='forest'){const arc=assets.rainbow();arc.position.set(.2,1,-2);arc.scale.setScalar(3.3);group.add(arc);}
    else{const dino=assets.dinosaur('triceratops');dino.position.set(2.7,.05,2.8);dino.rotation.y=-.3;group.add(dino);const volcano=assets.volcano();volcano.scale.setScalar(.045);volcano.position.set(0,0,-4);group.add(volcano);}
    render('episode-'+episode,group,episode);
  }
  renderer.dispose();assets.dispose();return result;
}
