import * as THREE from './vendor/three.module.js';

const smooth=(a,b,value)=>{const t=THREE.MathUtils.clamp((value-a)/(b-a),0,1);return t*t*(3-2*t);};
const seeded=seed=>{let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);};
export function caveCeilingAt(distance){return 14+22*smooth(130,175,distance)*(1-smooth(326,360,distance));}
export function caveWidthAt(distance){return 8.5+13*smooth(115,175,distance)*(1-smooth(334,372,distance));}
export function caveSectionAt(distance){return distance<125?'volcanic-tunnels':distance<230?'mushroom-grotto':distance<340?'underground-lake':distance<388?'heart-chamber':'sunlit-clearing';}

function stoneTexture(){
  const random=seeded(292),size=64,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,v=205+random()*38+Math.sin(x*.25+y*.13)*6;
    data.set([v,v+2,v+5,255],i);
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
function flowTexture(lava){
  const size=64,data=new Uint8Array(size*size*4),random=seeded(lava?918:143);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,vein=Math.sin(x*.42+Math.sin(y*.16)*1.6)+Math.sin(y*.29+x*.13),grain=random()*16;
    const color=lava?(vein>1.15?[255,221,131]:vein<-.7?[165,69,33]:[244,133,47]):[91+vein*11+grain,163+vein*10+grain,181+vein*9+grain];
    data.set([...color.map(value=>Math.max(0,Math.min(255,value))),255],i);
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
function softDot(){
  const size=32,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.hypot(x-15.5,y-15.5)/16;data.set([213,247,244,Math.round(Math.max(0,1-r)*Math.max(0,1-r)*210)],i);}
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.needsUpdate=true;return texture;
}

// The cave is a static render asset. Route rules, waiting and damage stay in rules.js.
export class CaveWorld{
  constructor(assets,scene){
    this.assets=assets;this.scene=scene;this.root=new THREE.Group();this.root.name='crystal-cave-world';scene.add(this.root);
    this.currentSection=caveSectionAt(0);this.heartCharge=0;this.distance=0;this.steamPuffs=0;
    this.makeGeometries();this.makeFloor();this.makeVault();this.makeScenery();this.makeWater();this.makeHeart();this.makeExit();this.makeParticles();
    this.lights=[new THREE.PointLight(0xffa65c,24,30,1.5),new THREE.PointLight(0x74e2d2,25,35,1.5),new THREE.PointLight(0xd4c1ff,17,34,1.5)];
    this.lights.forEach(light=>this.root.add(light));this.lights[0].position.set(-5,3,-42);this.lights[1].position.set(5,4,-170);this.lights[2].position.set(0,8,-397);
    this.update({distance:0,boss:{hp:3,done:false},vents:[]},0,0);
  }
  makeGeometries(){
    const a=this.assets;
    if(!a.geometries.caveSpire){
      const geometry=new THREE.CylinderGeometry(.05,1,1,6,1,false).toNonIndexed();geometry.translate(0,.5,0);a.geometries.caveSpire=geometry;
    }
    this.stone=stoneTexture();
  }
  makeFloor(){
    const a=this.assets;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(64,410,1,1),a.mat(0x7d797b,{name:'cave-floor'}));floor.geometry.rotateX(-Math.PI/2);floor.geometry.translate(0,-.07,-185);floor.material.map=this.stone;floor.material.map.repeat.set(10,70);floor.receiveShadow=true;this.root.add(floor);a.geometries.caveFloor=floor.geometry;
    const pathMaterial=a.mat(0xd1b998,{name:'cave-path'});this.path=a.mesh(this.root,'box',pathMaterial,0,-.055,-190,4.2,.11,416);this.path.castShadow=false;this.path.receiveShadow=true;
  }
  makeVault(){
    const a=this.assets,random=seeded(183),positions=[],uv=[],colors=[];
    const palette=[new THREE.Color(0x706975),new THREE.Color(0x625f70),new THREE.Color(0x777282),new THREE.Color(0x83777e)];
    const ring=distance=>{
      const width=caveWidthAt(distance),height=caveCeilingAt(distance),points=[[-width,0,-distance]];
      for(let i=0;i<=12;i++){const angle=i*Math.PI/12;points.push([-Math.cos(angle)*width*(1+random()*.04),3+Math.sin(angle)*(height-3)+random()*.35,-distance]);}
      points.push([width,0,-distance]);return points;
    };
    const rings=[];for(let d=-18;d<388;d+=8)rings.push({d,points:ring(d)});rings.push({d:388,points:ring(388)});
    const append=(point,u,v,color)=>{positions.push(...point);uv.push(u,v);colors.push(color.r,color.g,color.b);};
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<rings[r].points.length-1;i++){
      const first=rings[r],next=rings[r+1],color=palette[Math.floor(random()*palette.length)].clone();
      if(first.d<125)color.lerp(new THREE.Color(0x9a786a),.2);
      const u=i/4,v=first.d/7,vNext=next.d/7;
      append(first.points[i],u,v,color);append(next.points[i],u,vNext,color);append(first.points[i+1],u+.25,v,color);
      color.multiplyScalar(.92+random()*.14);
      append(first.points[i+1],u+.25,v,color);append(next.points[i],u,vNext,color);append(next.points[i+1],u+.25,vNext,color);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();a.geometries.caveVault=geometry;
    const material=a.mat(0xffffff,{name:'faceted-cave-vault',vertexColors:true,side:THREE.DoubleSide});material.map=this.stone;
    this.vault=new THREE.Mesh(geometry,material);this.vault.receiveShadow=false;this.vault.castShadow=false;this.root.add(this.vault);
  }
  makeScenery(){
    const a=this.assets,source=new THREE.Group(),random=seeded(429),rockColors=[0x797681,0x6a6a78,0x8e8490],crystalColors=[0x61c6cf,0xae93d3,0xe6b38b];
    const stone=rockColors.map(color=>a.mat(color,{name:'cave-detail-stone'}));
    const gems=crystalColors.map(color=>a.mat(color,{name:'cave-scenery-crystal',emissive:color,emissiveIntensity:.36,metalness:.15,roughness:.45}));
    const stalk=a.mat(0xb4c9bd,{name:'cave-mushroom-stem'}),caps=[0x69b5a4,0x8b90c4,0xc08da9].map(color=>a.mat(color,{name:'luminous-mushroom-cap',emissive:color,emissiveIntensity:.35}));
    this.crystalCount=0;this.mushroomCount=0;
    for(let d=1;d<386;d+=5.5)for(const side of [-1,1]){
      const width=caveWidthAt(d),z=-d;
      for(let i=0;i<3;i++){
        const x=side*(3.4+random()*(width-4.2)),scale=.35+random()*.8;
        const rock=a.mesh(source,'rock',stone[i%3],x,.20,z-random()*4,scale,.24+random()*.45,scale*.75);rock.rotation.y=random()*6.28;
      }
      if(d<125){
        const x=side*(width-.6),height=3+random()*3;
        a.mesh(source,'taper',stone[Math.floor(d)%3],x,height*.5,z,.55,height,.7);
        if(Math.floor(d)%3===0)a.mesh(source,'caveSpire',gems[2],side*(3.8+random()*2),0,z+1,.3,1.0+random()*.8,.3);
      }else{
        for(let i=0;i<3;i++){
          const x=side*(3.5+random()*(width-4.5)),height=1.2+random()*3.8;
          const gem=a.mesh(source,'caveSpire',gems[i%3],x,0,z-i*.75,.32+random()*.4,height,.33+random()*.4);gem.rotation.z=-side*(.08+random()*.22);gem.rotation.y=random()*6.28;this.crystalCount++;
        }
        if(d<235||d>345)for(let i=0;i<2;i++){
          const x=side*(d>=178&&d<=350?width-.95+random()*.3:4.0+random()*(width-5.5)),height=.65+random()*2.3,size=.55+height*.24;
          a.mesh(source,'taper',stalk,x,height*.45,z-i*1.8,.12,height*.9,.12);
          a.mesh(source,'rock',caps[i%3],x,height,z-i*1.8,size,size*.32,size);
          for(let k=0;k<3;k++)a.mesh(source,'rock',stalk,x+Math.sin(k*2.1)*size*.48,height+size*.23,z-i*1.8+Math.cos(k*2.1)*size*.4,.065,.025,.055);
          this.mushroomCount++;
        }
      }
      if(Math.floor(d/5.5)%2===0){
        const x=side*(width*.80),height=1.7+random()*2.0,ceiling=3+(caveCeilingAt(d)-3)*.60;
        const stalactite=a.mesh(source,'cone',stone[Math.floor(d)%3],x,ceiling-height*.5,z,.32+random()*.28,height,.4);stalactite.rotation.z=Math.PI;
      }
      a.mesh(source,'rock',a.mat(0xb6aaa0,{name:'cave-path-edge'}),side*2.46,.025,z,.09,.045,.14);
    }
    this.scenery=a.batch(source);this.scenery.name='batched-cave-scenery';this.scenery.children.forEach(mesh=>{mesh.castShadow=false;mesh.receiveShadow=true;});this.root.add(this.scenery);
  }
  makeWater(){
    const a=this.assets;
    const ribbon=(name,start,end,lava)=>{
      const positions=[],uv=[],indices=[],steps=Math.ceil((end-start)/3);
      for(const side of [-1,1]){
        const first=positions.length/3;
        for(let i=0;i<=steps;i++){
          const d=start+(end-start)*i/steps,inner=lava?5.2+Math.sin(d*.07)*.65:3.1+Math.sin(d*.11)*.25,outer=lava?inner+1.35:caveWidthAt(d)-1.4;
          for(const x of [inner,outer]){positions.push(side*x,lava?.015:-.025,-d);uv.push(x/3,d/5);}
          if(i<steps){const n=first+i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
        }
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();a.geometries[name]=geometry;
      const texture=flowTexture(lava),material=a.mat(lava?0xffffff:0x9bd4d9,{name,side:THREE.DoubleSide,emissive:lava?0xf2a44d:0x4f999c,emissiveIntensity:lava?.56:.18,metalness:lava?0:.3,roughness:lava?.7:.32});material.map=texture;if(lava)material.emissiveMap=texture;
      const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.receiveShadow=!lava;mesh.castShadow=false;this.root.add(mesh);return {mesh,texture};
    };
    this.lava=ribbon('cave-side-lava-streams',0,124,true);this.lake=ribbon('cave-underground-lake',178,350,false);
    const shimmerMaterial=a.mat(0xb4f5ec,{name:'lake-light-reflections',transparent:true,opacity:.19,depthWrite:false,emissive:0x71cfc7,emissiveIntensity:.45});
    this.shimmers=new THREE.InstancedMesh(a.geometries.rock,shimmerMaterial,30);this.shimmers.castShadow=false;this.shimmers.receiveShadow=false;this.shimmers.frustumCulled=false;this.root.add(this.shimmers);
  }
  makeHeart(){
    const a=this.assets,source=new THREE.Group();this.heart=new THREE.Group();this.heart.name='crystal-heart';this.heart.position.set(0,4.4,-397);this.root.add(this.heart);
    if(!a.geometries.caveHeartGem){
      const positions=[],ring=Array.from({length:6},(_,i)=>[Math.sin(i*Math.PI/3),.52,Math.cos(i*Math.PI/3)]);
      for(let i=0;i<6;i++){const next=(i+1)%6;positions.push(...ring[i],0,0,0,...ring[next],...ring[i],...ring[next],0,1,0);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();a.geometries.caveHeartGem=geometry;
    }
    this.heartSegments=[];
    for(let i=0;i<3;i++){
      const color=[0x75ddd5,0xc2a7e2,0xf1c385][i],material=a.mat(color,{name:'heart-segment-'+i,emissive:color,emissiveIntensity:.10,metalness:.25,roughness:.32});
      const gem=a.mesh(this.heart,'caveHeartGem',material,(i-1)*1.6,i===1?1.05:1.35,Math.abs(i-1)*.16,i===1?1.0:.82,i===1?4.3:3.05,.75);gem.rotation.z=(1-i)*.17;gem.userData.restScale=gem.scale.clone();this.heartSegments.push(gem);
    }
    const archMaterial=a.mat(0x8b8194,{name:'heart-chamber-arch'});
    for(const side of [-1,1]){a.mesh(source,'taper',archMaterial,side*3.2,2.55,-388,.46,5.1,.6);a.mesh(source,'rock',archMaterial,side*2.3,5.15,-388,1.25,.65,.7);}
    // The open gateway frames the floating heart; a crossbeam would occlude it from the arena.
    this.archGems=[];for(let i=0;i<3;i++){const material=a.mat(0x81d8d2,{name:'exit-arch-gem-'+i,emissive:0x81d8d2,emissiveIntensity:.05});const gem=a.mesh(this.root,'caveSpire',material,i===1?3.2:-3.2,i===2?4.3:3.5,-387.2,.19,.62,.19);gem.rotation.z=Math.PI;this.archGems.push(gem);}
    this.heartSetting=a.batch(source);this.heartSetting.name='heart-chamber-stonework';this.heartSetting.children.forEach(mesh=>mesh.castShadow=false);this.root.add(this.heartSetting);
  }
  makeExit(){
    const a=this.assets,source=new THREE.Group(),random=seeded(176);
    const grass=a.mat(0x9fbe8a,{name:'sunlit-clearing-grass',fog:false}),foliage=a.mat(0x85b18a,{name:'sunlit-clearing-leaves',fog:false}),wood=a.mat(0xa38b6d,{name:'sunlit-clearing-trunk',fog:false});
    const clearing=a.mesh(this.root,'box',grass,0,-.09,-424,100,.12,72);clearing.castShadow=false;
    const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(240,90),new THREE.MeshBasicMaterial({color:0xd7edf0,fog:false}));backdrop.position.set(0,30,-465);backdrop.name='sunlit-exit-sky';this.root.add(backdrop);a.geometries.caveExitSky=backdrop.geometry;
    const sunshine=a.mesh(source,'round',new THREE.MeshBasicMaterial({color:0xffe8ad,fog:false}),-18,24,-456,4.5,4.5,1.2);sunshine.castShadow=false;
    for(const side of [-1,1])for(let i=0;i<11;i++){
      const x=side*(6+random()*22),d=396+random()*55,height=4+random()*4;
      a.mesh(source,'taper',wood,x,height*.35,-d,.22,height*.70,.22);
      a.mesh(source,'round',foliage,x,height*.81,-d,1.5+random(),height*.31,1.7+random());
      if(i%2===0)a.mesh(source,'rock',a.mat(0xc9b7c3,{name:'clearing-flowers',fog:false}),side*(3.0+random()*2),.15,-d,.18,.16,.16);
    }
    const hills=a.mat(0xb2cca5,{name:'sunlit-clearing-hills',fog:false});for(const [x,d]of [[-24,460],[26,454]])a.mesh(source,'round',hills,x,2,-d,26,8,15);
    this.clearing=a.batch(source);this.clearing.name='sunlit-clearing';this.clearing.children.forEach(mesh=>{mesh.castShadow=false;mesh.receiveShadow=false;});this.root.add(this.clearing);
  }
  makeParticles(){
    const a=this.assets,random=seeded(812);this.glintsSeeds=Array.from({length:84},()=>({x:(random()<.5?-1:1)*(3.3+random()*9),d:125+random()*260,y:1+random()*8,phase:random()*6.28}));
    this.glintGeometry=new THREE.BufferGeometry();this.glintGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(this.glintsSeeds.length*3),3));a.geometries.caveGlints=this.glintGeometry;
    this.glints=new THREE.Points(this.glintGeometry,new THREE.PointsMaterial({color:0xa5e6db,size:.12,map:softDot(),transparent:true,opacity:.5,depthWrite:false}));this.glints.frustumCulled=false;this.root.add(this.glints);
    const material=a.mat(0xcbd7df,{name:'natural-steam-puffs',transparent:true,opacity:.16,depthWrite:false});
    this.steam=new THREE.InstancedMesh(a.geometries.round,material,48);this.steam.count=0;this.steam.castShadow=false;this.steam.receiveShadow=false;this.steam.frustumCulled=false;this.steam.name='steam-vent-jets';this.root.add(this.steam);
  }
  update(game,time,dt){
    this.distance=game.distance||0;this.currentSection=caveSectionAt(this.distance);const boss=game.boss||{hp:3,done:false};this.heartCharge=boss.done?3:Math.max(0,3-boss.hp);
    this.lava.texture.offset.y=-time*.13;this.lava.mesh.material.emissiveIntensity=.54+Math.sin(time*1.5)*.035;
    this.lake.texture.offset.set(Math.sin(time*.08)*.015,-time*.012);
    const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
    for(let i=0;i<30;i++){
      const side=i%2?-1:1,d=194+i*(340-194)/29,x=side*(4.2+(i%5)*2.1+Math.sin(time*.13+i)*.17);
      position.set(x,.001+Math.sin(time*.6+i)*.006,-d);scale.set(.45+Math.sin(time*.3+i)*.08,.012,.04+Math.sin(i*1.1)*.015);rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.sin(i)*.35);matrix.compose(position,rotation,scale);this.shimmers.setMatrixAt(i,matrix);
    }
    this.shimmers.instanceMatrix.needsUpdate=true;
    this.heartSegments.forEach((gem,i)=>{const charged=this.heartCharge>i;gem.material.emissiveIntensity=charged?.85+Math.sin(time*1.8+i)*.05:.10;gem.scale.copy(gem.userData.restScale).multiplyScalar(charged?1+Math.sin(time*1.5+i)*.008:1);this.archGems[i].material.emissiveIntensity=charged?.75:.05;});
    this.lights[0].position.z=-THREE.MathUtils.clamp(this.distance+9,12,112);this.lights[0].intensity=this.distance<134?24:0;
    this.lights[1].position.z=-THREE.MathUtils.clamp(this.distance+7,145,334);this.lights[1].intensity=this.distance>119&&this.distance<350?25:0;
    this.lights[2].intensity=17+this.heartCharge*8;
    const glints=this.glintGeometry.attributes.position;
    this.glintsSeeds.forEach((p,i)=>glints.setXYZ(i,p.x+Math.sin(time*.22+p.phase)*.12,p.y+Math.sin(time*.35+p.phase)*.20,-p.d));glints.needsUpdate=true;
    let count=0;
    for(const vent of game.vents||[]){
      if(vent.elapsed<0||vent.cleared)continue;
      for(let i=0;i<24&&count<48;i++){
        const phase=(vent.elapsed*.55+i/24)%1,x=-3.1+phase*6.2,y=.35+Math.sin(phase*Math.PI)*1.8+Math.sin(i*2.1)*.17;
        position.set(x,y,-vent.z+Math.sin(i*3.3+vent.elapsed)*.35);rotation.setFromAxisAngle(new THREE.Vector3(0,0,1),phase*2);scale.setScalar(.28+Math.sin(phase*Math.PI)*.32);matrix.compose(position,rotation,scale);this.steam.setMatrixAt(count++,matrix);
      }
    }
    this.steam.count=count;this.steamPuffs=count;if(count)this.steam.instanceMatrix.needsUpdate=true;
  }
  diagnostics(){return {section:this.currentSection,heartCharge:this.heartCharge,ceilingClearance:caveCeilingAt(this.distance),steamPuffs:this.steamPuffs,crystals:this.crystalCount,mushrooms:this.mushroomCount,staticBatches:this.scenery.children.length,lavaOffset:this.lava.texture.offset.y,lakeOffset:this.lake.texture.offset.y,exitStartsAt:388};}
}
