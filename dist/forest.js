import * as THREE from './vendor/three.module.js';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import { RULES, skyHeightAt } from './rules.js?v=9';
import { HORSES } from './characters.js?v=7';
import { jumpHeadPose } from './animation.js?v=7';
import { EPISODES } from './episodes.js?v=9';

const PALETTE = [0xee4168, 0xf58b25, 0xeec536, 0x27b691, 0x298cd1, 0x964dce];
const ART_FILES = ['tree-gold.svg','tree-blue.svg','troll-sword.svg','troll-axe.svg','dragon.svg','unicorn-run-0.svg','unicorn-run-1.svg','witch.svg','boss.svg','sky-panorama.svg','dino-palm.svg','dino-fern.svg','dino-triceratops.svg','dino-diplodocus.svg','dino-small-0.svg','dino-small-1.svg','dino-pterodactyl.svg','dino-tyrannosaurus.svg','dino-silhouette.svg','dragonfly.svg','dino-panorama.svg',...HORSES.flatMap(h=>[h.neck,h.headBack,h.headTurn,h.headLook])];
const artTextures = new Map();
const toonRamp = new THREE.DataTexture(new Uint8Array([105, 175, 245]), 3, 1, THREE.RedFormat);
toonRamp.minFilter = toonRamp.magFilter = THREE.NearestFilter;
toonRamp.needsUpdate = true;
const up = new THREE.Vector3(0, 1, 0);
const sphere = new THREE.SphereGeometry(1, 24, 16);
const treePlane = new THREE.PlaneGeometry(1, 1);
const detailShape = new THREE.SphereGeometry(1, 8, 6);
const stem = new THREE.CylinderGeometry(1, 1, 1, 10);
const dummy = new THREE.Object3D();
const color = new THREE.Color();
function rng(seed) {
  let n = seed >>> 0;
  return () => { n = (Math.imul(1664525, n) + 1013904223) >>> 0; return n / 4294967296; };
}
function material(hex, extra = {}) {
  const { roughness, metalness, ...paint } = extra;
  return new THREE.MeshToonMaterial({ color: hex, gradientMap: toonRamp, ...paint });
}
function ball(parent, mat, x, y, z, sx, sy = sx, sz = sx) {
  const mesh = new THREE.Mesh(sphere, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  parent.add(mesh);
  return mesh;
}
function beam(parent, mat, a, b, radius = 0.06) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const mesh = new THREE.Mesh(stem, mat);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.scale.set(radius, start.distanceTo(end), radius);
  mesh.quaternion.setFromUnitVectors(up, end.sub(start).normalize());
  parent.add(mesh);
  mesh.castShadow = true;
  return mesh;
}
function texture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function glowTexture() {
  return texture(128, (ctx, size) => {
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.08, '#fffcec');
    g.addColorStop(0.25, '#fff4c57d'); g.addColorStop(1, '#fff4c500');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  });
}
function groundTexture(path,episode) {
  const random = rng(path ? 195 : 76);
  const tex = texture(512, (ctx, s) => {
    ctx.fillStyle = path ? (episode.id==='dino'?'#c3b987':'#efcf9a') : (episode.id==='dino'?'#5c9375':'#6ea587'); ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 8000; i++) {
      const x = random()*s, y = random()*s;
      ctx.globalAlpha = random()*0.25;
      ctx.fillStyle = path ? (i%2 ? '#b9a39a' : '#fff4e2') : (i%2 ? '#5b7981' : '#d9c7aa');
      ctx.beginPath(); ctx.ellipse(x, y, 0.5+random()*2, 0.4+random()*(path?1.2:4), random(), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(path ? 1 : 30, path ? 180 : 190);
  tex.anisotropy = 8;
  return tex;
}
class Instances {
  constructor(group, geometry, mat, shadow = false) {
    this.group = group; this.geometry = geometry; this.mat = mat; this.shadow = shadow; this.items = [];
  }
  add(x, y, z, sx, sy, sz, hex, rotate = 0) {
    dummy.position.set(x,y,z); dummy.scale.set(sx,sy,sz); dummy.rotation.set(0,rotate,0); dummy.updateMatrix();
    this.items.push({ matrix: dummy.matrix.clone(), color: hex });
  }
  finish() {
    const mesh = new THREE.InstancedMesh(this.geometry, this.mat, this.items.length);
    this.items.forEach((item,i) => { mesh.setMatrixAt(i,item.matrix); mesh.setColorAt(i,color.setHex(item.color)); });
    mesh.castShadow = this.shadow; mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    this.group.add(mesh);
  }
}
function artMaterial(file, foreground = false) {
  return new THREE.MeshBasicMaterial({
    map: artTextures.get(file), transparent: true, alphaTest: 0.04,
    side: THREE.DoubleSide, depthWrite: !foreground, depthTest: !foreground,
    fog: !foreground,
  });
}
function artMesh(file, width, height, foreground = false) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), artMaterial(file, foreground));
  mesh.position.y = height / 2;
  return mesh;
}
function forestChunk(index,episode) {
  const group = new THREE.Group(), random = rng(index*919+115);
  const trees = episode.trees.map(file => new Instances(group, treePlane, artMaterial(file), true));
  const stems = new Instances(group, stem, material(0xffffff));
  const details = new Instances(group, detailShape, material(0xffffff));
  const gems = new Instances(group, new THREE.OctahedronGeometry(1,0), material(0xffffff, { emissive:0x777a9e, emissiveIntensity:0.1 }));
  for (const side of [-1,1]) {
    for (let i=0;i<7;i++) {
      const x=side*(3.4+random()*17), z=-random()*12, height=6.5+random()*5;
      const variant=(i+index)%3===0?0:1;
      trees[variant].add(x,height/2,z,height*.75,height,1,0xffffff,(random()-.5)*.12);
      for(let j=0;j<3;j++)details.add(x+(random()-.5)*1.2,.12,z+(random()-.5)*1.2,.3,.16,.3,0x8a9d95);
    }
    for(let i=0;i<38;i++) {
      const x=side*(2.4+random()*8), z=-random()*12;
      if(i<18) {
        const h=.13+random()*.18,tint=PALETTE[Math.floor(random()*6)];
        stems.add(x,h/2,z,.024,h,.024,0xd9cbb1);
        details.add(x,h,z,.11+random()*.08,.05,.13,tint);
        details.add(x,h+.03,z,.025,.018,.025,0xf7dfb1);
      } else if(i<27)details.add(x,.07,z,.15+random()*.2,.08,.15+random()*.2,0x9c9faa);
      else for(let j=0;j<3;j++)details.add(x+j*.06,.08+j*.025,z,.05,.13,.18,0x7d9793,j);
    }
    if(index%3===0)for(let i=0;i<3;i++)gems.add(side*(2.75+random())+i*.16,.18+random()*.22,-random()*12,.10,.35+random()*.2,.12,0xb5a9c4);
  }
  if(episode.id==='dino'){
    for(const side of [-1,1]){const silhouette=artMesh('dino-silhouette.svg',5,4.5);silhouette.position.set(side*(8+random()*8),2.25,-random()*12);silhouette.material.opacity=.7;group.add(silhouette);}
  }
  trees.forEach(batch=>batch.finish());stems.finish();details.finish();gems.finish();
  return group;
}
function rainbow() {
  const group = new THREE.Group();
  for(let i=0;i<6;i++) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(.52-i*.062,.032,8,40,Math.PI), material(PALETTE[i], { emissive:PALETTE[i],emissiveIntensity:.58,roughness:.3 }));
    group.add(mesh);
  }
  const cloud=material(0xfff8f1);
  for(const side of [-1,1]) {
    ball(group,cloud,side*.48,0,0,.16,.09,.12);
    ball(group,cloud,side*.41,.05,0,.10,.10,.1);
  }
  return group;
}
function fence() {
  const group=new THREE.Group(), wood=material(0xe2bea1), ends=material(0xf7dbc0);
  for(const x of [-RULES.halfWidth,RULES.halfWidth]) {
    beam(group,wood,[x,0,0],[x,.85,0],.065);
    ball(group,ends,x,.86,0,.07);
  }
  for(const y of [.26,.61]) {
    const bar=new THREE.Mesh(new THREE.BoxGeometry(RULES.halfWidth*2+.1,.13,.12),wood);
    bar.position.y=y;bar.castShadow=true;group.add(bar);
  }
  // A small pastel flower makes the obstacle friendly and easy to recognise.
  ball(group,material(0xeab4d2),.65,.84,-.07,.11,.1,.04);
  ball(group,material(0xffe4a0),.65,.84,-.11,.04);
  return group;
}
function creature(type,weapon='sword',episode=EPISODES.forest) {
  const group=new THREE.Group();
  if(episode.id==='dino'){const file=type==='boss'?'dino-tyrannosaurus.svg':type==='dragon'?'dino-diplodocus.svg':'dino-triceratops.svg';group.add(artMesh(file,type==='boss'?4:type==='dragon'?1.85:2.05,type==='boss'?4.6:type==='dragon'?2.65:1.85));return group;}
  const mesh=artMesh(type==='boss'?'boss.svg':type==='dragon'?'dragon.svg':weapon==='axe'?'troll-axe.svg':'troll-sword.svg',type==='boss'?3.3:type==='dragon'?1.72:1.4,type==='boss'?4.2:1.78);
  group.add(mesh);
  return group;
}
function mount() {
  const group=new THREE.Group();
  const neck=artMesh(HORSES[0].neck,1.5,1.5,true);
  neck.position.set(0,-.05,0);neck.renderOrder=50;group.add(neck);
  const head=new THREE.Group();head.position.y=-.24;group.add(head);
  const illustration=artMesh(HORSES[0].headBack,1.5,1.5,true);
  illustration.position.set(0,.19,0);illustration.renderOrder=51;head.add(illustration);
  group.userData.neck=neck;group.userData.head=head;group.userData.illustration=illustration;
  group.userData.hornTip=new THREE.Vector3(0,.635,0);
  group.userData.hooves=[-1,1].map(side=>{
    const hoof=new THREE.Mesh(new THREE.PlaneGeometry(.17,.16),new THREE.MeshBasicMaterial({color:HORSES[0].hooves,depthTest:false,depthWrite:false}));
    hoof.position.set(side*.40,-.5,.02);hoof.renderOrder=52;hoof.visible=false;group.add(hoof);return hoof;
  });
  group.position.set(0,-.65,-1.45);return group;
}
function skyRoad() {
  const group=new THREE.Group(),steps=96;
  for(let band=0;band<6;band++){
    const positions=[],indices=[];
    for(let row=0;row<=steps;row++){
      const z=RULES.bonusStart+(RULES.bonusEnd-RULES.bonusStart)*row/steps;
      for(const side of [0,1])positions.push(-RULES.halfWidth+(band+side)*RULES.halfWidth*2/6,skyHeightAt(z),-z);
      if(row<steps){const a=row*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:PALETTE[band],side:THREE.DoubleSide})));
  }
  for(const side of [-1,1]){
    const points=Array.from({length:97},(_,i)=>{const z=RULES.bonusStart+(RULES.bonusEnd-RULES.bonusStart)*i/96;return new THREE.Vector3(side*(RULES.halfWidth+.05),skyHeightAt(z)+.05,-z);});
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.035,6,false),new THREE.MeshBasicMaterial({color:0xffe5a0})));
  }
  return group;
}

