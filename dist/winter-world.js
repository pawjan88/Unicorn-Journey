import {mountain} from './organic-geometry.js';
import {landscapeSurface} from './nature-surfaces.js';
import * as THREE from './vendor/three.module.js';
import {winterSister} from './winter-models.js?v=17';

const smooth=(a,b,value)=>{const t=THREE.MathUtils.clamp((value-a)/(b-a),0,1);return t*t*(3-2*t);};
const seeded=seed=>{let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);};
export function winterSectionAt(distance){return distance<130?'snowy-forest':distance<320?'frozen-lake':distance<388?'castle-pass':'castle-courtyard';}
function winterTexture(ice=false){
  const size=64,data=new Uint8Array(size*size*4),random=seeded(ice?349:177);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const vein=Math.sin(x*.35+Math.sin(y*.17))*Math.cos(y*.21),grain=random()*11;
    const v=ice?211+vein*15+grain:232+grain;
    const i=(y*size+x)*4;data.set([v-(ice?22:1),v-(ice?5:0),Math.min(255,v+9),255],i);
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
function snowDot(){
  const size=16,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.hypot(x-7.5,y-7.5)/8;data.set([242,251,255,Math.round(Math.max(0,1-r)*220)],i);}
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.needsUpdate=true;return texture;
}

