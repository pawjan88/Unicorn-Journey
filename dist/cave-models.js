import * as THREE from './vendor/three.module.js';

// Faceted cave inhabitants share the same owned geometry and materials as the forest.
function crystalGeometry(a){
  if(!a.geometries.caveGem){
    const geometry=new THREE.CylinderGeometry(0,.22,.30,5,1).toNonIndexed();
    geometry.translate(0,.15,0);
    const lower=new THREE.ConeGeometry(.22,.23,5).toNonIndexed();lower.rotateZ(Math.PI);lower.translate(0,-.115,0);
    const positions=[...geometry.attributes.position.array,...lower.attributes.position.array];
    const merged=new THREE.BufferGeometry();merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));merged.computeVertexNormals();
    geometry.dispose();lower.dispose();a.geometries.caveGem=merged;
  }
  return 'caveGem';
}
function gem(a,parent,color,x,y,z,scale=1){
  return a.mesh(parent,crystalGeometry(a),a.mat(color,{emissive:color,emissiveIntensity:.23,metalness:.18,roughness:.37}),x,y,z,scale,scale,scale);
}
function glowingEyes(a,parent,x,y,z,size=.07,color=0xffdc92){
  for(const side of [-1,1]){
    a.mesh(parent,'eye',a.mat(color,{emissive:color,emissiveIntensity:.6}),side*x,y,z,size,size*1.15,size*.45);
    a.mesh(parent,'eye',0x263943,side*x,y,z+size*.40,size*.34,size*.65,size*.14);
    a.mesh(parent,'eye',0xfffaf0,side*x-size*.23,y+size*.35,z+size*.47,size*.14);
  }
}
export function caveCrystal(a){
  const root=new THREE.Group();root.name='cave-crystal';
  gem(a,root,0x81e7e2,0,0,0,.92);
  const spark=gem(a,root,0xd8a9ef,-.13,-.035,.05,.46);spark.rotation.z=.38;
  root.userData={kind:'cave-crystal'};return root;
}
export function caveGolem(a,boss=false){
  const root=new THREE.Group();root.name=boss?'obsidian-guardian':'stone-golem';
  const stone=boss?0x4b4d66:0x8c9b9b,edge=boss?0x666880:0xa1aeaa,legs=[];
  a.mesh(root,'rock',stone,0,.91,0,.51,.57,.32);
  a.mesh(root,'rock',edge,0,1.27,.01,.48,.30,.35);
  a.mesh(root,'rock',stone,0,1.73,.015,.35,.36,.29);
  a.mesh(root,'rock',edge,0,1.55,.23,.22,.16,.13);
  glowingEyes(a,root,.125,1.79,.285,.068,boss?0xb2e8f1:0xf2d68e);
  // A small flat mouth keeps the expression gentle and readable at a distance.
  a.mesh(root,'box',0x465666,0,1.60,.338,.15,.023,.018);
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.24,.52,0);root.add(leg);
    a.mesh(leg,'rock',stone,0,-.17,0,.18,.30,.19);a.mesh(leg,'rock',edge,0,-.43,.075,.21,.11,.27);legs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.47,1.29,0);root.add(arm);
    a.mesh(arm,'rock',edge,side*.055,-.04,0,.23,.25,.24);
    a.mesh(arm,'rock',stone,side*.13,-.37,.035,.19,.28,.20);
    a.mesh(arm,'rock',edge,side*.14,-.63,.08,.21,.18,.21);
    if(side===1)root.userData.arm=arm;
  }
  const crystalSegments=[];
  for(let i=0;i<3;i++){
    const color=[0x76d7df,0xb59be8,0xf1c481][i];
    const material=a.mat(color,{name:(boss?'guardian':'golem')+'-heart-'+i,emissive:color,emissiveIntensity:boss?.08:.24,metalness:.13,roughness:.42});
    const segment=a.mesh(root,crystalGeometry(a),material,(i-1)*.22,1.09-(i%2)*.16,.345,.55,.80,.46);segment.rotation.z=(i-1)*-.3;segment.name='heart-crystal-'+i;crystalSegments.push(segment);
  }
  for(const side of [-1,1]){
    const shard=gem(a,root,boss?0x9ba5dd:0x9bd1c9,side*.45,1.48,-.03,.58);shard.rotation.z=-side*.35;
  }
  if(boss){
    for(let i=0;i<5;i++){const crown=gem(a,root,[0x9cb8de,0xb79bdd,0x83cecf][i%3],(i-2)*.12,1.99+(.10-Math.abs(i-2)*.04),0,.65+(.2-Math.abs(i-2)*.08));crown.name='guardian-crown';}
    root.scale.setScalar(2.15);
  }
  a.shadow(root,.66);
  root.userData={...root.userData,kind:boss?'obsidian-guardian':'stone-golem',legs,baseScale:boss?2.15:1,crystalSegments};return root;
}
export function crystalCrab(a){
  const root=new THREE.Group();root.name='crystal-crab';const shell=0x8985b6,legs=[];
  a.mesh(root,'rock',shell,0,.57,0,.50,.35,.43);
  a.mesh(root,'rock',0xb1add5,0,.74,-.05,.38,.21,.32);
  for(let i=0;i<5;i++){const stone=gem(a,root,[0xa9ece6,0xd7b2ef,0xead5a1][i%3],(i%3-1)*.20,.77+(i%2)*.10,(Math.floor(i/3)-.5)*.28,.66);stone.rotation.z=(i%3-1)*.2;}
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const leg=new THREE.Group();leg.position.set(side*.36,.44,(i-1.5)*.19);root.add(leg);
      a.segment(leg,[0,0,0],[side*.31,-.03,(i-1.5)*.055],.039,0x8b83a7);
      a.segment(leg,[side*.31,-.03,(i-1.5)*.055],[side*.46,-.38,(i-1.5)*.13],.028,0xab9dbe);legs.push(leg);
    }
    a.segment(root,[side*.33,.51,.25],[side*.58,.62,.59],.065,shell);
    const pincer=new THREE.Group();pincer.position.set(side*.58,.64,.64);root.add(pincer);
    a.mesh(pincer,'rock',0xb0a7cc,0,0,0,.16,.14,.21);
    for(const finger of [-1,1]){const claw=a.mesh(pincer,'cone',0xd2badc,finger*.095,.01,.21,.065,.30,.06);claw.rotation.x=Math.PI/2;claw.rotation.y=-finger*.28;}
    a.segment(root,[side*.15,.75,.26],[side*.18,.93,.33],.026,shell);
  }
  glowingEyes(a,root,.18,.96,.35,.054,0xffe7b1);a.shadow(root,.76);
  root.userData={kind:'crystal-crab',legs};return root;
}
export function crystalLizard(a){
  const root=new THREE.Group();root.name='crystal-lizard';const skin=0x83b9a6,legs=[];
  a.mesh(root,'round',skin,0,.34,0,.22,.20,.45);
  a.mesh(root,'round',0xa4d3b5,0,.38,.46,.19,.16,.27);
  a.mesh(root,'round',0xbcd9bf,0,.32,.63,.15,.08,.10);glowingEyes(a,root,.12,.44,.60,.036,0xf7e5b4);
  for(const side of [-1,1])for(const z of [-.25,.26]){
    const leg=new THREE.Group();leg.position.set(side*.15,.30,z);root.add(leg);
    a.segment(leg,[0,0,0],[side*.18,-.09,.07],.04,skin);a.segment(leg,[side*.18,-.09,.07],[side*.24,-.24,.13],.028,skin);legs.push(leg);
  }
  const tail=new THREE.Group();tail.position.set(0,.30,-.36);root.add(tail);
  a.segment(tail,[0,0,0],[.10,-.10,-.58],.075,skin,'taper');a.segment(tail,[.10,-.10,-.53],[.22,-.10,-.91],.03,skin,'taper');
  for(let i=0;i<5;i++){const shard=gem(a,root,i%2?0xc5a6e8:0x90ded3,0,.51-i*.023,.24-i*.18,.36+(i===2?.12:0));shard.name='lizard-crystal-crest';}
  a.shadow(root,.40);root.userData={kind:'crystal-lizard',legs,tail};return root;
}
export function caveBat(a){
  const root=new THREE.Group();root.name='cave-bat';const fur=0x8d7a98;
  a.mesh(root,'round',fur,0,0,0,.17,.23,.16);a.mesh(root,'round',0xab96af,0,.18,.06,.19,.17,.14);
  for(const side of [-1,1]){const ear=a.mesh(root,'cone',fur,side*.14,.43,.04,.10,.32,.055);ear.rotation.z=-side*.20;a.mesh(root,'cone',0xd7b0c4,side*.14,.43,.085,.055,.20,.025);}
  glowingEyes(a,root,.076,.21,.182,.036,0xf1e0bd);
  a.mesh(root,'round',0xc4a3bb,0,.11,.20,.047,.035,.03);
  if(!a.geometries.caveBatWing){
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.37,.24);shape.lineTo(.95,.34);shape.lineTo(.76,-.10);shape.quadraticCurveTo(.65,-.02,.59,-.25);shape.quadraticCurveTo(.47,-.10,.39,-.34);shape.lineTo(.16,-.23);shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape,2);geometry.rotateX(Math.PI/2);a.geometries.caveBatWing=geometry;
  }
  const wings=[];for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(side*.11,.04,0);root.add(wing);
    a.mesh(wing,'caveBatWing',a.mat(0xc4a0b9,{side:THREE.DoubleSide}),0,0,0,side,1,1);
    a.segment(wing,[0,0,0],[side*.37,.02,.24],.019,0x9c829d);a.segment(wing,[side*.37,.02,.24],[side*.95,0,.34],.012,0x9c829d);
    a.segment(wing,[side*.37,.02,.24],[side*.59,0,-.25],.010,0xa78aa6);wings.push(wing);
  }
  root.userData={kind:'cave-bat',wings};return root;
}
export function crystalTurtle(a){
  const root=new THREE.Group();root.name='crystal-turtle';const skin=0x7eaaa0,legs=[];
  a.mesh(root,'round',skin,0,.91,-.18,1.59,.63,2.33);
  a.mesh(root,'round',0x728e92,0,1.15,-.35,1.80,.91,2.25);
  a.mesh(root,'round',0x9bb4a0,0,.73,-.24,1.86,.18,2.35);
  // Distinct hexagonal-looking shell facets, not a scaled dinosaur body.
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    const x=(col-1)*.86,z=(row-1)*1.03-.35,y=1.83-Math.abs(col-1)*.13-Math.abs(row-1)*.11;
    const panel=a.mesh(root,'rock',[0x8dada1,0x81a29a,0xa8bd9f][(row+col)%3],x,y,z,.68,.25,.75);panel.name='shell-panel';
  }
  for(const side of [-1,1])for(const z of [-1.65,1.22]){
    const leg=new THREE.Group();leg.position.set(side*1.28,.74,z);root.add(leg);
    a.mesh(leg,'round',skin,side*.16,-.19,.05,.40,.47,.48);a.mesh(leg,'round',0x73958d,side*.28,-.54,.19,.43,.16,.51);
    for(let toe=0;toe<3;toe++)a.mesh(leg,'rock',0xd4cfb2,side*.28+(toe-1)*.16,-.53,.59,.07,.06,.12);legs.push(leg);
  }
  const head=new THREE.Group();head.position.set(0,1.01,1.76);root.add(head);
  a.segment(head,[0,-.06,0],[0,.06,.75],.37,skin,'taper');a.mesh(head,'round',0x9ac0aa,0,.09,1.15,.51,.37,.69);
  a.mesh(head,'round',0xb4cbb1,0,-.10,1.53,.45,.19,.32);
  glowingEyes(a,head,.29,.25,1.55,.088,0xf7df9f);
  for(const side of [-1,1])a.mesh(head,'rock',0x668d7e,side*.16,.10,1.79,.044,.023,.014);
  a.mesh(head,'box',0x648a7b,0,-.18,1.78,.33,.022,.024);
  a.segment(root,[0,.78,-2.32],[0,.49,-3.28],.17,skin,'taper');
  for(const [x,z,size]of [[-.78,-.95,.9],[.80,.23,.72],[.15,-1.55,.62],[-.56,.83,.52]]){
    const shard=gem(a,root,z<0?0x8de4d7:0xc6aaed,x,1.89,z,size);shard.rotation.z=-x*.22;shard.name='turtle-crystal';
  }
  for(const [x,z,height]of [[.66,-.85,.39],[-.71,.12,.32],[.18,.86,.25]]){
    a.mesh(root,'taper',0xd0cbab,x,1.95+height*.3,z,.066,height,.066);
    a.mesh(root,'round',a.mat(0xb8d4c7,{emissive:0x5da9a1,emissiveIntensity:.16}),x,1.95+height*.8,z,.26,height*.26,.24);
    a.mesh(root,'round',0xe0d9b4,x-.08,1.98+height*.8,z+.13,.06,.03,.04);
  }
  a.shadow(root,2.0);root.userData={kind:'crystal-turtle',legs,head};return root;
}
export function caveObstacle(a,kind,row=0){
  const root=new THREE.Group();root.name='cave-'+kind;root.userData={kind,row};
  if(kind==='chasm'){
    const dark=a.mesh(root,'box',a.mat(0x182d3c,{emissive:0x091520,emissiveIntensity:.2}),0,.021,0,4.56,.035,.91);dark.castShadow=false;dark.receiveShadow=false;
    for(const side of [-1,1])for(let i=0;i<9;i++){
      const x=-2.12+i*.53,z=side*(.46+(i%3)*.025);
      const rim=a.mesh(root,'rock',i%2?0x7a8e95:0x95a5a4,x,.07,z,.30,.11,.13);rim.rotation.y=i*.57;
    }
    // Light catches the far lip, making a low dark obstacle readable for a child.
    for(const x of [-1.85,1.85])gem(a,root,0x8bcdc9,x,.05,.59,.34);
  }else{
    const shaft=a.mesh(root,'cylinder',0xa5b2ae,0,.27,0,.24,4.28,.24);shaft.rotation.z=Math.PI/2;
    for(const x of [-2.12,2.12]){
      const capital=a.mesh(root,'cylinder',0xc2c6b6,x,.27,0,.32,.20,.32);capital.rotation.z=Math.PI/2;
      const end=a.mesh(root,'cylinder',0x748994,x*1.055,.27,0,.18,.025,.18);end.rotation.z=Math.PI/2;
    }
    for(const x of [-1.45,-.48,.49,1.46]){const band=a.mesh(root,'cylinder',0x899d9e,x,.27,0,.245,.05,.245);band.rotation.z=Math.PI/2;}
    gem(a,root,0xbb9ad8,-.83,.41,.10,.41);
  }
  return root;
}