function amber() {
  const group=new THREE.Group();
  const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(.27,0),material(0xffb230,{emissive:0xe99719,emissiveIntensity:.35}));
  gem.scale.set(1,1.35,.82);group.add(gem);
  const glint=new THREE.Mesh(new THREE.OctahedronGeometry(.055,0),new THREE.MeshBasicMaterial({color:0xfff2b7}));
  glint.position.set(-.10,.15,.17);group.add(glint);return group;
}
function dinoObstacle(kind) {
  const group=new THREE.Group();
  if(kind==='lava') {
    const map=texture(256,(ctx,size)=>{
      ctx.fillStyle='#e56c22';ctx.fillRect(0,0,size,size);
      ctx.strokeStyle='#ffd16b';ctx.lineWidth=16;
      for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(-20,i*38);ctx.bezierCurveTo(70,i*38-35,160,i*38+40,280,i*38-8);ctx.stroke();}
    });
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    const river=new THREE.Mesh(new THREE.PlaneGeometry(RULES.halfWidth*2,1.05),new THREE.MeshBasicMaterial({map}));
    river.rotation.x=-Math.PI/2;river.position.y=.025;group.add(river);group.userData.lavaMap=map;
    for(const z of [-.6,.6]){const bank=new THREE.Mesh(new THREE.BoxGeometry(RULES.halfWidth*2+.15,.13,.12),material(0x615a58));bank.position.set(0,.025,z);group.add(bank);}
  } else {
    const bark=material(0x996745);
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.33,RULES.halfWidth*2+.2,16),bark);
    trunk.rotation.z=Math.PI/2;trunk.position.y=.30;trunk.castShadow=true;group.add(trunk);
    for(const side of [-1,1]){
      const cap=new THREE.Mesh(new THREE.CircleGeometry(.28,24),material(0xd1a06b));cap.rotation.y=side*Math.PI/2;cap.position.set(side*(RULES.halfWidth+.11),.30,0);group.add(cap);
      for(const r of [.12,.22]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.012,5,24),material(0x996745));ring.rotation.y=Math.PI/2;ring.position.set(side*(RULES.halfWidth+.115),.30,0);group.add(ring);}
    }
    beam(group,bark,[.3,.4,0],[.6,.72,.05],.07);
  }
  return group;
}
function caveEntrance() {
  const group=new THREE.Group(),shape=new THREE.Shape();
  shape.moveTo(-4,0);shape.lineTo(-4,3);shape.lineTo(-2.7,5);shape.lineTo(0,5.6);shape.lineTo(2.7,5);shape.lineTo(4,3);shape.lineTo(4,0);shape.closePath();
  const hole=new THREE.Path();hole.moveTo(-2.15,0);hole.lineTo(2.15,0);hole.lineTo(2.15,1.9);hole.quadraticCurveTo(2.1,3.9,0,4);hole.quadraticCurveTo(-2.1,3.9,-2.15,1.9);hole.closePath();shape.holes.push(hole);
  const rock=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:8,bevelEnabled:false}),material(0x6b6a64));rock.position.z=-8;rock.receiveShadow=true;group.add(rock);
  const darkness=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshBasicMaterial({color:0x142f35}));darkness.position.set(0,2,-8.1);group.add(darkness);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(4.3,9),material(0x625d51));floor.rotation.x=-Math.PI/2;floor.position.set(0,.01,-4);group.add(floor);
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),material(0xffbb4c,{emissive:0xf0a127,emissiveIntensity:.5}));crystal.position.set(side*(2.4+i*.22),.25+i*.15,-.1);crystal.scale.y=1.4;group.add(crystal);
  }
  return group;
}

