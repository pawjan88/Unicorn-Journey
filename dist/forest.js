import * as THREE from './vendor/three.module.js';
import { RULES, skyHeightAt } from './rules.js?v=16';
import { HORSES } from './characters.js?v=12';
import { jumpHeadPose } from './animation.js?v=12';
import { LowPolyAssets, RAINBOW, seeded } from './low-poly-models.js?v=14';
import { riderCameraPose } from './ride-camera.js?v=16';
import {GIANT} from './giant-encounter.js?v=14';
import {terrainHeightAt,riverMeander,riverHeightAt} from './environment-profile.js?v=14';
import {CaveWorld} from './cave-world.js?v=16';
import {caveCrystal,caveGolem,crystalCrab,crystalLizard,caveBat,crystalTurtle,caveObstacle} from './cave-models.js?v=16';

const up=new THREE.Vector3(0,1,0);
function skyRoad(assets){
  const group=new THREE.Group(),steps=80;
  for(let band=0;band<6;band++){
    const positions=[],indices=[];
    for(let row=0;row<=steps;row++){
      const z=RULES.bonusStart+(RULES.bonusEnd-RULES.bonusStart)*row/steps;
      for(const side of [0,1])positions.push(-RULES.halfWidth+(band+side)*RULES.halfWidth*2/6,skyHeightAt(z)+.025,-z);
      if(row<steps){const a=row*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry,assets.mat(RAINBOW[band],{side:THREE.DoubleSide,roughness:.5,emissive:RAINBOW[band],emissiveIntensity:.12})));
  }
  for(const side of [-1,1]){
    const points=Array.from({length:81},(_,i)=>{const z=RULES.bonusStart+(RULES.bonusEnd-RULES.bonusStart)*i/80;return new THREE.Vector3(side*(RULES.halfWidth+.03),skyHeightAt(z)+.06,-z);});
    const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),80,.045,5,false);
    group.add(new THREE.Mesh(geometry,assets.mat(0xffe6a3,{emissive:0xe7be70,emissiveIntensity:.25})));
  }
  return group;
}
function glowTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.18,'#fff0b2');gradient.addColorStop(1,'#ffdd7800');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
  return new THREE.CanvasTexture(canvas);
}
function natureTexture(foliage=false){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'),random=seeded(foliage?912:322);ctx.fillStyle=foliage?'#d6dcc5':'#d2dcb9';ctx.fillRect(0,0,128,128);
  for(let i=0;i<260;i++){const x=random()*128,y=random()*128,size=2+random()*10;ctx.fillStyle=i%2?'#91ab7b':'#f0edcb';ctx.globalAlpha=.08+random()*.15;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+size,y-size*.3);ctx.lineTo(x+size*.7,y+size*.65);ctx.lineTo(x-size*.3,y+size*.4);ctx.fill();}
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(foliage?2:18,foliage?2:70);tex.anisotropy=4;return tex;
}
function lavaTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),random=seeded(491);
  ctx.fillStyle='#e47d30';ctx.fillRect(0,0,256,256);
  for(let i=0;i<95;i++){const x=random()*256,y=random()*256;ctx.fillStyle=i%3?'#a8532c':'#ffd282';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+16+random()*32,y-3);ctx.lineTo(x+26,y+8+random()*10);ctx.lineTo(x-7,y+5);ctx.fill();}
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,1);return tex;
}

