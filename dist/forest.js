import * as THREE from './vendor/three.module.js';
import { RULES, skyHeightAt } from './rules.js?v=12';
import { HORSES } from './characters.js?v=12';
import { jumpHeadPose } from './animation.js?v=12';
import { LowPolyAssets, RAINBOW, seeded } from './low-poly-models.js?v=12';

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
function labelTexture(text,wide=false){
  const canvas=document.createElement('canvas');canvas.width=wide?768:256;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff6e5';ctx.fillRect(0,0,canvas.width,192);
  ctx.strokeStyle='#dbb47d';ctx.lineWidth=12;ctx.strokeRect(6,6,canvas.width-12,180);
  ctx.fillStyle='#416e60';ctx.font=`600 ${wide?64:65}px Fredoka, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,canvas.width/2,98);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function glowTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.18,'#fff0b2');gradient.addColorStop(1,'#ffdd7800');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
  return new THREE.CanvasTexture(canvas);
}

export class MagicForest{
  static async prepare(){await document.fonts?.ready;}
  constructor(canvas,objects,herds,options={}){
    this.assets=new LowPolyAssets();const a=this.assets;
    this.episodeId=options.episodeId||'forest';this.isDino=this.episodeId==='dino';
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(this.isDino?0xd4e2cc:0xe0eadb);
    this.scene.fog=new THREE.FogExp2(this.isDino?0xd4e2cc:0xe0eadb,.0082);
    this.camera=new THREE.PerspectiveCamera(64,16/9,.06,700);this.camera.position.set(0,2.05,1.7);this.camera.rotation.x=-.055;this.scene.add(this.camera);
    this.scene.add(new THREE.HemisphereLight(0xfff7e6,0x6c9484,1.8));
    this.sun=new THREE.DirectionalLight(0xffebcf,2.5);this.sun.position.set(-14,27,-20);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-18,right:18,top:25,bottom:-18,near:1,far:85});
    this.sun.shadow.bias=-.00035;this.sun.shadow.normalBias=.04;this.sun.shadow.radius=3;
    this.scene.add(this.sun,this.sun.target);
    const fill=new THREE.DirectionalLight(0xc4dfef,.65);fill.position.set(10,9,12);this.scene.add(fill);
    const riderLight=new THREE.PointLight(0xffe8cb,1.5,5,1.3);riderLight.position.set(-.8,1,-.3);this.camera.add(riderLight);
    this.reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
    this.lastDistance=0;this.lastX=0;this.shadowDistance=null;this.shotTime=0;this.bossHitTime=0;this.bossThrowTime=0;this.celebration=0;this.lastJumpHeight=0;this.lastFlightHeight=0;
    this.resolutionScale=1;this.slowFrames=0;this.lastFrameStamp=null;this.lastWrap=null;
    this.makeGround();this.makeSky();
    const forestSource=new THREE.Group();
    for(let i=0;i<9;i++){const chunk=a.forestChunk(i,this.episodeId);chunk.position.z=12-i*16;forestSource.add(chunk);}
    this.vegetation=a.batch(forestSource);this.scene.add(this.vegetation);
    this.wrapBatches=this.vegetation.children.map(mesh=>{mesh.frustumCulled=false;return {mesh,base:Float32Array.from(mesh.instanceMatrix.array)};});
    this.selectHorse(options.horseId||HORSES[0].id);
    this.objectMeshes=objects.map(object=>{
      let mesh;
      if(object.type==='rainbow')mesh=this.isDino?a.amber():a.rainbow();
      else if(object.type==='fence')mesh=this.isDino?a.obstacle(object.obstacle):a.fence();
      else mesh=a.creature(object.type,object.weapon,this.episodeId);
      mesh.position.set(object.x,object.type==='rainbow'?1.08:0,-object.z);
      if(['troll','dragon','boss'].includes(object.type))mesh.traverse(part=>{if(part.isMesh)part.castShadow=false;});
      this.scene.add(mesh);return mesh;
    });
    this.herdMeshes=herds.map(herd=>Array.from({length:herd.count},(_,i)=>{
      const runner=this.isDino?a.dinosaur('small'):a.unicorn(HORSES[i%3]);runner.scale.setScalar(this.isDino?.84:.72);runner.visible=false;runner.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});this.scene.add(runner);return runner;
    }));
    this.witchMeshes=(options.witches||[]).map(herd=>Array.from({length:herd.count},()=>{
      const flyer=this.isDino?a.pterodactyl():a.witch();flyer.visible=false;flyer.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});this.scene.add(flyer);return flyer;
    }));
    this.rockMeshes=Array.from({length:8},()=>{const rock=a.mesh(this.scene,'rock',0x82918a,0,.36,0,.36);rock.visible=false;return rock;});
    this.skyRoad=skyRoad(a);this.scene.add(this.skyRoad);
    this.skyPickups=Array.from({length:5},(_,i)=>{const z=RULES.bonusStart+(i+1)*(RULES.bonusEnd-RULES.bonusStart)/6;const mesh=this.isDino?a.amber():a.rainbow();mesh.scale.setScalar(.67);mesh.position.set(0,skyHeightAt(z)+1,-z);mesh.visible=false;this.scene.add(mesh);return mesh;});
    this.bonusGate=new THREE.Group();this.bonusGate.position.z=-RULES.bonusStart;this.scene.add(this.bonusGate);
    const gateArc=a.rainbow();gateArc.scale.setScalar(3.3);gateArc.position.y=.3;this.bonusGate.add(gateArc);
    const bonusMap=labelTexture('GALOP PO TĘCZY',true);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.64),new THREE.MeshStandardMaterial({map:bonusMap,roughness:.8,side:THREE.DoubleSide}));sign.position.set(0,2.18,.1);this.bonusGate.add(sign);
    if(this.isDino){
      this.volcano=a.volcano();this.volcano.position.z=-RULES.length-120;this.scene.add(this.volcano);
      this.cave=a.cave();this.cave.position.z=-RULES.length+4;this.scene.add(this.cave);
      const caveLight=new THREE.PointLight(0xffd08d,5,10,1.3);caveLight.position.set(0,2,-RULES.length+1);this.scene.add(caveLight);
    }else{
      const arch=a.rainbow();arch.scale.setScalar(7.3);arch.position.set(0,.7,-RULES.length);this.scene.add(arch);
      const map=labelTexture('META');const banner=new THREE.Mesh(new THREE.PlaneGeometry(2.3,.72),new THREE.MeshStandardMaterial({map,side:THREE.DoubleSide}));banner.position.set(0,3.2,-RULES.length+.06);this.scene.add(banner);
    }
    this.dragonflies=this.isDino?Array.from({length:10},()=>{const fly=a.dragonfly();this.scene.add(fly);return fly;}):[];
    this.makeEffects();
    this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  }
  makeGround(){
    const a=this.assets,random=seeded(55);
    const geometry=new THREE.PlaneGeometry(160,RULES.length+300,18,48);geometry.rotateX(-Math.PI/2);geometry.translate(0,-.07,-RULES.length/2);
    const position=geometry.attributes.position;
    for(let i=0;i<position.count;i++){const x=position.getX(i);if(Math.abs(x)>4)position.setY(i,-.1+(random()-.5)*Math.min(2.4,Math.abs(x)*.06));}
    geometry.computeVertexNormals();
    const ground=new THREE.Mesh(geometry,a.mat(this.isDino?0x7ca887:0x99b78f));ground.receiveShadow=true;this.scene.add(ground);
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
  resetEffects(){this.burst.length=0;this.shotTime=0;this.shotFresh=false;this.bossHitTime=0;this.bossThrowTime=0;this.celebration=0;this.shadowDistance=null;this.updateHead(-1);}
  celebrate(){this.celebration=4;}
  animate(actor,time,gait=0){
    const data=actor.userData;
    if(data.legs)data.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(gait+(i%2)*Math.PI)*.50);
    if(data.tail)data.tail.rotation.y=Math.sin(time*2.8)*.18;
    if(data.wings)data.wings.forEach((wing,i)=>{wing.rotation.z=Math.sin(time*(data.kind==='pterodactyl'?8:2.2))*(i?-.28:.28);});
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
    this.camera.position.set(game.x,2.05+game.jumpHeight+game.flightHeight+bounce,1.7-game.distance);
    const flight=game.bonus.elapsed/RULES.bonusDuration;this.camera.rotation.x=-.055+(game.bonus.active?Math.sin(flight*Math.PI*2)*.16:0);
    this.camera.rotation.z=THREE.MathUtils.lerp(this.camera.rotation.z,this.reducedMotion?0:(game.x-this.lastX)*-.08,1-Math.exp(-10*dt));
    this.sky.position.copy(this.camera.position);this.skyScenery.position.z=-game.distance;
    this.skyLandscape.position.set(0,0,-game.distance-80);this.skyLandscape.visible=game.flightHeight>1;
    if(this.horseId!==game.horseId)this.selectHorse(game.horseId);
    this.mount.position.y=-.8+(moving&&!this.reducedMotion?Math.sin(gait+.5)*.025:0);this.mount.rotation.z=moving&&!this.reducedMotion?Math.sin(gait*.5)*.013:0;
    this.mount.userData.hooves.forEach(hoof=>{hoof.visible=game.jumpHeight>.25;hoof.position.y=-.46+game.jumpHeight*.12;});this.updateHead(game.jumpTime,time);
    const shadowDistance=Math.floor(game.distance/1.5)*1.5;
    if(this.shadowDistance!==shadowDistance){this.shadowDistance=shadowDistance;this.sun.position.set(-14,27,-shadowDistance-20);this.sun.target.position.set(0,0,-shadowDistance-12);this.renderer.shadowMap.needsUpdate=true;}
    const wrap=Math.floor(game.distance/4);
    if(wrap!==this.lastWrap){
      this.lastWrap=wrap;const matrix=new THREE.Matrix4(),limit=this.camera.position.z+25,span=144;
      for(const {mesh,base}of this.wrapBatches){for(let i=0;i<mesh.count;i++){matrix.fromArray(base,i*16);const z=base[i*16+14];matrix.elements[14]=limit-((limit-z)%span+span)%span;mesh.setMatrixAt(i,matrix);}mesh.instanceMatrix.needsUpdate=true;}
      this.renderer.shadowMap.needsUpdate=true;
    }
    game.objects.forEach((object,i)=>{
      const mesh=this.objectMeshes[i];mesh.visible=!object.done&&object.z>game.distance-4&&object.z<game.distance+115&&(!game.bonus.active||object.type==='rainbow');
      if(object.type==='rainbow'){mesh.position.y=1.08+Math.sin(time*2+i)*.08;mesh.rotation.y=Math.sin(time*1.5+i)*.20;}
      else if(object.type!=='fence'){
        this.animate(mesh,time+i,0);const scale=mesh.userData.baseScale||(object.type==='boss'&&this.isDino?1.55:1);mesh.scale.y=scale*(1+Math.sin(time*2+i)*.012);
        if(object.type==='boss'){mesh.rotation.x=this.bossThrowTime>0?Math.sin(this.bossThrowTime*7)*-.05:0;mesh.visible=mesh.visible&&(this.bossHitTime<=0||Math.floor(this.bossHitTime*30)%2===0);}
      }
      if(mesh.userData.lava)mesh.userData.lava.material.emissiveIntensity=.5+Math.sin(time*2)*.09;
    });
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