// Rendering and visual rescue choreography; the game owns damage and rescue state.
export class WinterWorld{
  constructor(assets,scene){
    this.assets=assets;this.scene=scene;this.root=new THREE.Group();this.root.name='ice-kingdom-world';scene.add(this.root);
    this.distance=0;this.currentSection=winterSectionAt(0);this.freedAt=null;this.rescueProgress=0;this.princessesFreed=false;this.gateOpen=false;this.auroraStrength=.18;this.treeCount=0;
    this.makeGround();this.makeSky();this.makeScenery();this.makeLake();this.makeCastle();this.makeRescue();this.makeSnow();
    this.castleLight=new THREE.PointLight(0x8edfed,15,35,1.5);this.castleLight.position.set(0,6,-391);this.root.add(this.castleLight);
    this.update({distance:0,boss:{hp:3,done:false},rescue:{freed:false}},0,0);
  }
  makeGround(){
    const a=this.assets;
    const geometry=new THREE.PlaneGeometry(250,650);geometry.rotateX(-Math.PI/2);geometry.translate(0,-.08,-210);a.geometries.winterSnowFloor=geometry;
    const material=a.mat(0xdbe9ee,{name:'winter-snow-floor'});landscapeSurface(material,'snow_02',48,125,.46);
    const floor=new THREE.Mesh(geometry,material);floor.receiveShadow=true;this.root.add(floor);
    this.path=a.mesh(this.root,'box',a.mat(0xb9d1da,{name:'winter-riding-path'}),0,-.055,-205,4.2,.11,470);landscapeSurface(this.path.material,'snow_02',1,110,.34);this.path.castShadow=false;this.path.receiveShadow=true;
    const source=new THREE.Group(),random=seeded(54),stone=a.mat(0x87adbf,{name:'winter-path-markers'});
    for(let d=0;d<430;d+=2)for(const side of [-1,1])a.mesh(source,'rock',stone,side*2.37,.035,-d,.08+random()*.04,.05,.14);
    this.pathEdges=a.batch(source);this.pathEdges.name='winter-path-edges';this.pathEdges.children.forEach(mesh=>mesh.castShadow=false);this.root.add(this.pathEdges);
  }
  makeSky(){
    const a=this.assets;
    this.aurora=new THREE.Group();this.aurora.name='restorable-northern-lights';this.root.add(this.aurora);this.auroraBands=[];
    for(let band=0;band<3;band++){
      const positions=[],colors=[],indices=[],color=new THREE.Color([0x55dfbc,0xbda1e9,0x7ccde5][band]);
      for(let i=0;i<=48;i++){
        const t=i/48,x=-130+t*260,y=43+band*7+Math.sin(t*Math.PI*2+band)*8,z=-150-band*20+Math.sin(t*Math.PI*3+band)*10;
        const height=9+Math.sin(t*15+band)*3,glow=Math.sin(t*Math.PI)*(.7+.3*Math.cos(i*2.3+band));
        for(const [level,alpha]of [[0,0],[.24,glow],[1,0]]){
          positions.push(x,y+height*level,z);colors.push(color.r,color.g,color.b,alpha);
        }
        if(i<48)for(let row=0;row<2;row++){const n=i*3+row;indices.push(n,n+3,n+1,n+1,n+3,n+4);}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));geometry.setIndex(indices);geometry.computeVertexNormals();a.geometries['winterAurora'+band]=geometry;
      const material=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.NormalBlending,toneMapped:false,fog:false});
      const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;this.aurora.add(mesh);this.auroraBands.push(mesh);
    }

  }
  makeScenery(){
    const a=this.assets,source=new THREE.Group(),random=seeded(725),trunk=a.mat(0x8d999f,{name:'snow-pine-trunk'}),needles=a.mat(0x688e99,{name:'snow-pine-blue-needles',side:THREE.DoubleSide}),snow=a.mat(0xe5f2f4,{name:'pine-snow-caps',side:THREE.DoubleSide}),ice=a.mat(0x91bacd,{name:'winter-glacier'});
    const tree=(x,d,height)=>{
      a.mesh(source,'taper',trunk,x,height*.27,-d,.20,height*.54,.20);
      for(let layer=0;layer<3;layer++){
        const radius=(1.65-layer*.36)*height/7,y=height*.43+layer*height*.19,h=height*.45;
        a.mesh(source,'spruce',needles,x,y,-d,radius,h,radius);
        a.mesh(source,'spruce',snow,x,y+height*.055,-d,radius*.94,h*.91,radius*.94);
      }
      this.treeCount++;
    };
    for(let d=-12;d<440;d+=11)for(const side of [-1,1]){
      const inLake=d>=130&&d<=320;
      if(!inLake&&d<374)for(let i=0;i<3;i++)tree(side*(4.8+random()*12),d+random()*6,5.2+random()*3.5);
      for(let i=0;i<8;i++)tree(side*((inLake?27:20)+i*8+random()*4),d+random()*8,6+random()*5);
      if(inLake){
        for(let i=0;i<2;i++){const x=side*(5.2+random()*18),size=.7+random()*1.4;const boulder=a.mesh(source,'rock',ice,x,size*.5,-d-random()*6,size,size*.85,size*.8);boulder.rotation.y=random()*6.28;a.mesh(source,'rock',snow,x,size*1.0,boulder.position.z,size*.7,size*.15,size*.65);}
      }else if(d>320&&d<374){
        const h=4+random()*6;a.mesh(source,'rock',ice,side*(7.5+random()*3),h*.43,-d,3.5,h,4.5);a.mesh(source,'rock',snow,side*9,h*.85,-d,2.6,.5,3.2);
      }
    }
    a.geometries.winterPeak=mountain();
    const ridge=landscapeSurface(a.mat(0xffffff,{name:'alpine-ridge',vertexColors:true,fog:false}),'snow_02',6,4,.48);
    for(const [x,d,h,r]of [[-100,120,78,45],[112,190,91,54],[-99,310,86,44],[110,380,82,48],[-70,530,100,82],[68,545,110,85],[0,590,84,75]]){
      a.mesh(source,'winterPeak',ridge,x,h*.5,-d,r,h,r*.75).rotation.y=d*.37;
    }
    this.scenery=a.batch(source);this.scenery.name='batched-winter-forests-and-mountains';this.scenery.children.forEach(mesh=>{mesh.castShadow=false;mesh.receiveShadow=true;});this.root.add(this.scenery);
  }
  makeLake(){
    const a=this.assets;this.iceTexture=winterTexture(true);this.iceTexture.repeat.set(16,35);
    const material=a.mat(0x97c6dc,{name:'reflective-frozen-lake',metalness:.3,roughness:.33,emissive:0x5f96af,emissiveIntensity:.06});material.map=this.iceTexture;
    const geometry=new THREE.PlaneGeometry(126,204);geometry.rotateX(-Math.PI/2);geometry.translate(0,-.012,-222);a.geometries.winterLake=geometry;
    this.lake=new THREE.Mesh(geometry,material);this.lake.name='frozen-lake-beneath-rainbow';this.lake.receiveShadow=true;this.lake.castShadow=false;this.root.add(this.lake);
    const source=new THREE.Group(),random=seeded(833),crack=a.mat(0x7ca9c1,{name:'natural-lake-fractures'}),gleam=a.mat(0xe8fbff,{name:'ice-lake-glints',emissive:0xb7dce7,emissiveIntensity:.12});
    for(let i=0;i<100;i++){
      const side=i%2?-1:1,x=side*(4+random()*45),d=128+random()*188;
      a.segment(source,[x,.006,-d],[x+side*(.5+random()*1.8),.006,-d-.6-random()*2],.012,crack);
      if(i%2===0)a.mesh(source,'rock',gleam,x,.008,-d,.4+random()*.5,.01,.03);
    }
    this.lakeDetails=a.batch(source);this.lakeDetails.children.forEach(mesh=>{mesh.castShadow=false;mesh.receiveShadow=false;});this.root.add(this.lakeDetails);
  }
  makeCastle(){
    const a=this.assets,source=new THREE.Group(),ice=a.mat(0xa4c9dd,{name:'ice-castle-walls',metalness:.14,roughness:.45}),highlight=a.mat(0xe2f4f7,{name:'castle-snow-rims'}),roof=a.mat(0x78acd2,{name:'blue-crystal-roofs',metalness:.22,roughness:.34});
    for(const side of [-1,1]){
      a.mesh(source,'box',ice,side*9.9,3.2,-389,8.6,6.4,1.8);
      a.mesh(source,'box',highlight,side*9.9,6.5,-389,8.9,.25,2.0);
      for(let i=0;i<4;i++)a.mesh(source,'box',highlight,side*(6.5+i*2.0),6.9,-389,.8,.75,1.8);
      for(const [x,d,height]of [[side*7.4,390,10],[side*14,390,12.5],[side*13,419,11]]){
        a.mesh(source,'cylinder',ice,x,height*.5,-d,1.5,height,1.5);a.mesh(source,'cone',roof,x,height+1.65,-d,1.85,3.5,1.85);a.mesh(source,'cylinder',highlight,x,height-.4,-d,1.6,.28,1.6);
        a.mesh(source,'box',a.mat(0x668fac,{name:'castle-tower-windows'}),x,height*.65,-d+1.51,.48,1.15,.04);
      }
      a.mesh(source,'box',ice,side*14,2.4,-405,1.5,4.8,31);a.mesh(source,'box',highlight,side*14,4.85,-405,1.7,.25,31);
      a.mesh(source,'taper',ice,side*2.95,3.35,-388,.36,6.7,.48);a.mesh(source,'cone',roof,side*2.95,7.35,-388,.59,1.4,.59);
    }
    a.mesh(source,'box',ice,0,3.2,-429,29,6.4,1.5);a.mesh(source,'box',highlight,0,6.5,-429,30,.24,1.8);
    for(let i=-6;i<=6;i+=2)a.mesh(source,'cone',roof,i,8.3,-429,.9,3.8,.9);
    a.mesh(source,'box',a.mat(0xc8e0e9,{name:'castle-courtyard-floor'}),0,-.065,-410,27,.10,44);
    for(const side of [-1,1])for(let i=0;i<5;i++){
      a.mesh(source,'cylinder',ice,side*(5.5+i%2),.45,-397-i*4,.26,.9,.26);a.mesh(source,'rock',a.mat(0xe3d6a6,{name:'courtyard-warm-crystals',emissive:0xd4c391,emissiveIntensity:.2}),side*(5.5+i%2),1.05,-397-i*4,.18,.35,.18);
    }
    this.castle=a.batch(source);this.castle.name='ice-castle-and-courtyard';this.castle.children.forEach(mesh=>{mesh.castShadow=false;mesh.receiveShadow=true;});this.root.add(this.castle);
    this.gates=[];
    for(const side of [-1,1]){
      const pivot=new THREE.Group();pivot.position.set(side*2.7,0,-388);pivot.name='castle-gate-'+side;this.root.add(pivot);
      a.mesh(pivot,'box',a.mat(0x6b9fc0,{name:'frost-locked-gate'}),-side*1.35,2.45,.0,2.7,4.9,.24);
      for(let i=0;i<3;i++)a.mesh(pivot,'box',highlight,-side*(.45+i*.85),2.45,.15,.075,4.6,.06);
      a.mesh(pivot,'rock',roof,-side*1.35,2.6,.20,.5,.8,.10);this.gates.push({pivot,side});
    }
  }
  makeRescue(){
    const a=this.assets;this.sisters=[];this.cells=[];this.shards=[];
    const pedestal=a.mat(0xd6ebee,{name:'princess-ice-pedestals'});
    for(const [index,id]of ['elsa','anna'].entries()){
      const side=index===0?-1:1,start=new THREE.Vector3(side*4,.45,-389),end=new THREE.Vector3(side*2.8,0,-403);
      const actor=winterSister(a,id);actor.position.copy(start);this.root.add(actor);this.sisters.push({id,name:id==='elsa'?'Elza':'Anna',actor,start,end});
      a.mesh(this.root,'cylinder',pedestal,side*4,.20,-389,1.15,.4,1.15).castShadow=false;
      const cell=new THREE.Group();cell.name=id+'-ice-prison';cell.position.set(side*4,0,-389);this.root.add(cell);
      const material=a.mat(0x9bd9ee,{name:id+'-ice-prison-glass',transparent:true,opacity:.26,depthWrite:false,metalness:.19,roughness:.27,side:THREE.DoubleSide});
      const body=a.mesh(cell,'box',material,0,1.65,0,2.0,3.1,1.7);body.castShadow=false;body.receiveShadow=false;
      const top=a.mesh(cell,'cone',material,0,3.35,0,1.20,.7,1.05);top.castShadow=false;top.receiveShadow=false;
      const seam=a.mat(0xe9fbff,{name:id+'-prison-cracks',transparent:true,opacity:.58,depthWrite:false});
      a.segment(cell,[-.82,.42,.88],[.32,2.80,.88],.018,seam);a.segment(cell,[.32,2.80,.88],[.90,1.12,.88],.016,seam);a.segment(cell,[-.66,2.70,.88],[.72,.85,.88],.013,seam);
      this.cells.push({root:cell,material,seam});
      for(let i=0;i<10;i++){
        const shard=a.mesh(this.root,'rock',a.mat(0xbfeaf4,{name:'broken-princess-ice',transparent:true,opacity:.65,depthWrite:false,metalness:.15,roughness:.28}),side*4,1,-389,.15,.26,.12);shard.visible=false;shard.castShadow=false;this.shards.push({mesh:shard,side,angle:i*Math.PI*2/10,height:.7+(i%4)*.5});
      }
    }
  }
  makeSnow(){
    const random=seeded(194),count=200;this.snowSeeds=Array.from({length:count},()=>({x:(random()-.5)*62,y:random()*15,d:random()*115,phase:random()*6.28}));
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));this.assets.geometries.winterSnowfall=geometry;
    this.snowfall=new THREE.Points(geometry,new THREE.PointsMaterial({map:snowDot(),color:0xf0faff,size:.075,transparent:true,opacity:.52,depthWrite:false}));this.snowfall.frustumCulled=false;this.root.add(this.snowfall);
  }
  update(game,time,dt){
    this.distance=game.distance||0;this.currentSection=winterSectionAt(this.distance);
    const freed=!!(game.rescue?.freed||game.boss?.done);this.princessesFreed=freed;
    if(!freed)this.freedAt=null;else if(this.freedAt===null)this.freedAt=time;
    const elapsed=freed?Math.max(0,time-this.freedAt):0;this.rescueProgress=freed?smooth(0,3,elapsed):0;this.gateOpen=freed;
    this.auroraStrength=.18+(game.boss?Math.max(0,3-game.boss.hp)/3:0)*.10+(freed?.23:0);
    this.aurora.position.z=-this.distance;this.auroraBands.forEach((band,i)=>{band.material.opacity=this.auroraStrength;band.rotation.z=Math.sin(time*.11+i)*.015;band.position.y=Math.sin(time*.16+i)*1.4;});
    this.iceTexture.offset.y=Math.sin(time*.035)*.003;
    for(const {pivot,side}of this.gates)pivot.rotation.y=-side*Math.PI*.48*smooth(0,1.25,elapsed);
    this.cells.forEach(({root,material,seam})=>{root.visible=!freed||elapsed<1.15;const fade=freed?1-smooth(.05,1.1,elapsed):1;material.opacity=.26*fade;seam.opacity=.58*fade;});
    this.shards.forEach(({mesh,side,angle,height},i)=>{mesh.visible=freed&&elapsed<1.6;const t=Math.min(1.6,elapsed);mesh.position.set(side*4+Math.cos(angle)*t*.9,Math.max(.06,height+t*1.1-t*t*2.4),-389+Math.sin(angle)*t*.8);mesh.rotation.set(t*(i+1),t*.8,t*.4);});
    this.sisters.forEach(({actor,start,end},i)=>{
      actor.visible=this.distance>340;
      actor.position.lerpVectors(start,end,this.rescueProgress);
      const walking=freed&&elapsed<3,turn=freed?smooth(2.35,3.2,elapsed):0;actor.rotation.y=freed?Math.PI*(1-turn):0;
      if(actor.userData.legs)actor.userData.legs.forEach((leg,j)=>leg.rotation.x=walking?Math.sin(elapsed*7+j*Math.PI)*.26:0);
      if(actor.userData.leftArm)actor.userData.leftArm.rotation.z=freed&&!walking?-.25+Math.sin(time*2.2+i)*.12:-.08;
      if(actor.userData.rightArm){actor.userData.rightArm.rotation.z=freed&&!walking?2.05+Math.sin(time*3.5+i)*.20:.08;actor.userData.rightArm.rotation.x=walking?Math.sin(elapsed*7)*.12:0;}
      if(actor.userData.head)actor.userData.head.rotation.z=freed&&!walking?Math.sin(time*1.8+i)*.035:0;
    });
    this.castleLight.intensity=15+(freed?10:Math.max(0,3-(game.boss?.hp??3))*2);
    const position=this.snowfall.geometry.attributes.position;
    this.snowSeeds.forEach((seed,i)=>position.setXYZ(i,seed.x+Math.sin(time*.25+seed.phase)*.55,((seed.y-time*.55)%15+15)%15,-this.distance-((seed.d+time*.18)%115)+8));position.needsUpdate=true;
  }
  diagnostics(){
    return {section:this.currentSection,gateOpen:this.gateOpen,gateAngle:Math.abs(this.gates[0].pivot.rotation.y),princessesFreed:this.princessesFreed,rescueProgress:this.rescueProgress,princessNames:this.sisters.map(sister=>sister.name),princessPositions:this.sisters.map(({id,actor})=>({id,x:actor.position.x,y:actor.position.y,z:actor.position.z})),icePrisonsVisible:this.cells.some(cell=>cell.root.visible),auroraStrength:this.auroraStrength,trees:this.treeCount,staticBatches:this.scenery.children.length+this.castle.children.length+this.pathEdges.children.length+this.lakeDetails.children.length};
  }
}