export class MagicForest {
  static async prepare() {
    const loader=new THREE.TextureLoader();
    await Promise.all(ART_FILES.map(async file=>{
      if(artTextures.has(file))return;
      const tex=await loader.loadAsync(new URL('./assets/'+file+'?v=7',import.meta.url).href);
      tex.colorSpace=THREE.SRGBColorSpace;
      tex.anisotropy=4;artTextures.set(file,tex);
    }));
  }
  constructor(canvas, objects, herds, options={}) {
    this.episode=EPISODES[options.episodeId||'forest'];
    this.episodeId=this.episode.id;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.NoToneMapping;
    this.renderer.toneMappingExposure=1;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(this.episode.fog);
    this.scene.fog=new THREE.FogExp2(this.episode.fog,.012);
    this.camera=new THREE.PerspectiveCamera(64,16/9,.08,190);
    this.scene.add(this.camera);
    this.camera.position.set(0,2.05,1.7);
    this.camera.rotation.x=-.055;
    const skyMaterial=new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,
      vertexShader:`varying vec3 direction; void main(){ direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`varying vec3 direction;
        void main(){
          vec3 d=normalize(direction);
          float elevation=pow(max(d.y,0.0),0.55);
          vec3 sky=mix(vec3(0.89,0.84,0.77),vec3(0.96,0.89,0.78),elevation);
          float light=max(dot(d,normalize(vec3(-0.28,0.27,-1.0))),0.0);
          sky+=vec3(1.0,0.77,0.43)*(pow(light,70.0)*0.08+pow(light,650.0)*0.2);
          gl_FragColor=vec4(sky,1.0);
        }`,
    });
    this.sky=new THREE.Mesh(new THREE.SphereGeometry(165,32,20),skyMaterial);
    this.sky.renderOrder=-1000;this.scene.add(this.sky);
    this.scene.add(new THREE.HemisphereLight(0xfff1da,0x3b4c64,0.8));
    this.sun=new THREE.DirectionalLight(0xffead0,1.25);
    this.sun.position.set(-12,23,-22);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048);
    Object.assign(this.sun.shadow.camera,{left:-18,right:18,top:24,bottom:-18,near:1,far:70});
    this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=.025;
    this.scene.add(this.sun,this.sun.target);
    const fill=new THREE.DirectionalLight(0x7f91a7,.2);fill.position.set(10,6,8);this.scene.add(fill);
    const riderLight=new THREE.PointLight(0xffe8d0,.3,5,1.5);riderLight.position.set(-.7,.8,-.4);this.camera.add(riderLight);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,RULES.length+300),material(0xffffff,{map:groundTexture(false,this.episode)}));
    ground.rotation.x=-Math.PI/2;ground.position.set(0,-.025,-RULES.length/2);ground.receiveShadow=true;this.scene.add(ground);
    const path=new THREE.Mesh(new THREE.PlaneGeometry(RULES.halfWidth*2,RULES.length+100),material(0xffffff,{map:groundTexture(true,this.episode),roughness:.92}));
    path.rotation.x=-Math.PI/2;path.position.z=-RULES.length/2;path.receiveShadow=true;this.scene.add(path);
    // Soft mossy edges and stone markers make the narrow playable path legible.
    const edges=new THREE.Group();this.scene.add(edges);
    const edgeInstances=new Instances(edges,detailShape,material(0xffffff));
    const random=rng(312);
    for(let z=0;z<RULES.length+20;z+=.8)for(const side of [-1,1]) {
      edgeInstances.add(side*(RULES.halfWidth+.16),.035,-z,.22+random()*.2,.06,.3+random()*.2,0x8c9b96);
    }
    edgeInstances.finish();
    this.chunks=Array.from({length:13},(_,i)=>{const c=forestChunk(i,this.episode);c.position.z=12-i*12;this.scene.add(c);return c;});
    this.mount=mount();this.camera.add(this.mount);this.selectHorse(options.horseId||HORSES[0].id);
    this.objectMeshes=objects.map(object=>{
      const mesh=object.type==='rainbow'?(this.episodeId==='dino'?amber():rainbow()):object.type==='fence'?(this.episodeId==='dino'?dinoObstacle(object.obstacle):fence()):creature(object.type,object.weapon,this.episode);
      mesh.position.set(object.x,object.type==='rainbow'?1:0,-object.z);
      this.scene.add(mesh);return mesh;
    });
    this.herdMeshes=herds.map(herd=>Array.from({length:herd.count},()=>{
      const runner=artMesh(this.episodeId==='dino'?'dino-small-0.svg':'unicorn-run-0.svg',1.95,1.40);
      runner.visible=false;this.scene.add(runner);return runner;
    }));
    this.witchMeshes=(options.witches||[]).map(herd=>Array.from({length:herd.count},()=>{
      const witch=artMesh(this.episodeId==='dino'?'dino-pterodactyl.svg':'witch.svg',2.1,1.8);witch.visible=false;this.scene.add(witch);return witch;
    }));
    this.rockMeshes=Array.from({length:8},()=>{
      const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.36,0),material(0x748491));mesh.visible=false;mesh.castShadow=true;this.scene.add(mesh);return mesh;
    });
    this.skyRoad=skyRoad();this.scene.add(this.skyRoad);
    this.skyBackdrop=artMesh(this.episode.panorama,150,75);this.skyBackdrop.material.fog=false;this.skyBackdrop.material.depthWrite=false;this.skyBackdrop.visible=false;this.scene.add(this.skyBackdrop);
    this.skyPickups=Array.from({length:5},(_,i)=>{
      const z=RULES.bonusStart+(i+1)*(RULES.bonusEnd-RULES.bonusStart)/6;
      const mesh=this.episodeId==='dino'?amber():rainbow();mesh.scale.setScalar(.65);mesh.position.set(0,skyHeightAt(z)+1,-z);mesh.visible=false;this.scene.add(mesh);return mesh;
    });
    this.bonusGate=new THREE.Group();this.bonusGate.position.z=-RULES.bonusStart;
    for(let i=0;i<3;i++){
      const circle=new THREE.Mesh(new THREE.TorusGeometry(1.6-i*.25,.045,8,64),new THREE.MeshBasicMaterial({color:PALETTE[i*2]}));circle.rotation.x=-Math.PI/2;circle.position.y=.04;this.bonusGate.add(circle);
    }
    const bonusLabel=texture(512,(ctx,size)=>{ctx.fillStyle='#fff1d8';ctx.fillRect(0,0,size,size);ctx.fillStyle='#6d3f9f';ctx.textAlign='center';ctx.font='bold 48px sans-serif';ctx.fillText('GALOP PO TĘCZY',size/2,275);});
    const bonusSign=new THREE.Mesh(new THREE.PlaneGeometry(3.5,.65),new THREE.MeshBasicMaterial({map:bonusLabel}));bonusSign.position.y=1.7;this.bonusGate.add(bonusSign);this.scene.add(this.bonusGate);
    this.bossHitTime=0;this.bossThrowTime=0;
    this.dragonflies=this.episodeId==='dino'?Array.from({length:18},()=>{const fly=artMesh('dragonfly.svg',.34,.22);this.scene.add(fly);return fly;}):[];
    this.finishArch=new THREE.Group();this.finishArch.position.z=-RULES.length;
    const arch=rainbow();arch.scale.setScalar(7);arch.position.y=.7;this.finishArch.add(arch);
    const postMat=material(0xcea4cd);
    beam(this.finishArch,postMat,[-3.5,0,0],[-3.5,.8,0],.12);
    beam(this.finishArch,postMat,[3.5,0,0],[3.5,.8,0],.12);
    const label=texture(512,(ctx,s)=>{ctx.fillStyle='#fff9ed';ctx.fillRect(0,0,s,s);ctx.fillStyle='#8c709f';ctx.textAlign='center';ctx.font='bold 110px sans-serif';ctx.fillText('META',s/2,290);});
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.3,.7),material(0xffffff,{map:label,side:THREE.DoubleSide}));
    sign.position.set(0,2.9,.06);this.finishArch.add(sign);this.scene.add(this.finishArch);
    if(this.episodeId==='dino'){this.finishArch.visible=false;this.cave=caveEntrance();this.cave.position.z=-(RULES.length-4);this.scene.add(this.cave);const caveLight=new THREE.PointLight(0xffca71,2.0,9,1.2);caveLight.position.set(0,2,-RULES.length+1);this.scene.add(caveLight);}
    this.makeAtmosphere();
    this.composer=new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(960,540),.22,.5,1.2);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.burst=[];this.celebration=0;this.lastDistance=0;this.lastJumpHeight=0;this.lastFlightHeight=0;
    this.shotTime=0;this.shotGroup=new THREE.Group();this.shotGroup.visible=false;
    this.shotBeams=PALETTE.map(hex=>{
      const mesh=new THREE.Mesh(stem,new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.95,depthWrite:false}));
      this.shotGroup.add(mesh);return mesh;
    });
    this.shotFlash=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glow,color:0xffe8c2,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    this.shotFlash.scale.set(.55,.55,1);this.shotGroup.add(this.shotFlash);this.scene.add(this.shotGroup);
    this.resize();
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  }
  makeAtmosphere() {
    this.glow=glowTexture();
    // A warm sun, soft flare halos, and subtle diagonal light rays.
    this.sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glow,color:0xffe3ad,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    this.sunSprite.scale.set(22,22,1);this.scene.add(this.sunSprite);
    this.rays=new THREE.Group();this.scene.add(this.rays);
    const rayMap=texture(128,(ctx,s)=>{
      const g=ctx.createLinearGradient(0,0,s,0);
      g.addColorStop(0,'#ffffff00');g.addColorStop(.5,'#fff3bf45');g.addColorStop(1,'#ffffff00');
      ctx.fillStyle=g;ctx.fillRect(0,0,s,s);
    });
    for(let i=0;i<5;i++) {
      const mat=new THREE.MeshBasicMaterial({map:rayMap,color:0xffecd4,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
      const ray=new THREE.Mesh(new THREE.PlaneGeometry(1.5+i*.4,21),mat);
      ray.position.set(-7+i*3,7,-18-i*7);ray.rotation.z=-.48;this.rays.add(ray);
    }
    const random=rng(982);
    this.flyPositions=new Float32Array(160*3);
    this.flySeeds=Array.from({length:160},()=>({x:(random()-.5)*23,y:.3+random()*4.2,z:random()*125,phase:random()*Math.PI*2}));
    this.fliesGeometry=new THREE.BufferGeometry();this.fliesGeometry.setAttribute('position',new THREE.BufferAttribute(this.flyPositions,3));
    const fliesMat=new THREE.PointsMaterial({color:0xffeac0,map:this.glow,size:.16,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.8});
    this.flies=new THREE.Points(this.fliesGeometry,fliesMat);this.flies.frustumCulled=false;this.scene.add(this.flies);
    // Small optical halos stay faint so obstacles retain their contrast.
    this.flares=[.4,.8].map((scale,i)=>{
      const flare=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glow,color:i?0xddc1ff:0xffdfb6,transparent:true,opacity:.1,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending}));
      flare.scale.setScalar(scale);flare.position.set(.6-i*.9,.35-i*.4,-2);this.camera.add(flare);return flare;
    });
    this.burstGeometry=new THREE.BufferGeometry();
    this.burstPositions=new Float32Array(360*3);this.burstColors=new Float32Array(360*3);
    this.burstGeometry.setAttribute('position',new THREE.BufferAttribute(this.burstPositions,3));
    this.burstGeometry.setAttribute('color',new THREE.BufferAttribute(this.burstColors,3));
    this.burstGeometry.setDrawRange(0,0);
    this.sparkles=new THREE.Points(this.burstGeometry,new THREE.PointsMaterial({map:this.glow,size:.13,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    this.sparkles.frustumCulled=false;this.scene.add(this.sparkles);
  }
  dispose() {
    this.resizeObserver.disconnect();
    const geometries=new Set(),materials=new Set(),textures=new Set();
    this.scene.traverse(object=>{
      object.shadow?.map?.dispose();object.shadow?.mapPass?.dispose();
      if(object.geometry)geometries.add(object.geometry);
      for(const mat of (Array.isArray(object.material)?object.material:[object.material]))if(mat){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}
    });
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
    this.composer.passes.forEach(pass=>pass.dispose?.());this.composer.dispose();this.renderer.dispose();
  }
  resize() {
    const rect=this.renderer.domElement.getBoundingClientRect();
    const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    // Desktop buffer is at least Full HD wide, with a bounded GPU cost on Retina screens.
    const ratio=Math.min(2,2560/w,Math.max(window.devicePixelRatio||1,w>=800?1920/w:1));
    this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.composer.setPixelRatio(ratio);this.composer.setSize(w,h);
  }
  selectHorse(id) {
    const horse=HORSES.find(h=>h.id===id)||HORSES[0];
    this.horseId=horse.id;
    this.mount.userData.neck.material.map=artTextures.get(horse.neck);
    this.headTextures=[horse.headBack,horse.headTurn,horse.headLook].map(file=>artTextures.get(file));
    this.mount.userData.hooves.forEach(hoof=>hoof.material.color.set(horse.hooves));
    this.updateHead(-1);
  }
  updateHead(jumpTime) {
    const pose=jumpHeadPose(jumpTime,RULES.jumpDuration);
    const head=this.mount.userData.head;
    head.rotation.y=-.16*pose.turn;head.rotation.z=.10*pose.turn;
    head.position.set(.04*pose.turn,-.24+.03*pose.turn,0);
    this.mount.userData.illustration.material.map=this.headTextures[pose.frame];
    this.headFrame=pose.frame;
    head.updateMatrix();
    const tips=[[0,.876],[-.0404,.836],[-.0469,.873]];
    this.mount.userData.hornTip.set(tips[pose.frame][0],tips[pose.frame][1],0).applyMatrix4(head.matrix);
  }
  bossThrow(){this.bossThrowTime=.35;}
  collect(object) {
    for(let i=0;i<28;i++)this.burst.push({x:object.x,y:object.y??1,z:-object.z,vx:(Math.random()-.5)*2,vy:Math.random()*2,vz:Math.random()*1.4,life:1.3,color:PALETTE[i%6]});
  }
  fire(event) {
    this.camera.updateWorldMatrix(true,true);
    const start=this.mount.localToWorld(this.mount.userData.hornTip.clone());
    start.x+=event.origin.x-this.camera.position.x;
    start.z-=event.origin.z-this.lastDistance;
    start.y+=event.origin.y-1.78-this.lastJumpHeight-this.lastFlightHeight;
    const end=new THREE.Vector3(event.end.x,event.end.y,-event.end.z);
    const direction=end.clone().sub(start),length=Math.max(.1,direction.length());
    this.shotBeams.forEach((mesh,i)=>{
      mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.position.x+=(i-2.5)*.027;
      mesh.quaternion.setFromUnitVectors(up,direction.clone().normalize());mesh.scale.set(.017,length,.017);
    });
    this.shotFlash.position.copy(start);this.shotTime=.32;this.shotGroup.visible=true;
    if(event.target){this.collect({...event.target,y:event.target.type==='boss'?2:1});if(event.target.type==='boss')this.bossHitTime=.25;}
  }
  resetEffects() { this.burst.length=0;this.celebration=0;this.shotTime=0;this.shotGroup.visible=false;this.bossHitTime=0;this.bossThrowTime=0;this.updateHead(-1); }
  celebrate() { this.celebration=5; }
  update(game,time,dt) {
    const moving=game.mode==='playing'&&game.distance!==this.lastDistance;
    const bounce=moving?Math.sin(time*10)*.018:Math.sin(time*1.6)*.006;
    this.camera.position.set(game.x,2.05+game.jumpHeight+game.flightHeight+bounce,1.7-game.distance);
    const flightProgress=game.bonus.elapsed/RULES.bonusDuration;
    this.camera.rotation.x=-.055+(game.bonus.active?Math.sin(flightProgress*Math.PI*2)*.26:0);
    this.sky.position.copy(this.camera.position);
    const desiredRoll=(game.x-this.lastX||0)*-.1;
    this.camera.rotation.z=THREE.MathUtils.lerp(this.camera.rotation.z,desiredRoll,.08);
    this.mount.position.y=-.65+(moving?Math.sin(time*10+.5)*.025:0);
    this.mount.rotation.z=moving?Math.sin(time*5)*.015:0;
    this.mount.userData.hooves.forEach(hoof=>{hoof.visible=game.jumpHeight>.25;hoof.position.y=-.5+game.jumpHeight*.3;});
    if(this.horseId!==game.horseId)this.selectHorse(game.horseId);
    this.updateHead(game.jumpTime);
    this.lastDistance=game.distance;this.lastX=game.x;this.lastJumpHeight=game.jumpHeight;this.lastFlightHeight=game.flightHeight;
    this.sun.position.set(-12,23,-game.distance-22);
    this.sun.target.position.set(0,0,-game.distance-12);
    this.sunSprite.position.set(-18,18,-game.distance-65);
    this.rays.position.z=-game.distance;
    for(const chunk of this.chunks)while(chunk.position.z>this.camera.position.z+18)chunk.position.z-=this.chunks.length*12;
    // Reposition the same forest pool when replaying the route.
    if(game.distance===0)for(let i=0;i<this.chunks.length;i++)this.chunks[i].position.z=12-i*12;
    game.objects.forEach((o,i)=>{
      const mesh=this.objectMeshes[i];
      mesh.visible=!o.done&&o.z>game.distance-3&&o.z<game.distance+135&&(!game.bonus.active||o.type==='rainbow');
      if(o.type==='boss'){mesh.children[0].material.color.setHex(this.bossHitTime>0?0xffc6a9:0xffffff);mesh.rotation.z=this.bossThrowTime>0?Math.sin(this.bossThrowTime*18)*.04:0;}
      if(o.type==='rainbow'){mesh.position.y=1+Math.sin(time*2+i)*.1;mesh.rotation.y=Math.sin(time*1.3+i)*.12;}
      if(mesh.userData.lavaMap)mesh.userData.lavaMap.offset.y=time*.12;
    });
    game.herds.forEach((herd,h)=>{
      this.herdMeshes[h].forEach((runner,i)=>{
        const phase=(herd.elapsed-i*.52)/3.3;
        runner.visible=herd.elapsed>=0&&!herd.cleared&&phase>=0&&phase<=1;
        if(!runner.visible)return;
        runner.position.set(herd.direction*(-8+16*phase),.75+Math.abs(Math.sin(herd.elapsed*11+i))*.1,-herd.z+(i%2-.5)*.55);
        runner.scale.x=herd.direction;
        runner.material.map=artTextures.get((this.episodeId==='dino'?'dino-small-':'unicorn-run-')+(Math.floor(herd.elapsed*8+i)%2)+'.svg');
      });
    });
    (game.witches||[]).forEach((herd,h)=>{
      this.witchMeshes[h].forEach((witch,i)=>{
        const phase=(herd.elapsed-i*.52)/3.3;
        witch.visible=!game.bonus.active&&herd.elapsed>=0&&!herd.cleared&&phase>=0&&phase<=1;
        if(!witch.visible)return;
        witch.position.set(herd.direction*(-8+16*phase+Math.sin(phase*Math.PI*6)*1.1),2.2+Math.sin(phase*Math.PI*4+i)*.55,-herd.z+Math.sin(phase*Math.PI*6+i)*1.4);
        witch.rotation.z=Math.sin(phase*Math.PI*6)*.12;witch.scale.x=herd.direction;
      });
    });
    this.rockMeshes.forEach((mesh,i)=>{const rock=game.rocks[i];mesh.visible=!!rock&&!game.bonus.active;if(rock){mesh.position.set(rock.x,.36,-rock.z);mesh.rotation.x=rock.angle;mesh.rotation.z=rock.angle*.2;}});
    this.skyRoad.visible=game.distance>RULES.bonusStart-32&&game.distance<RULES.bonusEnd+6;
    this.bonusGate.visible=!game.bonus.active&&!game.bonus.finished&&game.distance<RULES.bonusStart;
    this.skyBackdrop.visible=this.episodeId==='dino'||game.flightHeight>1;
    this.skyBackdrop.material.opacity=this.episodeId==='dino'?1:Math.min(1,game.flightHeight/4);
    this.skyBackdrop.position.set(0,23,-game.distance-96);
    this.skyPickups.forEach((mesh,i)=>{mesh.visible=game.bonus.active&&!game.bonus.items[i].done;mesh.rotation.y=Math.sin(time*2+i)*.1;});
    this.bossHitTime=Math.max(0,this.bossHitTime-dt);this.bossThrowTime=Math.max(0,this.bossThrowTime-dt);
    this.flySeeds.forEach((f,i)=>{
      this.flyPositions[i*3]=f.x+Math.sin(time*.4+f.phase)*.3;
      this.flyPositions[i*3+1]=f.y+Math.sin(time*.6+f.phase)*.2;
      const offset=(f.z-game.distance%125+125)%125;
      this.flyPositions[i*3+2]=-game.distance-offset+2;
    });
    this.dragonflies.forEach((fly,i)=>{const phase=time*.7+i*2.1,offset=(i*2.3-game.distance%36+36)%36;fly.position.set(Math.sin(phase*.5)*3.8,1.2+Math.sin(phase)*.5,-game.distance-offset+2);fly.rotation.z=Math.sin(time*8+i)*.2;fly.scale.y=.8+Math.sin(time*22+i)*.2;});
    this.fliesGeometry.attributes.position.needsUpdate=true;
    if(this.celebration>0){this.celebration-=dt;for(let i=0;i<3;i++)this.burst.push({x:game.x+(Math.random()-.5)*6,y:3+Math.random()*3,z:-game.distance-3-Math.random()*6,vx:(Math.random()-.5),vy:-.7,vz:0,life:3,color:PALETTE[i%6]});}
    this.burst=this.burst.filter(p=>p.life>0).slice(-360);
    this.burst.forEach((p,i)=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=.9*dt;this.burstPositions.set([p.x,p.y,p.z],i*3);color.setHex(p.color);this.burstColors.set([color.r,color.g,color.b],i*3);});
    this.burstGeometry.attributes.position.needsUpdate=true;this.burstGeometry.attributes.color.needsUpdate=true;this.burstGeometry.setDrawRange(0,this.burst.length);
    this.shotTime=Math.max(0,this.shotTime-dt);
    this.shotGroup.visible=this.shotTime>0;
    this.shotBeams.forEach(mesh=>{mesh.material.opacity=Math.min(.95,this.shotTime*5);});
    this.shotFlash.material.opacity=Math.min(1,this.shotTime*4);
    this.composer.render();
  }
}
