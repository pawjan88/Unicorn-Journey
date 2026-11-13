import * as THREE from './vendor/three.module.js';

// All winter characters face local +Z and share the scene's owned low-poly assets.
function crystalKey(a){
  if(!a.geometries.winterCrystal){
    const points=[],ring=Array.from({length:6},(_,i)=>[Math.sin(i*Math.PI/3)*.22,0,Math.cos(i*Math.PI/3)*.22]);
    for(let i=0;i<6;i++){const next=(i+1)%6;points.push(...ring[i],0,-.23,0,...ring[next],...ring[i],...ring[next],0,.34,0);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.computeVertexNormals();a.geometries.winterCrystal=geometry;
  }
  return 'winterCrystal';
}
function ice(a,parent,color,x,y,z,sx=1,sy=sx,sz=sx,options={}){
  return a.mesh(parent,crystalKey(a),a.mat(color,{emissive:color,emissiveIntensity:.18,metalness:.2,roughness:.35,...options}),x,y,z,sx,sy,sz);
}
function eyes(a,parent,x,y,z,size=.06,white=0xfffcf0){
  for(const side of [-1,1]){
    a.mesh(parent,'eye',white,side*x,y,z,size,size*1.2,size*.48);
    a.mesh(parent,'eye',0x26354b,side*x+size*.09,y,z+size*.40,size*.43,size*.68,size*.16);
    a.mesh(parent,'eye',0xffffff,side*x-size*.12,y+size*.28,z+size*.51,size*.15,size*.18,size*.10);
  }
}
function smile(a,parent,y,z,width=.15,color=0x47677d){
  const center=a.mesh(parent,'box',color,0,y,z,width,.018,.018);center.name='friendly-smile';
  for(const side of [-1,1]){const corner=a.mesh(parent,'box',color,side*width*.51,y+.014,z,width*.26,.015,.018);corner.rotation.z=side*.45;}
}
function named(part,name){part.name=name;return part;}
function frozenMaterial(a,color,opacity=.58){return a.mat(color,{name:'winter-translucent-'+color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,metalness:.22,roughness:.32,emissive:color,emissiveIntensity:.08});}

export function snowflake(a){
  const root=new THREE.Group();root.name='golden-snowflake';const gold=a.mat(0xf4d56f,{name:'golden-snowflake',emissive:0xd8a73a,emissiveIntensity:.24,metalness:.25,roughness:.30});
  named(a.mesh(root,'rock',gold,0,0,0,.095,.095,.055),'snowflake-center');
  for(let i=0;i<6;i++){
    const arm=new THREE.Group();arm.rotation.z=i*Math.PI/3;root.add(arm);
    named(a.mesh(arm,'box',gold,0,.15,0,.032,.27,.045),'snowflake-arm');
    for(const side of [-1,1]){const branch=a.mesh(arm,'box',gold,side*.043,.175,0,.026,.115,.04);branch.rotation.z=-side*.72;}
    ice(a,arm,0xffe9a5,0,.286,0,.16,.17,.12);
  }
  root.userData={kind:'golden-snowflake'};return root;
}
export function snowImp(a){
  const root=new THREE.Group();root.name='snow-imp';const snow=0xe9f4f1,shade=0xbedce3,legs=[];
  a.mesh(root,'round',snow,0,.60,0,.39,.44,.30);a.mesh(root,'round',shade,0,.56,.23,.23,.27,.10);
  a.mesh(root,'round',snow,0,1.08,.045,.35,.32,.29);
  for(const side of [-1,1]){
    const ear=a.mesh(root,'cone',0xb9dfeb,side*.34,1.26,0,.13,.40,.11);ear.rotation.z=-side*.6;
    a.mesh(root,'rock',0xf3c7ce,side*.25,1.01,.25,.066,.045,.025);
    const leg=new THREE.Group();leg.position.set(side*.18,.32,0);root.add(leg);a.mesh(leg,'round',shade,0,-.15,.07,.16,.19,.22);legs.push(leg);
    a.segment(root,[side*.31,.74,.03],[side*.48,.45,.13],.10,snow);a.mesh(root,'round',snow,side*.48,.43,.14,.12);
  }
  eyes(a,root,.125,1.14,.30,.063);a.mesh(root,'round',0x9bb9cb,0,1.03,.345,.07,.043,.045);smile(a,root,.96,.304,.13);
  const scarf=a.mesh(root,'cylinder',0xa8a0d2,0,.83,.045,.27,.11,.25);scarf.name='snow-imp-scarf';a.mesh(root,'box',0xa8a0d2,-.16,.67,.30,.10,.28,.045);
  ice(a,root,0xa5ddeb,0,1.43,-.045,.36,.33,.25);a.shadow(root,.48);root.userData={kind:'snow-imp',legs};return root;
}
export function iceDragon(a){
  const root=new THREE.Group();root.name='ice-dragon';const blue=0x91c5de,legs=[];
  a.mesh(root,'round',blue,0,.63,-.08,.36,.43,.51);a.mesh(root,'round',0xd8edf1,0,.61,.29,.24,.30,.095);
  a.segment(root,[0,.84,.20],[0,1.15,.35],.17,blue,'taper');
  a.mesh(root,'round',blue,0,1.20,.43,.28,.28,.31);a.mesh(root,'round',0xb8dce8,0,1.10,.66,.23,.14,.25);
  eyes(a,root,.115,1.28,.664,.055);for(const side of [-1,1]){a.mesh(root,'rock',0x668fbb,side*.105,1.14,.875,.025,.016,.015);const horn=ice(a,root,0xe3f7f4,side*.16,1.49,.28,.22,.55,.22);horn.rotation.z=-side*.25;}
  smile(a,root,1.04,.842,.16);
  for(const side of [-1,1])for(const z of [-.25,.24]){const leg=new THREE.Group();leg.position.set(side*.25,.32,z);root.add(leg);a.mesh(leg,'round',blue,0,-.12,.055,.14,.19,.18);a.mesh(leg,'rock',0xd5edf0,0,-.27,.13,.15,.065,.18);legs.push(leg);}
  const tail=new THREE.Group();tail.position.set(0,.56,-.47);root.add(tail);a.segment(tail,[0,0,0],[.12,-.20,-.66],.12,blue,'taper');ice(a,tail,0xc5eff1,.12,-.16,-.69,.38,.45,.33);
  const wings=[];for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(side*.27,.92,-.16);root.add(wing);
    const material=frozenMaterial(a,0xbfeaf1,.72);const membrane=a.mesh(wing,'wing',material,0,0,0,side*.70,.70,.70);membrane.name='ice-dragon-wing';membrane.castShadow=false;membrane.receiveShadow=false;a.segment(wing,[0,0,0],[side*.91,.11,.18],.025,0xe1f5f2);wings.push(wing);
  }
  for(let i=0;i<4;i++)ice(a,root,0xcdeef1,0,.98-i*.05,-.02-i*.17,.22,.28,.18);
  a.shadow(root,.62);root.userData={kind:'ice-dragon',legs,tail,wings};return root;
}
export function frostKing(a){
  const root=new THREE.Group();root.name='frost-king';const snow=0xe5f0f2,shade=0xb7d0e2,legs=[];
  a.mesh(root,'round',shade,0,1.06,-.03,.58,.68,.39);a.mesh(root,'round',snow,0,1.17,.07,.49,.57,.34);
  const robe=a.mesh(root,'cone',0x7699c1,0,.79,-.06,.63,1.24,.43);robe.rotation.z=Math.PI;robe.name='frost-king-robe';
  a.mesh(root,'round',snow,0,1.93,.035,.40,.37,.34);a.mesh(root,'rock',0xf1f6f4,0,1.65,.22,.29,.30,.20);
  eyes(a,root,.145,2.02,.34,.071);a.mesh(root,'round',0x96c6df,0,1.89,.405,.085,.065,.065);smile(a,root,1.79,.353,.18);
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.28,.40,0);root.add(leg);a.mesh(leg,'round',shade,0,-.19,.10,.21,.20,.30);legs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.53,1.51,0);root.add(arm);a.mesh(arm,'round',snow,side*.06,-.11,.02,.22,.32,.22);a.mesh(arm,'round',shade,side*.12,-.46,.11,.21,.25,.22);if(side===1)root.userData.arm=arm;
    ice(a,root,0xc3e8f3,side*.52,1.72,-.04,.65,.55,.42);
  }
  const crown=a.mesh(root,'cylinder',a.mat(0xc9dce4,{metalness:.35,roughness:.36}),0,2.23,.02,.38,.16,.34);crown.name='frost-king-crown';
  const crystalSegments=[];for(let i=0;i<3;i++){
    const material=a.mat([0x88e8e5,0xd3ade8,0xf7d784][i],{name:'frost-crown-charge-'+i,emissive:[0x88e8e5,0xd3ade8,0xf7d784][i],emissiveIntensity:.08,metalness:.22,roughness:.28});
    const gem=a.mesh(root,crystalKey(a),material,(i-1)*.26,2.42+(i===1?.10:0),.08,.58,.78,.46);gem.name='crown-crystal-'+i;crystalSegments.push(gem);
  }
  root.scale.setScalar(1.8);a.shadow(root,.79);root.userData={...root.userData,kind:'frost-king',legs,baseScale:1.8,crystalSegments};return root;
}
export function reindeer(a){
  const root=new THREE.Group();root.name='reindeer';const fur=0xa78e77,cream=0xe5d8bf,legs=[];
  a.mesh(root,'round',fur,0,.89,-.08,.31,.38,.67);a.mesh(root,'round',cream,0,.98,.31,.27,.34,.24);a.segment(root,[0,1.01,.36],[0,1.53,.48],.18,fur,'taper');
  a.mesh(root,'round',fur,0,1.66,.62,.22,.27,.27);a.mesh(root,'round',cream,0,1.52,.84,.18,.13,.24);eyes(a,root,.103,1.74,.82,.043);a.mesh(root,'round',0x5d5f5d,0,1.55,1.062,.12,.075,.045);
  for(const side of [-1,1]){
    const ear=a.mesh(root,'cone',fur,side*.23,1.84,.55,.095,.32,.075);ear.rotation.z=-side*.8;
    a.segment(root,[side*.12,1.87,.43],[side*.29,2.33,.27],.037,cream);a.segment(root,[side*.29,2.33,.27],[side*.40,2.57,.37],.025,cream);a.segment(root,[side*.21,2.16,.34],[side*.42,2.32,.50],.026,cream);a.segment(root,[side*.31,2.35,.30],[side*.51,2.43,.20],.023,cream);
    for(const z of [-.48,.43]){const leg=a.leg(root,side*.23,.65,z,fur,0x5f6468,.61);legs.push(leg);}
  }
  a.mesh(root,'round',cream,0,1.05,-.68,.12,.17,.22);a.shadow(root,.55);root.userData={kind:'reindeer',legs};return root;
}
export function snowyOwl(a){
  const root=new THREE.Group();root.name='snowy-owl';const white=0xeaf2ec;
  a.mesh(root,'round',white,0,0,0,.24,.29,.34);a.mesh(root,'round',0xf7f8ee,0,.26,.17,.28,.24,.20);
  for(const side of [-1,1]){a.mesh(root,'round',0xc8d9de,side*.115,.27,.335,.11,.12,.025);a.mesh(root,'eye',0xf7df8b,side*.115,.28,.363,.055,.068,.021);a.mesh(root,'eye',0x233a4a,side*.115,.28,.384,.022,.048,.012);}
  const beak=a.mesh(root,'cone',0x9daaad,0,.17,.395,.052,.12,.05);beak.rotation.x=.55;
  const wings=[];for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(side*.17,.02,-.03);root.add(wing);
    a.mesh(wing,'round',white,side*.42,0,-.04,.49,.07,.30);a.mesh(wing,'round',0xdce7e4,side*.81,-.025,-.09,.42,.05,.22);
    for(let i=0;i<5;i++){const feather=a.mesh(wing,'rock',i%2?0xc4d6dc:0xebf0e8,side*(.37+i*.16),-.045,-.24+i*.012,.14,.045,.21-i*.018);feather.rotation.y=side*.10;}
    wings.push(wing);
  }
  for(const side of [-1,1])a.segment(root,[side*.085,-.23,-.06],[side*.09,-.36,.06],.026,0xbca987);
  const tail=a.mesh(root,'round',0xd0e0e0,0,-.02,-.39,.18,.06,.25);tail.rotation.x=.12;
  root.userData={kind:'snowy-owl',wings};return root;
}
export function mammoth(a){
  const root=new THREE.Group();root.name='winter-mammoth';const fur=0xa5907c,dark=0x7c6c66,legs=[];
  a.mesh(root,'round',fur,0,1.23,-.50,.94,.98,1.80);a.mesh(root,'round',0xb49e83,0,1.62,.32,.87,.79,1.0);
  for(let i=0;i<9;i++){const fringe=a.mesh(root,'cone',i%2?fur:dark,Math.sin(i*2.1)*.70,.70,-1.85+i*.39,.20,.66,.15);fringe.rotation.z=Math.PI;}
  for(const side of [-1,1])for(const z of [-1.64,.94]){
    const leg=new THREE.Group();leg.position.set(side*.67,.79,z);root.add(leg);a.mesh(leg,'round',fur,0,-.22,0,.34,.51,.38);a.mesh(leg,'round',dark,0,-.61,.10,.34,.16,.41);legs.push(leg);
  }
  const head=new THREE.Group();head.position.set(0,1.47,1.04);root.add(head);
  a.mesh(head,'round',fur,0,.10,.25,.67,.69,.72);a.mesh(head,'round',dark,0,.34,.34,.53,.44,.56);
  for(const side of [-1,1]){
    a.mesh(head,'round',fur,side*.67,.03,.20,.36,.44,.13);a.mesh(head,'round',0xbda498,side*.73,.03,.285,.19,.28,.035);
    a.mesh(head,'eye',0xf0e4cd,side*.47,.20,.79,.085,.11,.035);a.mesh(head,'eye',0x283a42,side*.47,.20,.824,.036,.067,.015);
    const tusk=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.36,-.15,.79),new THREE.Vector3(side*.62,-.27,1.30),new THREE.Vector3(side*.82,-.12,1.85),new THREE.Vector3(side*.74,.22,2.02)]);
    const key='winterMammothTusk'+side;if(!a.geometries[key])a.geometries[key]=new THREE.TubeGeometry(tusk,8,.065,5,false);named(a.mesh(head,key,0xf2dfb7),'curved-tusk');
  }
  const trunk=new THREE.Group();trunk.position.set(0,-.08,.76);head.add(trunk);
  a.segment(trunk,[0,0,0],[0,-.61,.24],.18,fur,'taper');a.segment(trunk,[0,-.58,.24],[0,-.98,.75],.14,fur,'taper');a.segment(trunk,[0,-.98,.74],[0,-.85,1.18],.10,fur,'taper');a.mesh(trunk,'round',dark,0,-.86,1.21,.12,.095,.065);
  a.segment(root,[0,1.10,-2.11],[.10,.71,-2.58],.055,dark,'taper');a.shadow(root,1.25);root.userData={kind:'mammoth',legs,head,trunk};return root;
}
function sisterSkirt(a){
  if(!a.geometries.winterSisterSkirt)a.geometries.winterSisterSkirt=new THREE.CylinderGeometry(.17,.43,1.03,9,1,false);
  return 'winterSisterSkirt';
}
function sisterArm(a,parent,side,sleeve,skin){
  const arm=new THREE.Group();arm.position.set(side*.20,1.52,.015);parent.add(arm);
  a.segment(arm,[0,0,0],[side*.04,-.27,.03],.063,sleeve,'taper');a.segment(arm,[side*.04,-.27,.03],[side*.06,-.47,.10],.048,skin,'taper');a.mesh(arm,'round',skin,side*.06,-.48,.11,.058,.075,.052);return arm;
}
export function winterSister(a,id='elsa'){
  const elsa=id==='elsa',root=new THREE.Group();root.name=elsa?'Elsa':'Anna';
  const skin=0xf0cdbb,hair=elsa?0xeee1bb:0xa26843,skirt=elsa?0x8ed5e6:0x49659e,bodice=elsa?0x75c7df:0x34495e;
  a.mesh(root,sisterSkirt(a),skirt,0,.68,0,.97,1,.78).name=elsa?'ice-blue-gown':'navy-skirt';
  a.mesh(root,'round',bodice,0,1.36,0,.21,.29,.16);
  if(!elsa){a.mesh(root,'rock',0xa7b281,0,1.39,.158,.087,.14,.022);a.mesh(root,'rock',0xd3ad6f,0,1.28,.161,.052,.055,.024);}
  const legs=[];for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.105,.30,0);root.add(leg);a.mesh(leg,'taper',elsa?0xb7dfeb:0x45526e,0,-.10,0,.055,.23,.055);a.mesh(leg,'round',elsa?0xa7d9e7:0x5b575d,0,-.24,.055,.078,.055,.12);legs.push(leg);
  }
  const leftArm=sisterArm(a,root,-1,elsa?0xa6deea:0x526a84,skin),rightArm=sisterArm(a,root,1,elsa?0xa6deea:0x526a84,skin);
  const capeMaterial=elsa?frozenMaterial(a,0xc5ecf4,.46):a.mat(0xa65389,{side:THREE.DoubleSide});
  if(!a.geometries.winterSisterCape){const shape=new THREE.Shape();shape.moveTo(-.19,0);shape.lineTo(.19,0);shape.lineTo(.43,-1.22);shape.quadraticCurveTo(0,-1.34,-.43,-1.22);shape.closePath();a.geometries.winterSisterCape=new THREE.ShapeGeometry(shape,3);}
  const cape=a.mesh(root,'winterSisterCape',capeMaterial,0,1.54,-.18,1,1,1);cape.rotation.x=.12;cape.name=elsa?'elsa-translucent-cape':'anna-magenta-cape';cape.castShadow=false;cape.receiveShadow=false;
  if(elsa)for(const side of [-1,1])for(let i=0;i<4;i++)a.mesh(root,'rock',0xc9f0ef,side*(.13+i*.055),.36+i*.15,.28-i*.026,.022,.043,.015);
  const head=new THREE.Group();head.position.set(0,1.86,0);root.add(head);
  a.mesh(head,'round',skin,0,0,.015,.225,.255,.205);a.mesh(head,'round',hair,0,.055,-.06,.241,.257,.20);a.mesh(head,'round',hair,-.09,.20,.09,.145,.080,.14);a.mesh(head,'round',hair,.105,.18,.08,.13,.075,.14);
  eyes(a,head,.081,.02,.205,.038,0xfff9ee);
  for(const side of [-1,1]){a.mesh(head,'rock',0xe8a9a6,side*.147,-.062,.181,.037,.025,.012);const brow=a.mesh(head,'box',elsa?0xa08f7c:0x8b563d,side*.083,.089,.204,.060,.012,.012);brow.rotation.z=side*-.12;}
  a.mesh(head,'round',0xe8bda9,0,-.027,.229,.030,.044,.028);smile(a,head,-.115,.190,.076,0xb17478);
  const braidSides=elsa?[-1]:[-1,1];
  for(const side of braidSides)for(let i=0;i<7;i++){
    const x=side*(.192+.011*Math.sin(i*1.8)),y=-.12-i*.075,z=.03+i*.019,size=.067-i*.004;
    const braid=a.mesh(head,'rock',!elsa&&side===-1&&i<2?0xc2a47d:hair,x,y,z,size,size*.91,size*.9);braid.name=elsa?'elsa-side-braid':'anna-twin-braid';
  }
  if(elsa)ice(a,head,0xb5e6ec,0,.27,.04,.11,.12,.11);
  root.userData={kind:elsa?'elsa':'anna',leftArm,rightArm,legs,head};return root;
}
export function winterObstacle(a,kind,row=0){
  const root=new THREE.Group();root.name='winter-'+kind;root.userData={kind,row};
  if(kind==='ice-crack'){
    const dark=a.mesh(root,'box',a.mat(0x357595,{emissive:0x173f65,emissiveIntensity:.18}),0,.022,0,4.50,.038,.87);dark.castShadow=false;dark.receiveShadow=false;
    for(const side of [-1,1])for(let i=0;i<9;i++){const x=-2.05+i*.515,z=side*(.43+(i%3)*.027);a.mesh(root,'rock',i%2?0xc8e8ee:0xe5f4f1,x,.062,z,.29,.085,.13);}
  }else{
    const trunk=a.mesh(root,'cylinder',0x998675,0,.27,0,.245,4.30,.245);trunk.rotation.z=Math.PI/2;
    const snow=a.mesh(root,'round',0xebf4f1,0,.40,0,2.20,.17,.27);snow.name='snow-covered-log';
    for(const side of [-1,1]){const end=a.mesh(root,'cylinder',0xbda989,side*2.17,.27,0,.205,.035,.205);end.rotation.z=Math.PI/2;}
    a.segment(root,[.7,.34,.02],[.98,.66,.10],.065,0x998675);a.mesh(root,'round',0xe8f2f0,.96,.62,.10,.15,.08,.13);
  }
  return root;
}