export class MagicForest{
  static async prepare(){await document.fonts?.ready;}
  constructor(canvas,objects,herds,options={}){
    this.assets=new LowPolyAssets();const a=this.assets;
    this.episodeId=options.episodeId||'forest';this.isDino=this.episodeId==='dino';this.isCave=this.episodeId==='cave';
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(this.isCave?0x263e4e:this.isDino?0xd4e2cc:0xe0eadb);
    this.scene.fog=new THREE.FogExp2(this.scene.background,this.isCave?.012:this.isDino?.0058:.0054);
    this.camera=new THREE.PerspectiveCamera(64,16/9,.06,700);this.camera.position.set(0,2.05,1.7);this.camera.rotation.x=-.055;this.scene.add(this.camera);
    this.ambient=new THREE.HemisphereLight(this.isCave?0xbad9ee:0xfff7e6,this.isCave?0x47465d:0x6c9484,this.isCave?1.3:1.8);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight(this.isCave?0xc5e9ed:0xffebcf,this.isCave?.95:2.5);this.sun.position.set(-14,27,-20);this.sun.castShadow=!this.isCave;
    this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-18,right:18,top:25,bottom:-18,near:1,far:85});
    this.sun.shadow.bias=-.00035;this.sun.shadow.normalBias=.04;this.sun.shadow.radius=3;
    this.scene.add(this.sun,this.sun.target);
    const fill=new THREE.DirectionalLight(0xc4dfef,.65);fill.position.set(10,9,12);this.scene.add(fill);
    const riderLight=new THREE.PointLight(this.isCave?0xc4efee:0xffe8cb,this.isCave?3.2:1.5,this.isCave?22:5,1.3);riderLight.position.set(-.8,1,-.3);this.camera.add(riderLight);
    this.reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
    this.lastDistance=0;this.lastX=0;this.shadowDistance=null;this.shotTime=0;this.bossHitTime=0;this.bossThrowTime=0;this.celebration=0;this.lastJumpHeight=0;this.lastFlightHeight=0;
    this.resolutionScale=1;this.slowFrames=0;this.lastFrameStamp=null;this.lastWrap=null;
    this.giantQuake=0;this.giantQuakeFresh=false;this.giantLook=0;this.shake=0;this.cameraRoll=0;
    this.lavaRows=objects.filter(object=>object.obstacle==='lava').map(object=>object.z);
    this.wrapBatches=[];
    if(this.isCave)this.caveWorld=new CaveWorld(a,this.scene);
    else{
      this.makeGround();this.makeSky();
      const forestSource=new THREE.Group();
      for(let i=0;i<9;i++){const chunk=a.forestChunk(i,this.episodeId);chunk.position.z=12-i*16;forestSource.add(chunk);}
      this.vegetation=a.batch(forestSource);this.scene.add(this.vegetation);
      this.wrapBatches=this.vegetation.children.map(mesh=>{mesh.frustumCulled=false;return {mesh,base:Float32Array.from(mesh.instanceMatrix.array)};});
      this.deepForest=a.deepForest(this.episodeId,this.lavaRows);this.scene.add(this.deepForest);
      this.foliageTexture=natureTexture(true);for(const mat of a.materials.values())if(mat.name==='foliage'){mat.map=this.foliageTexture;mat.needsUpdate=true;}
    }
    this.selectHorse(options.horseId||HORSES[0].id);
    this.objectMeshes=objects.map(object=>{
      let mesh;
      if(object.type==='rainbow')mesh=this.isCave?caveCrystal(a):this.isDino?a.amber():a.rainbow();
      else if(object.type==='fence')mesh=this.isCave?caveObstacle(a,object.obstacle,object.z):this.isDino?a.obstacle(object.obstacle,object.z):a.fence();
      else if(this.isCave)mesh=object.type==='dragon'?crystalCrab(a):caveGolem(a,object.type==='boss');
      else mesh=a.creature(object.type,object.weapon,this.episodeId);
      mesh.position.set(object.x,object.type==='rainbow'?1.08:0,-object.z);
      if(['troll','dragon','boss'].includes(object.type))mesh.traverse(part=>{if(part.isMesh)part.castShadow=false;});
      this.scene.add(mesh);return mesh;
    });
    this.herdMeshes=herds.map(herd=>Array.from({length:herd.count},(_,i)=>{
      const runner=this.isCave?crystalLizard(a):this.isDino?a.stegosaurus():a.unicorn(HORSES[i%3]);runner.scale.setScalar(this.isCave?.9:this.isDino?.84:.72);runner.visible=false;runner.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});this.scene.add(runner);return runner;
    }));
    this.witchMeshes=(options.witches||[]).map(herd=>Array.from({length:herd.count},()=>{
      const flyer=this.isCave?caveBat(a):this.isDino?a.pterodactyl():a.witch();flyer.visible=false;flyer.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});this.scene.add(flyer);return flyer;
    }));
    this.rockMeshes=Array.from({length:8},()=>{const rock=a.mesh(this.scene,'rock',0x82918a,0,.36,0,.36);rock.visible=false;return rock;});
    if(this.isDino){
      this.lavaTexture=lavaTexture();for(const mesh of this.objectMeshes)if(mesh.userData.lava){mesh.userData.lava.material.map=this.lavaTexture;mesh.userData.lava.material.emissiveMap=this.lavaTexture;mesh.userData.lava.material.needsUpdate=true;}
      this.giantActor=a.giganotosaurus();this.giantActor.scale.setScalar(GIANT.scale);this.giantActor.visible=false;this.giantActor.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});this.scene.add(this.giantActor);
    }
    if(this.isCave){this.giantActor=crystalTurtle(a);this.giantActor.scale.setScalar(2.4);this.giantActor.visible=false;this.giantActor.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});this.scene.add(this.giantActor);}
    this.skyRoad=skyRoad(a);this.scene.add(this.skyRoad);
    this.skyPickups=Array.from({length:5},(_,i)=>{const z=RULES.bonusStart+(i+1)*(RULES.bonusEnd-RULES.bonusStart)/6;const mesh=this.isCave?caveCrystal(a):this.isDino?a.amber():a.rainbow();mesh.scale.setScalar(.67);mesh.position.set(0,skyHeightAt(z)+1,-z);mesh.visible=false;this.scene.add(mesh);return mesh;});
    this.bonusGate=new THREE.Group();this.bonusGate.position.z=-RULES.bonusStart;this.scene.add(this.bonusGate);
    const gateArc=a.rainbow();gateArc.scale.setScalar(3.3);gateArc.position.y=.3;this.bonusGate.add(gateArc);
    if(this.isDino){
      this.volcano=a.volcano();this.volcano.position.z=-RULES.length-120;this.scene.add(this.volcano);
      this.cave=a.cave();this.cave.position.z=-RULES.length+4;this.scene.add(this.cave);
      const caveLight=new THREE.PointLight(0xffd08d,5,10,1.3);caveLight.position.set(0,2,-RULES.length+1);this.scene.add(caveLight);
    }else if(!this.isCave){
      const arch=a.rainbow();arch.scale.setScalar(7.3);arch.position.set(0,.7,-RULES.length);this.scene.add(arch);
    }
    this.dragonflies=this.isDino?Array.from({length:10},()=>{const fly=a.dragonfly();this.scene.add(fly);return fly;}):[];
    this.makeEffects();
    this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  }
  makeGround(){
    const a=this.assets,random=seeded(55);
    const geometry=new THREE.PlaneGeometry(320,RULES.length+600,32,70);geometry.rotateX(-Math.PI/2);geometry.translate(0,0,-RULES.length/2);
    const position=geometry.attributes.position;
    for(let i=0;i<position.count;i++)position.setY(i,terrainHeightAt(position.getX(i),position.getZ(i)));
    geometry.computeVertexNormals();
    const ground=new THREE.Mesh(geometry,a.mat(this.isDino?0x7ca887:0x99b78f));this.groundTexture=natureTexture();ground.material.map=this.groundTexture;ground.receiveShadow=true;this.scene.add(ground);
    a.mesh(this.scene,'box',this.isDino?0xcebb8e:0xe6c998,0,-.055,-RULES.length/2,RULES.halfWidth*2,.11,RULES.length+90).castShadow=false;
    const edges=new THREE.Group();
    for(let z=0;z<RULES.length+15;z+=1.5)for(const side of [-1,1])a.mesh(edges,'rock',this.isDino?0x91a58c:0xaab697,side*(RULES.halfWidth+.13),.035,-z,.17+random()*.12,.085,.28+random()*.2);
    this.scene.add(a.batch(edges));
  }
  makeSky(){
    const a=this.assets;
    const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 direction;void main(){float y=pow(max(normalize(direction).y,0.0),.6);vec3 color=mix(vec3(.96,.94,.83),vec3(.62,.82,.87),y);gl_FragColor=vec4(color,1.0);}'});
    this.sky=new THREE.Mesh(new THREE.SphereGeometry(640,16,12),material);this.sky.renderOrder=-1000;this.scene.add(this.sky);
    this.skyScenery=new THREE.Group();this.scene.add(this.skyScenery);
    const random=seeded(91);
    for(let i=0;i<7;i++){
      const x=(i-3)*32,y=28+random()*25,z=-130-random()*65;
      for(let puff=0;puff<3;puff++){const cloud=a.mesh(this.skyScenery,'round',a.mat(0xfff8e9,{fog:false,roughness:1}),x+puff*4,y+(puff%2)*2,z,7,3.0+random()*2,3.5);cloud.castShadow=false;}
    }
    this.sunBall=a.mesh(this.skyScenery,'round',new THREE.MeshBasicMaterial({color:0xffe9ba,fog:false}),-65,60,-230,8);this.sunBall.castShadow=false;
    this.skyLandscape=new THREE.Group();this.scene.add(this.skyLandscape);
    for(const [x,y,z,s,color]of [[-95,-17,-60,75,0xa8bda8],[80,-18,-110,85,0xc0cbb8],[-30,-18,-160,100,0xb2c5b7]]){
      const hill=a.mesh(this.skyLandscape,'round',a.mat(color,{fog:false}),x,y,z,s,30,s*.6);hill.castShadow=false;
    }
    const mound=new THREE.Mesh(new THREE.CylinderGeometry(14,32,18,7),a.mat(0x8fad8f,{fog:false}));mound.position.set(35,9,-52);this.skyLandscape.add(mound);
    const castle=a.castle();castle.position.set(35,18,-52);castle.scale.setScalar(1.1);castle.traverse(part=>{if(part.isMesh){part.material=a.mat(part.material.color.getHex(),{fog:false});part.castShadow=false;}});this.skyLandscape.add(castle);
    this.skyLandscape.visible=false;
  }
  makeEffects(){
    this.glow=glowTexture();const random=seeded(719);
    this.flySeeds=Array.from({length:100},()=>({x:(random()-.5)*21,y:.4+random()*3.3,z:random()*110,phase:random()*6.28}));
    this.flyPositions=new Float32Array(this.flySeeds.length*3);this.flyGeometry=new THREE.BufferGeometry();this.flyGeometry.setAttribute('position',new THREE.BufferAttribute(this.flyPositions,3));
    this.flies=new THREE.Points(this.flyGeometry,new THREE.PointsMaterial({map:this.glow,color:0xffe9aa,size:.075,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));this.flies.frustumCulled=false;this.scene.add(this.flies);
    this.burst=[];this.burstPositions=new Float32Array(360*3);this.burstColors=new Float32Array(360*3);this.burstGeometry=new THREE.BufferGeometry();this.burstGeometry.setAttribute('position',new THREE.BufferAttribute(this.burstPositions,3));this.burstGeometry.setAttribute('color',new THREE.BufferAttribute(this.burstColors,3));this.burstGeometry.setDrawRange(0,0);
    const sparkles=new THREE.Points(this.burstGeometry,new THREE.PointsMaterial({map:this.glow,size:.13,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sparkles.frustumCulled=false;this.scene.add(sparkles);
    this.shotGroup=new THREE.Group();this.shotGroup.visible=false;this.scene.add(this.shotGroup);
    this.shotBeams=RAINBOW.map(hex=>this.assets.mesh(this.shotGroup,'cylinder',new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.9,depthWrite:false}),0,0,0,.014,1,.014));
    this.shotFlash=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glow,color:0xffe6b5,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));this.shotFlash.scale.set(.6,.6,1);this.shotGroup.add(this.shotFlash);
    this.shotGroup.traverse(part=>{part.castShadow=false;part.receiveShadow=false;});
    this.shotEnd=new THREE.Vector3();
  }
  resize(){
    const rect=this.renderer.domElement.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    const ratio=Math.min(window.devicePixelRatio||1,1.5,1600/w)*this.resolutionScale;
    this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.needsUpdate=true;
  }
  selectHorse(id){
    const horse=HORSES.find(horse=>horse.id===id)||HORSES[0];this.horseId=horse.id;
    if(this.mount)this.camera.remove(this.mount);
    this.mount=this.assets.rider(horse);this.mount.rotation.y=Math.PI;this.mount.position.set(0,-.80,-1.36);this.mount.scale.setScalar(.9);this.camera.add(this.mount);this.updateHead(-1);
  }
  updateHead(jumpTime,time=0){
    const pose=jumpHeadPose(jumpTime,RULES.jumpDuration),head=this.mount.userData.head;
    head.rotation.y=-2.35*pose.turn;head.rotation.z=.065*pose.turn;
    head.position.set(-.02*pose.turn,.18+.20*pose.turn,pose.turn*.18);
    if(pose.turn===0&&!this.reducedMotion)head.rotation.z=Math.sin(time*1.8)*.005;
    this.headFrame=pose.frame;this.headTurn=pose.turn;
  }
  collect(object){for(let i=0;i<24;i++)this.burst.push({x:object.x,y:object.y??1.05,z:-object.z,vx:(Math.random()-.5)*2,vy:Math.random()*2,vz:(Math.random()-.5)*1.5,life:1.2,color:RAINBOW[i%6]});}
  fire(event){this.shotTime=.36;this.shotFresh=true;this.shotEnd.set(event.end.x,event.end.y,-event.end.z);if(event.target){this.collect({...event.target,y:event.target.type==='boss'?2:1});if(event.target.type==='boss')this.bossHitTime=.25;}}
  bossThrow(){this.bossThrowTime=.4;}
  resetEffects(){this.burst.length=0;this.shotTime=0;this.shotFresh=false;this.bossHitTime=0;this.bossThrowTime=0;this.celebration=0;this.giantQuake=0;this.giantQuakeFresh=false;this.shake=0;this.giantLook=0;this.cameraRoll=0;this.shadowDistance=null;this.updateHead(-1);}
  celebrate(){this.celebration=4;}
  rideView(){return {y:this.camera.position.y,z:this.camera.position.z,pitch:this.camera.rotation.x,clearance:this.camera.position.y-skyHeightAt(-this.camera.position.z),headScale:this.mount.userData.head.scale.x};}
  giantStep(x){this.giantQuake=.36*Math.max(0,1-Math.abs(x)/32);this.giantQuakeFresh=true;}
  environmentView(){return {deepTrees:this.deepForest?.userData.treeCount||0,beamShadowCasters:this.shotBeams.filter(mesh=>mesh.castShadow).length,lavaOffset:this.lavaTexture?.offset.x,giantJaw:this.giantActor?.userData.jaw?.rotation.x,shake:this.shake,giantLook:this.giantLook,roarVisible:this.giantActor?.visible,cave:this.caveWorld?.diagnostics()};}
  animate(actor,time,gait=0){
    const data=actor.userData;
    if(data.legs)data.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(gait+(i%2)*Math.PI)*(['giganotosaurus','crystal-turtle'].includes(data.kind)?.27:.50));
    if(data.tail)data.tail.rotation.y=Math.sin(time*2.8)*.18;
    if(data.wings)data.wings.forEach((wing,i)=>{wing.rotation.z=Math.sin(time*(['pterodactyl','cave-bat'].includes(data.kind)?8:2.2))*(i?-.28:.28);});
    if(data.arm)data.arm.rotation.x=this.bossThrowTime>0?Math.sin(this.bossThrowTime*6)*-.8:Math.sin(time*1.7)*.05;
    if(!['unicorn','witch','pterodactyl'].includes(data.kind))actor.rotation.z=Math.sin(time*1.8)*.012;
  }
  update(game,time,dt){
    const now=performance.now();
    if(this.lastFrameStamp!==null&&dt>0){this.slowFrames=now-this.lastFrameStamp>85?this.slowFrames+1:Math.max(0,this.slowFrames-1);}
    this.lastFrameStamp=now;
    if(this.slowFrames>=10&&this.resolutionScale>.65){this.resolutionScale=Math.max(.65,this.resolutionScale-.15);this.slowFrames=0;this.resize();}
    const a=this.assets,moving=game.mode==='playing'&&Math.abs(game.distance-this.lastDistance)>.0001,gait=game.distance*2.8;
    const bounce=this.reducedMotion?0:moving?Math.sin(gait)*.025:Math.sin(time*1.5)*.004;
    const ride=riderCameraPose(game.distance);
    this.camera.position.set(game.x,ride.y+game.jumpHeight+(game.bonus.active?0:bounce),ride.z);
    const giant=game.giant,nearGiant=giant&&!giant.done&&giant.visible;
    const proximity=nearGiant?THREE.MathUtils.clamp((game.distance-(GIANT.z-12))/(12-GIANT.stopDistance),0,1):0;
    const lookTarget=nearGiant?(this.isCave?.20:.50)*proximity*Math.max(0,1-Math.abs(giant.x)/28):0;
    this.giantLook=THREE.MathUtils.lerp(this.giantLook,lookTarget,1-Math.exp(-4*dt));
    this.giantQuake=Math.max(0,this.giantQuake-(this.giantQuakeFresh?0:dt));this.giantQuakeFresh=false;this.shake=this.reducedMotion?0:this.giantQuake;
    this.camera.position.x+=Math.sin(time*43)*this.shake*.15;this.camera.position.y+=Math.cos(time*47)*this.shake*.16;
    this.camera.rotation.x=ride.pitch+this.giantLook;
    this.cameraRoll=THREE.MathUtils.lerp(this.cameraRoll,this.reducedMotion?0:(game.x-this.lastX)*-.08,1-Math.exp(-10*dt));
    this.camera.rotation.z=this.cameraRoll+Math.sin(time*39)*this.shake*.025;
    if(this.sky){this.sky.position.copy(this.camera.position);this.skyScenery.position.z=-game.distance;this.skyLandscape.position.set(0,0,-game.distance-80);this.skyLandscape.visible=game.flightHeight>1;}
    if(this.caveWorld){
      this.caveWorld.update(game,time,dt);const daylight=game.boss.done?THREE.MathUtils.clamp((game.distance-382)/12,0,1):0;
      this.scene.background.setHex(0x263e4e).lerp(new THREE.Color(0xb9e2df),daylight);this.scene.fog.color.copy(this.scene.background);this.scene.fog.density=.012*(1-daylight)+.006*daylight;this.ambient.intensity=1.3+daylight*.8;this.sun.intensity=.95+daylight*1.3;
    }
    if(this.horseId!==game.horseId)this.selectHorse(game.horseId);
    this.mount.position.y=-.8+(moving&&!this.reducedMotion?Math.sin(gait+.5)*.025:0);this.mount.rotation.z=moving&&!this.reducedMotion?Math.sin(gait*.5)*.013:0;
    this.mount.userData.hooves.forEach(hoof=>{hoof.visible=game.jumpHeight>.25;hoof.position.y=-.46+game.jumpHeight*.12;});this.updateHead(game.jumpTime,time);
    const shadowDistance=Math.floor(game.distance/1.5)*1.5;
    if(this.shadowDistance!==shadowDistance){this.shadowDistance=shadowDistance;this.sun.position.set(-14,27,-shadowDistance-20);this.sun.target.position.set(0,0,-shadowDistance-12);this.renderer.shadowMap.needsUpdate=true;}
    const wrap=Math.floor(game.distance/4);
    if(wrap!==this.lastWrap){
      this.lastWrap=wrap;const matrix=new THREE.Matrix4(),limit=this.camera.position.z+25,span=144;
      for(const {mesh,base}of this.wrapBatches){for(let i=0;i<mesh.count;i++){matrix.fromArray(base,i*16);const z=base[i*16+14];matrix.elements[14]=limit-((limit-z)%span+span)%span;matrix.elements[13]=base[i*16+13]+terrainHeightAt(matrix.elements[12],matrix.elements[14]);mesh.setMatrixAt(i,matrix);}mesh.instanceMatrix.needsUpdate=true;}
      this.renderer.shadowMap.needsUpdate=true;
    }
    game.objects.forEach((object,i)=>{
      const mesh=this.objectMeshes[i];mesh.visible=mesh.userData.lava?Math.abs(object.z-game.distance)<165:!object.done&&object.z>game.distance-4&&object.z<game.distance+115&&(!game.bonus.active||object.type==='rainbow');
      if(this.isCave&&object.type==='boss'){
        mesh.visible=object.z>game.distance-18&&object.z<game.distance+115&&!game.bonus.active;
        mesh.position.x=THREE.MathUtils.lerp(mesh.position.x,object.done?4.5:object.x,1-Math.exp(-4*dt));
        (mesh.userData.crystalSegments||[]).forEach((segment,i)=>{segment.material.emissiveIntensity=i<(3-object.hp)?.9:.12;});
      }
      if(object.type==='rainbow'){mesh.position.y=1.08+Math.sin(time*2+i)*.08;mesh.rotation.y=Math.sin(time*1.5+i)*.20;}
      else if(object.type!=='fence'){
        this.animate(mesh,this.isCave&&object.done?0:time+i,0);const scale=mesh.userData.baseScale||(object.type==='boss'&&this.isDino?1.55:1);mesh.scale.y=scale*(1+Math.sin(time*2+i)*.012);
        if(object.type==='boss'){mesh.rotation.x=this.bossThrowTime>0?Math.sin(this.bossThrowTime*7)*-.05:0;mesh.visible=mesh.visible&&(this.bossHitTime<=0||Math.floor(this.bossHitTime*30)%2===0);}
      }
      if(mesh.userData.lava&&mesh.visible){mesh.userData.lava.material.emissiveIntensity=.64+Math.sin(time*2)*.09;mesh.userData.streaks.forEach((streak,i)=>{const x=(streak.userData.seedX+90+time*1.7)%180-90,z=riverMeander(x)+Math.sin(i*2.1)*.23;streak.position.set(x,riverHeightAt(x,-object.z+z)+.018,z);streak.scale.x=.34+Math.sin(time*2+i)*.07;});}
    });
    if(this.lavaTexture)this.lavaTexture.offset.x=-time*.20;
    if(this.giantActor){
      this.giantActor.visible=!!nearGiant;
      if(nearGiant){
        const actor=this.giantActor;actor.position.set(giant.x,(this.isCave?0:terrainHeightAt(giant.x,-giant.z))+.07+(giant.walking?Math.abs(Math.sin(giant.gait))*.075:0),-giant.z);actor.rotation.y=Math.PI/2;
        this.animate(actor,giant.elapsed,giant.gait);actor.updateWorldMatrix(true,true);
        const head=actor.userData.head,headPosition=head.getWorldPosition(new THREE.Vector3());
        const facing=Math.atan2(this.camera.position.x-headPosition.x,this.camera.position.z-headPosition.z)-Math.PI/2;
        head.rotation.y=facing*giant.look;head.rotation.x=.18*giant.look;if(actor.userData.jaw)actor.userData.jaw.rotation.x=giant.jaw;
      }
    }
    game.herds.forEach((herd,h)=>this.herdMeshes[h].forEach((runner,i)=>{
      const phase=(herd.elapsed-i*.52)/3.3;runner.visible=herd.elapsed>=0&&!herd.cleared&&phase>=0&&phase<=1;
      if(!runner.visible)return;runner.position.set(herd.direction*(-8+16*phase),Math.abs(Math.sin(herd.elapsed*10+i))*.04,-herd.z+(i%2-.5)*.6);runner.rotation.y=herd.direction*Math.PI/2;this.animate(runner,herd.elapsed,herd.elapsed*11+i);
    }));
    (game.witches||[]).forEach((herd,h)=>this.witchMeshes[h].forEach((flyer,i)=>{
      const phase=(herd.elapsed-i*.52)/3.3;flyer.visible=!game.bonus.active&&herd.elapsed>=0&&!herd.cleared&&phase>=0&&phase<=1;if(!flyer.visible)return;
      flyer.position.set(herd.direction*(-8+16*phase+Math.sin(phase*Math.PI*6)*1.1),2.1+Math.sin(phase*Math.PI*4+i)*.45,-herd.z+Math.sin(phase*Math.PI*6+i)*1.4);flyer.rotation.y=herd.direction*Math.PI/2;flyer.rotation.z=Math.sin(phase*Math.PI*6)*.12;this.animate(flyer,herd.elapsed+i);
    }));
    this.rockMeshes.forEach((mesh,i)=>{const rock=game.rocks[i];mesh.visible=!!rock&&!game.bonus.active;if(rock){mesh.position.set(rock.x,.36,-rock.z);mesh.rotation.x=rock.angle;mesh.rotation.z=rock.angle*.2;}});
    this.skyRoad.visible=game.distance>RULES.bonusStart-35&&game.distance<RULES.bonusEnd+7;this.bonusGate.visible=!game.bonus.active&&!game.bonus.finished&&game.distance<RULES.bonusStart;
    this.skyPickups.forEach((mesh,i)=>{mesh.visible=game.bonus.active&&!game.bonus.items[i].done;mesh.rotation.y=Math.sin(time*1.8+i)*.13;});
    this.dragonflies.forEach((fly,i)=>{const phase=time*.7+i*2.1,offset=(i*3.3-game.distance%38+38)%38;fly.position.set(Math.sin(phase*.5)*3.8,1.2+Math.sin(phase)*.6,-game.distance-offset+2);fly.rotation.y=Math.sin(phase*.7);fly.userData.wings.forEach((wing,j)=>wing.rotation.z=Math.sin(time*35+i)*(j%2?-.4:.4));});
    if(this.volcano)this.volcano.userData.smoke.forEach((puff,i)=>puff.position.x=Math.sin(time*.16+i)*5+i*1.5);
    this.flySeeds.forEach((fly,i)=>{this.flyPositions.set([fly.x+Math.sin(time*.4+fly.phase)*.3,fly.y+Math.sin(time*.7+fly.phase)*.2,-game.distance-(fly.z-game.distance%110+110)%110+2],i*3);});this.flyGeometry.attributes.position.needsUpdate=true;
    if(this.celebration>0){this.celebration-=dt;for(let i=0;i<3;i++)this.burst.push({x:game.x+(Math.random()-.5)*6,y:3+Math.random()*3,z:-game.distance-3-Math.random()*6,vx:Math.random()-.5,vy:-.5,vz:0,life:2,color:RAINBOW[i]});}
    this.burst=this.burst.filter(particle=>particle.life>0).slice(-360);const color=new THREE.Color();
    this.burst.forEach((p,i)=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=.9*dt;this.burstPositions.set([p.x,p.y,p.z],i*3);color.setHex(p.color);this.burstColors.set([color.r,color.g,color.b],i*3);});
    this.burstGeometry.attributes.position.needsUpdate=true;this.burstGeometry.attributes.color.needsUpdate=true;this.burstGeometry.setDrawRange(0,this.burst.length);
    this.shotTime=Math.max(0,this.shotTime-(this.shotFresh?0:dt));this.shotFresh=false;this.shotGroup.visible=this.shotTime>0;
    if(this.shotTime>0){
      this.camera.updateWorldMatrix(true,true);const start=this.mount.userData.hornTip.getWorldPosition(new THREE.Vector3()),direction=this.shotEnd.clone().sub(start),length=direction.length();
      this.shotBeams.forEach((beam,i)=>{beam.position.copy(start).add(this.shotEnd).multiplyScalar(.5);beam.position.x+=(i-2.5)*.025;beam.quaternion.setFromUnitVectors(up,direction.clone().normalize());beam.scale.set(.015,length,.015);beam.material.opacity=Math.min(.9,this.shotTime*5);});this.shotFlash.position.copy(start);this.shotFlash.material.opacity=Math.min(1,this.shotTime*5);
    }
    this.bossHitTime=Math.max(0,this.bossHitTime-dt);this.bossThrowTime=Math.max(0,this.bossThrowTime-dt);
    this.lastDistance=game.distance;this.lastX=game.x;this.lastJumpHeight=game.jumpHeight;this.lastFlightHeight=game.flightHeight;
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){
    this.resizeObserver.disconnect();const geometries=new Set(Object.values(this.assets.geometries)),materials=new Set(this.assets.materials.values()),textures=new Set([this.glow]);
    this.scene.traverse(object=>{object.shadow?.map?.dispose();if(object.geometry)geometries.add(object.geometry);for(const mat of(Array.isArray(object.material)?object.material:[object.material]))if(mat){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}});
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());this.renderer.dispose();
  }
}
